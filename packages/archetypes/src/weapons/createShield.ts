import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The round shield's size, from a secondary source. */
const ROUND: string =
  "Viking Age round shields, 75 to 90 cm across by far the most common (Wikipedia, Viking Age arms and armour, https://en.wikipedia.org/wiki/Viking_Age_arms_and_armour)";

/**
 * A buckler, round shield or strapped digital stage shield.
 *
 * The board stands on its centre with its face toward `+Z`. The centre-grip
 * variants place the grip behind the boss. The virtual foam variant uses a
 * lateral grip and a rear loop with a separate forearm socket, using the
 * distinction photographed in The Met's Highland Targe (1996.83) and documented
 * by the Pitt Rivers Museum under enarmes. Its lateral rim marks sit on the
 * board's profile. `slung` goes on the model axis at the rearmost depth, with
 * `+Y` toward the wearer and `+X` across the shield.
 *
 * @param params The kind, a buckler's model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension
 *   left free inside its band; absent, the first model and the middle of each
 *   band.
 * @returns The shield.
 * @throws {AutoMovieArchetypeRefusal} For a model not of the kind, a fixed
 *   dimension outside its band, or one the model gives.
 */
export function createShield(
  params: createShield.IParams,
  seed?: number,
): AutoMovieArchetype<createShield.Affordance, createShield.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createShield.Dimension> =
    new AutoMovieArchetypeDrawSession<createShield.Dimension>(
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
  const builder: AutoMovieArchetypeBuilder<
    createShield.Affordance,
    createShield.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name:
      kind === "buckler"
        ? "buckler"
        : kind === "round"
          ? "round shield"
          : "strapped stage shield",
    material: kind === "strapped" ? "foam" : "composite",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter! / 2;
  const half: number = createShield.BOARD[kind] / 2;
  const bar: number = createShield.GRIP / 2;
  const strapped: boolean = kind === "strapped";
  builder.rod("board", radius, v(0, 0, -half), v(0, 0, half), {
    color: kind === "buckler" ? "#8a8d91" : "#a9825a",
  });
  builder.ball("boss", createShield.BOSS, v(0, 0, half), {
    color: "#6c7076",
  });
  const grip: IAutoMovieVector3 = v(
    strapped ? radius * 0.45 : 0,
    0,
    -half - bar,
  );
  const along: IAutoMovieVector3 = strapped ? v(0, 1, 0) : v(1, 0, 0);
  const halfGrip: IAutoMovieVector3 = Vector3.scale(along, createShield.BOSS);
  builder.rod(
    "grip",
    bar,
    Vector3.subtract(grip, halfGrip),
    Vector3.add(grip, halfGrip),
    {
      color: "#4a3324",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(grip, v(0, 0, -1), along),
    extent: null,
    grip: "power",
    aperture: createShield.GRIP,
    length: 2 * createShield.BOSS,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, half),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.diameter!,
    depth: d.diameter!,
  });
  builder.affordance({
    id: "boss",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, radius, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  if (strapped) {
    const strapX: number = -radius * 0.38;
    const strapHalf: number = radius * 0.19;
    const strapBack: number = -half - 3 * bar;
    const low: IAutoMovieVector3 = v(strapX, -strapHalf, strapBack);
    const high: IAutoMovieVector3 = v(strapX, strapHalf, strapBack);
    builder.rod("forearm-strap", bar, low, high, { color: "#645579" });
    builder.rod("strap-low", bar, v(strapX, -strapHalf, -half), low, {
      color: "#645579",
    });
    builder.rod("strap-high", bar, v(strapX, strapHalf, -half), high, {
      color: "#645579",
    });
    builder.affordance({
      id: "forearm",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(strapX, 0, strapBack + bar),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
    });

    // Keep the lateral frames available as visual stage marks.
    for (const [id, sign] of [
      ["rim-negative-x", -1],
      ["rim-positive-x", 1],
    ] as const)
      builder.affordance({
        id,
        kind: "ledge",
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * radius, 0, 0),
          v(sign, 0, 0),
          v(0, 1, 0),
        ),
        extent: null,
      });
  }

  // Use the backmost depth of the loop, grip or boss to clear the wearer's back.
  const rear: number = Math.min(
    -half - (strapped ? 4 * bar : createShield.GRIP),
    half - createShield.BOSS,
  );
  builder.affordance({
    id: "slung",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, rear),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** Companion types, constants and bands of {@link createShield}. */
export namespace createShield {
  /** The kinds of shield. */
  export type Kind = "buckler" | "round" | "strapped";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["buckler", "round", "strapped"];

  /**
   * The board's thickness, metres, by kind: a steel plate and a plank board.
   * Estimates, not read at a source.
   */
  export const BOARD: Readonly<Record<Kind, number>> = {
    buckler: 0.003,
    round: 0.008,
    strapped: 0.035,
  };

  /**
   * The boss's radius, metres, which is also half the grip bar's length behind
   * it. An estimate, not read at a source.
   */
  export const BOSS: number = 0.07;

  /**
   * The grip bar's diameter, metres, which is the grip's `aperture`. An
   * estimate, not read at a source.
   */
  export const GRIP: number = 0.028;

  /**
   * The affordance ids:
   *
   * - `grip`: the bar behind the boss, taken by the fist from the `-Z` side, its
   *   length along `+X`.
   * - `face`: the whole front, facing `+Z`, as wide and as high as the diameter.
   * - `boss`: the top of the boss's dome, facing `+Z`.
   * - `rim`: the top of the edge, facing up.
   * - `forearm`: the rear loop's interior on the strapped stage shield.
   * - `rim-negative-x` and `rim-positive-x`: lateral marks on the strapped stage
   *   shield.
   * - `slung`: the shield's rearmost point on its axis, `+Y` toward a wearer
   *   whose back the shield hangs on (#3500).
   */
  export type Affordance =
    | "grip"
    | "face"
    | "boss"
    | "rim"
    | "slung"
    | "forearm"
    | "rim-negative-x"
    | "rim-positive-x";

  /**
   * The free dimensions:
   *
   * - `diameter`: across the board, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    mass: "kg",
  };

  /** The read bucklers: the Wallace Collection's A315 and A316. */
  export type Model = "a315" | "a316";

  /**
   * Each kind's models whole, the default first: A315, about 17.5 in and 3 lb 7
   * oz, and A316, 20.75 in and 3 lb 13 oz (K. Reeves, A Survey of Bucklers at
   * the Wallace Collection,
   * https://nachtanz.org/kjr/a-survey-of-bucklers-wallace-museum.html); a round
   * shield has none.
   */
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
        diameter: 17.5 * AutoMovieArchetypeUnits.INCH,
        mass:
          3 * AutoMovieArchetypeUnits.POUND + 7 * AutoMovieArchetypeUnits.OUNCE,
      },
      a316: {
        diameter: 20.75 * AutoMovieArchetypeUnits.INCH,
        mass:
          3 * AutoMovieArchetypeUnits.POUND +
          13 * AutoMovieArchetypeUnits.OUNCE,
      },
    },
  };

  /**
   * The parameters: the kind, a buckler's model, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which shield. */
    kind: Kind;

    /**
     * Which of the read bucklers; picked from the seed when absent. A round
     * shield has none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `shield` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    buckler: {},
    round: {
      diameter: AutoMovieArchetypeBand.metres(0.75, 0.9, ROUND, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        3.5,
        5,
        "a plank round shield with its boss, not read at a source",
        true,
      ),
    },
    strapped: {
      diameter: AutoMovieArchetypeBand.metres(
        0.72,
        0.92,
        "Authored virtual stage scale.",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.35,
        0.55,
        "Nominal foam mass for virtual staging.",
        true,
      ),
    },
  };
}
