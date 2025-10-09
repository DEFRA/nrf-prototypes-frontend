import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import { FORM_LIST_NAMES } from '../../common/constants/form-lists.js'

export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  getBuildingTypesList() {
    return this.model.def.lists.find(
      (list) => list.name === FORM_LIST_NAMES.BUILDING_TYPES
    )
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)
      const { state } = context

      const buildingTypesList = this.getBuildingTypesList()
      viewModel.buildingTypes = buildingTypesList?.items || []

      const savedValues = state[this.name]
      if (savedValues) {
        viewModel.submittedValues = savedValues
      }

      return h.view(this.viewName, viewModel)
    }
  }

  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload } = request
      const { state } = context

      const total = Object.values(payload)
        .filter((value) => typeof value === 'string' && value !== '')
        .map((value) => parseInt(value, 10))
        .filter((value) => !isNaN(value))
        .reduce((sum, value) => sum + value, 0)

      if (total === 0) {
        const viewModel = this.getViewModel(request, context)

        const buildingTypesList = this.getBuildingTypesList()
        viewModel.buildingTypes = buildingTypesList?.items || []
        viewModel.submittedValues = payload
        viewModel.errors = [
          {
            path: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            href: '#buildingType-1',
            name: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            text: 'Enter at least one building with a value of 1 or more'
          }
        ]

        return h.view(this.viewName, viewModel)
      }

      await this.mergeState(request, state, {
        [this.name]: payload
      })

      const { next } = this.pageDef

      if (!next || next.length === 0) {
        throw new Error(
          `No next page configured for ${FORM_COMPONENT_NAMES.BUILDING_TYPES}`
        )
      }

      const fullPath = `/${FORM_METADATA.SLUG}${next[0].path}`

      return h.redirect(fullPath)
    }
  }
}
