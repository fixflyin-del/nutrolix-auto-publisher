import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const allowedSourceHosts = new Set([
  '94vq1ehpyh8ppou9.public.blob.vercel-storage.com',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.NUTROLIX_UPLOAD_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server upload secret is not configured' });

  const supplied = req.headers['x-upload-secret'];
  if (!supplied || supplied !== secret) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { imageBase64, sourceUrl, fileName, contentType } = req.body || {};
    let buffer;
    let mime;

    if (sourceUrl) {
      let parsed;
      try {
        parsed = new URL(sourceUrl);
      } catch {
        return res.status(400).json({ error: 'sourceUrl must be a valid URL' });
      }
      if (parsed.protocol !== 'https:' || !allowedSourceHosts.has(parsed.hostname)) {
        return res.status(400).json({ error: 'sourceUrl host is not allowed' });
      }

      const upstream = await fetch(parsed.toString(), { signal: AbortSignal.timeout(15000) });
      if (!upstream.ok) return res.status(400).json({ error: 'Could not fetch source image' });
      mime = upstream.headers.get('content-type')?.split(';')[0] || '';
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
        return res.status(400).json({ error: 'Source must be PNG, JPEG, or WebP' });
      }
      const declaredSize = Number(upstream.headers.get('content-length') || 0);
      if (declaredSize > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image must be 8 MB or smaller' });
      }
      buffer = Buffer.from(await upstream.arrayBuffer());
    } else if (imageBase64 && typeof imageBase64 === 'string') {
      const match = imageBase64.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
      const raw = match ? match[2] : imageBase64;
      mime = match ? match[1] : (contentType || 'image/png');
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
        return res.status(400).json({ error: 'Only PNG, JPEG, or WebP images are accepted' });
      }
      buffer = Buffer.from(raw, 'base64');
    } else {
      return res.status(400).json({ error: 'imageBase64 or sourceUrl is required' });
    }

    if (!buffer?.length || buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be between 1 byte and 8 MB' });
    }

    const safeName = (fileName || 'nutrolix-post.png').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);
    const blob = await put(`nutrolix-posts/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: true
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname, contentType: blob.contentType });
  } catch (error) {
    return res.status(500).json({ error: 'Upload failed' });
  }
}
