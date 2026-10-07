import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "@automovie/human";

/**
 * What the simple tier reads a body from: the document's authored channel
 * weights and its anatomical measurements.
 *
 * The builder solves the anatomy's bound targets into channel weights before
 * shaping, so a projection read from the weights alone would describe a body
 * the editor does not show; the pair is the projection's input and its
 * invalidation key.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Carries the inputs a simple-tier reading of the shown body depends on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Keys the projection by the authored weights and anatomy together.
 * @author Samchon
 */
export interface IBodySimpleBody {
  /** Authored channel weights. */
  shape: Record<string, number>;

  /** Anatomical measurements the builder solves into channel weights, if any. */
  anatomy?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** Optional whole-person context identity; a changed head invalidates stature and volume readback. */
  contextKey?: string;
}
