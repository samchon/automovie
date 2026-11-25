import {
  AutoMovieArchetypeEquineFord,
  AutoMovieArchetypeEquineFordPlan,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
  createHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineFordScene } from "../../internal/equineFordScene";

/** The horse's back as a share of its withers height, `createHorse.BACK`, an estimate restated here. */
const BACK: number = 0.95;

/**
 * A horse wades a ford, swims and climbs the far bank on one film clock, continuous at both cuts, planted on the bank, and a bank out of reach is refused.
 *
 * Scenarios:
 * 1. The named contact changes come in order on one clock: `float`, `swim`, `land`, `climb`, with every wading hoof landing before `float` and every climbing one after `climb`; the stroke instants lie in the swim.
 * 2. Every wading and climbing second at half-second steps is admitted. At `float` and at `land` every emitted bar's world centre and its velocity are continuous: the jump across a 2 microsecond cut is no more than a 20 m/s point could travel, and the velocity on either side differs by no more than a 100 m/s^2 acceleration over the 12 microseconds between the two 10 microsecond differencing windows allows.
 * 3. Every climbing hoof landing after `climb` stays on the authored far-bank plane, its sole touching the plane and its world position unchanged 80 ms later.
 * 4. A far shelf below the floating horse's standing sole level (water less immersion and back height) is refused on `bank`; a ford still too shallow at the end of the wading is refused on `entry`; a far shelf rising into the stroke is refused on `bank`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public crossing and reads its instants, emitted bars and hoof solids; a jump at a cut, a hoof off the bank or sliding, a misordered contact change or an admitted unreachable bank is caught.
 * @evidence contracts/development/testing.md#independent-expectations Continuity bounds are physical speed and acceleration ceilings far above a walking or swimming horse's and far below a cut's jump; the bank plane is the scene's authored plane; the standing sole level is computed from the horse's withers height and the authored back estimate, not read from the crossing.
 * @evidence contracts/development/testing.md#distinguishing-cases Both cuts, landings on the far bank, and three refused geometries beside the admitted one; the stroke angles and clearances belong to test_archetype_equine_swim.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_ford(): void {
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
  const { float, swim, land, climb } = crossing.events;

  // 1. One clock.
  if (!(0 < float && float < swim && swim < land && land < climb))
    issues.push(`events out of order: ${JSON.stringify(crossing.events)}`);
  for (const instant of crossing.instants) {
    if (
      instant.label.endsWith("On") &&
      instant.seconds > float &&
      instant.seconds <= climb
    )
      issues.push(`a hoof landing at ${instant.seconds} s lies in the water`);
    if (
      instant.label.endsWith("Stroke") &&
      !(instant.seconds >= float && instant.seconds < land)
    )
      issues.push(`a stroke at ${instant.seconds} s lies outside the swim`);
  }

  // 2. Every grounded second is admitted, and continuity at both cuts.
  for (let seconds: number = 0; seconds < crossing.duration; seconds += 0.5)
    if (seconds < float || seconds >= land)
      try {
        crossing.sample(seconds);
      } catch (error) {
        issues.push(`${seconds} s: ${String(error)}`);
      }
  const centres = (seconds: number): Map<string, IAutoMovieVector3> => {
    const sample: AutoMovieArchetypeEquineFordPlan.ISample<string, string> =
      crossing.sample(seconds);
    return new Map(
      sample.archetype.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieVector3] => [
          part.id,
          equineFordScene.frame(sample, part.id).translation,
        ],
      ),
    );
  };
  for (const [name, cut] of [
    ["float", float],
    ["land", land],
  ] as const) {
    const h: number = 1e-6;
    const before: Map<string, IAutoMovieVector3> = centres(cut - h);
    const after: Map<string, IAutoMovieVector3> = centres(cut + h);
    const earlier: Map<string, IAutoMovieVector3> = centres(cut - 11 * h);
    const later: Map<string, IAutoMovieVector3> = centres(cut + 11 * h);
    for (const [id, p] of before) {
      const q: IAutoMovieVector3 = after.get(id)!;
      if (Vector3.distance(p, q) > 20 * 2 * h)
        issues.push(`${name}: ${id} jumps ${Vector3.distance(p, q)} m`);
      const v0: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(p, earlier.get(id)!),
        1 / (10 * h),
      );
      const v1: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(later.get(id)!, q),
        1 / (10 * h),
      );
      if (Vector3.distance(v0, v1) > 100 * 12 * h)
        issues.push(
          `${name}: ${id} velocity changes by ${Vector3.distance(v0, v1)} m/s`,
        );
    }
  }

  // 3. Planted on the far bank.
  const banks: readonly AutoMovieArchetypeQuadrupedFooting.IPlane[] =
    params.footing.planes.filter(
      (plane: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
        plane.id === "shelf" || plane.id === "climb",
    );
  let landings: number = 0;
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
    for (const instant of crossing.instants)
      if (
        instant.label === `${limb}On` &&
        instant.seconds > climb &&
        instant.seconds + 0.09 < crossing.duration
      ) {
        landings++;
        const id: string = AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
        const first: AutoMovieArchetypeEquineFordPlan.ISample<string, string> =
          crossing.sample(instant.seconds + 1e-3);
        const next: AutoMovieArchetypeEquineFordPlan.ISample<string, string> =
          crossing.sample(instant.seconds + 0.08);
        const slid: number = Vector3.distance(
          equineFordScene.frame(first, id).translation,
          equineFordScene.frame(next, id).translation,
        );
        if (slid > 1e-8)
          issues.push(
            `${limb} slides ${slid} m on the bank at ${instant.seconds}`,
          );
        const where: IAutoMovieVector3 = equineFordScene.frame(
          next,
          id,
        ).translation;
        const plane: AutoMovieArchetypeQuadrupedFooting.IPlane | undefined =
          banks.find(
            (candidate: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
              where.z >= candidate.z[0] && where.z < candidate.z[1],
          );
        const hoof: IAutoMovieModelPart = next.archetype.parts.find(
          (part: IAutoMovieModelPart): boolean => part.id === id,
        )!;
        const gap: number =
          plane === undefined
            ? Infinity
            : equineFordScene.separation(hoof, next.placement, plane);
        if (Math.abs(gap) > 1e-8)
          issues.push(
            `${limb} stands ${gap} m off the bank at ${instant.seconds}`,
          );
      }
  if (landings < 4) issues.push(`only ${landings} bank landings observed`);

  // 4. Refusals.
  const refuses = (label: string, axis: string, build: () => unknown): void => {
    let error: unknown = null;
    try {
      build();
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof AutoMovieArchetypeRefusal && error.axis === axis))
      issues.push(
        `${label}: expected a refusal on ${axis}, got ${String(error)}`,
      );
  };
  refuses("unreachable bank", "bank", () =>
    AutoMovieArchetypeEquineFord(horse, equineFordScene.params(level - 0.5)),
  );
  refuses("bank into the stroke", "bank", () =>
    AutoMovieArchetypeEquineFord(horse, equineFordScene.params(level + 0.9)),
  );
  refuses("shallow ford", "entry", () =>
    AutoMovieArchetypeEquineFord(horse, {
      ...params,
      entry: { ...params.entry, legs: [{ kind: "straight", length: 8 }] },
    }),
  );
  TestValidator.equals(
    "the ford crossing's cuts, footholds and refusals",
    issues,
    [],
  );
}
