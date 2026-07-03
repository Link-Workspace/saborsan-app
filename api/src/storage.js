const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');

function getBlobClient() {
  return BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
}

async function uploadAudio(buffer, mimeType, container) {
  const ext = mimeType.includes('mpeg') ? 'mp3' : 'webm';
  const blobName = `${randomUUID()}.${ext}`;
  const containerClient = getBlobClient().getContainerClient(container);
  const blockBlob = containerClient.getBlockBlobClient(blobName);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimeType } });
  return blockBlob.url;
}

module.exports = { uploadAudio };
