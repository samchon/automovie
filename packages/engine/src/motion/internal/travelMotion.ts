import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";

const IDENTITY_ROT: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const IDENTITY_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Repeat an admitted in-place clip a positive safe-integer number of cycles and
 * add velocity times global seconds to its root. Velocity uses the receiving
 * motion's metre frame, not necessarily the final staged world frame; optional
 * facing rotates base root translation and orientation.
 */
export function travelMotion(
  id: string,
  base: IAutoMovieMotion,
  cycles: number,
  velocity: IAutoMovieVector3,
  facing?: IAutoMovieQuaternion,
): IAutoMovieMotion {
  if (cycles < 1) throw new Error("travel cycles must be a positive integer");
  const duration: number = cycles * base.duration;
  if (duration <= 0)
    throw new Error("travel duration must be finite and positive");

  const keyframes: IAutoMovieKeyframe[] = [];
  for (let c: number = 0; c < cycles; ++c) {
    for (const k of base.keyframes) {
      // drop the duplicate seam keyframe (a later cycle's time:0) so times stay
      // strictly increasing, the prior cycle's final frame covers the pose,
      // but the seam must carry the INCOMING cycle's first-segment easing
      // (sampleMotion eases each segment from its starting keyframe, #1012)
      if (c > 0 && k.time === 0) {
        const seam: IAutoMovieKeyframe = keyframes[keyframes.length - 1]!;
        keyframes[keyframes.length - 1] = {
          ...seam,
          easing: k.easing,
          bezier: k.bezier,
        };
        continue;
      }
      const globalT: number = c * base.duration + k.time;
      if (
        keyframes.length > 0 &&
        globalT <= keyframes[keyframes.length - 1]!.time
      )
        throw new Error("travel keyframe times must advance finitely");
      const baseRoot: IAutoMovieTransform | null = k.pose.root;
      // The base root (a bob or sway) lives in the model frame; under a
      // facing turn it must rotate with the body before the world travel is
      // added, or a lateral sway would stay world-axis-aligned (#1012).
      const baseTranslation: IAutoMovieVector3 | undefined =
        facing === undefined || baseRoot === null
          ? baseRoot?.translation
          : Quaternion.rotateVector(facing, baseRoot.translation);
      const translation: IAutoMovieVector3 = {
        x: (baseTranslation?.x ?? 0) + velocity.x * globalT,
        y: (baseTranslation?.y ?? 0) + velocity.y * globalT,
        z: (baseTranslation?.z ?? 0) + velocity.z * globalT,
      };
      keyframes.push({
        ...k,
        time: globalT,
        pose: {
          ...k.pose,
          root: {
            translation,
            rotation:
              facing === undefined
                ? (baseRoot?.rotation ?? { ...IDENTITY_ROT })
                : Quaternion.multiply(
                    facing,
                    baseRoot?.rotation ?? IDENTITY_ROT,
                  ),
            scale: baseRoot?.scale ?? { ...IDENTITY_SCALE },
          },
        },
      });
    }
  }
  return {
    id,
    skeleton: base.skeleton,
    duration,
    loop: false,
    keyframes,
    // Travel repeats the base cyclically, so the composite's stride clock is
    // the base's own: carry its cycle, or stamp one from the repeated base (a
    // hand-authored loop clip is still a cycle of its own duration).
    gaitCycle: base.gaitCycle ?? { period: base.duration, phaseAt: 0 },
  };
}
