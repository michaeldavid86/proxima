import type { DiagramId } from '../../vignettes/types'
import HohmannDiagram from './HohmannDiagram'
import RicDiagram from './RicDiagram'
import VbarApproachDiagram from './VbarApproachDiagram'
import RbarApproachDiagram from './RbarApproachDiagram'
import LinkBudgetDiagram from './LinkBudgetDiagram'
import AttributionLadder from './AttributionLadder'

export const diagramFor = (id: DiagramId) => {
  switch (id) {
    case 'hohmann':
      return HohmannDiagram
    case 'ric':
      return RicDiagram
    case 'vbar_approach':
      return VbarApproachDiagram
    case 'rbar_approach':
      return RbarApproachDiagram
    case 'link_budget':
      return LinkBudgetDiagram
    case 'attribution_ladder':
      return AttributionLadder
  }
}
