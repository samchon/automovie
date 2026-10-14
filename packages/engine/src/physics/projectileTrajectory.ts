import type {
  IAutoMovieClip,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { aimRotation } from "../kinematics/aimRotation";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";
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
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Sample constant-acceleration states at i*duration/round(duration*fps), including both endpoints; aimRotation aligns +Z to velocity. Requested fps is approximate after rounding, and linear clip interpolation approximates the continuous parabola.
 * @evidence contracts/common.md#clear-and-simple-design The producer writes clip buffers directly and delegates state and facing mathematics to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The minimum one interval is an explicit sampling rule; no expected impact time is inserted. Very large finite duration*fps still requires a representable, allocatable frame count from callers.
 * @evidence contracts/common.md#meaningful-documentation Docs give seconds/fps inputs, position and quaternion tracks, endpoint inclusion and invalid-quantity throws; consumers own the returned clip buffers.
 * @evidence contracts/performance.md#efficient-algorithms F intervals require O(F) state/facing work and O(F) time, translation and rotation output storage; no constant-memory claim applies to the clip.
 * @evidence contracts/performance.md#reuse-equivalent-work The sampled state serves both translation and facing at each frame; no result is cached across mutable projectile or sample-clock inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocated clip arrays transfer to the caller on success; no native handle or background sampler survives failure or completion.
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

  const count: number = Math.max(1, Math.round(duration * fps));
  const times: number[] = [];
  const pos: number[] = [];
  const rot: number[] = [];
  for (let i: number = 0; i <= count; ++i) {
    const t: number = (i / count) * duration;
    const { position, velocity }: IAutoMovieProjectileState = projectileAt(
      p,
      t,
    );
    times.push(t);
    pos.push(position.x, position.y, position.z);
    const q: IAutoMovieQuaternion = aimRotation(PROJECTILE_FORWARD, velocity);
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
