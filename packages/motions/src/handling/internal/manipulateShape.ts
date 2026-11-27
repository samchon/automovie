import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../../everyday/internal/typeText";
import { HumanHand } from "../../posture/HumanHand";

/**
 * Resting digit angles and the individual tips requiring clearance from the
 * surface.
 */
interface IShape {
  joints: IAutoMovieMotionHumanPosture["joints"];
  avoid: NonNullable<IAutoMovieMotionHumanPosture["digits"]>;
}

/**
 * The hand's shape while one digit presses in a keyed contact sequence
 * (`manipulate`): that digit straight, as the flat hand holds it, for its
 * inverse kinematics to take down to its key. Other digits retain their relaxed
 * shape when it clears the key plane by the hover height. Each remaining digit
 * takes a clearing shape or lifts its own tip from the achieved wrist frame.
 *
 * @param body The rig supplying each shaped tip.
 * @param wrist The achieved wrist point, in world metres.
 * @param rotation The achieved wrist rotation.
 * @param site The key top in world metres.
 * @param normal The surface's unit outward normal.
 * @param side The hand.
 * @param digit The pressing digit, as `manipulate.Finger` names it.
 * @returns The digit angles and only the additional goals required for
 *   clearance.
 */
export function manipulateShape(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  digit: IAutoMovieMotionHumanManipulate.Finger,
  wrist: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  site: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IShape {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    normal,
  );
  const clearance: number = Vector3.dot(Vector3.subtract(wrist, site), normal);
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  const avoid: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {};
  for (const finger of DIGITS) {
    const prefix: string = side + finger[0]!.toUpperCase() + finger.slice(1);
    const surface: IAutoMovieMotionHumanHand.DigitSurface = `${finger}Tip`;
    let selected: IAutoMovieMotionHumanHand.Shape = "flat";
    if (finger !== digit) {
      let best: number = -Infinity;
      for (const shape of FORMS) {
        const height: number =
          clearance +
          Vector3.dot(
            HumanHand.offset(body, side, surface, shape).point,
            local,
          );
        if (height > best) {
          selected = shape;
          best = height;
        }
        if (height >= typeText.HOVER) break;
      }
      if (best < typeText.HOVER) {
        const point: IAutoMovieVector3 = HumanHand.offset(
          body,
          side,
          surface,
          selected,
        ).point;
        avoid[prefix as AutoMovieHumanDigit] = {
          on: `${side}Hand`,
          surface: "tip",
          point: Vector3.addScaled(point, local, typeText.HOVER - best),
        };
      }
    }
    for (const [bone, angles] of Object.entries(
      HumanHand.shape(side, selected),
    ))
      if (bone.startsWith(prefix))
        joints[bone as AutoMovieHumanoidBone] = angles;
  }
  return { joints, avoid };
}

/** Anatomical digits on a manipulating hand. */
const DIGITS: readonly IAutoMovieMotionHumanManipulate.Finger[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "little",
];

/**
 * Prefer the relaxed shape when it clears, then compare the extended and flexed
 * forms.
 */
const FORMS: readonly IAutoMovieMotionHumanHand.Shape[] = [
  "relaxed",
  "flat",
  "fist",
];
