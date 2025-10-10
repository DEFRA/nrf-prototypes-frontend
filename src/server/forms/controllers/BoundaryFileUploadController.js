import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import { ROUTES } from '../../common/constants/routes.js'

export class BoundaryFileUploadController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'boundary-file-upload'
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

      // Handle returnUrl if present
      const returnUrl = request.query.returnUrl
      if (returnUrl) {
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

    const sizeInBytes = fileData.size || 0
    let formattedSize

    if (sizeInBytes < 1024) {
      formattedSize = `${sizeInBytes} bytes`
    } else if (sizeInBytes < 1024 * 1024) {
      formattedSize = `${(sizeInBytes / 1024).toFixed(2)} KB`
    } else {
      formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
    }

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
   */
  async saveFile(request, state, fileData) {
    await this.mergeState(request, state, {
      [FORM_METADATA.PROTOTYPE_ID]: {
        [FORM_COMPONENT_NAMES.BOUNDARY_FILE]: fileData
      }
    })
  }

  /**
   * Remove file from state
   */
  async removeFile(request, state) {
    await this.mergeState(request, state, {
      [FORM_METADATA.PROTOTYPE_ID]: {
        [FORM_COMPONENT_NAMES.BOUNDARY_FILE]: null
      }
    })
  }
}
