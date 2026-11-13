import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
  type IArchetypeBand,
} from "../core";

/** The Euro container, from a secondary source. */
const EURO: string =
  "Euro container after VDA 4500, 600 x 400 mm base, 147.5 or 280 mm high, grip holes about 12 x 4 cm in the middle of the top lips (Wikipedia, Euro container, https://en.wikipedia.org/wiki/Euro_container)";

/** A 25 kg cement bag, from listings seen in search results. */
const SACK: string =
  "25 kg cement bag, 410 x 413 x 150 mm (Cork Builders Providers listing) and Heidelberg Materials' 25 kg bags, both seen only in search results";

/**
 * A heavy load moved by hand: a crate with two grip holes, or a sack.
 *
 * The load lies on the floor at the origin, its length along `+X`. A crate is held by the grip holes in the middle of its two short ends, a sack by a hand closed on each end at half its thickness; both have a top another load rests on.
 *
 * @param params The kind, the crate's contents and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The load.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, contents heavier than `createLoad.CONTENTS`, or any contents in a sack.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the load lies and where it is held.
 * @evidence contracts/development/implementation.md#principled-implementation One dimensioned box; a crate's contents add to its own mass, and are bounded so the heaviest crate stays at the 25 kg HSE gives for a man's lift close to the body between knuckle and elbow height (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the contents, draw the dimensions, one part and its three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A sack does not sag; it is a rigid shape at rest.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLoad(
  params: createLoad.IParams,
  seed?: number | string,
): Archetype<createLoad.Affordance, createLoad.Dimension> {
  const kind: createLoad.Kind = ArchetypeDraw.choice(
    "load",
    "kind",
    params.kind,
    createLoad.KINDS,
  );
  const d: Record<createLoad.Dimension, number> = ArchetypeDraw.dimensions(
    "load",
    createLoad.BANDS[kind],
    seed,
    params,
    createLoad.BANDS,
  );
  const load: number = params.load ?? 0;
  const most: number = kind === "sack" ? 0 : createLoad.CONTENTS;
  if (!(load >= 0 && load <= most))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "load",
      axis: "load",
      value: load,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: most,
        unit: "kg",
      },
      reason:
        kind === "sack"
          ? "a sack's mass is its own; it takes no contents"
          : `contents of ${load} kg could take a crate above ${createLoad.LIMIT} kg`,
      fix: "give contents that keep the load within what a person lifts",
    });
  const { length, height, depth }: Record<createLoad.Dimension, number> = d;
  const builder: ArchetypeBuilder<createLoad.Affordance, createLoad.Dimension> =
    new ArchetypeBuilder({
      archetype: "load",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  builder.box(
    kind,
    Vector3.create(length, height, depth),
    Vector3.create(0, height / 2, 0),
    { color: kind === "crate" ? "#8a8f96" : "#c9bfa5" },
  );

  // A hand at each end: at a crate's grip hole under its top lip, or closed on a sack's end at half its thickness.
  const hold: number = kind === "crate" ? height - 0.03 : height / 2;
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create((sign * length) / 2, hold, 0),
        Vector3.create(sign, 0, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
      length: kind === "crate" ? 0.12 : depth,
    });
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: [
      Vector3.create(-length / 2, 0, -depth / 2),
      Vector3.create(length / 2, 0, -depth / 2),
      Vector3.create(length / 2, 0, depth / 2),
      Vector3.create(-length / 2, 0, depth / 2),
    ],
  });
  return builder.build(d.mass + load);
}

/**
 * Companion types and bands of {@link createLoad}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span between the two hands, the height they take the load at and the mass (#3370).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lifting limit is a named constant with its source.
 */
export namespace createLoad {
  /** The kinds of load. */
  export type Kind = "crate" | "sack";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["crate", "sack"];

  /** The greatest mass with contents, kilograms: HSE INDG143 Figure 1 (https://www.hse.gov.uk/pubns/indg143.pdf). */
  export const LIMIT: number = 25;

  /** The greatest contents of a crate, kilograms: the limit less the heaviest empty crate, so the bound does not depend on the seed. */
  export const CONTENTS: number = 22.5;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: where the two hands hold the load, at its `+X` and `-X` ends.
   * - `top`: the upper face, on which another load rests.
   */
  export type Affordance = "left" | "right" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `height`, `depth`: along `+X`, `+Y` and `+Z`.
   * - `mass`: the empty crate or the whole sack, kilograms.
   */
  export type Dimension = "length" | "height" | "depth" | "mass";

  /** The parameters: the kind, the contents, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which load. */
    kind: Kind;

    /** The model's id, unique in a scene; `load` when absent. */
    id?: string;

    /** The mass of a crate's contents, kilograms, up to `CONTENTS`; empty when absent. A sack takes none. */
    load?: number;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    crate: {
      length: ArchetypeBand.metres(0.6, 0.6, EURO, true),
      depth: ArchetypeBand.metres(0.4, 0.4, EURO, true),
      height: ArchetypeBand.metres(0.1475, 0.28, EURO, true),
      mass: ArchetypeBand.of("kg", 1.5, 2.5, ArchetypeBand.TYPICAL_MASS, true),
    },
    sack: {
      length: ArchetypeBand.metres(0.41, 0.413, SACK, true),
      depth: ArchetypeBand.metres(0.41, 0.413, SACK, true),
      height: ArchetypeBand.metres(0.15, 0.15, SACK, true),
      mass: ArchetypeBand.of("kg", 25, 25, SACK, true),
    },
  };
}
