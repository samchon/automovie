import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { evaluateHumanBodyShape } from "../evaluateHumanBodyShape";

/**
 * One admitted document and its matching pose/rest/lean suppliers for skin appearance.
 *
 * @evidence contracts/common.md#principled-implementation Document, clinical rows and lazy geometry suppliers preserve one body's source/shape correspondence while appearance evaluates materials.
 * @evidence contracts/common.md#clear-and-simple-design The body builder retains geometry evaluation and this internal input passes its results to the material stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Appearance cannot substitute another document's rest/lean suppliers or treat pose color response as measured tissue deformation.
 * @evidence contracts/common.md#meaningful-documentation Members give admitted-document ownership, degree pose rows and source-corresponding lazy evaluation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Appearance-input typing performs no texture synthesis or skin-color evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplier dependencies describe builder-owned reuse without implementing material-cache identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed callbacks/documents acquire no texture cache or geometry lifetime in this schema.
 * @author Samchon
 */
export interface IHumanBodyAppearanceInput {
  /** Admitted numerical document whose copied materials receive the finish. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Coupled clinical pose rows in degrees for joint-color modulation. */
  pose: readonly IAutoMovieJointPose[];

  /**
   * Lazily return the same document's shaped rest geometry.
   *
   * @evidence contracts/common.md#principled-implementation Overlay thickness uses the builder's matching neutral shape, preserving source order with the selected material surface.
   * @evidence contracts/common.md#clear-and-simple-design Appearance requests geometry through one supplier while the builder remains the evaluator and owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared rest coordinates cannot establish imaged vein depth or replace the matching document with another shape.
   * @evidence contracts/common.md#meaningful-documentation The borrowed result contains metre surfaces and landmarks from the admitted preparation's source revision.
   * @evidence contracts/performance.md#efficient-algorithms The builder returns existing unposed geometry or lazily performs one complete neutral evaluation for a posed preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Overlay layers and performed-surface consumers share the preparation's single restOnce result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains its preparation while reachable; this input schema creates no independent geometry cache or background task.
   */
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;

  /**
   * Lazily return a source surface's matching lean positions in metres.
   *
   * @evidence contracts/common.md#principled-implementation Vein thickness compares rest positions with the selected source surface's declared lean override from the same document preparation.
   * @evidence contracts/common.md#clear-and-simple-design One indexed supplier connects appearance to the builder-owned shape evaluator without introducing an appearance-specific body model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The index requires a declared sag surface and source correspondence; the resulting projected difference is a proxy rather than measured vessel depth.
   * @evidence contracts/common.md#meaningful-documentation The borrowed array is in original surface order and body metres and shares the preparation's cache with sag.
   * @evidence contracts/performance.md#efficient-algorithms First demand evaluates the complete lean shape and retains that surface; repeated layers read the indexed cached array.
   * @evidence contracts/performance.md#reuse-equivalent-work One builder-local surface entry serves appearance and sag for the same admitted document.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Requested lean arrays remain with the preparation until released; appearance does not retain additional whole-body lean results through this signature.
   */
  leanOf: (index: number) => number[];
}
