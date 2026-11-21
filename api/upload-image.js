import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.NUTROLIX_UPLOAD_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server upload secret is not configured' });

  const supplied = req.headers['x-upload-secret'];
  if (supplied !== secret) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { imageBase64, fileName, contentType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const match = imageBase64.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    const raw = match ? match[2] : imageBase64;
    const mime = match ? match[1] : (contentType || 'image/png');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
      return res.status(400).json({ error: 'Only PNG, JPEG, or WebP images are accepted' });
    }

    const buffer = Buffer.from(raw, 'base64');
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
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
