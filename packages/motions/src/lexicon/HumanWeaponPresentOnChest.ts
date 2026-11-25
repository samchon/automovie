import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/**
 * A hand frame kept on a chest: where it lay on one chest's frame, carried onto
 * another's.
 */
export function HumanWeaponPresentOnChest(
  hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  then: IAutoMovieResolvedBone,
  now: IAutoMovieResolvedBone,
): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const back: IAutoMovieQuaternion = Quaternion.inverse(then.worldRotation);
  return {
    point: Vector3.add(
      now.worldPosition,
      Quaternion.rotateVector(
        now.worldRotation,
        Quaternion.rotateVector(
          back,
          Vector3.subtract(hand.point, then.worldPosition),
        ),
      ),
    ),
    rotation: Quaternion.multiply(
      now.worldRotation,
      Quaternion.multiply(back, hand.rotation),
    ),
  };
}
