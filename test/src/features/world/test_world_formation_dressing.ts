import { formationSlot } from "@automovie/engine";
import { IAutoMovieFormationDesign } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const RANKS: number = 4;
const FILES: number = 25;
const COUNT: number = RANKS * FILES;

const line: (props: {
  seed: number;
  dressing?: { lateral: number; depth: number };
}) => IAutoMovieFormationDesign = (props: {
  seed: number;
  dressing?: { lateral: number; depth: number };
}): IAutoMovieFormationDesign => ({
  id: "probe-line",
  model: "probe-model",
  count: COUNT,
  layout: {
    kind: "line",
    ranks: RANKS,
    files: FILES,
    spacing: { lateral: 0.7, depth: 1.2 },
    ...(props.dressing === undefined ? {} : { dressing: props.dressing }),
  },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: props.seed,
  capabilities: [],
  heroOverrides: [],
});

const positions: (
  formation: IAutoMovieFormationDesign,
) => { x: number; z: number }[] = (
  formation: IAutoMovieFormationDesign,
): { x: number; z: number }[] =>
  Array.from(
    { length: COUNT },
    (_unused: unknown, slot: number): { x: number; z: number } => {
      const placed: import("@automovie/interface").IAutoMovieVector3 =
        formationSlot(formation, slot).position;
      return { x: placed.x, z: placed.z };
    },
  );

const same: (
  left: { x: number; z: number }[],
  right: { x: number; z: number }[],
) => boolean = (
  left: { x: number; z: number }[],
  right: { x: number; z: number }[],
): boolean =>
  left.length === right.length &&
  left.every(
    (point: { x: number; z: number }, index: number): boolean =>
      nclose(point.x, right[index]!.x, 1e-12) &&
      nclose(point.z, right[index]!.z, 1e-12),
  );

/**
 * A formed layout can be dressed to a tolerance, and that tolerance reproduces.
 *
 * Placing every member on exact geometry makes a unit read as one figure
 * repeated on a grid. A real formed group holds a line to a tolerance, and the
 * width of that tolerance is often what the shot is about, so it has to be a
 * declared property rather than an assumption.
 *
 * Determinism is the whole point of deriving it from the seed and the slot
 * index instead of from randomness: nothing is stored per member, and the same
 * design must produce the same layout on every machine and every run.
 *
 * The oracle is the layout arithmetic, not the engine's output: exact slots sit
 * on multiples of `spacing`, so a deviation is detectable as a departure from
 * that lattice, and it is bounded by the declared tolerance by construction.
 *
 * Scenarios:
 *
 * 1. A layout with no dressing places every member on exact lattice geometry,
 *    which is the negative twin: the axis must be inert when unused.
 * 2. Both tolerances at zero reproduce those exact positions, so declaring the
 *    axis without asking for deviation changes nothing.
 * 3. A non-zero tolerance moves members off the lattice, and every deviation stays
 *    inside the declared bound on both axes.
 * 4. The same seed reproduces the same layout within 1e-12 metres; a different seed produces a
 *    different one. Reproducibility is the property, not merely variation.
 * 5. A tolerance on one axis alone leaves the other axis exact, so the two bounds
 *    are independent rather than one shared jitter.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates actual formation slots and observes undressed/zero-dressed lattice identity, bounded nonzero displacement, seed reproducibility/variation and independent dressing axes; always-zero jitter, exceeded tolerance or cross-axis leakage fails.
 * @evidence contracts/testing.md#independent-expectations Four ranks of 25 and authored 0.7/1.2-meter spacing independently determine the line lattice, while 0.25/0.4-meter bounds define permitted deviations. Same-seed comparisons are consistency checks, and the fixed seeds' every-member displacement is stronger than merely observing one changed slot without predicting hash outputs.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted dressing, zero bounds, both nonzero bounds, repeated and changed seeds and lateral-only dressing over all 100 slots; other layouts, terrain and malformed design admission have separate units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_world_formation_dressing entry owns direct CPU slot regeneration and local numeric facts, with no renderer, browser, Human asset or dynamic scenario registration.
 */
export function test_world_formation_dressing(): void {
  const exact: ReturnType<typeof positions> = positions(line({ seed: 7 }));
  const lattice: ReturnType<typeof positions> = Array.from(
    { length: COUNT },
    (_unused: unknown, slot: number): { x: number; z: number } => ({
      x: ((slot % FILES) - (FILES - 1) / 2) * 0.7,
      z: Math.floor(slot / FILES) * 1.2,
    }),
  );
  TestValidator.predicate(
    "an undressed layout sits on exact lattice geometry",
    same(exact, lattice),
  );
  TestValidator.predicate(
    "a zero tolerance reproduces those exact positions",
    same(
      positions(line({ seed: 7, dressing: { lateral: 0, depth: 0 } })),
      exact,
    ),
  );

  const dressed: ReturnType<typeof positions> = positions(
    line({ seed: 7, dressing: { lateral: 0.25, depth: 0.4 } }),
  );
  TestValidator.equals(
    "a declared tolerance moves members off the lattice and stays inside it",
    namedFacts([
      ["leavesTheLattice", (): boolean => same(dressed, exact) === false],
      [
        "everyMemberMoved",
        (): boolean =>
          dressed.every(
            (point: { x: number; z: number }, index: number): boolean =>
              nclose(point.x, exact[index]!.x, 1e-12) === false ||
              nclose(point.z, exact[index]!.z, 1e-12) === false,
          ),
      ],
      [
        "withinLateralBound",
        (): boolean =>
          dressed.every(
            (point: { x: number; z: number }, index: number): boolean =>
              Math.abs(point.x - exact[index]!.x) <= 0.25,
          ),
      ],
      [
        "withinDepthBound",
        (): boolean =>
          dressed.every(
            (point: { x: number; z: number }, index: number): boolean =>
              Math.abs(point.z - exact[index]!.z) <= 0.4,
          ),
      ],
    ]),
    {
      leavesTheLattice: true,
      everyMemberMoved: true,
      withinLateralBound: true,
      withinDepthBound: true,
    },
  );

  TestValidator.equals(
    "the same seed reproduces the same layout and a different seed does not",
    namedFacts([
      [
        "sameSeedReproduces",
        (): boolean =>
          same(
            positions(
              line({ seed: 7, dressing: { lateral: 0.25, depth: 0.4 } }),
            ),
            dressed,
          ),
      ],
      [
        "otherSeedDiffers",
        (): boolean =>
          same(
            positions(
              line({ seed: 8, dressing: { lateral: 0.25, depth: 0.4 } }),
            ),
            dressed,
          ) === false,
      ],
    ]),
    { sameSeedReproduces: true, otherSeedDiffers: true },
  );

  const lateralOnly: ReturnType<typeof positions> = positions(
    line({ seed: 7, dressing: { lateral: 0.25, depth: 0 } }),
  );
  TestValidator.equals(
    "the two bounds are independent",
    namedFacts([
      [
        "depthStaysExact",
        (): boolean =>
          lateralOnly.every(
            (point: { x: number; z: number }, index: number): boolean =>
              nclose(point.z, exact[index]!.z, 1e-12),
          ),
      ],
      [
        "lateralStillMoves",
        (): boolean =>
          lateralOnly.some(
            (point: { x: number; z: number }, index: number): boolean =>
              nclose(point.x, exact[index]!.x, 1e-12) === false,
          ),
      ],
    ]),
    { depthStaysExact: true, lateralStillMoves: true },
  );
}
