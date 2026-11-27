import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/*
 * A hand frame kept on a chest: where it lay on one chest's frame, carried onto
 * another's.
 */
export function HumanWeaponPresentOnChest(
  hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  then: IAutoMovieResolvedBone,
  now: IAutoMovieResolvedBone,
): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(then.worldRotation);
  return {
    point: AutoMovieEngineVector3.add(
      now.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(
        now.worldRotation,
        AutoMovieEngineQuaternion.rotateVector(
          back,
          AutoMovieEngineVector3.subtract(hand.point, then.worldPosition),
        ),
      ),
    ),
    rotation: AutoMovieEngineQuaternion.multiply(
      now.worldRotation,
      AutoMovieEngineQuaternion.multiply(back, hand.rotation),
    ),
  };
}
