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
} from "../core/index";

/*
 * The mirror's mounting read.
 */
const ADA: string =
  "2010 ADA Standards 603.3: a mirror over a lavatory or countertop with the bottom edge of its reflecting surface 40 inches (1015 mm) maximum above the floor (https://www.access-board.gov/ada/chapter/ch06/); the model takes the limit";

/*
 * The wall mirror read.
 */
const BOBRICK: string =
  "Bobrick B-290 technical data: standard sizes 18 x 30, 18 x 36, 24 x 30, 24 x 36, 24 x 48, 24 x 60 and 24 x 72 in (W x H), a 3/4 x 3/4 in angle frame, 1/4 in glass, 3/4 in off the wall (https://www.bobrick.com/wp-content/uploads/B-290_td.pdf)";

/*
 * The standing mirror read.
 */
const IKORNNES: string =
  "IKEA IKORNNES standing mirror 302.983.96: width 52 cm, height 167 cm, depth 52 cm (https://www.ikea.com/gb/en/p/ikornnes-standing-mirror-ash-30298396)";

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `panel`, a standing mirror's frame thickness;
 * `foot`, its feet's height.
 */
const ESTIMATES: Readonly<{ panel: number; foot: number }> = {
  panel: 0.03,
  foot: 0.04,
};

/** Constructs the mirror archetype from its recipe. */
export namespace AutoMovieArchetypeMirror {
/**
 * A mirror: a framed mirror on a wall, or a standing (cheval) mirror on the
 * floor.
 *
 * A wall mirror is one of Bobrick's standard sizes, given or drawn from the
 * seed; it hangs in the `XY` plane with the wall at `z = 0` behind it and its
 * face toward `+Z`, the bottom of its reflecting surface at the standard's
 * height. A standing mirror stands on the floor at the origin, its panel
 * upright facing `+Z` on two feet running front to back. `face` is the
 * reflecting surface, a surface a person stands before and looks into, its `+Y`
 * out of the glass.
 *
 * @param params The kind, a wall mirror's size and any dimension the author
 *   fixes.
 * @param seed The seed that draws a wall mirror's size when it is not given and
 *   every dimension left free inside its band; absent, the first size and the
 *   middle of each band.
 * @returns The mirror.
 * @throws {AutoMovieArchetypeRefusal} For a size Bobrick does not list or one
 *   named for a standing mirror, a fixed dimension outside its band, or one
 *   only another kind has.
 */
export function create(
  params: AutoMovieArchetypeMirror.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMirror.Affordance, AutoMovieArchetypeMirror.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMirror.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeMirror.Dimension>(
      "mirror",
      AutoMovieArchetypeMirror.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeMirror.Kind = ArchetypeDraw.choice(
    "mirror",
    "kind",
    params.kind,
    AutoMovieArchetypeMirror.KINDS,
  );
  const size: {
    name: AutoMovieArchetypeMirror.Size | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeMirror.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeMirror.Size>(
    "size",
    params.size,
    AutoMovieArchetypeMirror.SIZES[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeMirror.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeMirror.BANDS[kind], AutoMovieArchetypeMirror.BANDS),
    ...size.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeMirror.Affordance,
    AutoMovieArchetypeMirror.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name:
      size.name === undefined ? "standing mirror" : `wall mirror ${size.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width!;
  const height: number = d.height!;
  let centre: ReturnType<typeof v>;
  if (kind === "wall") {
    const frame: number = d.frame!;
    const offset: number = d.offset!;
    const bottom: number = d.bottom!;
    centre = v(0, bottom + height / 2, offset);
    builder.box(
      "frame",
      v(width + 2 * frame, height + 2 * frame, offset),
      v(0, bottom + height / 2, offset / 2),
      { color: "#b9bec4" },
    );
  } else {
    const E: typeof ESTIMATES = ESTIMATES;
    const panel: number = height - E.foot;
    centre = v(0, E.foot + panel / 2, E.panel / 2);
    builder.box(
      "panel",
      v(width, panel, E.panel),
      v(0, E.foot + panel / 2, 0),
      {
        color: "#a9825a",
      },
    );
    for (const [id, sign] of [
      ["foot-left", 1],
      ["foot-right", -1],
    ] as const)
      builder.box(
        id,
        v(E.panel, E.foot, d.depth!),
        v((sign * (width - E.panel)) / 2, E.foot / 2, 0),
        {
          color: "#a9825a",
        },
      );
  }
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(centre, v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width,
    depth: kind === "wall" ? height : height - ESTIMATES.foot,
  });
  return builder.build(d.mass!);
}

  /** The kinds of mirror. */
  export type Kind = "wall" | "cheval";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["wall", "cheval"];

  /** A wall mirror's standard sizes, inches width by height: Bobrick B-290's. */
  export type Size =
    | "18x30"
    | "18x36"
    | "24x30"
    | "24x36"
    | "24x48"
    | "24x60"
    | "24x72";

  /**
   * Each kind's standard sizes with the reflecting surface's width and height
   * each gives, metres, the default first: Bobrick B-290's for a wall mirror; a
   * standing mirror has one read model.
   */
  export const SIZES: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    wall: {
      "18x30": {
        width: 18 * AutoMovieArchetypeUnits.INCH,
        height: 30 * AutoMovieArchetypeUnits.INCH,
      },
      "18x36": {
        width: 18 * AutoMovieArchetypeUnits.INCH,
        height: 36 * AutoMovieArchetypeUnits.INCH,
      },
      "24x30": {
        width: 24 * AutoMovieArchetypeUnits.INCH,
        height: 30 * AutoMovieArchetypeUnits.INCH,
      },
      "24x36": {
        width: 24 * AutoMovieArchetypeUnits.INCH,
        height: 36 * AutoMovieArchetypeUnits.INCH,
      },
      "24x48": {
        width: 24 * AutoMovieArchetypeUnits.INCH,
        height: 48 * AutoMovieArchetypeUnits.INCH,
      },
      "24x60": {
        width: 24 * AutoMovieArchetypeUnits.INCH,
        height: 60 * AutoMovieArchetypeUnits.INCH,
      },
      "24x72": {
        width: 24 * AutoMovieArchetypeUnits.INCH,
        height: 72 * AutoMovieArchetypeUnits.INCH,
      },
    },
  };

  /**
   * The affordance id: `face`, the reflecting surface, its `+Y` out of the
   * glass.
   */
  export type Affordance = "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: a standing mirror's overall size; a wall mirror's are
   *   its standard size's.
   * - `bottom`: a wall mirror's reflecting surface's bottom edge above the floor.
   * - `frame`: a wall mirror's frame around the glass; `offset`: its face off the
   *   wall.
   * - `depth`: a standing mirror's feet front to back.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "bottom"
    | "frame"
    | "offset"
    | "depth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    bottom: "m",
    frame: "m",
    offset: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mirror. */
    kind: Kind;

    /**
     * A wall mirror's standard size; drawn from the seed when absent. A
     * standing mirror has none.
     */
    size?: Size;

    /** The model's id, unique in a scene; `mirror` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    wall: {
      bottom: AutoMovieArchetypeBand.metres(
        40 * AutoMovieArchetypeUnits.INCH,
        40 * AutoMovieArchetypeUnits.INCH,
        ADA,
      ),
      frame: AutoMovieArchetypeBand.metres(
        0.75 * AutoMovieArchetypeUnits.INCH,
        0.75 * AutoMovieArchetypeUnits.INCH,
        BOBRICK,
      ),
      offset: AutoMovieArchetypeBand.metres(
        0.75 * AutoMovieArchetypeUnits.INCH,
        0.75 * AutoMovieArchetypeUnits.INCH,
        BOBRICK,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        4,
        15,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    cheval: {
      width: AutoMovieArchetypeBand.metres(
        52 * AutoMovieArchetypeUnits.CENTIMETRE,
        52 * AutoMovieArchetypeUnits.CENTIMETRE,
        IKORNNES,
      ),
      height: AutoMovieArchetypeBand.metres(
        167 * AutoMovieArchetypeUnits.CENTIMETRE,
        167 * AutoMovieArchetypeUnits.CENTIMETRE,
        IKORNNES,
      ),
      depth: AutoMovieArchetypeBand.metres(
        52 * AutoMovieArchetypeUnits.CENTIMETRE,
        52 * AutoMovieArchetypeUnits.CENTIMETRE,
        IKORNNES,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        8,
        12,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
