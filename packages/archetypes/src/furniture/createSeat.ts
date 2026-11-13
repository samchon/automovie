import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import { SEAT_BANDS } from "./SEAT_BANDS";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createSeat.Kind, string>> = {
  dining: "dining chair",
  office: "office chair",
  armchair: "armchair",
  stool: "stool",
  barStool: "bar stool",
  bench: "bench",
  sofa: "sofa",
};

/** Thickness of the seat slab, metres: picture only. */
const SLAB: number = 0.04;

/** Thickness of a back panel, metres: also the width a hand grips along its top. */
const PANEL: number = 0.03;

/** Radius of a leg, metres: picture only. */
const LEG: number = 0.02;

/** Width of an armrest pad, metres: the 50 mm minimum of EN 1335-1:2020 Table 2. */
const ARM: number = 0.05;

/** Reach of an office chair's five-star base from its column, metres: inside the 415 mm underframe limit of EN 1335-1:2020 Table 2. */
const BASE_RADIUS: number = 0.3;

/** Flat colours, sRGB. */
const WOOD: string = "#a9825a";

/** The colour of upholstery. */
const CLOTH: string = "#6f7f93";

/** The colour of metal parts. */
const METAL: string = "#5b5f66";

/**
 * A seat: a dining chair, an office chair, an armchair, a stool, a bar stool, a bench or a sofa.
 *
 * The model is a seat slab on legs, a column or a plinth, with a back and arms where the kind has them: enough to tell a chair from a stool from a sofa and nothing more. What a sitter reads is exact: the `seat` frame stands at the seat height on the middle of the front edge, facing `+Z`, with the depth, the width and the back's height the bands below give. A bench or a sofa has one `seat` as wide as all its places; place `k` of `n` is the site `seat` at `u = (k + 0.5) / n`, counted from the sitter's right.
 *
 * The origin is on the floor under the middle of the seat.
 *
 * @param params The kind, the number of places and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The seat.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a number of places the kind does not have.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, where the seat frame stands, how places are addressed and where the origin is.
 * @evidence contracts/development/implementation.md#principled-implementation Dimensioned boxes and rods placed from the drawn seat height, depth, width and back height; the seat affordance follows the `seat` convention of `AutoMovieAffordanceKind`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the seat, then the support, back and arms each under the kinds that have them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sat-on dimensions come only from `BANDS`. Uncited and stated on their constants or here: leg and slab thickness, which shape the picture only; the back panel's thickness, which is the `grip`'s aperture; the footrest's 24 mm bar; and an arm pad's length of 0.7 of the seat depth.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of parts per kind.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSeat(
  params: createSeat.IParams,
  seed?: number | string,
): Archetype<createSeat.Affordance, createSeat.Dimension> {
  const kind: createSeat.Kind = ArchetypeDraw.choice(
    "seat",
    "kind",
    params.kind,
    createSeat.KINDS,
  );
  const shared: boolean = kind === "bench" || kind === "sofa";
  const places: number = params.places ?? (shared ? 2 : 1);
  if (!Number.isInteger(places) || places < 1 || places > (shared ? 4 : 1))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "seat",
      axis: "places",
      value: places,
      feasible: {
        kind: "range",
        minimum: 1,
        maximum: shared ? 4 : 1,
        unit: "",
      },
      reason: `a ${kind} seats ${shared ? "one to four" : "one"}`,
      fix: "give a whole number of places the kind has",
    });
  const d: Partial<Record<createSeat.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "seat",
      createSeat.BANDS[kind],
      seed,
      params,
      createSeat.BANDS,
    );
  const height: number = d.seatHeight!;
  const round: boolean = kind === "stool" || kind === "barStool";
  const width: number = d.seatWidth! * places;
  const depth: number = round ? width : d.seatDepth!;
  const back: number | undefined = d.backHeight;
  const arm: number | undefined = d.armHeight;
  const builder: ArchetypeBuilder<createSeat.Affordance, createSeat.Dimension> =
    new ArchetypeBuilder({
      archetype: "seat",
      id: params.id,
      name: NAMES[kind],
      dimensions: d,
    });

  // The seat: a slab whose top is the sitting surface, round for a stool.
  if (round)
    builder.rod(
      "seat",
      width / 2,
      Vector3.create(0, height - SLAB, 0),
      Vector3.create(0, height, 0),
      { color: WOOD },
    );
  else
    builder.box(
      "seat",
      Vector3.create(width, SLAB, depth),
      Vector3.create(0, height - SLAB / 2, 0),
      { color: kind === "sofa" || kind === "armchair" ? CLOTH : WOOD },
    );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, depth / 2)),
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
      Vector3.create(0, 0.08, 0),
      Vector3.create(0, height - SLAB, 0),
      { color: METAL },
    );
    for (let k: number = 0; k < 5; k++) {
      const angle: number = (2 * Math.PI * k) / 5;
      builder.rod(
        `spoke-${k}`,
        0.02,
        Vector3.create(0, 0.08, 0),
        Vector3.create(
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
      Vector3.create(width, height - SLAB, depth),
      Vector3.create(0, (height - SLAB) / 2, 0),
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
        Vector3.create(sx * x, 0, sz * z),
        Vector3.create(sx * x, height - SLAB, sz * z),
        { color: WOOD },
      );
    if (kind === "barStool") {
      const rest: number = height - d.footrestDrop!;
      builder.rod(
        "footrest",
        0.012,
        Vector3.create(-x, rest, z),
        Vector3.create(x, rest, z),
        { color: METAL },
      );
      builder.affordance({
        id: "footrest",
        kind: "bar",
        frame: ArchetypeFrame.upright(Vector3.create(0, rest, z)),
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
      Vector3.create(width, back, PANEL),
      Vector3.create(0, height + back / 2, z),
      { color: kind === "sofa" || kind === "armchair" ? CLOTH : WOOD },
    );
    builder.affordance({
      id: "back",
      kind: "surface",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, height + back / 2, -depth / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      width,
      depth: back,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, height + back - PANEL / 2, z),
        Vector3.create(0, 0, -1),
        Vector3.create(1, 0, 0),
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
        Vector3.create(ARM, solid ? height + arm : PANEL, depth * 0.7),
        Vector3.create(
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
          Vector3.create(
            sign * (width / 2 - LEG),
            height - SLAB / 2,
            -depth * 0.15,
          ),
          Vector3.create(x, height + arm - PANEL, -depth * 0.15),
          { color: METAL },
        );
      builder.affordance({
        id: `${side}Arm`,
        kind: "surface",
        frame: ArchetypeFrame.upright(
          Vector3.create(x, height + arm, -depth * 0.15),
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
      frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
      extent: null,
      width,
      depth,
    });
  return builder.build(d.mass! * places);
}

/**
 * Companion types and bands of {@link createSeat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the kind, the affordance ids and the free dimensions, and one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions are those a sitter's act reads (#3370): seat height, depth and width, back and arm height; mass is there because a model's body needs one.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A kind without a dimension has no band for it, so a stool cannot be given a back height.
 */
export namespace createSeat {
  /** The kinds of seat. */
  export type Kind =
    | "dining"
    | "office"
    | "armchair"
    | "stool"
    | "barStool"
    | "bench"
    | "sofa";

  /** Every kind, for a caller that reads one at run time. */
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
   * - `grip`: the top of the backrest, taken from behind to pull the seat out or to steady oneself; kinds with a back.
   * - `leftArm`, `rightArm`: the armrest pads, on the sitter's left (`+X`) and right; the office chair, the armchair and the sofa.
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
   * - `seatDepth`: the sitting surface from its front edge to the back; a round stool has none, its depth being its diameter.
   * - `seatWidth`: the sitting surface's width per place; a stool's diameter, so the `seat` contact of a stool is the square about its disc.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which seat. */
    kind: Kind;

    /** The model's id, unique in a scene; `seat` when absent. */
    id?: string;

    /** How many sit side by side on a bench or a sofa, 1 to 4; 2 when absent. Other kinds seat one. */
    places?: number;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof SEAT_BANDS = SEAT_BANDS;
}
