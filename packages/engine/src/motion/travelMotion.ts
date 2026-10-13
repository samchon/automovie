import type { IAutoMovieTransform, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";


import { Quaternion } from "../math/Quaternion";

const IDENTITY_ROT: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const IDENTITY_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

const assertFiniteVector: (label: string, vector: IAutoMovieVector3) => void = (label: string, vector: IAutoMovieVector3): void => {
  if (!Number.isFinite(vector.x)) throw new Error(`${label}.x must be finite`);
  if (!Number.isFinite(vector.y)) throw new Error(`${label}.y must be finite`);
  if (!Number.isFinite(vector.z)) throw new Error(`${label}.z must be finite`);
};

const assertFiniteQuaternion: (label: string, quaternion: IAutoMovieQuaternion) => void = (
  label: string,
  quaternion: IAutoMovieQuaternion,
): void => {
  if (!Number.isFinite(quaternion.x))
    throw new Error(`${label}.x must be finite`);
  if (!Number.isFinite(quaternion.y))
    throw new Error(`${label}.y must be finite`);
  if (!Number.isFinite(quaternion.z))
    throw new Error(`${label}.z must be finite`);
  if (!Number.isFinite(quaternion.w))
    throw new Error(`${label}.w must be finite`);
};

/**
 * Repeat an admitted in-place clip a positive safe-integer number of cycles and add velocity times global seconds to its root. Velocity uses the receiving motion's metre frame, not necessarily the final staged world frame; optional facing rotates base root translation and orientation.
 *
 * @evidence contracts/common.md#principled-implementation Global-time translation keeps travel continuous across repeated seams; incoming first-segment easing replaces the retained seam easing, and optional facing composes before travel is added.
 * @evidence contracts/common.md#clear-and-simple-design One loop owns cycle repetition, root placement and stride-clock carry; the locomotion caller determines speed and cycle count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid cycles, velocity and facing are rejected before baking; empty or otherwise malformed base clips remain outside the admitted-motion premise, and output growth has no arbitrary choreography cap.
 * @evidence contracts/common.md#meaningful-documentation States motion-frame metres/second, cycle admission, facing composition, seam behavior and fallback identity ownership.
 * @evidence contracts/performance.md#efficient-algorithms For C cycles and K base keyframes, O(CK) time and output storage are required to bake every repeated keyframe; there is no continuous physics integration.
 * @evidence contracts/performance.md#reuse-equivalent-work Base articulation and authored root values remain borrowed, while fallback identity values are fresh per output root; gait metadata is carried once rather than recalculated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the output clip and its roots; no shared mutable fallback identity escapes and no ongoing simulation task or cache is retained.
 */
export const travelMotion: (id: string, base: IAutoMovieMotion, cycles: number, velocity: IAutoMovieVector3, facing?: IAutoMovieQuaternion) => IAutoMovieMotion = (
  id: string,
  base: IAutoMovieMotion,
  cycles: number,
  velocity: IAutoMovieVector3,
  facing?: IAutoMovieQuaternion,
): IAutoMovieMotion => {
  if (!Number.isSafeInteger(cycles))
    throw new Error("travel cycles must be a positive integer");
  if (cycles < 1) throw new Error("travel cycles must be a positive integer");
  assertFiniteVector("travel velocity", velocity);
  if (facing !== undefined) assertFiniteQuaternion("travel facing", facing);
  const duration: number = cycles * base.duration;
  if (!Number.isFinite(duration) || duration <= 0)
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
      if (!Number.isFinite(globalT) ||
          (keyframes.length > 0 && globalT <= keyframes[keyframes.length - 1]!.time))
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
      assertFiniteVector("travel root translation", translation);
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
};
