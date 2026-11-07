import type { Fighter } from "../../entities/cast/fighter/Fighter";
import type { Referee } from "../../entities/cast/referee/Referee";
import type { Bell } from "../../entities/props/bell/Bell";
import type { RingCamera } from "../../entities/cameras/ring-camera/RingCamera";
import type { Ring } from "../../entities/sets/ring/Ring";

/**
 * Everyone and everything the bout's interactions relate by role: the two
 * fighters, the referee, the ring, the camera and the bell.
 *
 * @evidence docs/body/screenplay/kickboxing.md#s01 The scene's breakdown: A, B, the referee, the ring, the bell and the camera.
 * @evidence contracts/development/design.md#principled-representation Roles map to entities; ids live on the entities.
 */
export interface IRingCast {
  /** Fighter A. */
  a: Fighter;

  /** Fighter B. */
  b: Fighter;

  /** The referee. */
  referee: Referee;

  /** The ring. */
  ring: Ring;

  /** The camera. */
  camera: RingCamera;

  /** The bell. */
  bell: Bell;
}
