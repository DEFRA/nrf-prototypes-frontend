import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'

/**
 * Base controller for NRF Quote form pages that preserves custom state data
 *
 * The default QuestionPageController calls setState() which replaces the entire state,
 * wiping out custom data stored under PROTOTYPE_ID (like boundary file metadata).
 * This controller overrides setState to preserve that custom data.
 */
export class NRFQuestionPageController extends QuestionPageController {
  async setState(request, state) {
    const { query } = request

    // Skip set for preview URL direct access
    if ('force' in query) {
      return state
    }

    // Get existing full state from session
    const existingState = await this.getState(request)

    // Preserve custom data stored under PROTOTYPE_ID
    const prototypeData = existingState[FORM_METADATA.PROTOTYPE_ID]

    // Merge the new state with preserved custom data
    const mergedState = {
      ...state,
      ...(prototypeData && { [FORM_METADATA.PROTOTYPE_ID]: prototypeData })
    }

    // Save the merged state using parent's setState
    return super.setState(request, mergedState)
  }
}
