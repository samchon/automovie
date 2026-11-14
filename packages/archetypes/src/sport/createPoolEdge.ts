import { Quaternion, Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The facilities rules, read. */
const FR: string =
  "FINA Facilities Rules 2017-2021 (https://artisticswimming.ca/wp-content/uploads/2021/10/fina_facilities_2017-2021.pdf)";

/**
 * One lane's width of a competition pool's end wall: the deck, the wall down into the water with its rest ledge, and on the `startingPlatform` kind the starting platform on the deck with its backstroke grip.
 *
 * The deck's surface is the origin's height and the wall's face the origin's `Z`; the water lies toward `+Z`, its surface the drawn freeboard below the deck, and the wall reaches down to the pool's floor. A swimmer in the water faces the wall along `-Z`; one on the platform faces the water along `+Z`.
 *
 * - `deck` is the deck behind the edge, a surface stood on; `edge` the deck's edge over the water, a ledge along `+X` with `+Z` out over the water, which a swimmer grips and hauls out by; `water` the water's surface in front of the wall, the plane a swimming act swims on; `restLedge` the rest ledge's outer edge, a ledge a swimmer stands or rests on.
 * - A starting platform's `platform` is its top, a surface sloping down toward the water; `front` the top's front edge, a ledge the toes curl over; `backstrokeGrip` the horizontal grip on its front, a bar a swimmer in the water holds for a backstroke start.
 *
 * Getting into or out of the water by a ladder is `createLadder` placed at the wall; no motion law yet climbs out of water (the multi-contact rows of #3436), so the edge serves a production's staging until one does.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The pool edge.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only the other kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the deck, the wall and the water are, which way a swimmer faces, each contact, and how a ladder and the missing law stand.
 * @evidence contracts/development/implementation.md#principled-implementation The end wall as one block from the deck down to the pool's floor at the rules' least depth, the rest ledge a box on its face at the rules' depth below the water, and a platform as a pedestal set back from the wall under a top slab tilted by the drawn slope, its grip a rod in the recess so it does not pass the wall's face, as the rules ask.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the wall and the ledge, then the platform when the kind has one.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The water is a contact, not a part; the deck's run behind the edge, the ledge's thickness, the platform's slab thickness and recess are named estimates (`createPoolEdge.ESTIMATES`).
 * @evidence contracts/development/implementation.md#efficient-algorithms At most five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPoolEdge(
  params: createPoolEdge.IParams,
  seed?: number | string,
): Archetype<createPoolEdge.Affordance, createPoolEdge.Dimension> {
  const kind: createPoolEdge.Kind = ArchetypeDraw.choice(
    "poolEdge",
    "kind",
    params.kind,
    createPoolEdge.KINDS,
  );
  const d: Partial<Record<createPoolEdge.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "poolEdge",
      createPoolEdge.BANDS[kind],
      seed,
      params,
      createPoolEdge.BANDS,
    );
  const builder: ArchetypeBuilder<
    createPoolEdge.Affordance,
    createPoolEdge.Dimension
  > = new ArchetypeBuilder({
    archetype: "poolEdge",
    id: params.id,
    name: kind === "deckEdge" ? "pool edge" : "starting platform",
    dimensions: d,
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
    frame: ArchetypeFrame.upright(v(0, 0, -E.deck / 2)),
    extent: null,
    width,
    depth: E.deck,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: width,
  });
  builder.affordance({
    id: "water",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, water, E.water / 2)),
    extent: null,
    width,
    depth: E.water,
  });
  builder.affordance({
    id: "restLedge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, ledge, d.ledgeWidth!), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: width,
  });
  if (kind === "deckEdge") return builder.build(d.mass!);

  // The platform: a pedestal set back from the wall's line, the top slab over it sloping down toward the water, its front on the wall's line. The pedestal's level top meets the slab's underside at its own middle, so the slab neither floats over it nor is pierced by it: the slope moves the underside by less than the slab's thickness across the pedestal.
  const size: number = d.platformSize!;
  const top: number = water + d.platformHeight!;
  const slope: number = (d.slope! * Math.PI) / 180;
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
  const grip: number = water + d.gripHeight!;
  const radius: number = createPoolEdge.GRIP / 2;
  builder.rod(
    "backstroke-grip",
    radius,
    v(-size / 2, grip, -radius),
    v(size / 2, grip, -radius),
    { color: "#b9bcc0" },
  );
  const normal: ReturnType<typeof v> = v(0, Math.cos(slope), Math.sin(slope));
  builder.affordance({
    id: "platform",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, top, -size / 2), normal, v(1, 0, 0)),
    extent: null,
    width: size,
    depth: size,
  });
  builder.affordance({
    id: "front",
    kind: "ledge",
    frame: ArchetypeFrame.facing(
      v(0, top - (size / 2) * Math.sin(slope), -(size / 2) * (1 - Math.cos(slope))),
      normal,
      v(1, 0, 0),
    ),
    extent: null,
    length: size,
  });
  builder.affordance({
    id: "backstrokeGrip",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, grip, -radius), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "hook",
    aperture: createPoolEdge.GRIP,
    length: size,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createPoolEdge}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and estimate states what it is; each band its clause.
 * @evidence contracts/development/design.md#principled-representation Closed unions; every height is stated from the water's surface, as the rules state them, and placed from the deck through the freeboard.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The water plane a swim reads, the edge and ledge a swimmer holds or stands on, and the platform and grip a start uses (#3468 F7).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rules' least values are taken where they give only a limit, and said to be.
 */
export namespace createPoolEdge {
  /** The kinds: the bare end wall, and the end wall with a starting platform. */
  export type Kind = "deckEdge" | "startingPlatform";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["deckEdge", "startingPlatform"];

  /** A backstroke grip's diameter, metres: an estimate, the rules give none. */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `deck`, `edge`, `water`, `restLedge`: every kind's, as {@link createPoolEdge} describes them.
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
   * - `ledgeDepth`, `ledgeWidth`: the rest ledge's top below the water and its width out from the wall.
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
    | "slope"
    | "gripHeight"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which segment. */
    kind: Kind;

    /** The model's id, unique in a scene; `poolEdge` when absent. */
    id?: string;
  }

  /**
   * The sizes the rules do not give, metres, each an estimate: `deck`, the deck's run behind the edge; `water`, the depth of water in front of the wall the `water` contact covers; `ledge`, the rest ledge's thickness; `slab`, the platform's top thickness, the 0.04 m the rules name for a grippable top; `recess`, how far the pedestal stands back from the wall's line.
   */
  export const ESTIMATES: Readonly<{
    deck: number;
    water: number;
    ledge: number;
    slab: number;
    recess: number;
  }> = {
    deck: 1,
    water: 2,
    ledge: 0.1,
    slab: 0.04,
    recess: 0.1,
  };

  /** The bands every segment shares. */
  const WALL: Readonly<Partial<Record<Dimension, IArchetypeBand>>> = {
    width: ArchetypeBand.metres(
      2.5,
      2.5,
      `${FR} FR 2.5: lanes at least 2.5 m wide; the model takes the least`,
    ),
    freeboard: ArchetypeBand.metres(
      0.3,
      0.3,
      `${FR} FR 2.4.3 and FR 2.15: the end wall to 0.3 m above the water for the touch panels`,
    ),
    poolDepth: ArchetypeBand.metres(
      1.35,
      1.35,
      `${FR} FR 2.3: at least 1.35 m where starting platforms stand; the model takes the least`,
    ),
    ledgeDepth: ArchetypeBand.metres(
      1.2,
      1.2,
      `${FR} FR 2.4.2: rest ledges not less than 1.2 m below the water; the model takes the least`,
    ),
    ledgeWidth: ArchetypeBand.metres(
      0.1,
      0.15,
      `${FR} FR 2.4.2: rest ledges 0.1 to 0.15 m wide`,
    ),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    deckEdge: {
      ...WALL,
      mass: ArchetypeBand.of(
        "kg",
        3000,
        6000,
        `${ArchetypeBand.TYPICAL_MASS}: a concrete wall segment of this size`,
        true,
      ),
    },
    startingPlatform: {
      ...WALL,
      platformHeight: ArchetypeBand.metres(
        0.5,
        0.75,
        `${FR} FR 2.7: the platform 0.5 to 0.75 m above the water`,
      ),
      platformSize: ArchetypeBand.metres(
        0.5,
        0.5,
        `${FR} FR 2.7: the top at least 0.5 x 0.5 m; the model takes the least`,
      ),
      slope: ArchetypeBand.of(
        "degrees",
        0,
        10,
        `${FR} FR 2.7: the slope not more than 10 degrees`,
      ),
      gripHeight: ArchetypeBand.metres(
        0.3,
        0.5 -
          0.25 * Math.tan((10 * Math.PI) / 180) -
          ESTIMATES.slab / Math.cos((10 * Math.PI) / 180) -
          GRIP / 2,
        `${FR} FR 2.7: backstroke handgrips 0.3 to 0.6 m above the water; the model keeps them under the underside of the lowest top FR 2.7 allows at its front, 0.5 m at the middle falling 10 degrees over half of 0.5 m, less the grip's radius, so no drawn grip stands in or above its platform`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        3050,
        6100,
        `${ArchetypeBand.TYPICAL_MASS}: a concrete wall segment with a platform of some 50 to 100 kg`,
        true,
      ),
    },
  };
}
