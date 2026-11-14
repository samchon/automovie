import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { STREET_FIXTURE_BANDS } from "./STREET_FIXTURE_BANDS";

/** The builder every construction fills. */
type Builder = ArchetypeBuilder<
  createStreetFixture.Affordance,
  createStreetFixture.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createStreetFixture.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** The Brimar 28 in cone's proportions to its height: its square base, its cone's foot and its top (13.4, 9.8 and 2.1 in of 28). */
const CONE: Readonly<{ base: number; foot: number; top: number }> = {
  base: 13.4 / 28,
  foot: 9.8 / 28,
  top: 2.1 / 28,
};

/** The Mueller hydrant's nozzle bores, metres: the 4 1/2 in pumper and the 2 1/2 in hose nozzles; its 1 1/2 in operating nut. */
const HYDRANT: Readonly<{ pumper: number; hose: number; nut: number }> = {
  pumper: 0.1143,
  hose: 0.0635,
  nut: 0.0381,
};

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `plate`, a cone's base plate as a share of its height; `sign`, a sign blank's thickness. */
const ESTIMATES: Readonly<{ plate: number; sign: number }> = {
  plate: 0.04,
  sign: 0.003,
};

/** The readable name of each kind. */
const NAMES: Readonly<Record<createStreetFixture.Kind, string>> = {
  trafficCone: "traffic cone",
  bollard: "bollard",
  hydrant: "fire hydrant",
  lampPost: "lamp post",
  signPost: "sign post",
};

/**
 * A street fixture standing on the pavement at the origin: a traffic cone, a bollard, a fire hydrant, a lamp post or a sign post.
 *
 * Each stands upright on `y = 0`. A cone is a square base plate under a cone in the Brimar cone's proportions, held at its top. A bollard is a steel pipe, a post to lean on or swing round with a top to sit or set things on. A hydrant is a barrel with its pumper nozzle toward `+Z` and its hose nozzles toward `+X` and `-X` at the maker's height, each a socket at its face where a hose couples, and its operating nut on top. A lamp post is a base under a round shaft to its mounting height, a post to lean on or swing round, with a post-top luminaire on it. A sign post is a square post carrying a STOP sign's blank facing `+Z` with its bottom edge at the mounting height, the post below the sign a bar.
 *
 * A bollard rests on its steel pipe: steel on concrete (`ArchetypeFriction`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The fixture.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands, its contacts, and what is left out for want of a source.
 * @evidence contracts/development/implementation.md#principled-implementation Each kind's parts at the drawn sizes: the cone scaled from the Brimar sheet's proportions, the bollard at Reliance's height and diameters, the hydrant at AMERICAN-Darling's heights and nozzle faces with Mueller's nozzle bores and nut, the lamp post at Wave's height, shaft and base under Sternberg's luminaire, the sign at the MUTCD's height and sizes on Atkore's post.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind, each its parts then its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cone is three stacked rods, a bonnet and nozzles are rods; the cone's plate is a construction estimate, and the barrel's diameter Mueller's unlabelled top.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStreetFixture(
  params: createStreetFixture.IParams,
  seed?: number | string,
): Archetype<createStreetFixture.Affordance, createStreetFixture.Dimension> {
  const kind: createStreetFixture.Kind = ArchetypeDraw.choice(
    "streetFixture",
    "kind",
    params.kind,
    createStreetFixture.KINDS,
  );
  const d: Drawn = ArchetypeDraw.dimensions(
    "streetFixture",
    createStreetFixture.BANDS[kind],
    seed,
    params,
    createStreetFixture.BANDS,
  );
  const builder: Builder = new ArchetypeBuilder({
    archetype: "streetFixture",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  if (kind === "trafficCone") cone(builder, d);
  else if (kind === "bollard" || kind === "lampPost") post(builder, d, kind);
  else if (kind === "signPost") sign(builder, d);
  else hydrant(builder, d);
  return builder.build(d.mass!, kind === "bollard" ? { rests: "steel" } : {});
}

/**
 * Build a traffic cone: a square base plate and a cone of three stacked rods narrowing from the foot to the top; `top` is a round handle on the top.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function cone(builder: Builder, d: Drawn): void {
  const height: number = d.height!;
  const plate: number = ESTIMATES.plate * height;
  const base: number = CONE.base * height;
  builder.box("base", v(base, plate, base), v(0, plate / 2, 0), {
    color: "#1d1d1d",
  });
  const foot: number = (CONE.foot * height) / 2;
  const top: number = (CONE.top * height) / 2;
  const rise: number = (height - plate) / 3;
  for (let k: number = 0; k < 3; k++) {
    const share: number = (k + 0.5) / 3;
    builder.rod(
      `cone-${k + 1}`,
      foot + (top - foot) * share,
      v(0, plate + k * rise, 0),
      v(0, plate + (k + 1) * rise, 0),
      { color: k === 1 ? "#f2f2f2" : "#ff6a13" },
    );
  }
  builder.affordance({
    id: "top",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, height, 0), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    grip: "power",
  });
}

/**
 * Build a bollard or a lamp post: a lamp post's base, then the round shaft to the drawn height and a lamp post's luminaire on it; `post` is the shaft as an upright bar, a bollard's `top` its top face.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 * @param kind Which of the two.
 */
function post(builder: Builder, d: Drawn, kind: "bollard" | "lampPost"): void {
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const foot: number = kind === "lampPost" ? d.baseHeight! : 0;
  const color: string = kind === "lampPost" ? "#2f3236" : "#e2b714";
  if (kind === "lampPost")
    builder.rod("base", d.base! / 2, v(0, 0, 0), v(0, foot, 0), { color });
  builder.rod("shaft", radius, v(0, foot, 0), v(0, height, 0), {
    color,
    ...(kind === "bollard" ? { surface: "steel" as const } : {}),
  });
  if (kind === "lampPost")
    builder.rod("luminaire", d.head! / 2, v(0, height, 0), v(0, height + d.headHeight!, 0), {
      color: "#f4f1e0",
    });
  builder.affordance({
    id: "post",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, (foot + height) / 2, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter!,
    length: height - foot,
  });
  if (kind === "bollard")
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
      width: d.diameter!,
      depth: d.diameter!,
    });
}

/**
 * Build a sign post: the square post up to the sign's top, and the sign's square blank on its `+Z` face with its bottom edge at the mounting height; `post` is the post below the sign, an upright bar.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function sign(builder: Builder, d: Drawn): void {
  const bottom: number = d.height!;
  const size: number = d.head!;
  const side: number = d.diameter!;
  builder.box("post", v(side, bottom + size, side), v(0, (bottom + size) / 2, 0), {
    color: "#9aa1a8",
  });
  builder.box(
    "sign",
    v(size, size, ESTIMATES.sign),
    v(0, bottom + size / 2, side / 2 + ESTIMATES.sign / 2),
    { color: "#c8102e" },
  );
  builder.affordance({
    id: "post",
    kind: "bar",
    symmetry: "half",
    frame: ArchetypeFrame.facing(v(0, bottom / 2, 0), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: side,
    length: bottom,
  });
}

/**
 * Build a fire hydrant: the barrel to its top, the pumper nozzle toward `+Z` and the hose nozzles toward `+X` and `-X` on the nozzles' plane out to their faces, and the operating nut on top; `pumper`, `hoseLeft` and `hoseRight` are the nozzles' faces, sockets whose `+Y` points out of them, and `nut` the nut, a knob turned about `+Y`.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function hydrant(builder: Builder, d: Drawn): void {
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const y: number = d.nozzleHeight!;
  const red: string = "#c8102e";
  builder.rod("barrel", radius, v(0, 0, 0), v(0, height - HYDRANT.nut, 0), {
    color: red,
  });
  builder.rod(
    "nut",
    HYDRANT.nut / 2,
    v(0, height - HYDRANT.nut, 0),
    v(0, height, 0),
    { color: "#8a8d91" },
  );
  const out: number = d.pumperReach!;
  const hose: number = d.hoseReach!;
  builder.rod("pumper", HYDRANT.pumper / 2, v(0, y, 0), v(0, y, out), {
    color: red,
  });
  for (const [id, sign] of [
    ["hose-left", 1],
    ["hose-right", -1],
  ] as const)
    builder.rod(id, HYDRANT.hose / 2, v(0, y, 0), v(sign * hose, y, 0), {
      color: red,
    });
  builder.affordance({
    id: "pumper",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, y, out), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  for (const [id, sign] of [
    ["hoseLeft", 1],
    ["hoseRight", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: ArchetypeFrame.facing(v(sign * hose, y, 0), v(sign, 0, 0), v(0, 0, 1)),
      extent: null,
    });
  builder.affordance({
    id: "nut",
    kind: "knob",
    frame: ArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
  });
}

/**
 * Companion types and bands of {@link createStreetFixture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The posts a hand leans on or swings round, the top a cone is lifted by, the nut a hydrant is opened at and the nozzles a hose couples to (#3468 N2).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A contact no source places is left out rather than placed by guess.
 */
export namespace createStreetFixture {
  /** The kinds of fixture. */
  export type Kind =
    | "trafficCone"
    | "bollard"
    | "hydrant"
    | "lampPost"
    | "signPost";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "trafficCone",
    "bollard",
    "hydrant",
    "lampPost",
    "signPost",
  ];

  /**
   * The affordance ids:
   *
   * - `top`: a cone's top, a round handle it is lifted by; a bollard's top face.
   * - `post`: a bollard's or a lamp post's shaft, a sign post below its sign, an upright bar.
   * - `nut`: a hydrant's operating nut, a knob turned about `+Y`.
   * - `pumper`, `hoseLeft`, `hoseRight`: a hydrant's pumper nozzle face on `+Z` and hose nozzle faces on `+X` and `-X`, sockets a hose couples to.
   */
  export type Affordance =
    | "top"
    | "post"
    | "nut"
    | "pumper"
    | "hoseLeft"
    | "hoseRight";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the fixture above the ground; a lamp post's mounting height; a sign's bottom edge.
   * - `diameter`: a bollard's pipe, a hydrant's barrel, a lamp post's shaft, a sign post's side.
   * - `head`, `headHeight`: a lamp post's luminaire across and high; `head` also a sign's side.
   * - `nozzleHeight`: a hydrant's nozzles' centreline above the ground; `pumperReach`, `hoseReach`: its pumper's and hose nozzles' faces from its axis.
   * - `base`, `baseHeight`: a lamp post's base across and high.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "diameter"
    | "nozzleHeight"
    | "pumperReach"
    | "hoseReach"
    | "base"
    | "baseHeight"
    | "head"
    | "headHeight"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which fixture. */
    kind: Kind;

    /** The model's id, unique in a scene; `streetFixture` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = STREET_FIXTURE_BANDS;
}
