import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import {
  FORM_LIST_NAMES,
  BUILDING_TYPES
} from '../../common/constants/form-lists.js'
import { ROUTES } from '../../common/constants/routes.js'

/**
 * Custom controller for the building types page
 * Displays a custom form with inline input/label layout for entering building quantities
 */
export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  /**
   * Get the building types list definition from the form model
   */
  getBuildingTypesList() {
    return this.model.def.lists.find(
      (list) => list.name === FORM_LIST_NAMES.BUILDING_TYPES
    )
  }

  /**
   * Handle GET requests - display the building types form
   * Populates the form with building types list and any previously saved values
   */
  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)
      const { state } = context

      // Add building types list to view model
      const buildingTypesList = this.getBuildingTypesList()
      viewModel.buildingTypes = buildingTypesList?.items || []

      // Restore previously entered values from session state
      const savedValues = state[FORM_METADATA.PROTOTYPE_ID]
      if (savedValues) {
        viewModel.submittedValues = savedValues
      }

      return h.view(this.viewName, viewModel)
    }
  }

  /**
   * Handle POST requests - validate and save building types
   * Requires at least one building with a quantity > 0
   * Supports returnUrl for redirecting back to summary page
   */
  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload, query } = request
      const { state } = context

      // Calculate total number of buildings across all types
      const total = Object.values(payload)
        .filter((value) => typeof value === 'string' && value !== '')
        .map((value) => parseInt(value, 10))
        .filter((value) => !isNaN(value))
        .reduce((sum, value) => sum + value, 0)

      // Validation: require at least one building
      if (total === 0) {
        const viewModel = this.getViewModel(request, context)

        const buildingTypesList = this.getBuildingTypesList()
        viewModel.buildingTypes = buildingTypesList?.items || []
        viewModel.submittedValues = payload
        viewModel.errors = [
          {
            path: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            name: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            href: '#buildingType-1',
            text: 'Enter at least one building with a value of 1 or more'
          }
        ]

        return h.view(this.viewName, viewModel)
      }

      // Save building types to session state (before any redirects)
      await this.mergeState(request, state, {
        [FORM_METADATA.PROTOTYPE_ID]: payload
      })

      // Check if only non-residential development was entered
      const buildingTypesList = this.getBuildingTypesList()

      let hasNonResidential = false
      let hasResidentialTypes = false

      // Check each building type
      buildingTypesList?.items.forEach((item, index) => {
        const fieldName = `buildingType-${index + 1}`
        const quantity = parseInt(payload[fieldName], 10) || 0

        if (quantity > 0) {
          if (item.value === BUILDING_TYPES.NON_RESIDENTIAL.id) {
            hasNonResidential = true
          } else {
            hasResidentialTypes = true
          }
        }
      })

      // Redirect if only non-residential was entered
      if (hasNonResidential && !hasResidentialTypes) {
        return h.redirect(
          `/${FORM_METADATA.SLUG}${ROUTES.NON_RESIDENTIAL_ERROR}`
        )
      }

      // Support returnUrl for "Change" links from summary page
      const returnUrl = query.returnUrl
      if (returnUrl) {
        return h.redirect(returnUrl)
      }

      // Default: redirect to next page in form flow
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
