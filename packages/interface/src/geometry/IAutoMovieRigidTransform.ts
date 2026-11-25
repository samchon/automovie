import type { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A rigid placement with metre translation and a unit quaternion, without
 * scale.
 *
 * The containing field owns the source and destination frames: a physical
 * segment's neutral placement is body-relative, joint and collider placements
 * are bone-relative, and evaluated prop placements are world-relative. A worn
 * prop offset is bone-relative. The same representation does not convert them.
 *
 * Values are mutable object components. Callers retain ownership unless their
 * operation says it allocates a result. Physical-profile admission checks
 * finite native-representable translation and quaternion norm within 1e-6;
 * motion and composition producers own the premises of their evaluated
 * placements. This record neither validates nor normalizes supplied values.
 */
export interface IAutoMovieRigidTransform {
  /**
   * Source origin in the destination frame, metres; that frame is named by the
   * containing field.
   */
  position: IAutoMovieVector3;

  /** Unit quaternion mapping source-frame axes into the destination frame. */
  rotation: IAutoMovieQuaternion;
}
