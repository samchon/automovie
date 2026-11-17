import {
  Quaternion,
  resolveAutoMovieCenterOfMass,
  resolveHydrodynamicForce,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSwimImmersed,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  swimImmersed,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Passive immersion through the typed chain and displayed pose route.
 *
 * Scenarios:
 * 1. A medium whose half-volume weighs the performer carries the supine body
 *    in place with half the profile's equivalent sphere volume submerged.
 * 2. A head-first coast at yaw 90 follows the closed-form distance in world
 *    -X at two film seconds. Reading those seconds backwards gives the same
 *    positions and there is no vertical or cross-track drift.
 * 3. A medium whose whole displacement weighs only half the performer refuses
 *    the immersed support, identifying the water density.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public route, the fixture's two density relations, the travel frame and the read order.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the displayed bones, pose root and located refusal through HumanPerformance, so a disconnected registered law or a staged constant-speed path fails.
 * @evidence contracts/development/testing.md#independent-expectations Archimedes' balance, the spherical-cap formula and the separation-of-variables solution for quadratic drag supply the expectations. The profile supplies the authored segment volumes and centres, and 2 percent is the issue's stated mechanics bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Still and moving cases use the same supported medium, while the insufficient medium cannot satisfy force balance even at total immersion.
 * @evidence contracts/development/testing.md#execution-ownership Uses one canonical body and a small fixed set of display reads, with no viewer or solver process.
 */
export function test_human_motion_swim_immersed(): void {
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
    swimImmersed: typeof swimImmersed;
  }> = HumanChain.extend({ swimImmersed });

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
      laws: [swimImmersed],
      composition: Chain.subject("swimmer").swimImmersed(input).node,
    });

  const floating: HumanPerformance = stage({
    water: { surface, density },
    seconds,
  });
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    floating.bones("swimmer", 0);
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
  const start: IAutoMovieVector3 = floating.pose("swimmer", 0).root!.translation;
  const end: IAutoMovieVector3 =
    floating.pose("swimmer", seconds).root!.translation;
  TestValidator.predicate(
    "still water holds the float in place",
    vclose(start, end),
  );

  const speed: number = 1;
  const coefficient: number =
    (0.5 * density * resolveHydrodynamicForce.DRAG * area) / body.profile.mass;
  const gliding: HumanPerformance = stage({
    water: { surface, density },
    seconds,
    speed,
  });
  const times: readonly number[] = [seconds, seconds / 2];
  const reads: IAutoMovieVector3[] = times.map(
    (time: number): IAutoMovieVector3 =>
      gliding.pose("swimmer", time).root!.translation,
  );
  times.forEach((time: number, index: number): void => {
    const travel: number =
      Math.log(1 + coefficient * speed * time) / coefficient;
    const read: IAutoMovieVector3 = reads[index]!;
    TestValidator.predicate(
      `coast at ${time} s travels head first under quadratic drag`,
      nclose(read.x, start.x - travel, 0.02 * travel) &&
        nclose(read.y, start.y) &&
        nclose(read.z, start.z),
    );
  });
  // A separate seed also keeps the performance resolver from sharing
  // the first instance's displayed reads.
  const reversed: HumanPerformance = stage(
    { water: { surface, density }, seconds, speed },
    "reverse-immersion",
  );
  [...times].reverse().forEach((time: number, index: number): void => {
    TestValidator.predicate(
      `reverse-order coast gives the same position at ${time} s`,
      vclose(
        reversed.pose("swimmer", time).root!.translation,
        reads[reads.length - index - 1]!,
        0,
      ),
    );
  });

  let failure: unknown;
  try {
    stage({
      water: { surface, density: body.profile.mass / (2 * totalVolume) },
      seconds,
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
