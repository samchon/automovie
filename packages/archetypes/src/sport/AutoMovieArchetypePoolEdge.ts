import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypePoolEdgeData } from "./internal/AutoMovieArchetypePoolEdgeData";

/** Constructs the pool edge archetype from its recipe. */
export namespace AutoMovieArchetypePoolEdge {
  /**
   * Select the deck edge alone or include the starting platform.
   */
  export type Kind = "deckEdge" | "startingPlatform";

  /**
   * Pool-edge contact identifiers, in the model's local frame.
   *
   * Both kinds expose `deck`, `deckFace`, `wall`, `edge`, `water`, and
   * `restLedge`. `startingPlatform` also exposes `platform`, `front`, and
   * `backstrokeGrip`. See {@link create} for their frames and uses.
   */
  export type Affordance =
    | "deck"
    | "deckFace"
    | "wall"
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
   * Build a pool end-wall segment and its deck and water contacts.
   *
   * The deck lip is at the origin, `+X` spans the lane, and `+Z` points into
   * the pool. The deck extends behind the lip along `-Z`. The `water` surface
   * is `freeboard` metres below the lip and the floor is `poolDepth` below that.
   *
   * `deck` marks the lip. `edge` is the transverse ledge, with its normal up.
   * `deckFace` and `wall` are bounded surfaces on the same wall part. The
   * deck face points up and carries palm and foot contact during `edgeExit`.
   * The wall face points into the pool. `restLedge` marks the submerged ledge's
   * outer edge.
   *
   * A `startingPlatform` adds the sloping `platform` face, its `front` ledge,
   * and the horizontal `backstrokeGrip` bar. A separate ladder can be placed
   * at the wall.
   *
   * @param params Segment kind, optional scene ID and fixed dimensions.
   * @param seed Draws omitted dimensions within their bands. Omit it to use
   *   each band's midpoint.
   * @returns The fixed end wall, its deck, and the named contact frames.
   * @throws {AutoMovieArchetypeRefusal} For an unknown kind, a dimension
   *   belonging only to the other kind, or a fixed value outside its band.
   */
export function create(
  params: AutoMovieArchetypePoolEdge.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePoolEdge.Affordance, AutoMovieArchetypePoolEdge.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePoolEdge.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypePoolEdge.Dimension>(
      "poolEdge",
      AutoMovieArchetypePoolEdge.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypePoolEdge.Kind = ArchetypeDraw.choice(
    "poolEdge",
    "kind",
    params.kind,
    AutoMovieArchetypePoolEdge.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypePoolEdge.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypePoolEdge.BANDS[kind],
    AutoMovieArchetypePoolEdge.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePoolEdge.Affordance,
    AutoMovieArchetypePoolEdge.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "deckEdge" ? "pool edge" : "starting platform",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const E: typeof AutoMovieArchetypePoolEdge.ESTIMATES = AutoMovieArchetypePoolEdge.ESTIMATES;
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
    id: "deckFace",
    kind: "surface",
    materialPart: "wall",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, -E.deck / 2)),
    extent: null,
    width,
    depth: E.deck,
  });
  builder.affordance({
    id: "wall",
    kind: "surface",
    materialPart: "wall",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, floor / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: -floor,
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
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(v(1, 0, 0), d.slope!),
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

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["deckEdge", "startingPlatform"];

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
   * Construction sizes in metres.
   *
   * `deck` extends behind the lip and sets the depth of `deckFace`. `ledge`
   * is the rest ledge thickness. `slab` is the 0.04 m starting platform top
   * thickness from FR 2.7. `recess` measures how far the pedestal stands
   * behind the wall, and `grip` is the bar's drawn diameter. The other sizes
   * are staging estimates.
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

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    deckEdge: {
      ...AutoMovieArchetypePoolEdgeData.WALL,
      mass: AutoMovieArchetypeBand.of(
        "kg",
        3000,
        6000,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: a concrete wall segment of this size`,
        true,
      ),
    },
    startingPlatform: {
      ...AutoMovieArchetypePoolEdgeData.WALL,
      platformHeight: AutoMovieArchetypeBand.metres(
        0.5,
        0.75,
        `${AutoMovieArchetypePoolEdgeData.FR} FR 2.7: the platform 0.5 to 0.75 m above the water`,
      ),
      platformSize: AutoMovieArchetypeBand.metres(
        0.5,
        0.5,
        `${AutoMovieArchetypePoolEdgeData.FR} FR 2.7: the top at least 0.5 x 0.5 m; the model takes the least`,
      ),
      slope: AutoMovieArchetypeBand.of(
        "degrees",
        0,
        10,
        `${AutoMovieArchetypePoolEdgeData.FR} FR 2.7: the slope not more than 10 degrees`,
      ),
      gripHeight: AutoMovieArchetypeBand.metres(
        0.3,
        0.41,
        `${AutoMovieArchetypePoolEdgeData.FR} FR 2.7: backstroke grips 0.3 to 0.6 m above the water, parallel to the end wall and not protruding beyond it; the model keeps them under the least platform's front, 0.5 m less half its 0.5 m top's fall at 10 degrees and the 0.04 m slab`,
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
