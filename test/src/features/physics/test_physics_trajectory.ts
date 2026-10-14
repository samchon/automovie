import {
  IAutoMovieProjectile,
  Quaternion,
  projectileTrajectory,
  sampleClip,
  solveBallisticLaunch,
} from "@automovie/engine";
import { IAutoMovieTrack, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * `projectileTrajectory`: bake a projectile's flight into a node clip. The
 * contract is that the baked clip agrees with constant-acceleration motion
 * at sampled instants, and its rotation keeps the
 * model's +Z along the velocity so the arrow noses over.
 *
 * Scenarios:
 *
 * 1. A 30 fps trajectory over a 1 s flight has 31 keys (endpoints included) on
 *    both a translation and a rotation track for the projectile node, closing
 *    exactly on the duration.
 * 2. Sampling the clip at several instants matches the constant-acceleration position equation.
 * 3. The rotation aims +Z down the instantaneous velocity: at the top of a lobbed
 *    arc the arrow is level, and by landing it noses downward.
 * 4. End to end with the aim solver: fire a solved launch, bake its flight, and
 *    the clip's last position sits on the target.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes and samples a projectile clip, checking track order, key count, endpoint time, frame-aligned positions, apex/landing facing and solved-launch landing; wrong sample timing, acceleration or orientation fails.
 * @evidence contracts/testing.md#independent-expectations Authored p0+v0*t+g*t^2/2 values replace projectileAt as the position oracle, key arithmetic gives 31 and the authored target defines final landing. sampleClip and Quaternion remain shared interpretation dependencies; apex interpolation has a stated tolerance and no rendered appearance is proved.
 * @evidence contracts/testing.md#distinguishing-cases Covers start/interior/end keys, horizontal apex versus downward landing and an oblique solved flight at a different fps; invalid timing and state admission belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all assertions and calls clip/math functions directly with local records, without a viewer, GPU or dynamically registered cases.
 */
export function test_physics_trajectory(): void {
  const p: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 5, y: 8, z: 2 },
    gravity: { x: 0, y: -9.81, z: 0 },
  };
  const clip: ReturnType<typeof projectileTrajectory> = projectileTrajectory(
    "arrow",
    p,
    1,
    30,
  );

  TestValidator.equals(
    "translation + rotation tracks on the node",
    clip.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.path : "",
    ),
    ["translation", "rotation"],
  );
  TestValidator.equals(
    "31 keys over 1 s at 30 fps",
    clip.tracks[0]!.times.length,
    31,
  );
  TestValidator.predicate(
    "closes on the duration",
    nclose(clip.tracks[0]!.times[30]!, 1),
  );

  // Check at frame-aligned instants (multiples of 1/30) where the clip's
  // linear track returns the baked value exactly. Between samples the linear
  // interpolation of a parabola drifts, as it should.
  for (const t of [0, 0.3, 20 / 30, 1]) {
    const sampled: number[] = sampleClip(clip, t).get(
      "node:arrow:translation",
    )!.value;
    TestValidator.predicate(
      `position at ${t.toFixed(3)}s matches constant acceleration`,
      vclose(
        { x: sampled[0]!, y: sampled[1]!, z: sampled[2]! },
        { x: 5 * t, y: 1 + 8 * t - (9.81 * t * t) / 2, z: 2 * t },
        1e-6,
      ),
    );
  }

  const rotAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => {
    const v: number[] = sampleClip(clip, t).get("node:arrow:rotation")!.value;
    return Quaternion.rotateVector(
      { x: v[0]!, y: v[1]!, z: v[2]!, w: v[3]! },
      { x: 0, y: 0, z: 1 },
    );
  };
  const apex: number = 8 / 9.81; // v_y / g, the top of the arc
  TestValidator.predicate(
    "at the apex the arrow is level (no vertical velocity)",
    nclose(rotAt(apex).y, 0, 1e-3),
  );
  TestValidator.predicate(
    "by landing the arrow noses downward",
    rotAt(1).y < 0,
  );

  // 4. end to end with the aim
  const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };
  const target: IAutoMovieVector3 = { x: 12, y: 1.2, z: 4 };
  const sol: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, target, 16)!;
  const flight: ReturnType<typeof projectileTrajectory> = projectileTrajectory(
    "bolt",
    { origin, velocity: sol.velocity, gravity: p.gravity },
    sol.hitTime,
    60,
  );
  const last: number[] = flight.tracks[0]!.values;
  TestValidator.predicate(
    "the baked flight ends on the target",
    vclose(
      {
        x: last[last.length - 3]!,
        y: last[last.length - 2]!,
        z: last[last.length - 1]!,
      },
      target,
      2e-3,
    ),
  );
}
