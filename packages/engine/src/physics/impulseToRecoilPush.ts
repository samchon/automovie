import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Bridge an {@link IAutoMovieImpact}'s impulse to a recoil
 * {@link IAutoMovieRecoilPush}: the missing consumer between collision response
 * and flinch. The impulse magnitude (N·s) scaled by `gainDegPerImpulse` becomes
 * the `flexion` the struck body yields; {@link impactRecoil} then bounds that
 * push by joint ROM and spreads it down the chain. Kept deliberately simple
 * (one dominant flexion axis): it is an AI hint, not a solved contact
 * response.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Maps the computed impulse magnitude into a deterministic recoil cue.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Bridges the contact output to its bounded pose reaction.
 * @author Samchon
 */
export const impulseToRecoilPush = (
  impulse: IAutoMovieVector3,
  gainDegPerImpulse: number,
): IAutoMovieRecoilPush => {
  if (!Number.isFinite(gainDegPerImpulse))
    throw new RangeError(
      `recoil push gain must be finite, but was ${gainDegPerImpulse}`,
    );
  if (gainDegPerImpulse < 0)
    throw new RangeError(
      `recoil push gain must be >= 0, but was ${gainDegPerImpulse}`,
    );
  return { flexion: Vector3.length(impulse) * gainDegPerImpulse };
};

/**
 * Scale one input deflection down the recoil chain. An absent or zero push is
 * represented as `null`, the pose model's resting axis, so a zero-excluding ROM
 * does not drag an untouched axis to its minimum and the resulting pose remains
 * legal under the same validator. A non-zero deflection stays explicit for the
 * shared whole-joint ROM clamp.
 */
const scaledPushAxis = (value: number | null, scale: number): number | null => {
  if (value === null) return null;
  const scaled = value * scale;
  return scaled === 0 ? null : scaled;
};

const readPushAxis = (
  axis: keyof IAutoMovieRecoilPush,
  value: number | undefined,
): number | null => {
  if (value === undefined || value === 0) return null;
  if (!Number.isFinite(value))
    throw new RangeError(
      `impact recoil push ${axis} must be finite, but was ${value}`,
    );
  return value;
};
