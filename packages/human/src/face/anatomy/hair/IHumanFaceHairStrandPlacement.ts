import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IAutoMovieHumanFaceHairRootedTransition } from "./IAutoMovieHumanFaceHairRootedTransition";
import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairStrandSample } from "./IHumanFaceHairStrandSample";

/**
 * One strand's placement request to `growHumanFaceHairStrand`.
 *
 * The rooted stem was already admitted by the owning metric walk; placement projects the remainder with the same contact and, on rejection, resumes that walk once through `integrate`.
 *
 * @evidence contracts/common.md#principled-implementation An interpolated strand is placed after its already admitted canonical stem with the owning contact and resume callback.
 * @evidence contracts/common.md#clear-and-simple-design growHumanFaceHairStrand preserves the stem and delegates rejection back to the same metric walk once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Placement cannot replace canonical transition refusal; current remainder rejection invokes the supplied resume seam.
 * @evidence contracts/common.md#meaningful-documentation integrate may return undefined for the resident continuation loop, and all geometry remains in the head frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Remainder projection and metric checking execute in growHumanFaceHairStrand.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The owning walk reuses field, gather state and remaining budget when placement rejects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns callback, contact and borrowed strand or stem records; this input type creates no second walk.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStrandPlacement {
  /** The interpolated strand to place. */
  strand: IHumanFaceHairStrandSample;

  /** Contact of the owning walk. */
  contact: IHumanFaceHairContact;

  /** Canonical stem, already admitted by the owning metric walk. */
  rooted: IAutoMovieHumanFaceHairRootedTransition;

  /**
   * Placement rejection resumes the same walk; standalone callers may grow it.
   *
   * @evidence contracts/common.md#principled-implementation Placement rejection invokes the owning walk's continuation seam after its already admitted rooted stem.
   * @evidence contracts/common.md#clear-and-simple-design The resident builder supplies undefined so the current walk loop continues; standalone callers can return their own completed curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical transition refusal is not replaced by a second launch and a resumed producer's error propagates.
   * @evidence contracts/common.md#meaningful-documentation The returned curve/undefined distinguishes completed continuation from resident-loop resumption in head metres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Continuation cost executes in the supplied walk callback, not this erased signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The existing field, contact, gather phase and remaining budget are reused by that owning walk.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callback lifetime is borrowed from the current integration and this field creates no new retained walk state.
   */
  integrate: () => IAutoMovieHumanFaceHairCurve | undefined;
}
