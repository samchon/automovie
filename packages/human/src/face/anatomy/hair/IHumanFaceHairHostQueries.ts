import type {
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";
import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The compiled readers of one hair host surface, cached per surface by the
 * hair builder for one evaluation.
 *
 * All four are compiled from the same current closed collider, so contact,
 * rays, separation and root support never disagree about the skin.
 *
 * @evidence contracts/common.md#principled-implementation One compilation feeds every reader so all hair proofs read one skin.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous cache value type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reader is compiled from a different or stale surface.
 * @evidence contracts/common.md#meaningful-documentation States the producer, cache scope and shared source.
 * @evidence contracts/modeling.md#spatial-conventions Every reader uses the current head-local metre frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries All readers describe the one host skin that bounds the hair.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived readers, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairHostQueries {
  /** Signed closed-collider query for contact and projection. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Ray index for root-to-station exterior intervals. */
  raycaster: ReturnType<typeof createAutoMovieMeshRayCaster>;

  /** Source and represented separation readers for ribbon certification. */
  separation: IHumanFaceHairSeparationReaders;

  /** Root support resolver and proximity reader. */
  boundary: ReturnType<typeof createHumanFaceHairRootBoundary>;
}
