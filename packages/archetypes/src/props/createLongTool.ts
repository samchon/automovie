import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { ForestAxe } from "./ForestAxe";
import { Throwers } from "./Throwers";

/** Broom and mop handles from a maker's listings seen in search results. */
const HANDLES: string =
  "Rubbermaid Commercial broom handle, 60 in by 15/16 in, and mop handles, 54 in by 1 in, listings seen only in search results";

/** D-handle shovels from retailer listings seen in search results. */
const SHOVEL: string =
  "Bully Tools 82510, 41.5 in and 4.5 lb, and Fiskars D-handle shovels, 44.75 to 46 in and 4.85 to 5.6 lb, retailer listings seen only in search results";

/**
 * A long tool: a broom, a mop or a shovel that works on the floor or the ground, a forest axe, a fishing rod, or a field gun's sponge and rammer, worm or trail handspike.
 *
 * The tool stands upright along `+Y`, its head or blade on the floor at the origin and its shaft rising to the top. Both hands hold the `shaft`, each at a site along it. A shovel also has a D grip at its top. A mop provides fixed `upperGrip` and `lowerGrip` positions along the clear shaft for two-handed floor strokes. The `face` is the head's working side, facing down; a forest axe's `face` is its edge instead, facing `+Z` the way the swing goes, with the handle's back flush with the poll. A fishing rod stands on its butt with its tip up: one hand takes its `grip` at the butt, and its `tip` is the rod's end, `+Y` along it. Chopping with two hands has no motion law yet; the axe is built for holding, carrying and the swing rows that exist.
 *
 * The 6-pdr field gun's implements follow the 1862 Ordnance Manual: a sponge and rammer stands on its rammer head, whose end is its `face`, with the sponge at the top, whose end is its `tip`, `+Y` along it; a worm stands on its iron worm, whose point is its `face`, `-Y` along it, out of the tool; a trail handspike stands on its large end, its `face`, and tapers to the small end the hands bear down on.
 *
 * @param params The kind, the kind's model where it has read models, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The tool.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tool stands, where the hands go and which way the head faces.
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod with a head box; the shaft is one `bar` whose sites the two hands share, so the hand spacing is the holding act's choice. An axe is `ForestAxe.build`'s, a thrower `Throwers`'s and a field gun's implement `FIELD_IMPLEMENTS.build`'s.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build an axe whole, or the shaft and the head, then a shovel's grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bristles and strands are one block; a shovel's blade is a flat plate; the axe's, the throwers' and the implements' shortcuts are their builders'.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts for a broom, a mop or an axe, a head and a shaft; four for a shovel, with its grip and yoke; one for a fishing rod; three for a sponge and rammer or a worm, and two for a handspike.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLongTool(
  params: createLongTool.IParams,
  seed?: number | string,
): Archetype<createLongTool.Affordance, createLongTool.Dimension> {
  const draw: ArchetypeDrawSession<createLongTool.Dimension> =
    new ArchetypeDrawSession<createLongTool.Dimension>(
      "longTool",
      createLongTool.UNITS,
      seed,
      params,
    );
  const kind: createLongTool.Kind = ArchetypeDraw.choice(
    "longTool",
    "kind",
    params.kind,
    createLongTool.KINDS,
  );
  const drawn: Partial<Record<createLongTool.Dimension, number>> =
    draw.dimensions(createLongTool.BANDS[kind], createLongTool.BANDS);
  // A fishing rod is one of Daiwa's Ninja X spinning rods whole.
  const model: {
    name: createLongTool.Model | undefined;
    figures: createLongTool.Figures;
  } = draw.model<createLongTool.Model>(
    "model",
    params.model,
    createLongTool.MODELS[kind],
  );
  const d: Partial<Record<createLongTool.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const length: number = d.length!;
  const builder: ArchetypeBuilder<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });

  if (kind === "forestAxe") {
    ForestAxe.build(builder, d);
    return builder.build(d.mass!);
  }

  if (kind === "sling" || kind === "atlatl") {
    if (kind === "sling") Throwers.sling(builder, d);
    else Throwers.atlatl(builder, d);
    return builder.build(d.mass!);
  }
  const radius: number = d.shaftDiameter! / 2;
  if (kind === "spongeRammer" || kind === "worm" || kind === "trailHandspike") {
    FIELD_IMPLEMENTS.build(builder, kind, length, radius, d.mass!);
    return builder.build(d.mass!);
  }
  if (kind === "fishingRod") {
    // A rod on its butt: the grip a hand takes and the tip it casts with.
    const grip: number = createLongTool.ROD_GRIP;
    builder.rod(
      "rod",
      radius,
      Vector3.create(0, 0, 0),
      Vector3.create(0, length, 0),
      {
        color: "#2c2f33",
      },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, grip / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: grip,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // The head on the floor: a broom's block, a mop's pad, a shovel's blade standing on its edge.
  const head: number =
    kind === "shovel" ? 0.29 : kind === "broom" ? 0.08 : 0.03;
  const wide: number =
    kind === "shovel" ? createLongTool.BLADE_WIDTH : createLongTool.HEAD_WIDTH;
  builder.box(
    "head",
    kind === "shovel"
      ? Vector3.create(wide, head, 0.004)
      : Vector3.create(wide, head, kind === "broom" ? 0.05 : 0.12),
    Vector3.create(0, head / 2, 0),
    {
      color: kind === "shovel" ? "#6c7076" : "#c9a24a",
      density: kind === "shovel" ? 8 : 1,
    },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: wide,
  });

  const top: number = kind === "shovel" ? length - 0.1 : length;
  builder.rod(
    "shaft",
    radius,
    Vector3.create(0, head, 0),
    Vector3.create(0, top, 0),
    { color: "#b98d5b" },
  );
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, (head + top) / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 2 * radius,
    length: top - head,
  });

  if (kind === "mop") {
    // An upper hand and a lower hand push in distinct places on one shaft.
    for (const [id, share] of [
      ["upperGrip", 0.73],
      ["lowerGrip", 0.53],
    ] as const)
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(
          Vector3.create(0, head + share * (top - head), 0),
          Vector3.create(0, 0, -1),
          Vector3.create(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: 2 * radius,
      });
  }

  if (kind === "shovel") {
    // The D grip: a cross bar held from above, joined to the shaft by its yoke.
    builder.rod(
      "grip",
      radius,
      Vector3.create(-createLongTool.D_GRIP / 2, length - radius, 0),
      Vector3.create(createLongTool.D_GRIP / 2, length - radius, 0),
      { color: "#b98d5b" },
    );
    builder.box(
      "yoke",
      Vector3.create(0.12, 0.1 - 2 * radius, 0.01),
      Vector3.create(0, top + (0.1 - 2 * radius) / 2, 0),
      { color: "#b98d5b", density: 0.2 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.upright(Vector3.create(0, length - radius, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: createLongTool.D_GRIP,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createLongTool}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shaft two hands hold, its length and the mass (#3369, #3361).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The two hands share one bar and its sites instead of two fixed hand places.
 */
export namespace createLongTool {
  /** The kinds of tool. */
  export type Kind =
    | "broom"
    | "mop"
    | "shovel"
    | "forestAxe"
    | "fishingRod"
    | "spongeRammer"
    | "worm"
    | "trailHandspike"
    | "sling"
    | "atlatl";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "broom",
    "mop",
    "shovel",
    "forestAxe",
    "fishingRod",
    "spongeRammer",
    "worm",
    "trailHandspike",
    "sling",
    "atlatl",
  ];

  /** A fishing rod's grip length, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const ROD_GRIP: number = 0.12;

  /** The width of a broom's or a mop's head along `+X`, metres, which its `face` publishes. An estimate, not read at a source. */
  export const HEAD_WIDTH: number = 0.3;

  /** The width of a shovel's blade along `+X`, metres, which its `face` publishes. An estimate, not read at a source. */
  export const BLADE_WIDTH: number = 0.22;

  /** The length of the cross bar of a shovel's D grip, metres, the run one hand holds. An estimate, not read at a source. */
  export const D_GRIP: number = 0.11;

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft, a bar both hands hold at sites along it.
   * - `grip`: a shovel's D grip at its top, held from above; a fishing rod's grip at its butt, taken from `-Z`.
   * - `face`: the working side of the head, facing down onto the floor or the ground; an axe's edge, facing `+Z`, its `+X` along the edge; a rammer head's or a handspike's lower end, facing down; a worm's point, `+Y` down along the tool.
   * - `tip`: a fishing rod's end, or a sponge's, `+Y` along it.
   * - `release`: a sling's release knot, held between the thumb and the first finger and let go to throw (`Throwers.sling`); its `grip` is the finger loop.
   * - `pouch`: a sling's pouch a stone sits in, facing up.
   * - `spur`: an atlatl's hook, whose groove takes the dart's butt, facing back along the shaft (`Throwers.atlatl`); its `grip` is the handle at the butt.
   */
  export type Affordance =
    | "shaft"
    | "grip"
    | "face"
    | "tip"
    | "release"
    | "pouch"
    | "spur"
    | "upperGrip"
    | "lowerGrip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `shaftDiameter`: the shaft the hands wrap; an axe's follows from its handle's mass instead, and a handspike's from its read tapers.
   * - `edge`: an axe's cutting edge, along `+Y`, which is the head's height.
   * - `headLength`: an axe head from its poll to its edge, along `+Z`.
   * - `headMass`: an axe head's mass, kilograms, its share of the whole placing the balance.
   * - `pouchLength`, `pouchWidth`: a sling's pouch.
   * - `width`: an atlatl's width at its spur end.
   * - `spurSetback`: an atlatl's spur from its far end; `gripSetback`: where its handle proper begins from the butt.
   * - `launchSpeed`: a thrower's measured projectile speed, metres per second.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "shaftDiameter"
    | "edge"
    | "headLength"
    | "headMass"
    | "pouchLength"
    | "pouchWidth"
    | "width"
    | "spurSetback"
    | "gripSetback"
    | "launchSpeed"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    shaftDiameter: "m",
    edge: "m",
    headLength: "m",
    headMass: "kg",
    pouchLength: "m",
    pouchWidth: "m",
    width: "m",
    spurSetback: "m",
    gripSetback: "m",
    launchSpeed: "m/s",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** A fishing rod's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `longTool` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The fishing rods read: Daiwa's seven Ninja X two-piece spinning rods, by length and casting weight. */
  export type Model =
    | "NJX602MLFS"
    | "NJX702MLFS"
    | "NJX702MHFS"
    | "NJX802MLFS"
    | "NJX802MHFS"
    | "NJX802HFS"
    | "NJX902MLFS";

  /** Each kind's models whole, the default first, length and mass: 183 cm and 106 g, 213 cm and 131 g, 213 cm and 133 g, 244 cm and 141, 157 and 165 g, and 274 cm and 178 g (Daiwa Ninja X Spin specifications, https://www.daiwa.com/scandinavia/product/n753a5g). */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    fishingRod: {
      NJX602MLFS: { length: 1.83, mass: 0.106 },
      NJX702MLFS: { length: 2.13, mass: 0.131 },
      NJX702MHFS: { length: 2.13, mass: 0.133 },
      NJX802MLFS: { length: 2.44, mass: 0.141 },
      NJX802MHFS: { length: 2.44, mass: 0.157 },
      NJX802HFS: { length: 2.44, mass: 0.165 },
      NJX902MLFS: { length: 2.74, mass: 0.178 },
    },
  };

  /** The band of each free dimension, by kind; an axe and a handspike have no drawn shaft diameter, a broom, a mop, a shovel, a fishing rod and a field gun's implements no head of their own sizes. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    sling: Throwers.BANDS.sling,
    atlatl: Throwers.BANDS.atlatl,
    spongeRammer: FIELD_IMPLEMENTS.BANDS.spongeRammer,
    worm: FIELD_IMPLEMENTS.BANDS.worm,
    trailHandspike: FIELD_IMPLEMENTS.BANDS.trailHandspike,
    forestAxe: ForestAxe.BANDS,
    fishingRod: {
      shaftDiameter: ArchetypeBand.metres(
        0.032,
        0.038,
        "no rod grip diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a rod's grip",
        true,
      ),
    },
    broom: {
      length: ArchetypeBand.metres(
        60 * ArchetypeUnits.INCH,
        60 * ArchetypeUnits.INCH + 0.08,
        `${HANDLES}; the head adds 8 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(
        (15 / 16) * ArchetypeUnits.INCH,
        ArchetypeUnits.INCH,
        HANDLES,
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    mop: {
      length: ArchetypeBand.metres(
        54 * ArchetypeUnits.INCH,
        54 * ArchetypeUnits.INCH + 0.03,
        `${HANDLES}; the head adds 3 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(
        (15 / 16) * ArchetypeUnits.INCH,
        ArchetypeUnits.INCH,
        HANDLES,
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    shovel: {
      length: ArchetypeBand.metres(
        41.5 * ArchetypeUnits.INCH,
        46 * ArchetypeUnits.INCH,
        SHOVEL,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(
        0.032,
        0.038,
        "no shovel shaft diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        4.5 * ArchetypeUnits.POUND,
        5.6 * ArchetypeUnits.POUND,
        SHOVEL,
        true,
      ),
    },
  };
}
