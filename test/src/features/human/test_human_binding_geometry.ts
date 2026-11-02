import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBindingGeometry as Geometry } from "../../../../packages/human/src/skeleton/AutoMovieHumanBindingGeometry";

/**
 * A segment envelope must retain a bulge away from its middle section.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads production sampled binding geometry on a declared harmonic chain with an off-centre bulge. The old middle-section radius is red against a 40 mm envelope, while the complete sampled segment is green; truncated segments retain endpoint-plane crossings.
 * @evidence contracts/testing.md#independent-expectations Authored circular radii 10,40,10,20,10 mm at stations 0,25,50,75,100 determine the sampled-grid envelope. Clipping the linear grid edge from 40 to 10 at station 30 gives 34 mm. These are sampled polyline expectations, not a guarantee between analytic station or phase samples.
 * @evidence contracts/testing.md#distinguishing-cases Whole and reversed segment directions, a middle section that misses the bulge, an interval containing no bulge layer but intersecting its neighbouring grid edge, millimetre-to-metre scaling, and zero-length segment refusal. This fixture does not generate a person or certify resting anatomy.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous synthetic-chain unit, with no person generation, process, browser or GPU.
 */
export function test_human_binding_geometry(): void {
  const chain: IAutoMovieHumanLoftChain = {
    name: "shaft",
    order: 1,
    rule: "polar",
    samples: 48,
    layers: [10, 40, 10, 20, 10].map((radius: number, index: number): IAutoMovieHumanLoftChain.ILayer => ({ y: index * 25, coefficients: [0, radius, 0, 0, 0, radius], slopes: [0, 0, 0, 0, 0, 0] })),
  };
  const body: IAutoMovieHumanBodyCalibration = { stature: 100, chains: [chain], events: [], poles: [], apertures: [], eyes: [] };
  const geometry: Geometry.IGeometry = Geometry.prepare(body, 1);
  const middle: number = geometry.outer("shaft", [0, 50, 0], [0, 1, 0]);
  const envelope: number = geometry.envelope("shaft", [0, 0, 0], [0, 100, 0]);
  TestValidator.predicate("one middle section misses the outer segment bulge", Math.abs(middle - 10) < 1e-12 && envelope - middle > 29.9);
  TestValidator.predicate("complete sampled segment retains the bulge", Math.abs(envelope - 40) < 1e-12);
  TestValidator.predicate("segment direction preserves the envelope", Math.abs(geometry.envelope("shaft", [0, 100, 0], [0, 0, 0]) - 40) < 1e-12);
  TestValidator.predicate("endpoint plane retains clipped grid intersection", Math.abs(geometry.envelope("shaft", [0, 30, 0], [0, 60, 0]) - 34) < 1e-12);
  const metres: Geometry.IGeometry = Geometry.prepare(body, 0.001);
  TestValidator.predicate("envelope uses the declared scale", Math.abs(metres.envelope("shaft", [0, 0, 0], [0, 0.1, 0]) - 0.04) < 1e-12);
  let refused: boolean = false;
  try { geometry.envelope("shaft", [0, 0, 0], [0, 0, 0]); }
  catch { refused = true; }
  TestValidator.predicate("zero-length segment is refused", refused);
}
