import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
  resolveHydrodynamicForce,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSwimImmersed,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Passive immersion and one keyed stroke through the typed chain and displayed
 * pose route.
 *
 * Scenarios:
 *
 * 1. A medium whose half-volume weighs the performer carries the supine body in
 *    place with half the profile's equivalent sphere volume submerged.
 * 2. A head-first coast at yaw 90 follows the closed-form distance in world -X at
 *    two film seconds. Reading those seconds backwards gives the same positions
 *    and there is no vertical or cross-track drift.
 * 3. A medium whose whole displacement weighs only half the performer refuses the
 *    immersed support, identifying the water density.
 * 4. A single breaststroke drives its displayed hip target along its heading from
 *    rest, with nonzero travel that replays at the same stroke phase under an
 *    authored duration change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public route, the fixture's two density relations, the travel frame and the read order.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the displayed bones, pose root and located refusal through HumanPerformance, so a disconnected registered law or a staged constant-speed path fails.
 * @evidence contracts/development/testing.md#independent-expectations Archimedes' balance, the spherical-cap formula, the closed-form coast and the phase scaling of quadratic drag supply the expectations. The profile supplies the authored segment volumes and centres, and 2 percent is the issue's passive mechanics bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Still and moving cases use the same supported medium. The insufficient medium cannot satisfy force balance, and the stroke is compared at two authored durations.
 * @evidence contracts/development/testing.md#execution-ownership Uses one canonical body and a small fixed set of display reads, with no viewer or solver process.
 */
export function test_motion_swim_immersed(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const volumes: number[] = body.profile.segments.map(
    resolveHydrodynamicForce.volume,
  );
  const totalVolume: number = volumes.reduce(
    (sum: number, volume: number): number => sum + volume,
    0,
  );
  const density: number = (2 * body.profile.mass) / totalVolume;
  const surface: number = 0;
  const seconds: number = 0.4;
  const Chain: IAutoMovieMotionHumanChain.IExtension<{
    swimImmersed: typeof AutoMovieMotionHumanSwim.swimImmersed;
  }> = HumanChain.extend({
    swimImmersed: AutoMovieMotionHumanSwim.swimImmersed,
  });

  /** Place the same swimmer in each declared medium. */
  const stage = (
    input: IAutoMovieMotionHumanSwimImmersed,
    seed: string = "passive-immersion",
  ): HumanPerformance =>
    new HumanPerformance({
      seed,
      performers: [
        {
          subject: "swimmer",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 90,
          proficiency: { level: "trained" },
        },
      ],
      laws: [AutoMovieMotionHumanSwim.swimImmersed],
      composition: Chain.subject("swimmer").swimImmersed(input).node,
    });

  const floating: HumanPerformance = stage({
    water: { surface, density },
    duration: seconds,
  });
  const floatPose: IAutoMoviePose = floating.pose("swimmer", 0);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, floatPose);
  let displaced: number = 0;
  let area: number = 0;
  for (let i: number = 0; i < model.segments.length; ++i) {
    const segment: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
    const bone: IAutoMovieResolvedBone = bones.get(segment.bone)!;
    const volume: number = volumes[i]!;
    if (volume === 0) continue;
    const y: number =
      bone.worldPosition.y +
      Quaternion.rotateVector(bone.worldRotation, segment.point).y;
    const radius: number = Math.cbrt((3 * volume) / (4 * Math.PI));
    const cap: number = Math.min(2 * radius, Math.max(0, surface - y + radius));
    const submerged: number = (Math.PI * cap ** 2 * (3 * radius - cap)) / 3;
    displaced += submerged;
    area += (Math.PI * radius ** 2 * submerged) / volume;
  }
  TestValidator.predicate(
    "displayed float displaces its own mass",
    nclose(displaced * density, body.profile.mass, 0.02 * body.profile.mass),
  );
  const start: IAutoMovieVector3 = floatPose.root!.translation;
  const end: IAutoMovieVector3 = floating.pose("swimmer", seconds).root!
    .translation;
  TestValidator.predicate(
    "still water holds the float in place",
    vclose(start, end),
  );

  const speed: number = 1;
  const coefficient: number =
    (0.5 * density * resolveHydrodynamicForce.DRAG * area) / body.profile.mass;
  const gliding: HumanPerformance = stage({
    water: { surface, density },
    duration: seconds,
    speed,
  });
  // Use distinct times in nonmonotonic order and check each against the
  // analytic path rather than against a cached read.
  for (const time of [seconds, seconds / 4, seconds / 2]) {
    const travel: number = Math.log1p(coefficient * speed * time) / coefficient;
    const read: IAutoMovieVector3 = gliding.pose("swimmer", time).root!
      .translation;
    TestValidator.predicate(
      `coast at ${time} s travels head first under quadratic drag`,
      nclose(read.x, start.x - travel, 0.02 * travel) &&
        nclose(read.y, start.y) &&
        nclose(read.z, start.z),
    );
  }

  const strokeSeconds: number = 1.35;
  const stroke: HumanPerformance = stage({
    water: { surface, density },
    duration: strokeSeconds,
    stroke: "breaststroke",
  });
  const slower: HumanPerformance = stage(
    {
      water: { surface, density },
      duration: 2 * strokeSeconds,
      stroke: "breaststroke",
    },
    "slower-stroke",
  );
  /** The midpoint of the two hips is the translating point pinned by the keys. */
  const hips = (film: HumanPerformance, time: number): IAutoMovieVector3 => {
    const frame: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("swimmer", time);
    return Vector3.scale(
      Vector3.add(
        frame.get("leftUpperLeg")!.worldPosition,
        frame.get("rightUpperLeg")!.worldPosition,
      ),
      0.5,
    );
  };
  const first: IAutoMovieVector3 = hips(stroke, 0);
  const early: IAutoMovieVector3 = hips(stroke, strokeSeconds / 120);
  const shares: readonly number[] = [0.75, 0.5, 0.25];
  const displacements: number[] = shares.map((share: number): number => {
    const moved: IAutoMovieVector3 = hips(stroke, share * strokeSeconds);
    TestValidator.predicate(
      `stroke phase ${share} keeps trim and heading when retimed`,
      nclose(moved.y, first.y, 1e-5) &&
        nclose(moved.z, first.z, 1e-5) &&
        vclose(moved, hips(slower, share * 2 * strokeSeconds), 1e-5),
    );
    return moved.x - first.x;
  });
  TestValidator.predicate(
    "the keyed stroke drives a nonzero displacement from rest",
    Math.abs(early.x - first.x) <= 1e-5 &&
      displacements.some(
        (distance: number): boolean => Math.abs(distance) > 1e-3,
      ),
  );
  const cycle: IAutoMovieMotionHumanSegment = stroke.segments("swimmer")[0]!;
  TestValidator.predicate(
    "the stroke preserves its authored duration and named cycle",
    cycle.plan.duration === strokeSeconds &&
      cycle.plan.events.some(
        (event: { name: string }): boolean => event.name === "stroke1",
      ),
  );

  let movingStroke: unknown;
  try {
    stage({
      water: { surface, density },
      duration: seconds,
      speed,
      stroke: "breaststroke",
    });
  } catch (error) {
    movingStroke = error;
  }
  TestValidator.predicate(
    "a stroke from rest refuses passive entry speed",
    movingStroke instanceof HumanRefusal &&
      movingStroke.kind === "parameter" &&
      movingStroke.axis === "speed",
  );

  let failure: unknown;
  try {
    stage({
      water: { surface, density: body.profile.mass / (2 * totalVolume) },
      duration: seconds,
    });
  } catch (error) {
    failure = error;
  }
  TestValidator.predicate(
    "insufficient buoyancy refuses the support",
    failure instanceof HumanRefusal &&
      failure.kind === "base" &&
      failure.axis === "water.density",
  );
}
