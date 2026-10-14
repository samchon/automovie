import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * Legacy paired-basis person evaluation: one validated static resident model with face:/body: part/material names in posed body metre Y-up/+Z-forward coordinates. Local collar/stitch owners publish shared boundary points/normals where supported; this result carrier adds no universal global manifold, collision or clinical proportion guarantee. Body retains its independent colour-derived evaluation before person collar alignment for rig/body tools, while person bones include actual face jaw/eye frames.
 *
 * Seam receipts report zero displayed ribbon triangles for shared boundary subdivision and the actual largest collar shift in metres. Shift is an assembly observation without a hardcoded neutral magnitude or anatomical acceptance tolerance. Source/runtime/visual qualification belongs to actual geometry owners and observation, not this type.
 *
 * @evidence contracts/common.md#principled-implementation The actual legacy person model, independent body build and measured seam displacement preserve their distinct numerical owners and frames.
 * @evidence contracts/common.md#clear-and-simple-design Canonical model/body/bone schemas carry outputs while two seam scalars summarize the existing join without another runtime geometry representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared boundary publication is not claimed global manifoldness or clinical fit, and collarShift is not an invented tolerance or current GPU observation.
 * @evidence contracts/common.md#meaningful-documentation Prose states posed metre axes, namespace prefixes, independent body timing, zero ribbon and observation-only shift meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result record performs no person construction, stitching or displacement scan; owning builders/readers execute them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing one result for editor/export is runtime behavior rather than a cache implemented by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no asset task or renderer; build/caller owners control model/body/bone buffer retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBuild {
  /** The posed person, validated as a resident model. */
  model: IAutoMovieModel;

  /** The body's own evaluation, before its collar followed the face. */
  body: IAutoMovieHumanBodyBuild;

  /**
   * Rest/posed world frames of body joints followed by available face jaw/leftEye/rightEye frames carried under the head, in the common basis frame.
   */
  bones: IAutoMovieHumanBodyBuild["bones"];

  /** The state of the join at the neck on this evaluation. */
  seam: {
    /** Displayed joining ribbon triangles. Shared boundary subdivision needs none and returns zero. */
    ribbonTriangles: number;

    /**
     * Largest actual retained body-collar displacement during person conformity, metres; this receipt supplies no clinical acceptance bound or fixed neutral value.
     */
    collarShiftMetres: number;
  };
}
