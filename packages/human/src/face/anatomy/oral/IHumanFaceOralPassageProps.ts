import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";

/**
 * Actual geometry inputs for tooth-presence-independent oral passage.
 *
 * @evidence contracts/common.md#principled-implementation Actual present-crown colliders and final lips/tongue are paired with the same shaped reference for passage comparison.
 * @evidence contracts/common.md#clear-and-simple-design Tooth-presence-independent passage uses source jaw-derived up/forward directions rather than absent incisor landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection/slab/tolerance are coarse geometry conventions and prove neither a clinical seal nor constant-volume mechanics.
 * @evidence contracts/common.md#meaningful-documentation Source arrays use head metres and reference omits independent tongue performance while positions contain final contact corrections.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Projected section and crossing comparison execute in evaluateHumanFaceOralPassage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Existing present-crown query geometry is reused instead of absent-tooth proxy reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns basis, arrays and collider assembly for this synchronous check; this input creates no second mesh/query cache.
 *
 * @author Samchon
 */
export interface IHumanFaceOralPassageProps {
  /** Source contact ports, tongue connectivity and unchanged geometric tolerance. */
  basis: IAutoMovieHumanFaceBasis;
  /** Same present-crown query geometry used by the contact owner. */
  assembly: IHumanFaceOralAssembly;
  /** Shape-only source reference, with independent tongue performance omitted. */
  reference: ReadonlyMap<string, readonly number[]>;
  /** Actual final contact-corrected source arrays; absent teeth are not read. */
  positions: ReadonlyMap<string, readonly number[]>;
  /** Source jaw-axis-derived unit opening direction. */
  up: IAutoMovieVector3;
  /** Source jaw-axis-derived unit anterior direction. */
  forward: IAutoMovieVector3;
}
