import { Quaternion, Vector3 } from "@automovie/engine";

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

/** The facilities rules, read. */
const FR: string =
  "FINA Facilities Rules 2017-2021 (https://artisticswimming.ca/wp-content/uploads/2021/10/fina_facilities_2017-2021.pdf)";

/**
 * One lane's width of a competition pool's end wall: the deck, the wall down
 * into the water with its rest ledge, and on the `startingPlatform` kind the
 * starting platform on the deck.
 *
 * The deck's surface is the origin's height and the wall's face the origin's
 * `Z`; the water lies toward `+Z`, its surface the drawn freeboard below the
 * deck, and the wall reaches down to the pool's floor. A swimmer in the water
 * faces the wall along `-Z`; one on the platform faces the water along `+Z`.
 *
 * - `deck` is the deck at its edge, a surface stood on, as wide as the segment
 *   and its run behind the edge not stated; `edge` the deck's edge over the
 *   water, a ledge along `+X` with `+Z` out over the water, which a swimmer
 *   grips and hauls out by; `water` the water's surface at the wall's face, the
 *   plane a swimming act swims on, as wide as the segment; `restLedge` the rest
 *   ledge's outer edge, a ledge a swimmer stands or rests on.
 * - A starting platform's `platform` is its top, a surface sloping down toward
 *   the water; `front` the top's front edge, a ledge the toes curl over;
 *   `backstrokeGrip` the horizontal backstroke grip under the top's front, a
 *   bar across the platform on the wall's line, at the drawn height FR 2.7
 *   allows below the slab, behind the wall's face so it does not protrude. Its
 *   mounting is not drawn.
 *
 * Getting into or out of the water by a ladder is `createLadder` placed at the
 * wall; no motion law yet climbs out of water (the multi-contact rows of
 * #3436), so the edge serves a production's staging until one does.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The pool edge.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or one only the other kind has.
 */
export function createPoolEdge(
  params: createPoolEdge.IParams,
  seed?: number,
): AutoMovieArchetype<createPoolEdge.Affordance, createPoolEdge.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createPoolEdge.Dimension> =
    new AutoMovieArchetypeDrawSession<createPoolEdge.Dimension>(
      "poolEdge",
      createPoolEdge.UNITS,
      seed,
      params,
    );
  const kind: createPoolEdge.Kind = ArchetypeDraw.choice(
    "poolEdge",
    "kind",
    params.kind,
    createPoolEdge.KINDS,
  );
  const d: Partial<Record<createPoolEdge.Dimension, number>> = draw.dimensions(
    createPoolEdge.BANDS[kind],
    createPoolEdge.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createPoolEdge.Affordance,
    createPoolEdge.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "deckEdge" ? "pool edge" : "starting platform",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof createPoolEdge.ESTIMATES = createPoolEdge.ESTIMATES;
  const width: number = d.width!;
  const water: number = -d.freeboard!;
  const floor: number = water - d.poolDepth!;

  // The wall from the deck down to the pool's floor, the deck running back from its edge.
  builder.box("wall", v(width, -floor, E.deck), v(0, floor / 2, -E.deck / 2), {
    color: "#d9dcd6",
  });
  const ledge: number = water - d.ledgeDepth!;
  builder.box(
    "rest-ledge",
    v(width, E.ledge, d.ledgeWidth!),
    v(0, ledge - E.ledge / 2, d.ledgeWidth! / 2),
    { color: "#d9dcd6" },
  );
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: width,
  });
  builder.affordance({
    id: "water",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, water, 0)),
    extent: null,
    width,
  });
  builder.affordance({
    id: "restLedge",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, ledge, d.ledgeWidth!),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    length: width,
  });
  if (kind === "deckEdge") return builder.build(d.mass!);

  // The platform: a pedestal set back from the wall's line, the top slab over it sloping down toward the water, its front on the wall's line. The pedestal's level top meets the slab's underside at its own middle, so the slab neither floats over it nor is pierced by it: the slope moves the underside by less than the slab's thickness across the pedestal.
  const size: number = d.platformSize!;
  const top: number = water + d.platformHeight!;
  const slope: number = d.slope! * AutoMovieArchetypeUnits.DEGREE;
  const pedestal: number =
    top + (Math.tan(slope) * E.recess) / 2 - E.slab / Math.cos(slope);
  builder.box(
    "pedestal",
    v(size, pedestal, size - E.recess),
    v(0, pedestal / 2, -(size + E.recess) / 2),
    { color: "#e7e9ec" },
  );
  const centre: { y: number; z: number } = {
    y: top - (E.slab / 2) * Math.cos(slope),
    z: -size / 2 - (E.slab / 2) * Math.sin(slope),
  };
  builder.box("top", v(size, E.slab, size), v(0, centre.y, centre.z), {
    color: "#3a6ea5",
    rotation: Quaternion.fromAxisAngle(v(1, 0, 0), d.slope!),
  });
  const normal: ReturnType<typeof v> = v(0, Math.cos(slope), Math.sin(slope));
  builder.affordance({
    id: "platform",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top, -size / 2),
      normal,
      v(1, 0, 0),
    ),
    extent: null,
    width: size,
    depth: size,
  });
  const grip: number = water + d.gripHeight!;
  builder.rod(
    "backstroke-grip",
    E.grip / 2,
    v(-size / 2, grip, -E.grip / 2),
    v(size / 2, grip, -E.grip / 2),
    { color: "#b9bec4" },
  );
  builder.affordance({
    id: "backstrokeGrip",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, grip, -E.grip / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    length: size,
  });
  builder.affordance({
    id: "front",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(
        0,
        top - (size / 2) * Math.sin(slope),
        -(size / 2) * (1 - Math.cos(slope)),
      ),
      normal,
      v(1, 0, 0),
    ),
    extent: null,
    length: size,
  });
  return builder.build(d.mass!);
}

/** Companion types, constants and bands of {@link createPoolEdge}. */
export namespace createPoolEdge {
  /** The kinds: the bare end wall, and the end wall with a starting platform. */
  export type Kind = "deckEdge" | "startingPlatform";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["deckEdge", "startingPlatform"];

  /**
   * The affordance ids:
   *
   * - `deck`, `edge`, `water`, `restLedge`: every kind's, as
   *   {@link createPoolEdge} describes them.
   * - `platform`, `front`, `backstrokeGrip`: a starting platform's.
   */
  export type Affordance =
    | "deck"
    | "edge"
    | "water"
    | "restLedge"
    | "platform"
    | "front"
    | "backstrokeGrip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: the segment along `X`, one lane.
   * - `freeboard`: the deck above the water.
   * - `poolDepth`: the water's depth at the wall.
   * - `ledgeDepth`, `ledgeWidth`: the rest ledge's top below the water and its
   *   width out from the wall.
   * - `platformHeight`: the platform's top above the water, at its middle.
   * - `platformSize`: its top, square.
   * - `slope`: its top's fall toward the water, degrees.
   * - `gripHeight`: the backstroke grip above the water.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "freeboard"
    | "poolDepth"
    | "ledgeDepth"
    | "ledgeWidth"
    | "platformHeight"
    | "platformSize"
    | "gripHeight"
    | "slope"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    freeboard: "m",
    poolDepth: "m",
    ledgeDepth: "m",
    ledgeWidth: "m",
    platformHeight: "m",
    platformSize: "m",
    gripHeight: "m",
    slope: "degrees",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which segment. */
    kind: Kind;

    /** The model's id, unique in a scene; `poolEdge` when absent. */
    id?: string;
  }

  /**
   * The construction sizes: `deck`, the deck's run behind the edge, and
   * `ledge`, the rest ledge's thickness, each an estimate no act reads and no
   * band declares; `slab`, the platform's top thickness, the 0.04 m FR 2.7
   * names for a top a swimmer grips; `recess`, how far the pedestal stands back
   * from the wall's line, an estimate; `grip`, the backstroke grip bar's
   * diameter, an estimate the bar is not declared with.
   */
  export const ESTIMATES: Readonly<{
    deck: number;
    ledge: number;
    slab: number;
    recess: number;
    grip: number;
  }> = {
    deck: 1,
    ledge: 0.1,
    slab: 0.04,
    recess: 0.1,
    grip: 0.03,
  };

  /** The bands every segment shares. */
  const WALL: Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>> = {
    width: AutoMovieArchetypeBand.metres(
      2.5,
      2.5,
      `${FR} FR 2.5: lanes at least 2.5 m wide; the model takes the least`,
    ),
    freeboard: AutoMovieArchetypeBand.metres(
      0.3,
      0.3,
      `${FR} FR 2.4.3 and FR 2.15: the end wall to 0.3 m above the water for the touch panels`,
    ),
    poolDepth: AutoMovieArchetypeBand.metres(
      1.35,
      1.35,
      `${FR} FR 2.3: at least 1.35 m where starting platforms stand; the model takes the least`,
    ),
    ledgeDepth: AutoMovieArchetypeBand.metres(
      1.2,
      1.2,
      `${FR} FR 2.4.2: rest ledges not less than 1.2 m below the water; the model takes the least`,
    ),
    ledgeWidth: AutoMovieArchetypeBand.metres(
      0.1,
      0.15,
      `${FR} FR 2.4.2: rest ledges 0.1 to 0.15 m wide`,
    ),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    deckEdge: {
      ...WALL,
      mass: AutoMovieArchetypeBand.of(
        "kg",
        3000,
        6000,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: a concrete wall segment of this size`,
        true,
      ),
    },
    startingPlatform: {
      ...WALL,
      platformHeight: AutoMovieArchetypeBand.metres(
        0.5,
        0.75,
        `${FR} FR 2.7: the platform 0.5 to 0.75 m above the water`,
      ),
      platformSize: AutoMovieArchetypeBand.metres(
        0.5,
        0.5,
        `${FR} FR 2.7: the top at least 0.5 x 0.5 m; the model takes the least`,
      ),
      slope: AutoMovieArchetypeBand.of(
        "degrees",
        0,
        10,
        `${FR} FR 2.7: the slope not more than 10 degrees`,
      ),
      gripHeight: AutoMovieArchetypeBand.metres(
        0.3,
        0.41,
        `${FR} FR 2.7: backstroke grips 0.3 to 0.6 m above the water, parallel to the end wall and not protruding beyond it; the model keeps them under the least platform's front, 0.5 m less half its 0.5 m top's fall at 10 degrees and the 0.04 m slab`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        3050,
        6100,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: a concrete wall segment with a platform of some 50 to 100 kg`,
        true,
      ),
    },
  };
}
