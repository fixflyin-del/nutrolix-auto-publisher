# Nutrolix Auto Publisher

Private backend project for publishing assets to Vercel Blob.

## Endpoint
POST /api/upload-image

Required header: `x-upload-secret`

JSON body:
- `imageBase64`: base64 data or data URL
- `fileName`: optional
- `contentType`: optional (PNG, JPEG, WebP)

The endpoint returns the public Blob URL after upload.

## Required environment variables
- `BLOB_READ_WRITE_TOKEN` (added when Blob store is connected to this Vercel project)
- `NUTROLIX_UPLOAD_SECRET` (long random secret)
