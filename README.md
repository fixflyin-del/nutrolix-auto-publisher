# Nutrolix Auto Publisher

Private backend project for publishing assets to Vercel Blob.

## Endpoint
POST /api/upload-image

Required header: `x-upload-secret`

JSON body supports either:
- `imageBase64`: base64 data or data URL
- `sourceUrl`: HTTPS image URL from the configured Vercel Blob source host
- `fileName`: optional
- `contentType`: optional (PNG, JPEG, WebP; used with imageBase64)

The endpoint returns the public Blob URL after upload.

For `sourceUrl`, the source host is allowlisted to avoid arbitrary URL fetching.

## Required environment variables
- `BLOB_READ_WRITE_TOKEN` (added when Blob store is connected to this Vercel project)
- `NUTROLIX_UPLOAD_SECRET` (long random secret)
