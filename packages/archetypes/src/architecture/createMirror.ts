import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The mirror's mounting read. */
const ADA: string =
  "2010 ADA Standards 603.3: a mirror over a lavatory or countertop with the bottom edge of its reflecting surface 40 inches (1015 mm) maximum above the floor (https://www.access-board.gov/ada/chapter/ch06/); the model takes the limit";

/** The wall mirror read. */
const BOBRICK: string =
  "Bobrick B-290 technical data: 18 or 24 in wide, 30 to 72 in high, a 3/4 x 3/4 in angle frame, 1/4 in glass, 3/4 in off the wall (https://www.bobrick.com/wp-content/uploads/B-290_td.pdf)";

/** The standing mirror read. */
const IKORNNES: string =
  "IKEA IKORNNES standing mirror 302.983.96: width 52 cm, height 167 cm, depth 52 cm (https://www.ikea.com/gb/en/p/ikornnes-standing-mirror-ash-30298396)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `panel`, a standing mirror's frame thickness; `foot`, its feet's height. */
const ESTIMATES: Readonly<{ panel: number; foot: number }> = {
  panel: 0.03,
  foot: 0.04,
};

/**
 * A mirror: a framed mirror on a wall, or a standing (cheval) mirror on the floor.
 *
 * A wall mirror hangs in the `XY` plane with the wall at `z = 0` behind it and its face toward `+Z`, the bottom of its reflecting surface at the standard's height. A standing mirror stands on the floor at the origin, its panel upright facing `+Z` on two feet running front to back. `face` is the reflecting surface, a surface a person stands before and looks into, its `+Y` out of the glass.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The mirror.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where each kind stands and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation Bobrick's sizes, frame and wall offset at the ADA's limit for the bottom edge; IKEA's overall width, height and depth for the standing mirror.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the frame and glass or the panel and feet, then the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The glass is a slab; the standing mirror's panel thickness and feet are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMirror(
  params: createMirror.IParams,
  seed?: number | string,
): Archetype<createMirror.Affordance, createMirror.Dimension> {
  const kind: createMirror.Kind = ArchetypeDraw.choice(
    "mirror",
    "kind",
    params.kind,
    createMirror.KINDS,
  );
  const d: Partial<Record<createMirror.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "mirror",
      createMirror.BANDS[kind],
      seed,
      params,
      createMirror.BANDS,
    );
  const builder: ArchetypeBuilder<
    createMirror.Affordance,
    createMirror.Dimension
  > = new ArchetypeBuilder({
    archetype: "mirror",
    id: params.id,
    name: kind === "wall" ? "wall mirror" : "standing mirror",
    dimensions: d,
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
    builder.box("panel", v(width, panel, E.panel), v(0, E.foot + panel / 2, 0), {
      color: "#a9825a",
    });
    for (const [id, sign] of [
      ["foot-left", 1],
      ["foot-right", -1],
    ] as const)
      builder.box(id, v(E.panel, E.foot, d.depth!), v((sign * (width - E.panel)) / 2, E.foot / 2, 0), {
        color: "#a9825a",
      });
  }
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(centre, v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width,
    depth: kind === "wall" ? height : height - ESTIMATES.foot,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createMirror}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face a person looks into (#3468 N15).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where the standard gives only a limit, the band is that limit and says so; masses no source gives are provisional.
 */
export namespace createMirror {
  /** The kinds of mirror. */
  export type Kind = "wall" | "cheval";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["wall", "cheval"];

  /** The affordance id: `face`, the reflecting surface, its `+Y` out of the glass. */
  export type Affordance = "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: the reflecting surface, or a standing mirror's overall size.
   * - `bottom`: a wall mirror's reflecting surface's bottom edge above the floor.
   * - `frame`: a wall mirror's frame around the glass; `offset`: its face off the wall.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mirror. */
    kind: Kind;

    /** The model's id, unique in a scene; `mirror` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    wall: {
      width: ArchetypeBand.metres(18 * ArchetypeUnits.INCH, 24 * ArchetypeUnits.INCH, BOBRICK),
      height: ArchetypeBand.metres(30 * ArchetypeUnits.INCH, 72 * ArchetypeUnits.INCH, BOBRICK),
      bottom: ArchetypeBand.metres(40 * ArchetypeUnits.INCH, 40 * ArchetypeUnits.INCH, ADA),
      frame: ArchetypeBand.metres(0.75 * ArchetypeUnits.INCH, 0.75 * ArchetypeUnits.INCH, BOBRICK),
      offset: ArchetypeBand.metres(0.75 * ArchetypeUnits.INCH, 0.75 * ArchetypeUnits.INCH, BOBRICK),
      mass: ArchetypeBand.of("kg", 4, 15, ArchetypeBand.TYPICAL_MASS, true),
    },
    cheval: {
      width: ArchetypeBand.metres(52 * ArchetypeUnits.CENTIMETRE, 52 * ArchetypeUnits.CENTIMETRE, IKORNNES),
      height: ArchetypeBand.metres(167 * ArchetypeUnits.CENTIMETRE, 167 * ArchetypeUnits.CENTIMETRE, IKORNNES),
      depth: ArchetypeBand.metres(52 * ArchetypeUnits.CENTIMETRE, 52 * ArchetypeUnits.CENTIMETRE, IKORNNES),
      mass: ArchetypeBand.of("kg", 8, 12, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
