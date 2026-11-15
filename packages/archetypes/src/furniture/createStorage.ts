import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The UK furniture schedule. */
const ADM: string =
  "Approved Document M Volume 1, Appendix D furniture schedule (https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf)";

/** The height band operable parts must lie in. */
const REACH: string =
  "2010 ADA Standards 308.2.1, operable parts 15 to 48 in above the floor (https://www.access-board.gov/ada/chapter/ch03/)";

/** How far a pull stands off a front and how thick its bar is, metres: picture and grip size, not read at a source. */
const PULL: number = 0.012;

/**
 * A storage cabinet: a wardrobe with two hinged doors, or a chest of three drawers.
 *
 * The cabinet stands on the floor at the origin with its front toward `+Z`. Its doors and drawers are parts on their articulations: a wardrobe door turns out about its outer edge, a drawer slides out toward `+Z` with the box behind its front, and each carries its pull. The `push` face on the `+X` side is where the cabinet is pushed when it is moved.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cabinet.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, what moves and where the cabinet is pushed.
 * @evidence contracts/development/implementation.md#principled-implementation A carcass box with door parts bound to `hinge` affordances, or drawer fronts with the boxes behind them bound to `slider` affordances; each pull is a `handle` that rides its articulation, and each door's hinge axis points so that a positive travel swings the door out toward `+Z`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the carcass, then the doors or the drawers with their pulls.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carcass is one solid box, so a drawer's box is a solid block hidden inside it at rest, without runners or a hollow; a wardrobe's inside is not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most ten parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStorage(
  params: createStorage.IParams,
  seed?: number | string,
): Archetype<createStorage.Affordance, createStorage.Dimension> {
  const kind: createStorage.Kind = ArchetypeDraw.choice(
    "storage",
    "kind",
    params.kind,
    createStorage.KINDS,
  );
  const d: Partial<Record<createStorage.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "storage",
      createStorage.BANDS[kind],
      seed,
      params,
      createStorage.BANDS,
    );
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.depth!;
  const builder: ArchetypeBuilder<
    createStorage.Affordance,
    createStorage.Dimension
  > = new ArchetypeBuilder({
    archetype: "storage",
    id: params.id,
    name: kind === "wardrobe" ? "wardrobe" : "chest of drawers",
    dimensions: d,
  });
  const panel: number = 0.02;
  const face: number = depth / 2;
  builder.box(
    "carcass",
    Vector3.create(width, height, depth - panel),
    Vector3.create(0, height / 2, -panel / 2),
    { color: "#9b7a55", density: 0.3 },
  );
  builder.affordance({
    id: "push",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.create(width / 2, height / 2, 0),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    width: depth,
    depth: height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width,
    depth,
  });

  if (kind === "wardrobe") {
    // Two doors meeting at the middle, each hinged on its outer edge and pulled near the meeting edge.
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const pull: number = d.pullHeight!;
      builder.box(
        `door-${side}`,
        Vector3.create(width / 2, height, panel),
        Vector3.create((sign * width) / 4, height / 2, face - panel / 2),
        { color: "#b08a60" },
      );
      builder.rod(
        `pull-${side}`,
        PULL / 2,
        Vector3.create(sign * 0.04, pull - 0.06, face + PULL),
        Vector3.create(sign * 0.04, pull + 0.06, face + PULL),
        { color: "#55595f" },
      );
      builder.affordance({
        id: `${side}Door`,
        kind: "hinge",
        frame: ArchetypeFrame.facing(
          Vector3.create((sign * width) / 2, pull, face),
          Vector3.create(0, sign, 0),
          Vector3.create(-sign, 0, 0),
        ),
        extent: null,
        travel: d.swing!,
        parts: [`door-${side}`, `pull-${side}`],
      });
      builder.affordance({
        id: `${side}Pull`,
        kind: "handle",
        symmetry: "none",
        frame: ArchetypeFrame.facing(
          Vector3.create(sign * 0.04, pull, face + PULL),
          Vector3.create(0, 0, 1),
          Vector3.create(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: PULL,
        length: 0.12,
        rides: `${side}Door`,
      });
    }
    return builder.build(d.mass!);
  }

  // Three drawers, each a front with its pull and a box behind it, on a slider that runs out along +Z. The box is as long as the longest travel, so a drawn drawer stays in the carcass's mouth.
  const run: number = depth - panel - 0.03;
  for (const index of [1, 2, 3] as const) {
    const y: number = (height * (index - 0.5)) / 3;
    builder.box(
      `box-${index}`,
      Vector3.create(width - 0.06, height / 3 - 0.06, run),
      Vector3.create(0, y, face - panel - run / 2),
      { color: "#c9a77c", density: 0.1 },
    );
    builder.box(
      `front-${index}`,
      Vector3.create(width - 0.02, height / 3 - 0.02, panel),
      Vector3.create(0, y, face - panel / 2),
      { color: "#b08a60" },
    );
    builder.rod(
      `pull-${index}`,
      PULL / 2,
      Vector3.create(-0.06, y, face + PULL),
      Vector3.create(0.06, y, face + PULL),
      { color: "#55595f" },
    );
    builder.affordance({
      id: `drawer${index}`,
      kind: "slider",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, y, face + PULL),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      travel: d.travel!,
      parts: [`front-${index}`, `pull-${index}`, `box-${index}`],
    });
    builder.affordance({
      id: `pull${index}`,
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, y, face + PULL),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: PULL,
      length: 0.12,
      rides: `drawer${index}`,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createStorage}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pulls' heights and the travel an opening act reads, and the face a push meets (#3370, #3371).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A slider's `+X` is its travel and a grip's `+X` is the bar the hand wraps, which differ on a drawer, so the slide and the pull are two affordances and neither frame is bent to serve both.
 */
export namespace createStorage {
  /** The kinds of cabinet. */
  export type Kind = "wardrobe" | "chest";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["wardrobe", "chest"];

  /**
   * The affordance ids:
   *
   * - `push`: the `+X` side face, pushed to move the cabinet.
   * - `top`: the upper face.
   * - `leftDoor`, `rightDoor`: a wardrobe's door hinges on `+X` and `-X`.
   * - `leftPull`, `rightPull`: the doors' pulls, each riding its hinge.
   * - `drawer1`, `drawer2`, `drawer3`: a chest's drawers from the bottom up, each a slider running out along `+Z`.
   * - `pull1`, `pull2`, `pull3`: the drawers' pulls, each riding its slider.
   */
  export type Affordance =
    | "push"
    | "top"
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "drawer1"
    | "drawer2"
    | "drawer3"
    | "pull1"
    | "pull2"
    | "pull3";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `+X`, `+Y` and `+Z`.
   * - `pullHeight`: a wardrobe's door pulls above the floor.
   * - `swing`: how far a wardrobe door opens, degrees.
   * - `travel`: how far a drawer slides out.
   * - `mass`: the empty cabinet, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "pullHeight"
    | "swing"
    | "travel"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which cabinet. */
    kind: Kind;

    /** The model's id, unique in a scene; `storage` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    wardrobe: {
      width: ArchetypeBand.metres(
        1.2,
        1.2,
        `${ADM}: double wardrobe 600 x 1200 mm`,
      ),
      depth: ArchetypeBand.metres(
        0.6,
        0.6,
        `${ADM}: double wardrobe 600 x 1200 mm`,
      ),
      height: ArchetypeBand.metres(
        1.8,
        2.1,
        "wardrobe height, not read at a source",
        true,
      ),
      pullHeight: ArchetypeBand.metres(
        0.865,
        1.22,
        `${REACH}; the upper part of the range, shared with door hardware (404.2.7)`,
      ),
      swing: ArchetypeBand.of(
        "degrees",
        95,
        110,
        "Blum CLIP top hinges, 95 and 110 degree opening angles (https://publications.blum.com/2022/catalogue/en/128/, https://www.blum.com/us/en/products/hingesystems/clip-top-blumotion/programme/)",
      ),
      mass: ArchetypeBand.of("kg", 50, 90, ArchetypeBand.TYPICAL_MASS, true),
    },
    chest: {
      width: ArchetypeBand.metres(
        0.75,
        0.75,
        `${ADM}: chest of drawers 450 x 750 mm`,
      ),
      depth: ArchetypeBand.metres(
        0.45,
        0.45,
        `${ADM}: chest of drawers 450 x 750 mm`,
      ),
      height: ArchetypeBand.metres(
        0.75,
        1.1,
        "chest of drawers height, not read at a source",
        true,
      ),
      travel: ArchetypeBand.metres(
        0.3,
        0.4,
        "Accuride 3832E full extension slides, travel equal to slide length (https://res.cloudinary.com/amerhart/image/upload/Documents/Product/3832E Technical Sheet.pdf); the lengths that fit a 450 mm deep chest",
      ),
      mass: ArchetypeBand.of("kg", 25, 50, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
