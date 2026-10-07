import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * Expand a simple-tier shape to detailed channels, keeping the residue of `over`.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Requests the expansion of the simple tier into detailed channel weights stored in the document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Carries the simple shape and the residue of `over` the worker's expansion keeps.
 * @author Samchon
 */
export interface IBodySimpleExpandMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "expand";

  /** The simple-tier values to expand. */
  simple: IAutoMovieHumanBodySimpleShape;

  /** The detailed shape to keep the residue of; absent for a fresh body. */
  over?: Record<string, number>;
}
