import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The gymnastics apparatus norms. */
const FIG: string =
  "FIG Apparatus Norms (March 2021), MAG 6 section 2.1 (https://www.gymnasticsontario.ca/download/523/fig-technical-documents-resources/49077/fig-apparatus-norms-en-march-2021.pdf)";

/** The accessibility standard's grab bar and handrail clauses. */
const ADA: string = "2010 ADA Standards (https://www.access-board.gov/ada/)";

/**
 * A horizontal bar a person holds or hangs from: a high bar on two posts, a grab bar on a wall, or a level rail on posts.
 *
 * The bar runs along `+X`, centred above the origin on the floor, and is gripped from above. A grab bar stands off a wall behind it by the clearance the standard fixes; the wall is not part of the model.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bar.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bar's direction, how it is gripped and what is left out.
 * @evidence contracts/development/implementation.md#principled-implementation One rod at the drawn height with two supports; the `bar` frame lies on the rod's axis with the rod's diameter as its `aperture`, and a rail's or a grab bar's height is the top of its gripping surface, as the standard measures it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the bar, its two supports, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bracket, flange or footing detail.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBar(
  params: createBar.IParams,
  seed?: number | string,
): Archetype<createBar.Affordance, createBar.Dimension> {
  const kind: createBar.Kind = ArchetypeDraw.choice(
    "bar",
    "kind",
    params.kind,
    createBar.KINDS,
  );
  const d: Record<createBar.Dimension, number> = ArchetypeDraw.dimensions(
    "bar",
    createBar.BANDS[kind],
    seed,
    params,
    createBar.BANDS,
  );
  const radius: number = d.diameter / 2;

  // A high bar's height is its upper edge by the norm; the others' is the top of the gripping surface.
  const y: number = d.height - radius;
  const builder: ArchetypeBuilder<createBar.Affordance, createBar.Dimension> =
    new ArchetypeBuilder({
      archetype: "bar",
      id: params.id,
      name:
        kind === "high" ? "high bar" : kind === "grab" ? "grab bar" : "rail",
      dimensions: d,
    });
  builder.rod(
    "bar",
    radius,
    Vector3.create(-d.length / 2, y, 0),
    Vector3.create(d.length / 2, y, 0),
    { color: "#8a8d91" },
  );
  for (const side of [1, -1] as const) {
    const x: number = (side * d.length) / 2;
    builder.rod(
      side === 1 ? "support-left" : "support-right",
      kind === "grab" ? radius : 0.025,
      Vector3.create(x, y, 0),
      kind === "grab"
        ? Vector3.create(x, y, -createBar.GAP - radius)
        : Vector3.create(x, 0, 0),
      { color: "#55595f" },
    );
  }
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.upright(Vector3.create(0, y, 0)),
    extent: null,
    grip: "power",
    aperture: d.diameter,
    length: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createBar}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The diameter a hand wraps, the height it reaches and the length it may travel along (#3371, #3363).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One affordance for every kind: a bar is a bar.
 */
export namespace createBar {
  /** The kinds of bar: a gymnastics high bar, a wall grab bar, a level handrail. */
  export type Kind = "high" | "grab" | "rail";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["high", "grab", "rail"];

  /** A grab bar's gap to the wall behind it, metres: the 1-1/2 in (38 mm) of 2010 ADA Standards 609.3. */
  export const GAP: number = 0.038;

  /** The affordance id: `bar`, the whole bar, gripped from above at any site along it. */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top of the bar above the floor.
   * - `diameter`: the bar's round section.
   * - `length`: along `+X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "length" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bar. */
    kind: Kind;

    /** The model's id, unique in a scene; `bar` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    high: {
      height: ArchetypeBand.metres(
        2.8,
        2.9,
        `${FIG}: upper edge 280 cm from the floor, adjustable to 290 cm`,
      ),
      diameter: ArchetypeBand.metres(0.028, 0.028, `${FIG}: diameter 2.8 cm`),
      length: ArchetypeBand.metres(
        2.4,
        2.4,
        `${FIG}: 240 cm between the attachments`,
      ),
      mass: ArchetypeBand.of("kg", 40, 80, ArchetypeBand.TYPICAL_MASS, true),
    },
    grab: {
      height: ArchetypeBand.metres(
        0.84,
        0.915,
        `${ADA} 609.4, top of the gripping surface 33 to 36 in above the floor`,
      ),
      diameter: ArchetypeBand.metres(
        0.032,
        0.051,
        `${ADA} 609.2.1, circular section 1-1/4 to 2 in`,
      ),
      length: ArchetypeBand.metres(
        0.915,
        1.065,
        `${ADA} 604.5, rear wall bar at least 36 in and side wall bar at least 42 in long`,
      ),
      mass: ArchetypeBand.of("kg", 1.5, 4, ArchetypeBand.TYPICAL_MASS, true),
    },
    rail: {
      height: ArchetypeBand.metres(
        0.865,
        0.965,
        `${ADA} 505.4, top of the gripping surface 34 to 38 in above the walking surface`,
      ),
      diameter: ArchetypeBand.metres(
        0.032,
        0.051,
        `${ADA} 505.7.1, circular section 1-1/4 to 2 in`,
      ),
      length: ArchetypeBand.metres(
        1.2,
        3,
        "a run of level rail, not read at a source",
        true,
      ),
      mass: ArchetypeBand.of("kg", 8, 25, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
