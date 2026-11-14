import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Measured steel bucklers of a museum collection. */
const WALLACE: string =
  "K. Reeves, A Survey of Bucklers at the Wallace Collection: A315, about 17.5 in and 3 lb 7 oz, and A316, 20.75 in and 3 lb 13 oz, both about 1600 (https://nachtanz.org/kjr/a-survey-of-bucklers-wallace-museum.html)";

/** The round shield's size, from a secondary source. */
const ROUND: string =
  "Viking Age round shields, 75 to 90 cm across by far the most common (Wikipedia, Viking Age arms and armour, https://en.wikipedia.org/wiki/Viking_Age_arms_and_armour)";

/**
 * A shield held by a grip behind its boss: a buckler or a round shield.
 *
 * The shield stands upright with its centre at the origin and its face toward `+Z`. It is a disc with a domed boss on the face and a bar across the back, behind the boss, that the fist closes on. `face` is the whole front that meets a blow, `boss` the dome's top that a punch leads with, and `rim` the top of the edge.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The shield.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the shield stands, what it is built of and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation A short cylinder for the board, a ball for the boss and a rod for the grip, of one density, so the centre of mass sits at the disc's centre a little toward the boss and the inertia is a disc's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, three parts, four contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arm strap, no rim binding; the board's thickness and the boss's size are estimates named on their constants.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createShield(
  params: createShield.IParams,
  seed?: number | string,
): Archetype<createShield.Affordance, createShield.Dimension> {
  const kind: createShield.Kind = ArchetypeDraw.choice(
    "shield",
    "kind",
    params.kind,
    createShield.KINDS,
  );
  const d: Record<createShield.Dimension, number> = ArchetypeDraw.dimensions(
    "shield",
    createShield.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createShield.Affordance,
    createShield.Dimension
  > = new ArchetypeBuilder({
    archetype: "shield",
    id: params.id,
    name: kind === "buckler" ? "buckler" : "round shield",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter / 2;
  const half: number = createShield.BOARD[kind] / 2;
  const bar: number = createShield.GRIP / 2;
  builder.rod("board", radius, v(0, 0, -half), v(0, 0, half), {
    color: kind === "buckler" ? "#8a8d91" : "#a9825a",
  });
  builder.ball("boss", createShield.BOSS, v(0, 0, half), {
    color: "#6c7076",
  });
  builder.rod(
    "grip",
    bar,
    v(-createShield.BOSS, 0, -half - bar),
    v(createShield.BOSS, 0, -half - bar),
    { color: "#4a3324" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(v(0, 0, -half - bar), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: createShield.GRIP,
    length: 2 * createShield.BOSS,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(v(0, 0, half), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width: d.diameter,
    depth: d.diameter,
  });
  builder.affordance({
    id: "boss",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(0, 0, half + createShield.BOSS),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "rim",
    kind: "ledge",
    direction: "normal",
    frame: ArchetypeFrame.facing(v(0, radius, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createShield}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from or that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The diameter and mass a block reads, and the grip, face, boss and rim it is held and struck by (#3202's buckler and round shield).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every kind has every dimension; the uncited sizes are named constants, not literals in the builder.
 */
export namespace createShield {
  /** The kinds of shield. */
  export type Kind = "buckler" | "round";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["buckler", "round"];

  /** The board's thickness, metres, by kind: a steel plate and a plank board. Estimates, not read at a source. */
  export const BOARD: Readonly<Record<Kind, number>> = {
    buckler: 0.003,
    round: 0.008,
  };

  /** The boss's radius, metres, which is also half the grip bar's length behind it. An estimate, not read at a source. */
  export const BOSS: number = 0.07;

  /** The grip bar's diameter, metres, which is the grip's `aperture`. An estimate, not read at a source. */
  export const GRIP: number = 0.028;

  /**
   * The affordance ids:
   *
   * - `grip`: the bar behind the boss, taken by the fist from the `-Z` side, its length along `+X`.
   * - `face`: the whole front, facing `+Z`, as wide and as high as the diameter.
   * - `boss`: the top of the boss's dome, facing `+Z`.
   * - `rim`: the top of the edge, facing up.
   */
  export type Affordance = "grip" | "face" | "boss" | "rim";

  /**
   * The free dimensions:
   *
   * - `diameter`: across the board, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which shield. */
    kind: Kind;

    /** The model's id, unique in a scene; `shield` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    buckler: {
      diameter: ArchetypeBand.metres(0.445, 0.527, WALLACE),
      mass: ArchetypeBand.of("kg", 1.56, 1.73, WALLACE),
    },
    round: {
      diameter: ArchetypeBand.metres(0.75, 0.9, ROUND, true),
      mass: ArchetypeBand.of(
        "kg",
        3.5,
        5,
        "a plank round shield with its boss, not read at a source",
        true,
      ),
    },
  };
}
