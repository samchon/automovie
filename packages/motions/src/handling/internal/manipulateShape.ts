import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
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
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * The hand's shape while one digit presses in a keyed contact sequence
 * (`manipulate`): that digit straight, as the flat hand holds it, for its
 * inverse kinematics to take down to its key. Other digits retain their relaxed
 * shape when it clears the key plane by the hover height. Each remaining digit
 * takes a clearing shape or lifts its own tip from the achieved wrist frame.
 * Parameter body: The rig supplying each shaped tip.
 * Parameter wrist: The achieved wrist point, in world metres.
 * Parameter rotation: The achieved wrist rotation.
 * Parameter site: The key top in world metres.
 * Parameter normal: The surface's unit outward normal.
 * Parameter side: The hand.
 * Parameter digit: The pressing digit, as `manipulate.Finger` names it.
 * Returns: The digit angles and only the additional goals required for
 * clearance.
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
  const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(rotation),
    normal,
  );
  const clearance: number = AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(wrist, site), normal);
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
          AutoMovieEngineVector3.dot(
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
          point: AutoMovieEngineVector3.addScaled(point, local, typeText.HOVER - best),
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

/*
 * Resting digit angles and the individual tips requiring clearance from the
 * surface.
 */
interface IShape {
  joints: IAutoMovieMotionHumanPosture["joints"];
  avoid: NonNullable<IAutoMovieMotionHumanPosture["digits"]>;
}

/*
 * Anatomical digits on a manipulating hand.
 */
const DIGITS: readonly IAutoMovieMotionHumanManipulate.Finger[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "little",
];

/*
 * Prefer the relaxed shape when it clears, then compare the extended and flexed
 * forms.
 */
const FORMS: readonly IAutoMovieMotionHumanHand.Shape[] = [
  "relaxed",
  "flat",
  "fist",
];
