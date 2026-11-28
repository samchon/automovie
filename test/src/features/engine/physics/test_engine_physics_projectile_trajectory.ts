import { AutoMovieEngineQuaternion, AutoMovieEngineSequence, AutoMovieEngineAir } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../../internal/predicates";

/** How far a baked key may stand from the closed form, metres. */
const KEY: number = 1e-6;

/**
 * How level the nose may be at the apex, unit components: the apex falls
 * between keys a thirtieth of a second apart, where the interpolated nose tilts
 * by under a thousandth.
 */
const LEVEL: number = 1e-3;

/** How far a baked flight may end from its solved target, metres. */
const LANDING: number = 2e-3;

/**
 * `projectileTrajectory` bakes a flight into a node clip of translation and
 * rotation keys, one per frame over the duration, endpoints included: the keys
 * are the constant-acceleration positions, and the rotation keeps the model's
 * +Z along the velocity so the projectile noses over.
 *
 * Scenarios, from (0, 1, 0) at (5, 8, 2) m/s under -9.81 m/s^2:
 *
 * 1. Over 1 s at 30 fps the clip has a translation and a rotation track of 31 keys
 *    closing on 1 s; at frame-aligned 0, 0.3, 2/3 and 1 s the position is `(5
 *    t, 1 + 8 t - 9.81 t^2 / 2, 2 t)`.
 * 2. At the apex, `8 / 9.81` s, the nose is level; by 1 s it points down.
 * 3. A solved launch from (0, 1.6, 0) at 16 m/s onto (12, 1.2, 4), baked at 60
 *    fps, ends on the target.
 * 4. A zero duration or a zero frame rate is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inclusive per-frame position and nose-aligned orientation contract, with launch-target and invalid-duration cases.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes a trajectory clip, samples its named node tracks and checks a separately solved launch at its terminal key.
 * @evidence contracts/development/testing.md#independent-expectations At 30 fps over 1 s there are 31 keys. The analytic position at frame ticks and apex time 8/9.81 s fix translation and the level-to-downward orientation change.
 */
export function test_engine_physics_projectile_trajectory(): void {
  const p: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 5, y: 8, z: 2 },
    gravity: { x: 0, y: -9.81, z: 0 },
  };
  const clip = AutoMovieEngineAir.projectileTrajectory("arrow", p, 1, 30);
  TestValidator.equals(
    "the tracks",
    [
      clip.tracks.map((t: IAutoMovieTrack): string =>
        t.channel.kind === "node" ? t.channel.path : "",
      ),
      clip.tracks[0]!.times.length,
    ],
    [["translation", "rotation"], 31],
  );
  let keyed: boolean = nclose(clip.tracks[0]!.times[30]!, 1);
  for (const t of [0, 0.3, 20 / 30, 1]) {
    const sampled: number[] = AutoMovieEngineSequence.sampleClip(clip, t).get(
      "node:arrow:translation",
    )!.value;
    keyed &&= vclose(
      { x: sampled[0]!, y: sampled[1]!, z: sampled[2]! },
      { x: 5 * t, y: 1 + 8 * t - (9.81 * t * t) / 2, z: 2 * t },
      KEY,
    );
  }
  TestValidator.predicate("the keys", keyed);
  const nose = (t: number): IAutoMovieVector3 => {
    const v: number[] = AutoMovieEngineSequence.sampleClip(clip, t).get("node:arrow:rotation")!.value;
    return AutoMovieEngineQuaternion.rotateVector(
      { x: v[0]!, y: v[1]!, z: v[2]!, w: v[3]! },
      { x: 0, y: 0, z: 1 },
    );
  };
  TestValidator.predicate(
    "the nose",
    nclose(nose(8 / 9.81).y, 0, LEVEL) && nose(1).y < 0,
  );
  const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };
  const target: IAutoMovieVector3 = { x: 12, y: 1.2, z: 4 };
  const launch = AutoMovieEngineAir.solveBallisticLaunch(origin, target, 16)!;
  const last: number[] = AutoMovieEngineAir.projectileTrajectory(
    "bolt",
    { origin, velocity: launch.velocity, gravity: p.gravity },
    launch.hitTime,
    60,
  ).tracks[0]!.values;
  TestValidator.predicate(
    "ends on the target",
    vclose(
      {
        x: last[last.length - 3]!,
        y: last[last.length - 2]!,
        z: last[last.length - 1]!,
      },
      target,
      LANDING,
    ),
  );
  TestValidator.equals(
    "refusals",
    [
      throwsError(() => AutoMovieEngineAir.projectileTrajectory("arrow", p, 0, 30)),
      throwsError(() => AutoMovieEngineAir.projectileTrajectory("arrow", p, 1, 0)),
    ],
    [true, true],
  );
}
