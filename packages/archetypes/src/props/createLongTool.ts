import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Broom and mop handles from a maker's listings seen in search results. */
const HANDLES: string =
  "Rubbermaid Commercial broom handle, 60 in by 15/16 in, and mop handles, 54 in by 1 in, listings seen only in search results";

/** D-handle shovels from retailer listings seen in search results. */
const SHOVEL: string =
  "Bully Tools 82510, 41.5 in and 4.5 lb, and Fiskars D-handle shovels, 44.75 to 46 in and 4.85 to 5.6 lb, retailer listings seen only in search results";

/** Two splitting axes, read. */
const AXE: string =
  "Husqvarna Large Splitting Axe, 75 cm, head 1.5 kg, 2.085 kg complete (https://www.husqvarna.com/uk/axes/large-splitting-axe/); Gränsfors Bruk Large Splitting Axe, 70 to 80 cm, 2.3 kg (https://www.gransforsbruk.com/en/p/large-splitting-axe)";

/** A pick mattock, read. */
const PICK: string =
  "Truper TP-5M pick mattock, head 5 lb (2.3 kg), handle 36 in (90 cm), blade 110 mm (https://www.truper.com/ficha_tecnica/Talacho-pico-5-lbs-mango-de-madera-36.html?code=18647); the handle's own mass is not given";

/** A sledgehammer, read. */
const SLEDGE: string =
  "Truper MD-10FX, head 10 lb (4.5 kg), handle 36 in (90 cm) (https://www.truper.com/ficha_tecnica/Marro-10-lb-mango-fibra-de-vidrio-11142.html?code=11135); Estwing ESH-1036W, 4.5 kg on a 900 mm shaft (https://www.drapertools.com/product/31316/estwing-esh-1036W-hickory-shaft-sledge-hammer-4-5kg-10lb/); the handle's own mass is not given";

/** A maker's rakes, read. */
const RAKE: string =
  "Bully Tools 16 in bow rake, 58 in, 3.5 lb (https://www.bullytools.com/products/lawn-and-garden/rakes/16-bow-rake-with-fiberglass-handle/), and leaf rake, 68 in with a 24 or 30 in head, 3 to 3.25 lb (https://www.bullytools.com/products/lawn-and-garden/rakes/lawn-leaf-rake-with-fiberglass-handle/)";

/** Two hay forks, read. */
const FORK: string =
  "Truper BPJ-4 fork, tines 32 cm, handle 122 cm (https://www.truper.com/ficha_tecnica/controllers/index.php?codigo=11003); Spear & Jackson hay fork, tines 300 mm, handle 1250 mm (https://www.spear-and-jackson.com/products/hand-contractor-tools/agricultural-tools/manure-hay-forks/spear-jackson-hay-fork)";

/** A maker's hoe, read. */
const HOE: string =
  "Bully Tools 92353 garden hoe, 58 in, head 6.25 in wide, 3.25 lb (https://www.bullytools.com/products/lawn-and-garden/hoes/garden-hoe-with-fiberglass-long-handle/)";

/** A maker's spinning rods, read. */
const ROD: string =
  "Daiwa Ninja X spin rods, 7 ft 0 in (213 cm), 131 and 133 g (https://www.daiwa.com/scandinavia/product/n753a5g)";

/** The power grip band applied to a shaft no maker sizes. */
const GRIP_BAND: string =
  "no shaft diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)";

/**
 * A two-hand tool used standing: a broom, a mop, a shovel, a splitting axe, a pick mattock, a sledgehammer, a rake, a hay fork or a hoe; or a fishing rod.
 *
 * The tool stands upright along `+Y` on its head at the origin, its shaft rising to its top end; a fishing rod stands on its butt with its tip up. Both hands hold the `shaft`, each at a site along it; a shovel also has a D grip at its top. The `face` is the head's working side: a broom's, a mop's, a shovel's, a rake's, a fork's and a hoe's facing down onto the floor or the ground; an axe's edge, a sledgehammer's face and a mattock's blade facing `+Z`, the way the swing goes. A fishing rod's one hand takes its `grip` at the butt, and its `tip` is the rod's end, `+Y` along it. Chopping and digging with two hands have no motion law yet; these tools are built for holding, carrying and the swing rows that exist.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tool.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tool stands, where the hands go, which way each head works, and what has no law.
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod with a head box; the shaft is one `bar` whose sites the two hands share, so the hand spacing is the holding act's choice. A swung head's steel is denser than the shaft by the named factor, which puts the balance toward the head, and a sledgehammer's or a mattock's mass is its head's read mass, its handle's unread mass left out.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the head and its face, the shaft, then a shovel's grip or a rod's grip and tip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bristles, strands and tines are one block; blades are flat plates; a fishing rod's taper, guides and reel seat are not modelled. Head sizes no source gives are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLongTool(
  params: createLongTool.IParams,
  seed?: number | string,
): Archetype<createLongTool.Affordance, createLongTool.Dimension> {
  const kind: createLongTool.Kind = ArchetypeDraw.choice(
    "longTool",
    "kind",
    params.kind,
    createLongTool.KINDS,
  );
  const d: Partial<Record<createLongTool.Dimension, number>> =
    ArchetypeDraw.dimensions<createLongTool.Dimension>(
      "longTool",
      createLongTool.BANDS[kind],
      seed,
      params,
      createLongTool.BANDS,
    );
  const length: number = d.length!;
  const radius: number = d.shaftDiameter! / 2;
  const builder: ArchetypeBuilder<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = new ArchetypeBuilder({
    archetype: "longTool",
    id: params.id,
    name: kind === "fishingRod" ? "fishing rod" : kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;

  if (kind === "fishingRod") {
    // A rod on its butt: the grip a hand takes and the tip it casts with.
    const grip: number = createLongTool.ROD_GRIP;
    builder.rod("rod", radius, v(0, 0, 0), v(0, length, 0), {
      color: "#2c2f33",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, grip / 2, 0), v(0, 0, -1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: grip,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // The head at the origin: a block, a pad, a plate standing on its edge, or a swung steel head.
  const head: createLongTool.IHead = createLongTool.HEADS[kind];
  const wide: number = d.headWidth ?? head.width;
  const swung: boolean =
    kind === "axe" || kind === "pickaxe" || kind === "sledgehammer";
  builder.box("head", v(wide, head.height, head.depth), v(0, head.height / 2, 0), {
    color: head.steel ? "#6c7076" : "#c9a24a",
    density: head.steel ? createLongTool.STEEL : 1,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: swung
      ? ArchetypeFrame.facing(
          v(0, head.height / 2, head.depth / 2),
          v(0, 0, 1),
          v(1, 0, 0),
        )
      : ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: wide,
  });

  const top: number = kind === "shovel" ? length - 0.1 : length;
  builder.rod("shaft", radius, v(0, head.height, 0), v(0, top, 0), {
    color: "#b98d5b",
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, (head.height + top) / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 2 * radius,
    length: top - head.height,
  });

  if (kind === "shovel") {
    // The D grip: a cross bar held from above, joined to the shaft by its yoke.
    builder.rod(
      "grip",
      radius,
      v(-createLongTool.D_GRIP / 2, length - radius, 0),
      v(createLongTool.D_GRIP / 2, length - radius, 0),
      { color: "#b98d5b" },
    );
    builder.box(
      "yoke",
      v(0.12, 0.1 - 2 * radius, 0.01),
      v(0, top + (0.1 - 2 * radius) / 2, 0),
      { color: "#b98d5b", density: 0.2 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.upright(v(0, length - radius, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: createLongTool.D_GRIP,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createLongTool}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions, one cited band per dimension per kind, and each kind's head as one record of its size and whether it is steel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shaft two hands hold, its length, the head's working face and the mass swung (#3369, #3361, #3468's N10); a rod's grip and tip.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The two hands share one bar and its sites instead of two fixed hand places; a head size a page gives is cited on its record, the others are named estimates.
 */
export namespace createLongTool {
  /** The kinds of tool. */
  export type Kind =
    | "broom"
    | "mop"
    | "shovel"
    | "axe"
    | "pickaxe"
    | "sledgehammer"
    | "rake"
    | "pitchfork"
    | "hoe"
    | "fishingRod";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "broom",
    "mop",
    "shovel",
    "axe",
    "pickaxe",
    "sledgehammer",
    "rake",
    "pitchfork",
    "hoe",
    "fishingRod",
  ];

  /**
   * A tool's head as drawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   * @evidence contracts/development/design.md#principled-representation The head's box in metres and whether its steel weighs it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `createLongTool` for each kind's head.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every member is used for every head.
   */
  export interface IHead {
    /** Across `X`, metres; a drawn `headWidth` replaces it. */
    width: number;

    /** Up `Y`, metres. */
    height: number;

    /** Along `Z`, metres. */
    depth: number;

    /** Whether the head is steel, denser than the shaft by `STEEL`. */
    steel: boolean;
  }

  /** Each kind's head: a hoe's 6.25 in and a mattock's 110 mm blade, a rake's drawn width and a fork's 30 to 32 cm tines as read; the shovel's blade, the broom's and the mop's heads and the swung heads' sizes are estimates. */
  export const HEADS: Readonly<Record<Exclude<Kind, "fishingRod">, IHead>> = {
    broom: { width: 0.3, height: 0.08, depth: 0.05, steel: false },
    mop: { width: 0.3, height: 0.03, depth: 0.12, steel: false },
    shovel: { width: 0.22, height: 0.29, depth: 0.004, steel: true },
    axe: { width: 0.03, height: 0.08, depth: 0.2, steel: true },
    pickaxe: { width: 0.04, height: 0.04, depth: 0.11 * 2 + 0.06, steel: true },
    sledgehammer: { width: 0.07, height: 0.07, depth: 0.2, steel: true },
    rake: { width: 0.4, height: 0.08, depth: 0.03, steel: true },
    pitchfork: { width: 0.2, height: 0.31, depth: 0.02, steel: true },
    hoe: { width: 6.25 * 0.0254, height: 5.25 * 0.0254, depth: 0.004, steel: true },
  };

  /** A steel head's density over a wooden or glass-fibre shaft's: about 7850 over 700 kg per cubic metre, handbook figures recalled and not read at a source. */
  export const STEEL: number = 8;

  /** The length of the cross bar of a shovel's D grip, metres, the run one hand holds. An estimate, not read at a source. */
  export const D_GRIP: number = 0.11;

  /** A fishing rod's grip length, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const ROD_GRIP: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft, a bar both hands hold at sites along it.
   * - `grip`: a shovel's D grip at its top, held from above; a fishing rod's grip, taken from `-Z`.
   * - `face`: the working side of the head: down onto the ground, or `+Z` on a swung head.
   * - `tip`: a fishing rod's end, `+Y` along it.
   */
  export type Affordance = "shaft" | "grip" | "face" | "tip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `shaftDiameter`: the shaft the hands wrap.
   * - `headWidth`: a rake's head across `X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "shaftDiameter" | "headWidth" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; `longTool` when absent. */
    id?: string;
  }

  /** The power grip band applied to a shaft. */
  const SHAFT: IArchetypeBand = ArchetypeBand.metres(0.032, 0.038, GRIP_BAND, true);

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    broom: {
      length: ArchetypeBand.metres(
        1.524,
        1.604,
        `${HANDLES}; the head adds 8 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(0.0238, 0.0254, HANDLES, true),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    mop: {
      length: ArchetypeBand.metres(
        1.372,
        1.402,
        `${HANDLES}; the head adds 3 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(0.0238, 0.0254, HANDLES, true),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    shovel: {
      length: ArchetypeBand.metres(1.054, 1.168, SHOVEL, true),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 2.04, 2.54, SHOVEL, true),
    },
    axe: {
      length: ArchetypeBand.metres(0.7, 0.8, AXE),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 2.085, 2.3, AXE),
    },
    pickaxe: {
      length: ArchetypeBand.metres(0.9 + 0.04, 0.9 + 0.04, `${PICK}; the head's estimated 4 cm adds to the handle`, true),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 2.3, 2.3, `${PICK}: the head alone`, true),
    },
    sledgehammer: {
      length: ArchetypeBand.metres(0.9 + 0.07, 0.9 + 0.07, `${SLEDGE}; the head's estimated 7 cm adds to the handle`, true),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 4.5, 4.5, `${SLEDGE}: the head alone`, true),
    },
    rake: {
      length: ArchetypeBand.metres(58 * 0.0254, 68 * 0.0254, RAKE),
      shaftDiameter: SHAFT,
      headWidth: ArchetypeBand.metres(16 * 0.0254, 30 * 0.0254, RAKE),
      mass: ArchetypeBand.of("kg", 3 * 0.4536, 3.5 * 0.4536, RAKE),
    },
    pitchfork: {
      length: ArchetypeBand.metres(1.22 + 0.32, 1.25 + 0.3, FORK),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 1.5, 2.5, ArchetypeBand.TYPICAL_MASS, true),
    },
    hoe: {
      length: ArchetypeBand.metres(58 * 0.0254, 58 * 0.0254, HOE),
      shaftDiameter: SHAFT,
      mass: ArchetypeBand.of("kg", 3.25 * 0.4536, 3.25 * 0.4536, HOE),
    },
    fishingRod: {
      length: ArchetypeBand.metres(2.13, 2.13, ROD),
      shaftDiameter: ArchetypeBand.metres(
        0.02,
        0.03,
        "no rod grip diameter was found; the 20 to 30 mm between the precision band's top and the power band's foot of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.131, 0.133, ROD),
    },
  };
}
