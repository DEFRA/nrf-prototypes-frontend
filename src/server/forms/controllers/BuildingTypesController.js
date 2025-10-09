import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'

/**
 * Custom controller for building types page with inline form layout.
 * Overrides both GET and POST handlers to support custom form structure.
 */
export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)
      return h.view(this.viewName, viewModel)
    }
  }

  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload } = request
      const { state } = context

      // Store the building types data using mergeState
      await this.mergeState(request, state, {
        [this.name]: payload.buildingTypes || ''
      })

      // Get the next page path from pageDef
      const { next } = this.pageDef

      if (!next || next.length === 0) {
        throw new Error('No next page configured for building-types')
      }

      // Build the full path - extract slug from current request path
      const currentPath = request.path // e.g. /nrf-quote/building-types
      const slug = currentPath.split('/')[1] // Extract 'nrf-quote'
      const fullPath = `/${slug}${next[0].path}`

      // Redirect to the next page
      return h.redirect(fullPath)
    }
  }
}
