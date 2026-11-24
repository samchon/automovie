import { AutoMovieLoftAdmissionError, AutoMovieLoftViewFullSource } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanCourseRuns,
  AutoMovieHumanF1Nails,
  AutoMovieHumanF1NativeCourse,
  AutoMovieHumanNativeFamily,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * The native digit's physical-to-material aperture and the actual emitting owner.
 *
 * Scenarios:
 * 1. The three-to-two transported course opens the grid at 38 mm, reads 8 mm joint breadth and places its pole at 30 mm.
 * 2. Emission preserves the original native controls, cap samples and regular cap jets. The actual collapsed pole has a point without a regular jet.
 * 3. The identity map on exactly that skin opens the chart late at material station 57.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the native source and course owners and both digit fits. Evaluates the emitted cap outside the retained relief and tests the pole's absent regular jet.
 * @evidence contracts/development/testing.md#independent-expectations The straight course ratio, known section radius and off-quarter first ring determine the probes.
 * @evidence contracts/development/testing.md#distinguishing-cases Both reciprocal controls inspect actual station reads on the same native family.
 * @evidence contracts/development/testing.md#execution-ownership One native source and two bounded nail charts are built inside the scenario without a whole body.
 * @evidence contracts/development/common.md#meaningful-documentation Names both material apertures, their physical course ratio and the emitted native owner.
 */
export function test_human_nail_native_aperture(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const { family, posed }: ReturnType<typeof HumanNailFixture.circularDigit> = HumanNailFixture.circularDigit();
  // Author equal circular sections on both grid intervals adjoining the joint.
  // Material joint 40 stands at world z = 60, so z = 57 is station 38.
  // Keep original skin before the correct aperture, including all three preceding quarter probes.
  const wallStart: number = 36 + 1 / 8;
  const wallKnots: number[] = [wallStart, 39.75, 40, 40.25, 54];
  const reference: IAutoMovieHumanConicLoft.IFamily = {
    ...family,
    centres: [[-40, 0, 0], [-40, 0, 40], [-40, 0, 60]],
    halves: [0],
    knots: wallKnots,
    values: family.values.map((values: number[]): number[] => wallKnots.map((): number => values[0]!)),
    tips: [null, { from: 54, tip: 60 }],
  };
  const bone: IAutoMovieHumanConicLoft.IFamily = {
    ...reference,
    centres: [[-40, 0, 0], [-40, 0, 60], [-40, 0, 90]],
  };
  const course = AutoMovieHumanF1NativeCourse.prepare(reference, bone);
  const sampled: Set<number> = new Set();
  const axis: IAutoMovieViewAxis.IAxis = {
    ...course.axis,
    at: (station: number): IAutoMovieLoftSectionFrame => {
      sampled.add(station);
      return course.axis.at(station);
    },
  };
  const stretched: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanNativeFamily.create({
    original: reference,
    bone,
    originals: new Map([[reference.name, AutoMovieHumanConicLoft.source(reference)]]),
    axis,
    scale: (): AutoMovieVector2Tuple => [1, 1],
    station: (station: number): number => station,
    features: [],
    protection: [],
  });
  const stretchedFrames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame> =
    new Map([["index.distal", { ...posed, origin: [-40, 0, 60] }]]);
  const original: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(stretched, [...reference.knots]);
  sampled.clear();
  const transported: IAutoMovieHumanF1Nails.IMade = AutoMovieHumanF1Nails.createFrom(
    { family: stretched, physicalStation: course.physicalStation }, stretchedFrames, original,
  );
  // The first ring is at 36 + 1/8. For an aperture F, let k = F - 36. The prefix has 4k cells.
  // A row at local quarter j/4 requires 4k + (8k - 1)i = 8kj, hence i = 4k modulo 8k.
  // Its only solution in the prefix is the aperture itself, so an earlier quarter cannot be a prefix row.
  const quarters = (station: number): number[] => [0.25, 0.5, 0.75].map((offset: number): number => station + offset);
  const reads = (station: number): boolean => sampled.has(station);
  if (!quarters(38).every(reads) || quarters(37).some(reads))
    failures.push("the transported digit's skin grid did not open at material station 38");
  near("transported digit's joint breadth", transported.nail.readings.breadth, 8, 1e-9);
  near("transported digit's placed pole", transported.nail.readings.tip, 30, 1e-9);
  const bed: IAutoMovieHumanF1Nails.IMade["nail"]["bed"] = transported.nail.bed;
  const emitted: IAutoMovieViewPart = AutoMovieHumanF1Nails.addReliefs(original, stretched, [bed]);
  if (emitted.reliefs?.[0] !== bed || original.axis !== emitted.axis || original.front !== emitted.front ||
      original.side !== emitted.side || original.fullness !== emitted.fullness || original.pole !== emitted.pole ||
      emitted.stations.at(-1) !== 60 || !original.stations.every((station: number): boolean => emitted.stations.includes(station)))
    failures.push("the transported relief changed the digit's original field or cap custody");

  const through: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(emitted);
  const before: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(original);
  const phase: number = (bed.phases[0] + bed.phases[1]) / 2 + Math.PI;
  const regular: IAutoMovieSolidSurface.IJet = through.jet(57, phase);
  const held: IAutoMovieSolidSurface.IJet = before.jet(57, phase);
  for (const field of ["p", "u", "v", "uu", "uv", "vv"] as const)
    for (const [i, coordinate] of regular[field].entries())
      near("the unaffected cap " + field, coordinate, held[field][i]!, 1e-9);
  near("the actual cap pole", through.point(60, phase)[2], 90, 1e-9);
  try {
    through.jet(60, phase);
    failures.push("the collapsed point reported a regular cap jet");
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
  }

  // The identity map on the same transported skin reenacts the old aperture.
  sampled.clear();
  try {
    AutoMovieHumanF1Nails.createFrom(
      { family: stretched, physicalStation: AutoMovieHumanCourseRuns.identity }, stretchedFrames, original,
    );
  } catch {
    // The late grid is built before the fit can refuse its shortened skin.
  }
  if (!quarters(57).every(reads) || quarters(38).some(reads))
    failures.push("the stale map did not expose the old cap aperture at material station 57");
  finish();
}
