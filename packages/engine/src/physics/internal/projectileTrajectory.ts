import type {
  IAutoMovieClip,
  IAutoMovieProjectile,
  IAutoMovieProjectileState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { projectileAt } from "./projectileAt";

/** A projectile model faces +Z; its trajectory rotates that onto the flight. */
const PROJECTILE_FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

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
 */
export const projectileTrajectory: (
  node: string,
  p: IAutoMovieProjectile,
  duration: number,
  fps?: number,
) => IAutoMovieClip = (
  node: string,
  p: IAutoMovieProjectile,
  duration: number,
  fps: number = 30,
): IAutoMovieClip => {
  if (duration <= 0)
    throw new RangeError(
      `projectile trajectory duration must be > 0 seconds, but was ${duration}`,
    );
  if (fps <= 0)
    throw new RangeError(
      `projectile trajectory fps must be > 0, but was ${fps}`,
    );

  const count: number = Math.max(1, Math.round(duration * fps));
  const times: number[] = [];
  const pos: number[] = [];
  const rot: number[] = [];
  for (let i: number = 0; i <= count; ++i) {
    const t: number = (i / count) * duration;
    const { position, velocity, rotation }: IAutoMovieProjectileState =
      projectileAt(p, t);
    times.push(t);
    pos.push(position.x, position.y, position.z);

    // A stated attitude turns the body; without one the nose follows the arc.
    const q: IAutoMovieQuaternion =
      rotation ?? AutoMovieEngineKinematics.aimRotation(PROJECTILE_FORWARD, velocity);
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
