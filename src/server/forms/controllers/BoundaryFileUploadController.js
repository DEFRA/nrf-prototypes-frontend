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

      const response = await super.makeGetRouteHandler()(request, context, h)

      if (response && response.variety === 'view') {
        response.source.context.uploadedFile = uploadedFile
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
          // Invalid JSON, ignore
        }
      }

      // Handle returnUrl if present
      const returnUrl = request.query.returnUrl
      if (returnUrl) {
        return h.redirect(decodeURIComponent(returnUrl))
      }

      // Continue to next page
      return super.makePostRouteHandler()(request, context, h)
    }
  }

  /**
   * Retrieve uploaded file from state
   */
  getFileFromState(state) {
    const formData = state[FORM_METADATA.PROTOTYPE_ID]
    return formData?.[FORM_COMPONENT_NAMES.BOUNDARY_FILE]
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
