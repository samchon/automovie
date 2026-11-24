import {
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanDigitNails as Nails,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNail,
} from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * Prepare a nail from a complete caller-owned digit using a supplied distal
 * frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the shared nail source entry with a differently named analytic digit and an anatomical row selection.
 * @evidence contracts/development/testing.md#independent-expectations The chart's aperture is zero and its pole is at station 26, with 20 mm from the measured distal frame. The clipping limit is 0.01 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Fits a closed distal source and refuses the same wall when its distal closure is absent.
 * @evidence contracts/development/testing.md#execution-ownership Fits one analytic digit and reads its source receipt with no assembled figure or asset.
 * @evidence contracts/development/common.md#meaningful-documentation Names the original source and its supplied distal frame.
 */
export function test_human_digit_nails(): void {
  const { failures, near, finish } = HumanNailFixture.observations();
  const family: IAutoMovieHumanConicLoft.IFamily = {
    ...HumanNailFixture.circularDigit().family,
    name: "candidate.left.index",
  };
  const frame: IAutoMovieHumanNail.IFrame = {
    origin: [-40, 0, 0],
    distal: [0, 0, 1],
    dorsal: [0, 1, 0],
  };
  const original = Loft.part(family, [...family.knots]);
  const made = Nails.createFrom(
    { family, digit: "finger.index" },
    frame,
    original,
  );
  const { support, nail } = made;
  if (
    made.original !== original ||
    nail.plate.name !== "nail.candidate.left.index"
  )
    failures.push("the fitted plate lost its supplied source identity");
  near("complete chart's start", support.domain[0], 0, 1e-12);
  near("complete chart's tip", support.domain[1], 26, 1e-12);
  near("direct chart's aperture", support.aperture, 0, 1e-12);
  near("placed tip from the explicit frame", nail.readings.tip, 20, 1e-12);
  if (
    support.limit !== 0.01 ||
    !Number.isFinite(support.clipped) ||
    support.clipped !== nail.readings.clipped ||
    support.clippedIn !== nail.readings.clippedIn ||
    support.admitted !== nail.readings.clipped <= 0.01
  )
    failures.push("the support receipt lost the combined clipping observation");

  const bedded = Nails.addReliefs(original, family, [nail.bed]);
  const sources = new Map([[bedded.name, bedded]]);
  const seed = {
    type: "point" as const,
    partFace: nail.plate.name,
    hostFace: bedded.name,
    part: [0.005, 0.3] as [number, number],
    host: [0.01, 0.2] as [number, number],
  };
  const curveLength = 24;
  const join = Nails.attach(
    { type: "source", name: bedded.name, source: bedded.name },
    sources,
    [made],
    (plate, digit) => {
      if (plate.name !== seed.partFace || digit !== bedded)
        failures.push("the contact planner lost its original placed faces");
      return { seed, curveLength, tolerance: 1e-7, grazing: 0.09 };
    },
  );
  const bedPitch =
    (nail.bed.stations[1] - nail.bed.stations[0]) / (nail.bed.rows - 3);
  if (
    join.type !== "join" ||
    join.seed !== seed ||
    join.grazing !== 0.09 ||
    join.tolerance !== 1e-7 ||
    join.count % 4 !== 0 ||
    curveLength / join.count > bedPitch ||
    (join.count > 8 && curveLength / (join.count - 4) <= bedPitch) ||
    !sources.has(nail.plate.name)
  )
    failures.push(
      "the declared merge lost its measured contact or minimum bed-pitch sampling",
    );

  const open = { ...family, tips: undefined };
  try {
    Nails.createFrom(
      { family: open, digit: "finger.index" },
      frame,
      Loft.part(open, [...open.knots]),
    );
    failures.push(
      "the selector treated the end of an open wall as a closed tip",
    );
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("distal pole")))
      throw error;
  }
  finish();
}
