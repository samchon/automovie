import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { SEAT_BANDS } from "./constants/SEAT_BANDS";

/** Creates chairs, stools and shared seats with named body contacts. */
export namespace AutoMovieArchetypeSeat {
/**
 * Creates a seat with the contacts supported by its chosen furniture kind.
 *
 * The origin is on the floor under the seat's centre. The `seat` frame is
 * at the top of the front edge and faces `+Z`. A bench or sofa has one
 * shared contact that defaults to two places. For zero-based place `k` of
 * `n`, use `site("seat", (k + 0.5) / n)`. The sites run from the sitter's
 * right to left. A stool's contact uses the square around its round seat.
 * Its stable central site is `site("seat")`.
 *
 * @param params The required kind, optional scene ID and places, and fixed
 *   dimensions in their band units.
 * @param seed Finite numeric seed for omitted dimension draws. Omit it to
 *   use each applicable band's midpoint.
 * @returns A generated seat with its local contact frames.
 * @throws {AutoMovieArchetypeRefusal} For an unsupported kind, invalid place
 *   count or a fixed dimension unsupported by the kind or band.
 * @example
 * const chair = AutoMovieArchetypeSeat.create({ kind: "dining" }, 31);
 * const seat = chair.affordance("seat");
 */
export function create(
  params: AutoMovieArchetypeSeat.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSeat.Affordance, AutoMovieArchetypeSeat.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSeat.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSeat.Dimension>(
      "seat",
      AutoMovieArchetypeSeat.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeSeat.Kind = ArchetypeDraw.choice(
    "seat",
    "kind",
    params.kind,
    AutoMovieArchetypeSeat.KINDS,
  );
  const shared: boolean = kind === "bench" || kind === "sofa";
  const layouts: readonly number[] = shared ? [1, 2, 3, 4] : [1];
  const requested: number = params.places ?? (shared ? 2 : 1);
  const places: number | undefined = layouts.find(
    (count: number): boolean => count === requested,
  );
  if (places === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "seat",
      axis: "places",
      value: requested,
      feasible: {
        kind: "range",
        minimum: 1,
        maximum: layouts.at(-1)!,
        unit: "",
      },
      reason: `a ${kind} seats ${shared ? "one to four" : "one"}`,
      fix: "give a whole number of places the kind has",
    });
  const d: Partial<Record<AutoMovieArchetypeSeat.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeSeat.BANDS[kind],
    AutoMovieArchetypeSeat.BANDS,
  );
  const height: number = d.seatHeight!;
  const round: boolean = kind === "stool" || kind === "barStool";
  const width: number = d.seatWidth! * places;
  const depth: number = round ? width : d.seatDepth!;
  const back: number | undefined = d.backHeight;
  const arm: number | undefined = d.armHeight;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSeat.Affordance,
    AutoMovieArchetypeSeat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });

  // The seat: a slab whose top is the sitting surface, round for a stool.
  if (round)
    builder.rod(
      "seat",
      width / 2,
      AutoMovieEngineVector3.create(0, height - SLAB, 0),
      AutoMovieEngineVector3.create(0, height, 0),
      { color: WOOD },
    );
  else
    builder.box(
      "seat",
      AutoMovieEngineVector3.create(width, SLAB, depth),
      AutoMovieEngineVector3.create(0, height - SLAB / 2, 0),
      { color: kind === "sofa" || kind === "armchair" ? CLOTH : WOOD },
    );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(0, height, depth / 2),
    ),
    extent: null,
    depth,
    width,
    ...(back === undefined ? {} : { back }),
  });

  // What carries the seat: a column on a five-star base, a plinth, or four legs.
  if (kind === "office") {
    builder.rod(
      "column",
      0.03,
      AutoMovieEngineVector3.create(0, 0.08, 0),
      AutoMovieEngineVector3.create(0, height - SLAB, 0),
      { color: METAL },
    );
    for (let k: number = 0; k < 5; k++) {
      const angle: number = (2 * Math.PI * k) / 5;
      builder.rod(
        `spoke-${k}`,
        0.02,
        AutoMovieEngineVector3.create(0, 0.08, 0),
        AutoMovieEngineVector3.create(
          BASE_RADIUS * Math.sin(angle),
          0.04,
          BASE_RADIUS * Math.cos(angle),
        ),
        { color: METAL },
      );
    }
  } else if (kind === "sofa")
    builder.box(
      "plinth",
      AutoMovieEngineVector3.create(width, height - SLAB, depth),
      AutoMovieEngineVector3.create(0, (height - SLAB) / 2, 0),
      { color: CLOTH, density: 0.4 },
    );
  else {
    const x: number = width / 2 - LEG * (round ? 3 : 1);
    const z: number = (round ? width : depth) / 2 - LEG * (round ? 3 : 1);
    for (const [name, sx, sz] of [
      ["leg-front-left", 1, 1],
      ["leg-front-right", -1, 1],
      ["leg-back-left", 1, -1],
      ["leg-back-right", -1, -1],
    ] as const)
      builder.rod(
        name,
        LEG,
        AutoMovieEngineVector3.create(sx * x, 0, sz * z),
        AutoMovieEngineVector3.create(sx * x, height - SLAB, sz * z),
        { color: WOOD },
      );
    if (kind === "barStool") {
      const rest: number = height - d.footrestDrop!;
      builder.rod(
        "footrest",
        0.012,
        AutoMovieEngineVector3.create(-x, rest, z),
        AutoMovieEngineVector3.create(x, rest, z),
        { color: METAL },
      );
      builder.affordance({
        id: "footrest",
        kind: "bar",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, rest, z)),
        extent: null,
        length: 2 * x,
        aperture: 0.024,
      });
    }
  }

  // The back: a panel rising from the seat's rear edge, leaned on from the front and gripped along its top.
  if (back !== undefined) {
    const z: number = -depth / 2 - PANEL / 2;
    builder.box(
      "back",
      AutoMovieEngineVector3.create(width, back, PANEL),
      AutoMovieEngineVector3.create(0, height + back / 2, z),
      { color: kind === "sofa" || kind === "armchair" ? CLOTH : WOOD },
    );
    builder.affordance({
      id: "back",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, height + back / 2, -depth / 2),
        AutoMovieEngineVector3.create(0, 0, 1),
        AutoMovieEngineVector3.create(1, 0, 0),
      ),
      extent: null,
      width,
      depth: back,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, height + back - PANEL / 2, z),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: PANEL,
      length: width,
    });
  }

  // The arms: a pad on each side at the arm height above the seat.
  if (arm !== undefined)
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = sign * (width / 2 + ARM / 2);
      const solid: boolean = kind !== "office";
      builder.box(
        `arm-${side}`,
        AutoMovieEngineVector3.create(ARM, solid ? height + arm : PANEL, depth * 0.7),
        AutoMovieEngineVector3.create(
          x,
          solid ? (height + arm) / 2 : height + arm - PANEL / 2,
          -depth * 0.15,
        ),
        { color: solid ? CLOTH : METAL, density: solid ? 0.4 : 1 },
      );
      if (!solid)
        builder.rod(
          `arm-post-${side}`,
          0.012,
          AutoMovieEngineVector3.create(
            sign * (width / 2 - LEG),
            height - SLAB / 2,
            -depth * 0.15,
          ),
          AutoMovieEngineVector3.create(x, height + arm - PANEL, -depth * 0.15),
          { color: METAL },
        );
      builder.affordance({
        id: `${side}Arm`,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright(
          AutoMovieEngineVector3.create(x, height + arm, -depth * 0.15),
        ),
        extent: null,
        width: ARM,
        depth: depth * 0.7,
      });
    }

  // A bench or a sofa is also lain on, along its length.
  if (shared)
    builder.affordance({
      id: "lie",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, height, 0)),
      extent: null,
      width,
      depth,
    });
  return builder.build(d.mass! * places);
}


  /** Selects the geometry, dimension bands and available seat contacts. */
  export type Kind =
    | "dining"
    | "office"
    | "armchair"
    | "stool"
    | "barStool"
    | "bench"
    | "sofa";

  /** Lists the kinds accepted by the factory at runtime. */
  export const KINDS: readonly Kind[] = [
    "dining",
    "office",
    "armchair",
    "stool",
    "barStool",
    "bench",
    "sofa",
  ];

  /**
   * The affordance ids:
   *
   * - `seat`: where a person sits; every kind.
   * - `back`: the backrest's front face, leaned on; kinds with a back.
   * - `grip`: the top of the backrest, taken from behind to pull the seat out or
   *   to steady oneself; kinds with a back.
   * - `leftArm`, `rightArm`: the armrest pads, on the sitter's left (`+X`) and
   *   right; the office chair, the armchair and the sofa.
   * - `footrest`: the bar a bar stool's sitter puts the feet on.
   * - `lie`: the whole sitting surface as a place to lie; the bench and the sofa.
   */
  export type Affordance =
    | "seat"
    | "back"
    | "grip"
    | "leftArm"
    | "rightArm"
    | "footrest"
    | "lie";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `seatHeight`: the sitting surface above the floor.
   * - `seatDepth`: the sitting surface from its front edge to the back; a round
   *   stool has none, its depth being its diameter.
   * - `seatWidth`: the sitting surface's width per place; a stool's diameter, so
   *   the `seat` contact of a stool is the square about its disc.
   * - `backHeight`: the top of the backrest above the sitting surface.
   * - `armHeight`: the armrest pads above the sitting surface.
   * - `footrestDrop`: a bar stool's footrest below the sitting surface.
   * - `mass`: kilograms per place.
   */
  export type Dimension =
    | "seatHeight"
    | "seatDepth"
    | "seatWidth"
    | "backHeight"
    | "armHeight"
    | "footrestDrop"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    seatHeight: "m",
    seatDepth: "m",
    seatWidth: "m",
    backHeight: "m",
    armHeight: "m",
    footrestDrop: "m",
    mass: "kg",
  };

  /** Selects a seat and any fixed dimensions for that kind. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Furniture kind with its available contacts and bands. */
    kind: Kind;

    /** Scene ID, defaulting to `seat`. */
    id?: string;

    /**
     * How many sit side by side on a bench or a sofa, 1 to 4; 2 when absent.
     * Other kinds seat one.
     */
    places?: number;
  }

  /** The applicable dimension bands and sources for each kind. */
  export const BANDS: typeof SEAT_BANDS = SEAT_BANDS;
}


/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeSeat.Kind, string>> = {
  dining: "dining chair",
  office: "office chair",
  armchair: "armchair",
  stool: "stool",
  barStool: "bar stool",
  bench: "bench",
  sofa: "sofa",
};

/*
 * Thickness of the seat slab, metres: picture only.
 */
const SLAB: number = 0.04;

/*
 * Thickness of a back panel, metres: also the width a hand grips along its top.
 */
const PANEL: number = 0.03;

/*
 * Radius of a leg, metres: picture only.
 */
const LEG: number = 0.02;

/*
 * Width of an armrest pad, metres: the 50 mm minimum of EN 1335-1:2020 Table 2.
 */
const ARM: number = 0.05;

/*
 * Reach of an office chair's five-star base from its column, metres: inside the
 * 415 mm underframe limit of EN 1335-1:2020 Table 2.
 */
const BASE_RADIUS: number = 0.3;

/*
 * Flat colours, sRGB.
 */
const WOOD: string = "#a9825a";

/*
 * The colour of upholstery.
 */
const CLOTH: string = "#6f7f93";

/*
 * The colour of metal parts.
 */
const METAL: string = "#5b5f66";
