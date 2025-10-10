/**
 * Handles file upload for boundary files by converting to base64
 * This avoids multipart form data issues with the forms-engine plugin
 */

/* eslint-env browser */

export function initBoundaryFileUpload() {
  const fileInput = document.getElementById('file')
  const uploadButton = document.getElementById('upload-button')

  if (!fileInput || !uploadButton) {
    return
  }

  const form = uploadButton.closest('form')
  if (!form) {
    return
  }

  // Handle upload button click
  uploadButton.addEventListener('click', async (e) => {
    e.preventDefault()

    const file = fileInput.files[0]
    if (!file) {
      return
    }

    try {
      const base64 = await readFileAsBase64(file)

      const fileDataInput = document.createElement('input')
      fileDataInput.type = 'hidden'
      fileDataInput.name = 'fileData'
      fileDataInput.value = JSON.stringify({
        filename: file.name,
        size: file.size,
        contentType: file.type || 'application/json',
        buffer: base64,
        uploadedAt: new Date().toISOString()
      })

      form.appendChild(fileDataInput)

      fileInput.remove()

      form.submit()
    } catch (error) {
      console.error('Error uploading file:', error)
      // eslint-disable-next-line no-undef
      alert('Error uploading file. Please try again.')
    }
  })
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    const reader = new FileReader()

    reader.onload = () => {
      // Remove data:*/*;base64, prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}
