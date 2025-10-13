import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { isPathRelative } from '@defra/forms-engine-plugin/engine/helpers.js'
import { formatFileSize } from '../../common/helpers/format-utils.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import { ROUTES } from '../../common/constants/routes.js'

const ALLOWED_FILE_EXTENSIONS = ['.geojson', '.json', '.kml']
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/geo+json',
  'application/vnd.google-earth.kml+xml',
  'text/plain'
]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export class BoundaryFileUploadController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'boundary-file-upload'
  }

  /**
   * Validates file data according to supported types and constraints
   * @param {Object} fileData - The file data to validate
   * @returns {Object|null} Error object if validation fails, null if valid
   */
  validateFile(fileData) {
    // Validate required fields
    if (!fileData.filename || !fileData.size || !fileData.contentType) {
      return {
        text: 'File is missing required information (filename, size, or content type)'
      }
    }

    if (!fileData.buffer) {
      return {
        text: 'File content is missing'
      }
    }

    const filename = fileData.filename.toLowerCase()
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) =>
      filename.endsWith(ext)
    )

    if (!hasValidExtension) {
      return {
        text: `File type not supported. Please upload a file with one of these extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
      }
    }

    const contentType = fileData.contentType.toLowerCase()
    const hasValidContentType = ALLOWED_CONTENT_TYPES.some((type) =>
      contentType.includes(type.toLowerCase())
    )

    if (!hasValidContentType) {
      return {
        text: `File content type '${fileData.contentType}' is not supported. Expected one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`
      }
    }

    if (fileData.size > MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)
      return {
        text: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
      }
    }

    return null // is valid!
  }

  /**
   * GET handler - renders the file upload page with current file state
   */
  makeGetRouteHandler() {
    return async (request, context, h) => {
      const { state } = context
      const uploadedFile = this.getFileFromState(state)

      // Format file size if file exists
      const formattedFile = uploadedFile
        ? this.formatFileData(uploadedFile)
        : null

      const response = await super.makeGetRouteHandler()(request, context, h)

      if (response && response.variety === 'view') {
        response.source.context.uploadedFile = formattedFile
      }

      return response
    }
  }

  /**
   * POST handler - handles file upload, removal, and navigation
   */
  makePostRouteHandler() {
    return async (request, context, h) => {
      const { state } = context
      const { payload } = request

      // Handle file removal
      if (payload.removeFile) {
        await this.removeFile(request, state)
        return h.redirect(request.path)
      }

      // Handle file upload (base64 encoded from client)
      if (payload.fileData) {
        try {
          const fileData = JSON.parse(payload.fileData)

          // Validate file data
          const validationError = this.validateFile(fileData)
          if (validationError) {
            const viewModel = this.getViewModel(request, context)
            viewModel.errors = [
              {
                path: 'file',
                name: 'file',
                href: '#file',
                text: validationError.text
              }
            ]
            return h.view(this.viewName, viewModel)
          }

          // Save valid file
          if (fileData && fileData.filename) {
            await this.saveFile(request, state, fileData)
            return h.redirect(request.path)
          }
        } catch (error) {
          // Return to form with error message
          const viewModel = this.getViewModel(request, context)
          viewModel.errors = [
            {
              path: 'file',
              name: 'file',
              href: '#file',
              text: 'There was a problem uploading your file. Please try again.'
            }
          ]
          return h.view(this.viewName, viewModel)
        }
      }

      // Handle returnUrl if present (only allow relative paths for security)
      const returnUrl = request.query.returnUrl
      if (returnUrl && isPathRelative(returnUrl)) {
        return h.redirect(decodeURIComponent(returnUrl))
      }

      // Continue to next page - manually navigate since this page has no components
      const nextPath = `/${FORM_METADATA.SLUG}${ROUTES.BUILDINGS}`
      return h.redirect(nextPath)
    }
  }

  /**
   * Retrieve uploaded file from state
   */
  getFileFromState(state) {
    const formData = state[FORM_METADATA.PROTOTYPE_ID]
    const fileData = formData?.[FORM_COMPONENT_NAMES.BOUNDARY_FILE]

    return fileData
  }

  /**
   * Format file data with human-readable size and formatted JSON content
   */
  formatFileData(fileData) {
    if (!fileData) return null

    const formattedSize = formatFileSize(fileData.size || 0)

    // Format the content as pretty-printed JSON if it exists
    let formattedContent = null
    if (fileData.buffer) {
      try {
        // Decode base64 buffer
        const decodedContent = Buffer.from(fileData.buffer, 'base64').toString(
          'utf-8'
        )
        // Parse and re-stringify with indentation
        const parsed = JSON.parse(decodedContent)
        formattedContent = JSON.stringify(parsed, null, 2)
      } catch (error) {
        // If parsing fails, just use the decoded content as-is
        formattedContent = Buffer.from(fileData.buffer, 'base64').toString(
          'utf-8'
        )
      }
    }

    return {
      ...fileData,
      formattedSize,
      content: formattedContent
    }
  }

  /**
   * Save file data to state
   * Preserves existing prototype data like building types
   */
  async saveFile(request, state, fileData) {
    const existingData = state[FORM_METADATA.PROTOTYPE_ID] || {}
    const mergedData = {
      ...existingData,
      [FORM_COMPONENT_NAMES.BOUNDARY_FILE]: fileData
    }

    await this.mergeState(request, state, {
      [FORM_METADATA.PROTOTYPE_ID]: mergedData
    })
  }

  /**
   * Remove file from state
   * Preserves existing prototype data like building types
   */
  async removeFile(request, state) {
    const existingData = state[FORM_METADATA.PROTOTYPE_ID] || {}
    const mergedData = {
      ...existingData,
      [FORM_COMPONENT_NAMES.BOUNDARY_FILE]: null
    }

    await this.mergeState(request, state, {
      [FORM_METADATA.PROTOTYPE_ID]: mergedData
    })
  }
}
