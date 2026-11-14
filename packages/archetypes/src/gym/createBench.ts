import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The rule that sizes a competition bench. */
const IPF: string =
  "International Powerlifting Federation, Technical Rules, the bench: not less than 1.22 m long, 29 to 32 cm wide, 42 to 45 cm from the floor to the top of its pad";

/**
 * A flat weight bench: a padded top on four legs, lain on for a press or
 * sat on.
 *
 * It stands on the floor with the middle of its footprint at the origin,
 * its length along `Z`. `surface` is the top, lain on along its length;
 * `seat` is the same top at its `+Z` end, sat on facing `+Z`; `edge` is the
 * middle of the top's `+X` long side, which the upper back leans on across
 * the bench (a hip thrust) with the body out along `+X`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bench.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands, which way it runs and the three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A pad of the rule's length, width and top height on four legs set in from its corners.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one box, four rods, three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pad's thickness and the legs' inset are estimates; no uprights or bar rests, which are the rack's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five shapes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBench(
  params: createBench.IParams,
  seed?: number | string,
): Archetype<createBench.Affordance, createBench.Dimension> {
  const kind: createBench.Kind = ArchetypeDraw.choice(
    "bench",
    "kind",
    params.kind ?? "flat",
    createBench.KINDS,
  );
  const d: Partial<Record<createBench.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "bench",
      createBench.BANDS[kind],
      seed,
      params,
      createBench.BANDS,
    );
  const length: number = d.length!;
  const width: number = d.width!;
  const height: number = d.height!;
  const builder: ArchetypeBuilder<
    createBench.Affordance,
    createBench.Dimension
  > = new ArchetypeBuilder({
    archetype: "bench",
    id: params.id,
    name: "weight bench",
    dimensions: d,
  });
  builder.box(
    "pad",
    Vector3.create(width, createBench.PAD, length),
    Vector3.create(0, height - createBench.PAD / 2, 0),
    { color: "#2c2f33" },
  );
  for (const x of [1, -1] as const)
    for (const z of [1, -1] as const)
      builder.rod(
        `leg-${x === 1 ? "left" : "right"}-${z === 1 ? "front" : "back"}`,
        createBench.LEG,
        Vector3.create(
          x * (width / 2 - createBench.LEG),
          0,
          z * (length / 2 - createBench.INSET),
        ),
        Vector3.create(
          x * (width / 2 - createBench.LEG),
          height - createBench.PAD,
          z * (length / 2 - createBench.INSET),
        ),
        { color: "#b8bcc2" },
      );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, height, length / 2 - createBench.SEAT / 2),
    ),
    extent: null,
    depth: createBench.SEAT,
    width,
  });
  builder.affordance({
    id: "edge",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(width / 2, height, 0)),
    extent: null,
    depth: length,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createBench}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union and one cited band per dimension; what no rule fixes is a named estimate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top's size and height a lying or sitting body reads, and the three contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared.
 */
export namespace createBench {
  /** The kinds of bench. */
  export type Kind = "flat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["flat"];

  /** The pad's thickness, metres. An estimate, not read at a source. */
  export const PAD: number = 0.07;

  /** A leg's radius, metres. An estimate, not read at a source. */
  export const LEG: number = 0.025;

  /** How far the legs stand in from the pad's ends, metres. An estimate, not read at a source. */
  export const INSET: number = 0.15;

  /** The depth of the top's end a sitter takes, metres. An estimate, not read at a source. */
  export const SEAT: number = 0.4;

  /**
   * The affordance ids:
   *
   * - `surface`: the top, lain on along `Z`.
   * - `seat`: the top's `+Z` end, sat on facing `+Z`.
   * - `edge`: the middle of the top's `+X` long side, leaned on across the bench.
   */
  export type Affordance = "surface" | "seat" | "edge";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the pad's, along `Z`.
   * - `width`: the pad's, along `X`.
   * - `height`: from the floor to the top of the pad.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bench; `flat` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `bench` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    flat: {
      length: ArchetypeBand.metres(
        1.22,
        1.3,
        `${IPF}; the upper end is an estimate`,
        true,
      ),
      width: ArchetypeBand.metres(0.29, 0.32, IPF),
      height: ArchetypeBand.metres(0.42, 0.45, IPF),
      mass: ArchetypeBand.of(
        "kg",
        20,
        40,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
  };
}
