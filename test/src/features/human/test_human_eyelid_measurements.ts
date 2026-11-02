import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanEyelid } from "../../../../packages/human/src/generation/AutoMovieHumanEyelid";
import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import { HumanEyelidMeasurements } from "../internal/HumanEyelidMeasurements";
import { nclose } from "../internal/nclose";

/**
 * Fissures are measured on the consumer's visible margin, not the recessed trim.
 *
 * Scenarios:
 * 1. Independent 32 by 10 mm and 24 by 8 mm elliptical contact margins read correctly.
 * 2. A 23.3 mm tucked boundary cannot answer the 32 mm margin contract.
 * 3. A rigidly rotated lid keeps both lengths when its own frame rotates with it.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates real eyelid contact geometry from an analytic aperture and measures its canthi and pupil-plane margin crossings. A narrow recessed-boundary substitute fails the independently prescribed visible length while the visible margin succeeds.
 * @evidence contracts/testing.md#independent-expectations Ellipse lateral extrema are separated by its prescribed width and its central vertical crossing by its prescribed height. The shared eyelid consumer may move contact points along gaze to seat them on the globe, which does not alter those two projected coordinates. The fixture's symmetric canthi have equal depth. No fitted head ratio or generated person's scalar is an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers two different widths and heights, a known 23.3 mm wrong boundary, and a rotation exchanging up and lateral world axes. Whole-head identity and skin/lid seam health remain with anatomy and curve checks.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test test_human_eyelid_measurements, selected by --include human_eyelid_measurements. It calls the portable real eyelid evaluator and local measurement helper without generating a person or starting a host.
 */
export function test_human_eyelid_measurements(): void {
  for (const [length, height] of [[32, 10], [24, 8]] as const) {
    const lid: AutoMovieHumanEyelid.ILid = ellipse(length, height);
    const read: { length: number; height: number } = HumanEyelidMeasurements(lid);
    TestValidator.predicate("visible canthus length", nclose(read.length, length, 1e-8));
    TestValidator.predicate("visible central fissure height", nclose(read.height, height, 1e-8));
  }
  const wrong: { length: number; height: number } = HumanEyelidMeasurements(ellipse(23.3, 10));
  TestValidator.predicate("tucked boundary is red for the visible margin", !nclose(wrong.length, 32, 1));
  const original: AutoMovieHumanEyelid.ILid = ellipse(32, 10);
  const rotate: (p: AutoMovieHumanEyelid.Point) => AutoMovieHumanEyelid.Point = (p: AutoMovieHumanEyelid.Point): AutoMovieHumanEyelid.Point => [p[0], p[2], -p[1]];
  const moved: AutoMovieHumanEyelid.ILid = {
    ...original,
    globe: { centre: rotate(original.globe.centre), forward: rotate(original.globe.forward), up: rotate(original.globe.up), lateral: rotate(original.globe.lateral) },
    samples: original.samples.map((sample: AutoMovieHumanEyelid.ISample): AutoMovieHumanEyelid.ISample => ({ ...sample, contact: rotate(sample.contact) })),
  };
  const rotated: { length: number; height: number } = HumanEyelidMeasurements(moved);
  TestValidator.predicate("canthi length is rigid invariant", nclose(rotated.length, 32, 1e-8));
  TestValidator.predicate("pupil-plane height follows its frame", nclose(rotated.height, 10, 1e-8));
}

/** First-harmonic ellipse centred laterally at 35 mm with a 12 mm globe. */
function ellipse(width: number, height: number): AutoMovieHumanEyelid.ILid {
  const aperture: IAutoMovieHumanLoftAperture = { name: "eye.left", order: 1, coefficients: [12, 0, 0, 0, 0, height / 2, 35, width / 2, 0], forward: [1, 0, 0], depth: 2 };
  return AutoMovieHumanEyelid.create(aperture, { side: "left", centre: [0, 0, 35], radius: 12 });
}
