import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'

/**
 * Simple controller for building types page.
 * Only overrides GET handler to use custom view.
 * Lets parent QuestionPageController handle POST (form submission).
 */
export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)

      // Add any custom data to viewModel here if needed

      return h.view(this.viewName, viewModel)
    }
  }
}
