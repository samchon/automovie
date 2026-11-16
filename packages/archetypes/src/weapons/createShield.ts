import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The round shield's size, from a secondary source. */
const ROUND: string =
  "Viking Age round shields, 75 to 90 cm across by far the most common (Wikipedia, Viking Age arms and armour, https://en.wikipedia.org/wiki/Viking_Age_arms_and_armour)";

/**
 * A shield held by a grip behind its boss: a buckler or a round shield.
 *
 * The shield stands upright with its centre at the origin and its face toward `+Z`. It is a disc with a domed boss on the face and a bar across the back, behind the boss, that the fist closes on. `face` is the whole front that meets a blow, `boss` the dome's top that a punch leads with, and `rim` the top of the edge. `slung` is where the shield hangs on a wearer's back: on its axis at its rearmost point, the back of the grip bar or of the boss ball, which reaches behind the board, `+Y` toward the wearer and `+X` across the shield, so a worn prop placed with that frame on the back of the chest bone carries the shield face out; the strap that holds it there is not drawn.
 *
 * @param params The kind, a buckler's model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The shield.
 * @throws {ArchetypeRefusal} For a model not of the kind, a fixed dimension outside its band, or one the model gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the shield stands, what it is built of and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation A short cylinder for the board, a ball for the boss and a rod for the grip, of one density, so the centre of mass sits at the disc's centre a little toward the boss and the inertia is a disc's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model, draw the other dimensions, three parts, five contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arm strap, no rim binding and no guige strap for slinging; the board's thickness and the boss's size are estimates named on their constants.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createShield(
  params: createShield.IParams,
  seed?: number | string,
): Archetype<createShield.Affordance, createShield.Dimension> {
  const draw: ArchetypeDrawSession<createShield.Dimension> =
    new ArchetypeDrawSession<createShield.Dimension>(
      "shield",
      createShield.UNITS,
      seed,
      params,
    );
  const kind: createShield.Kind = ArchetypeDraw.choice(
    "shield",
    "kind",
    params.kind,
    createShield.KINDS,
  );
  // A buckler is one of the two Wallace Collection bucklers whole; a round shield has no read model, its bands.
  const model: {
    figures: Readonly<Partial<Record<createShield.Dimension, number>>>;
  } = draw.model<createShield.Model>(
    "model",
    params.model,
    createShield.MODELS[kind],
  );
  const d: Partial<Record<createShield.Dimension, number>> = {
    ...draw.dimensions(createShield.BANDS[kind], createShield.BANDS),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createShield.Affordance,
    createShield.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind === "buckler" ? "buckler" : "round shield",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter! / 2;
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
    width: d.diameter!,
    depth: d.diameter!,
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

  // Slung on the back, the shield's rearmost point lies against the wearer, its face outward: the back of the grip bar or of the boss ball, which reaches behind the board, whichever is farther back.
  const rear: number = Math.min(
    -half - createShield.GRIP,
    half - createShield.BOSS,
  );
  builder.affordance({
    id: "slung",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, 0, rear), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createShield}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from or that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds and read bucklers, each whole, and one cited band per dimension a model leaves, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The diameter and mass a block reads, the grip, face, boss and rim it is held and struck by (#3202's buckler and round shield), and the place it hangs on a back (#3500).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every kind has every dimension, a buckler's from one measured buckler, never between two; the uncited sizes are named constants, not literals in the builder.
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
   * - `slung`: the shield's rearmost point on its axis, `+Y` toward a wearer whose back the shield hangs on (#3500).
   */
  export type Affordance = "grip" | "face" | "boss" | "rim" | "slung";

  /**
   * The free dimensions:
   *
   * - `diameter`: across the board, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    diameter: "m",
    mass: "kg",
  };

  /** The read bucklers: the Wallace Collection's A315 and A316. */
  export type Model = "a315" | "a316";

  /** Each kind's models whole, the default first: A315, about 17.5 in and 3 lb 7 oz, and A316, 20.75 in and 3 lb 13 oz (K. Reeves, A Survey of Bucklers at the Wallace Collection, https://nachtanz.org/kjr/a-survey-of-bucklers-wallace-museum.html); a round shield has none. */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    buckler: {
      a315: {
        diameter: 17.5 * ArchetypeUnits.INCH,
        mass: 3 * ArchetypeUnits.POUND + 7 * ArchetypeUnits.OUNCE,
      },
      a316: {
        diameter: 20.75 * ArchetypeUnits.INCH,
        mass: 3 * ArchetypeUnits.POUND + 13 * ArchetypeUnits.OUNCE,
      },
    },
  };

  /** The parameters: the kind, a buckler's model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which shield. */
    kind: Kind;

    /** Which of the read bucklers; picked from the seed when absent. A round shield has none. */
    model?: Model;

    /** The model's id, unique in a scene; `shield` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    buckler: {},
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
