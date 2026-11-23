import { Vector3 } from "@automovie/engine";

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

/** The whiteboard read. */
const GHENT_M1: string =
  "Ghent M1 Series spec sheet PSS-M1: H x W 24 x 36 7/16, 36 7/16 x 48 15/32, 36 7/16 x 60 15/32, and 48 15/32 high by 48 15/32, 60 15/32, 72 1/2, 87 29/32, 96 17/32, 120 19/32, 144 19/32 or 192 19/32 in wide, a 5/8 in deep frame and a tray projecting 3 1/8 in (https://cdn.shopify.com/s/files/1/0272/6150/1542/files/m1_spec_sheets.pdf)";

/** The whiteboard's mounting read. */
const LETHBRIDGE: string =
  'University of Lethbridge design standard: "Classroom whiteboards - base to be mounted 915mm above the floor" (https://ulethbridge.ca/node/9433)';

/** The chalkboard read. */
const CLARIDGE: string =
  "Claridge Series 8 sheet V062226: chalkboards in standard sizes (H x W) 2 x 3, 2 x 4, 3 x 4, 4 x 4, 4 x 5, 4 x 6, 4 x 8, 4 x 10, 4 x 12, 4 x 14 and 4 x 16 ft, about 1/2 in thick overall, a 1 in tray (https://claridgeproducts.com/wp-content/uploads/2023/08/Series8-sheet.pdf)";

/** The notice board read. */
const GHENT_059: string =
  "Ghent 059 Series drawing PSS-059: cork boards 3 x 5, 4 x 4, 4 x 5, 4 x 6 and 4 x 8 ft (H x W), an 11/16 in deep frame (https://www.mybinding.com/cdn/shop/files/Ghent-Premium-Aluminum-Frame-Cork-Bulletin-Board-spec-sheet.pdf)";

/**
 * Each standard size read, height and width in inches: Ghent M1's by its own
 * figures, Claridge's and Ghent 059's by their feet.
 */
const INCHES: Readonly<Record<createBoard.Size, readonly [number, number]>> = {
  "24x36-7/16": [24, 36 + 7 / 16],
  "36-7/16x48-15/32": [36 + 7 / 16, 48 + 15 / 32],
  "36-7/16x60-15/32": [36 + 7 / 16, 60 + 15 / 32],
  "48-15/32x48-15/32": [48 + 15 / 32, 48 + 15 / 32],
  "48-15/32x60-15/32": [48 + 15 / 32, 60 + 15 / 32],
  "48-15/32x72-1/2": [48 + 15 / 32, 72 + 1 / 2],
  "48-15/32x87-29/32": [48 + 15 / 32, 87 + 29 / 32],
  "48-15/32x96-17/32": [48 + 15 / 32, 96 + 17 / 32],
  "48-15/32x120-19/32": [48 + 15 / 32, 120 + 19 / 32],
  "48-15/32x144-19/32": [48 + 15 / 32, 144 + 19 / 32],
  "48-15/32x192-19/32": [48 + 15 / 32, 192 + 19 / 32],
  "2x3ft": [24, 36],
  "2x4ft": [24, 48],
  "3x4ft": [36, 48],
  "3x5ft": [36, 60],
  "4x4ft": [48, 48],
  "4x5ft": [48, 60],
  "4x6ft": [48, 72],
  "4x8ft": [48, 96],
  "4x10ft": [48, 120],
  "4x12ft": [48, 144],
  "4x14ft": [48, 168],
  "4x16ft": [48, 192],
};

/**
 * A kind's standard sizes as model records, each its height and width in
 * metres.
 *
 * @param names The kind's sizes, its default first.
 * @returns Each size's figures, in the given order.
 */
function sized(
  names: readonly createBoard.Size[],
): Readonly<
  Partial<
    Record<
      createBoard.Size,
      Readonly<Partial<Record<createBoard.Dimension, number>>>
    >
  >
> {
  return Object.fromEntries(
    names.map((name: createBoard.Size) => [
      name,
      {
        height: INCHES[name][0] * AutoMovieArchetypeUnits.INCH,
        width: INCHES[name][1] * AutoMovieArchetypeUnits.INCH,
      },
    ]),
  );
}

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `lip`, a tray's lip height.
 */
const ESTIMATES: Readonly<{ lip: number }> = { lip: 0.02 };

/** The readable name of each kind. */
const NAMES: Readonly<Record<createBoard.Kind, string>> = {
  whiteboard: "whiteboard",
  blackboard: "blackboard",
  noticeBoard: "notice board",
};

/**
 * A wall board: a whiteboard, a blackboard or a cork notice board.
 *
 * The board is one of its maker's standard sizes, given or drawn from the seed.
 * It hangs in the `XY` plane with the wall at `z = 0` behind it and its face
 * toward `+Z`, its bottom edge at the drawn mounting height: a whiteboard at
 * the classroom standard's, the others on the floor's line for a production to
 * raise, since no source read mounts them. `face` is the writing or pinning
 * face, its `+Y` out of the board; a whiteboard's or blackboard's `tray` is its
 * tray's front edge along its foot, a ledge a marker or chalk rests on.
 *
 * @param params The kind, its size and any dimension the author fixes.
 * @param seed The seed that draws the size when it is not given and every
 *   dimension left free inside its band; absent, the kind's first size and the
 *   middle of each band.
 * @returns The board.
 * @throws {AutoMovieArchetypeRefusal} For a size the kind's maker does not
 *   list, a fixed dimension outside its band, or one only another kind has.
 */
export function createBoard(
  params: createBoard.IParams,
  seed?: number | string,
): AutoMovieArchetype<createBoard.Affordance, createBoard.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBoard.Dimension> =
    new AutoMovieArchetypeDrawSession<createBoard.Dimension>(
      "board",
      createBoard.UNITS,
      seed,
      params,
    );
  const kind: createBoard.Kind = ArchetypeDraw.choice(
    "board",
    "kind",
    params.kind,
    createBoard.KINDS,
  );
  const size: {
    name: createBoard.Size | undefined;
    figures: Readonly<Partial<Record<createBoard.Dimension, number>>>;
  } = draw.model<createBoard.Size>(
    "size",
    params.size,
    createBoard.SIZES[kind],
  );
  const d: Partial<Record<createBoard.Dimension, number>> = {
    ...draw.dimensions(createBoard.BANDS[kind], createBoard.BANDS),
    ...size.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createBoard.Affordance,
    createBoard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${NAMES[kind]} ${size.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const width: number = d.width!;
  const depth: number = d.depth!;
  const bottom: number = d.mount ?? 0;
  builder.box(
    "board",
    v(width, height, depth),
    v(0, bottom + height / 2, depth / 2),
    {
      color:
        kind === "whiteboard"
          ? "#f7f7f7"
          : kind === "blackboard"
            ? "#2f4f3f"
            : "#b98a5a",
    },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, bottom + height / 2, depth),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  if (kind !== "noticeBoard") {
    const tray: number = d.tray!;
    builder.box("tray", v(width, ESTIMATES.lip, tray), v(0, bottom, tray / 2), {
      color: "#b9bec4",
    });
    builder.affordance({
      id: "tray",
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, bottom + ESTIMATES.lip / 2, tray),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length: width,
    });
  }
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createBoard}. */
export namespace createBoard {
  /** The kinds of board. */
  export type Kind = "whiteboard" | "blackboard" | "noticeBoard";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "whiteboard",
    "blackboard",
    "noticeBoard",
  ];

  /**
   * The affordance ids:
   *
   * - `face`: the writing or pinning face.
   * - `tray`: a whiteboard's or blackboard's tray front edge, a ledge along `X`.
   */
  export type Affordance = "face" | "tray";

  /**
   * The standard sizes read, height by width: Ghent M1's whiteboards in inches,
   * Claridge's chalkboards and Ghent 059's notice boards in feet.
   */
  export type Size =
    | "24x36-7/16"
    | "36-7/16x48-15/32"
    | "36-7/16x60-15/32"
    | "48-15/32x48-15/32"
    | "48-15/32x60-15/32"
    | "48-15/32x72-1/2"
    | "48-15/32x87-29/32"
    | "48-15/32x96-17/32"
    | "48-15/32x120-19/32"
    | "48-15/32x144-19/32"
    | "48-15/32x192-19/32"
    | "2x3ft"
    | "2x4ft"
    | "3x4ft"
    | "3x5ft"
    | "4x4ft"
    | "4x5ft"
    | "4x6ft"
    | "4x8ft"
    | "4x10ft"
    | "4x12ft"
    | "4x14ft"
    | "4x16ft";

  /**
   * Each kind's standard sizes with the height and width each gives, metres,
   * its default first.
   */
  export const SIZES: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    whiteboard: sized([
      "24x36-7/16",
      "36-7/16x48-15/32",
      "36-7/16x60-15/32",
      "48-15/32x48-15/32",
      "48-15/32x60-15/32",
      "48-15/32x72-1/2",
      "48-15/32x87-29/32",
      "48-15/32x96-17/32",
      "48-15/32x120-19/32",
      "48-15/32x144-19/32",
      "48-15/32x192-19/32",
    ]),
    blackboard: sized([
      "2x3ft",
      "2x4ft",
      "3x4ft",
      "4x4ft",
      "4x5ft",
      "4x6ft",
      "4x8ft",
      "4x10ft",
      "4x12ft",
      "4x14ft",
      "4x16ft",
    ]),
    noticeBoard: sized(["3x5ft", "4x4ft", "4x5ft", "4x6ft", "4x8ft"]),
  };

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: the board, its standard size's.
   * - `depth`: its frame off the wall.
   * - `tray`: a tray's projection from the wall.
   * - `mount`: a whiteboard's bottom edge above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "tray"
    | "mount"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    tray: "m",
    mount: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width" | "height">, number>
  > {
    /** Which board. */
    kind: Kind;

    /** One of the kind's standard sizes; drawn from the seed when absent. */
    size?: Size;

    /** The model's id, unique in a scene; `board` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    whiteboard: {
      depth: AutoMovieArchetypeBand.metres(
        (5 / 8) * AutoMovieArchetypeUnits.INCH,
        (5 / 8) * AutoMovieArchetypeUnits.INCH,
        GHENT_M1,
      ),
      tray: AutoMovieArchetypeBand.metres(
        (3 + 1 / 8) * AutoMovieArchetypeUnits.INCH,
        (3 + 1 / 8) * AutoMovieArchetypeUnits.INCH,
        GHENT_M1,
      ),
      mount: AutoMovieArchetypeBand.metres(
        915 * AutoMovieArchetypeUnits.MILLIMETRE,
        915 * AutoMovieArchetypeUnits.MILLIMETRE,
        LETHBRIDGE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        5,
        40,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    blackboard: {
      depth: AutoMovieArchetypeBand.metres(
        0.5 * AutoMovieArchetypeUnits.INCH,
        0.5 * AutoMovieArchetypeUnits.INCH,
        CLARIDGE,
      ),
      tray: AutoMovieArchetypeBand.metres(
        1 * AutoMovieArchetypeUnits.INCH,
        1 * AutoMovieArchetypeUnits.INCH,
        CLARIDGE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        5,
        60,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    noticeBoard: {
      depth: AutoMovieArchetypeBand.metres(
        (11 / 16) * AutoMovieArchetypeUnits.INCH,
        (11 / 16) * AutoMovieArchetypeUnits.INCH,
        GHENT_059,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        4,
        15,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
