import { IAutoMovieClip } from "@automovie/interface";
import { aimRotation } from "../kinematics/aimRotation";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { projectileAt } from "./projectileAt";

/**
 * Bake a projectile's flight into an {@link IAutoMovieClip} for its scene node:
 * position sampled from {@link projectileAt} at `fps`, plus a rotation track
 * that keeps the model's forward (+Z) pointing down the arc's velocity, so the
 * arrow noses over as it falls. This is the projectile half of the `launch`
 * verb (paired with the aim `solveBallisticLaunch` computed): the host applies
 * the clip to the thrown prop and plays it through `sampleClip`.
 *
 * Samples the closed-form solution, so there is no integration drift; the last
 * key lands exactly on `duration`.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Bakes the analytic projectile path into deterministic position and rotation tracks.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Converts the analytic tier into an authored-motion compatible clip.
 * @author Samchon
 */
export const projectileTrajectory = (
  node: string,
  p: IAutoMovieProjectile,
  duration: number,
  fps = 30,
): IAutoMovieClip => {
  if (!Number.isFinite(duration))
    throw new RangeError(
      `projectile trajectory duration must be finite, but was ${duration}`,
    );
  if (!(duration > 0))
    throw new RangeError(
      `projectile trajectory duration must be > 0 seconds, but was ${duration}`,
    );
  if (!Number.isFinite(fps))
    throw new RangeError(
      `projectile trajectory fps must be finite, but was ${fps}`,
    );
  if (!(fps > 0))
    throw new RangeError(
      `projectile trajectory fps must be > 0, but was ${fps}`,
    );

  const count = Math.max(1, Math.round(duration * fps));
  const times: number[] = [];
  const pos: number[] = [];
  const rot: number[] = [];
  for (let i = 0; i <= count; ++i) {
    const t = (i / count) * duration;
    const { position, velocity } = projectileAt(p, t);
    times.push(t);
    pos.push(position.x, position.y, position.z);
    const q = aimRotation(PROJECTILE_FORWARD, velocity);
    rot.push(q.x, q.y, q.z, q.w);
  }
  return {
    id: `trajectory:${node}`,
    name: null,
    duration,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node, path: "translation" },
        times,
        values: pos,
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node, path: "rotation" },
        times,
        values: rot,
        interpolation: "linear",
      },
    ],
  };
};

/** A projectile model faces +Z; its trajectory rotates that onto the flight. */
const PROJECTILE_FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
