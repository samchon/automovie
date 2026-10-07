import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The last closed-collider query a hair contact made, kept so that sampling
 * the same coordinates again returns the identical hit without a new query.
 *
 * The query is deterministic in its point, so reuse changes no answer. The
 * point is an owned copy; the hit is shared and read only.
 *
 * @evidence contracts/common.md#principled-implementation Reuses a deterministic query's answer only for bit-identical coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace an anonymous cache record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hit is returned for different coordinates.
 * @evidence contracts/common.md#meaningful-documentation States the reuse condition and ownership.
 * @evidence contracts/modeling.md#spatial-conventions The point is current head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The hit is read from the one host collider.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSample {
  /** Owned copy of the queried point. */
  point: IAutoMovieVector3;

  /** The query's answer at that point. */
  hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;
}
