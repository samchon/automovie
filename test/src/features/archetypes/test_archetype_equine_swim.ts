import {
  AutoMovieArchetypeEquineFord,
  AutoMovieArchetypeEquineFordPlan,
  type AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  createHorse,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineFordScene } from "../internal/equineFordScene";

/** The horse's back as a share of its withers height, `createHorse.BACK`, an estimate restated here. */
const BACK: number = 0.95;

/**
 * A swimming horse shows the measured fore and hind strokes, keeps its head out of the water and touches no bed while it floats.
 *
 * Scenarios:
 * 1. Over one steady stroke cycle the side-view included angles read from the emitted bars reach the swimming means of the two cited studies' Table 2: fore elbow 52.8 to 125.9 (dorsal), carpus 60.9 to 156.7 and fetlock 111.4 to 188.3 (palmar); hind stifle 60.5 to 111.5 (caudal), tarsus 43.7 to 154.7 (dorsal) and fetlock 76.8 to 188.9 (plantar).
 * 2. Maximal flexion comes in the studies' order: carpus, elbow, then fetlock, all within the forelimb's 13.5 to 73 % protraction; stifle, fetlock, then tarsus within the hindlimb's first 0.8 s of its 1.2 s cycle. The fore and hind strokes are distinct: their angle ranges differ.
 * 3. At every sampled swimming second, from the established stroke to the landing, the head's solid stays above the water plane; over the entry cut the head rises out of the wading carriage.
 * 4. At every sampled swimming second every emitted solid stays strictly above every authored bed under it; over the entry cut, while the hooves leave the bed, none enters it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios, their sources and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public crossing and reads emitted bar geometry, the head solid and every part against the authored planes; a wrong angle convention, a lost stroke order, a submerged head or a hoof in a bed is caught.
 * @evidence contracts/development/testing.md#independent-expectations Angle extremes and their order come from the cited studies' tables and text; the angles are measured from the bars' own ends with the studies' landmark sides, not read from the stroke table; the water and beds are the scene's authored planes.
 * @evidence contracts/development/testing.md#distinguishing-cases Fore against hind limbs, flexion against extension, each joint's order inside its protraction, and the floating interval against the bed; the crossing's cuts and refusals belong to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_swim(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const level: number =
    equineFordScene.WATER - equineFordScene.IMMERSION - BACK * 1.72;
  const params: AutoMovieArchetypeEquineFordPlan.IParams =
    equineFordScene.params(level - 0.05);
  const crossing: AutoMovieArchetypeEquineFordPlan.IClip<string, string> =
    AutoMovieArchetypeEquineFord(horse, params);
  const issues: string[] = [];

  // 1 and 2. One steady cycle after the stroke is established.
  const start: number = crossing.instants.find(
    (instant: { seconds: number; label: string }): boolean =>
      instant.label === "leftForeStroke" &&
      instant.seconds >= crossing.events.swim,
  )!.seconds;
  const steps: number = 440;
  const traces: Record<string, number[]> = {};
  for (let k: number = 0; k < steps; k++) {
    const sample: AutoMovieArchetypeEquineFordPlan.ISample<string, string> =
      crossing.sample(start + (k / steps) * equineFordScene.CYCLE);
    if (sample.phase !== "swimming")
      issues.push(`${k}: the steady cycle is not swimming but ${sample.phase}`);
    for (const limb of ["leftFore", "leftHind"] as const) {
      const bones: readonly IAutoMovieModelPart[] = equineFordScene.BONES[
        limb
      ].map(
        (id: AutoMovieArchetypeQuadrupedBody.Bone): IAutoMovieModelPart =>
          sample.archetype.parts.find(
            (part: IAutoMovieModelPart): boolean => part.id === id,
          )!,
      );
      const front: number[] = [0, 1, 2].map((j: number): number =>
        equineFordScene.front(bones[j]!, bones[j + 1]!),
      );
      const angles: number[] =
        limb === "leftFore"
          ? [front[0]!, 360 - front[1]!, 360 - front[2]!]
          : [360 - front[0]!, front[1]!, 360 - front[2]!];
      angles.forEach((angle: number, j: number): void => {
        (traces[`${limb}${j}`] ??= []).push(angle);
      });
    }
  }
  const TABLE: Record<string, readonly [number, number]> = {
    leftFore0: [52.8, 125.9],
    leftFore1: [60.9, 156.7],
    leftFore2: [111.4, 188.3],
    leftHind0: [60.5, 111.5],
    leftHind1: [43.7, 154.7],
    leftHind2: [76.8, 188.9],
  };
  const flexed: Record<string, number> = {};
  for (const [key, [flexion, extension]] of Object.entries(TABLE)) {
    const trace: number[] = traces[key]!;
    const least: number = Math.min(...trace);
    const most: number = Math.max(...trace);
    if (Math.abs(least - flexion) > 0.1 || Math.abs(most - extension) > 0.1)
      issues.push(
        `${key}: ${least} to ${most} degrees, measured ${flexion} to ${extension}`,
      );
    flexed[key] = trace.indexOf(least) / steps;
  }
  const hindStart: number =
    (((AutoMovieArchetypeEquineFordPlan.PHASES.leftFore -
      AutoMovieArchetypeEquineFordPlan.PHASES.leftHind) %
      1) +
      1) %
    1;
  const hindFlexed = (key: string): number =>
    (flexed[key]! - hindStart + 1) % 1;
  if (
    !(
      flexed.leftFore1! < flexed.leftFore0! &&
      flexed.leftFore0! < flexed.leftFore2! &&
      flexed.leftFore1! >= 0.135 - 1e-9 &&
      flexed.leftFore2! <= 0.73 + 1e-9
    )
  )
    issues.push(
      `fore flexion order carpus ${flexed.leftFore1}, elbow ${flexed.leftFore0}, fetlock ${flexed.leftFore2}`,
    );
  if (
    !(
      hindFlexed("leftHind0") < hindFlexed("leftHind2") &&
      hindFlexed("leftHind2") < hindFlexed("leftHind1") &&
      hindFlexed("leftHind1") <= 0.8 / 1.2 + 1e-9
    )
  )
    issues.push(
      `hind flexion order stifle ${hindFlexed("leftHind0")}, fetlock ${hindFlexed("leftHind2")}, tarsus ${hindFlexed("leftHind1")}`,
    );

  // 3 and 4. Every floating second.
  const planes: readonly AutoMovieArchetypeQuadrupedFooting.IPlane[] =
    params.footing.planes;
  for (
    let seconds: number = crossing.events.float + 1e-3;
    seconds < crossing.events.land;
    seconds += 0.05
  ) {
    const sample: AutoMovieArchetypeEquineFordPlan.ISample<string, string> =
      crossing.sample(seconds);
    for (const part of sample.archetype.parts) {
      if (part.geometry.type !== "primitive") continue;
      if (part.geometry.shape.type === "plane") continue;
      const centre = equineFordScene.frame(sample, part.id).translation;
      for (const plane of planes)
        if (
          centre.x >= plane.x[0] &&
          centre.x < plane.x[1] &&
          centre.z >= plane.z[0] &&
          centre.z < plane.z[1]
        ) {
          const gap: number = equineFordScene.separation(
            part,
            sample.placement,
            plane,
          );
          if (sample.phase === "swimming" ? !(gap > 0) : gap < -1e-9)
            issues.push(`${seconds} s: ${part.id} meets ${plane.id} by ${gap}`);
        }
      if (part.id === "head" && sample.phase === "swimming") {
        const clearance: number = equineFordScene.separation(
          part,
          sample.placement,
          {
            id: "water",
            origin: { x: 0, y: equineFordScene.WATER, z: 0 },
            x: [-Infinity, Infinity],
            z: [-Infinity, Infinity],
            slope: { x: 0, z: 0 },
          },
        );
        if (!(clearance > 0))
          issues.push(
            `${seconds} s: the head dips ${-clearance} m into the water`,
          );
      }
    }
  }
  TestValidator.equals(
    "the swim's measured strokes and clearances",
    issues,
    [],
  );
}
