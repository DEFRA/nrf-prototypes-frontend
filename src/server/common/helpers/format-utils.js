/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} sizeInBytes - The size in bytes
 * @returns {string} Formatted size string (e.g., "1.5 KB", "2.34 MB")
 */
export function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} bytes`
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  }
}
