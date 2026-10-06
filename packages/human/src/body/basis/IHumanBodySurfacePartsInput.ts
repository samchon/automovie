import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import type { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Evaluation state of one document consumed by the existing surface/material projector. Every callback belongs to that same document and source.
 *
 * @evidence contracts/common.md#principled-implementation Carries the document, shaped result, posed flag, transforms and lazy appearance/rest suppliers, preserving the original material-projection evaluation state.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original material-projection evaluation state; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Document, shaped state and lazy rest/lean suppliers remain one evaluation; the posed flag does not substitute another document or material population.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The admitted document preserves named shape, pose and appearance authority; lazy source arrays remain internal evaluation state.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Shaped/rest/lean positions and landmarks are metres in the right-handed +Y-up, +Z-anterior, +X-left body basis frame; bone rotations are unit quaternions and evaluated site colours are linear RGB.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The shaped skin/landmarks and site colours retain compiled-source and appearance-owner qualification; this record establishes no independently acquired internal anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority The admitted document preserves named shape, pose and appearance authority; lazy source arrays remain internal evaluation state.
 * @author Samchon
 */
export interface IHumanBodySurfacePartsInput {
  /** Admitted document whose appearance and motion are evaluated. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Shaped source skin and joint landmarks. */
  shaped: ReturnType<typeof evaluateHumanBodyShape>;

  /** Whether performed filtering, sag and relief are active. */
  posed: boolean;

  /** Existing world rest/posed frame map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** Lazily evaluate document rest once. */
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;

  /** Lazily evaluate a source surface's matching lean skin. */
  leanOf: (index: number) => number[];

  /** Existing appearance owner's evaluated site colours. */
  coloured: ReturnType<ReturnType<typeof createHumanBodyAppearance>>["coloured"];
}
