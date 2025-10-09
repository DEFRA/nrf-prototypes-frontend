import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'

export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)

      const buildingTypesList = this.model.def.lists.find(
        (list) => list.name === 'eYJZxu'
      )

      viewModel.buildingTypes = buildingTypesList?.items || []

      return h.view(this.viewName, viewModel)
    }
  }

  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload } = request
      const { state } = context

      await this.mergeState(request, state, {
        [this.name]: payload.buildingTypes || ''
      })

      const { next } = this.pageDef

      if (!next || next.length === 0) {
        throw new Error('No next page configured for building-types')
      }

      const fullPath = `/${FORM_METADATA.SLUG}${next[0].path}`

      return h.redirect(fullPath)
    }
  }
}
