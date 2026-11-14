import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createStorage } from "./createStorage";

/** The builder every construction fills. */
type Builder = ArchetypeBuilder<
  createStorage.Affordance,
  createStorage.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createStorage.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** Painted steel. */
const STEEL: string = "#8f979e";

/** A wooden carcass. */
const WOOD: string = "#9b7a55";

/** A wooden front. */
const FRONT: string = "#b08a60";

/** Dark metal hardware. */
const HARDWARE: string = "#55595f";

/** White laminate. */
const LAMINATE: string = "#efece6";

/**
 * A rectangle's corners in a stack-top's plane, centred.
 *
 * @param width Along `X`, metres.
 * @param depth Along `Z`, metres.
 * @returns Four corners.
 */
function rectangle(width: number, depth: number): IAutoMovieVector3[] {
  return [
    v(-width / 2, 0, -depth / 2),
    v(width / 2, 0, -depth / 2),
    v(width / 2, 0, depth / 2),
    v(-width / 2, 0, depth / 2),
  ];
}

/**
 * How {@link createStorage} builds each kind of cabinet: a wardrobe, a chest of drawers or a filing cabinet, a locker and a bookcase, each standing on the floor at the origin with its front toward `+Z`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is built and the shared frame.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions; doors and drawers are parts on their articulations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The constructions, the drawer cabinets' make-up and the estimates they read; read only by `createStorage`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A slider's `+X` is its travel and a grip's `+X` is the bar the hand wraps, which differ on a drawer, so the slide and the pull are two affordances; a pull no source places is left out rather than placed by guess.
 */
export namespace StorageConstruction {
  /**
   * How each drawer cabinet is made: `count`, its drawers, a chest's three and the HON 510's four; `pulls`, whether each drawer front carries a bar pull, which no source read places on the filing cabinet; `color`, its finish.
   */
  export const DRAWERS: Readonly<
    Record<
      "chest" | "filingCabinet",
      Readonly<{ count: number; pulls: boolean; color: string }>
    >
  > = {
    chest: { count: 3, pulls: true, color: WOOD },
    filingCabinet: { count: 4, pulls: false, color: STEEL },
  };

  /** A bookcase's shelves above its bottom, as the BILLY's one fixed and four adjustable. */
  export const SHELVES: number = 5;

  /**
   * The construction sizes no source read gives, metres, each an estimate: `panel`, a door's, front's or wall's thickness; `pull`, how far a pull stands off a front and how thick its bar is; `grip`, a pull's length; `plinth`, a bookcase's base board under its lowest shelf.
   */
  export const ESTIMATES: Readonly<{
    panel: number;
    pull: number;
    grip: number;
    plinth: number;
  }> = { panel: 0.02, pull: 0.012, grip: 0.12, plinth: 0.12 };

  /**
   * The `push` face on the `+X` side, where a cabinet is pushed when it is moved, and its `top`.
   *
   * @param builder The builder to fill.
   * @param width The cabinet along `X`, metres.
   * @param height Along `Y`, metres.
   * @param depth Along `Z`, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two contacts.
   * @evidence contracts/development/implementation.md#principled-implementation Two surface frames on the cabinet's faces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two affordances.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every kind lays its outer faces through this one function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function faces(
    builder: Builder,
    width: number,
    height: number,
    depth: number,
  ): void {
    builder.affordance({
      id: "push",
      kind: "surface",
      frame: ArchetypeFrame.facing(
        v(width / 2, height / 2, 0),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      width: depth,
      depth: height,
    });
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
      width,
      depth,
    });
  }

  /**
   * A wardrobe: a carcass box and two doors meeting at the middle, each hinged on its outer edge and pulled near the meeting edge; a positive travel swings a door out toward `+Z`.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and which way the doors swing.
   * @evidence contracts/development/implementation.md#principled-implementation Door parts bound to `hinge` affordances on the outer edges, each pull a `handle` riding its hinge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Carcass, then each door with its pull and their two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carcass is one solid box; the inside is not modelled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one cabinet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function wardrobe(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const width: number = d.width!;
    const height: number = d.height!;
    const depth: number = d.depth!;
    const face: number = depth / 2;
    const pull: number = d.pullHeight!;
    builder.box(
      "carcass",
      v(width, height, depth - E.panel),
      v(0, height / 2, -E.panel / 2),
      { color: WOOD, density: 0.3 },
    );
    faces(builder, width, height, depth);
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      builder.box(
        `door-${side}`,
        v(width / 2, height, E.panel),
        v((sign * width) / 4, height / 2, face - E.panel / 2),
        { color: FRONT },
      );
      builder.rod(
        `pull-${side}`,
        E.pull / 2,
        v(sign * 0.04, pull - E.grip / 2, face + E.pull),
        v(sign * 0.04, pull + E.grip / 2, face + E.pull),
        { color: HARDWARE },
      );
      builder.affordance({
        id: `${side}Door`,
        kind: "hinge",
        frame: ArchetypeFrame.facing(
          v((sign * width) / 2, pull, face),
          v(0, sign, 0),
          v(-sign, 0, 0),
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
          v(sign * 0.04, pull, face + E.pull),
          v(0, 0, 1),
          v(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: E.pull,
        length: E.grip,
        rides: `${side}Door`,
      });
    }
  }

  /**
   * A chest of drawers or a filing cabinet: a carcass box and a stack of drawers, each a front, its pull where the cabinet has them, and a box behind it on a slider that runs out along `+Z`, numbered from the bottom.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   * @param make The cabinet's drawer count, pulls and finish.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, the drawers' numbering and direction.
   * @evidence contracts/development/implementation.md#principled-implementation Equal drawers up the carcass's height, each box as long as the carcass's inside so a drawn drawer stays in its mouth, its slider's travel the drawn one and its frame on the front's middle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Carcass, then each drawer with its contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carcass is one solid box, so a drawer's box hides in it at rest, without runners or a hollow.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts per drawer.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one cabinet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function drawers(
    builder: Builder,
    d: Drawn,
    make: (typeof DRAWERS)["chest"],
  ): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const width: number = d.width!;
    const height: number = d.height!;
    const depth: number = d.depth!;
    const face: number = depth / 2;
    const count: number = make.count;
    builder.box(
      "carcass",
      v(width, height, depth - E.panel),
      v(0, height / 2, -E.panel / 2),
      { color: make.color, density: 0.3 },
    );
    faces(builder, width, height, depth);
    const run: number = depth - E.panel - 0.03;
    for (let index: number = 1; index <= count; index++) {
      const y: number = (height * (index - 0.5)) / count;
      const front: number = make.pulls ? face + E.pull : face;
      builder.box(
        `box-${index}`,
        v(width - 0.06, height / count - 0.06, run),
        v(0, y, face - E.panel - run / 2),
        { color: "#c9a77c", density: 0.1 },
      );
      builder.box(
        `front-${index}`,
        v(width - 0.02, height / count - 0.02, E.panel),
        v(0, y, face - E.panel / 2),
        { color: make.color === WOOD ? FRONT : make.color },
      );
      if (make.pulls)
        builder.rod(
          `pull-${index}`,
          E.pull / 2,
          v(-E.grip / 2, y, face + E.pull),
          v(E.grip / 2, y, face + E.pull),
          { color: HARDWARE },
        );
      builder.affordance({
        id: `drawer${index}`,
        kind: "slider",
        frame: ArchetypeFrame.facing(v(0, y, front), v(0, 1, 0), v(0, 0, 1)),
        extent: null,
        travel: d.travel!,
        parts: make.pulls
          ? [`front-${index}`, `pull-${index}`, `box-${index}`]
          : [`front-${index}`, `box-${index}`],
      });
      if (make.pulls)
        builder.affordance({
          id: `pull${index}`,
          kind: "handle",
          symmetry: "none",
          frame: ArchetypeFrame.facing(v(0, y, front), v(0, 0, 1), v(1, 0, 0)),
          extent: null,
          grip: "power",
          aperture: E.pull,
          length: E.grip,
          rides: `drawer${index}`,
        });
    }
  }

  /**
   * A single-tier steel locker on its legs: a hollow body of back, sides, roof and bottom, closed by a door hung on its `-X` edge.
   *
   * `door` is the door's hinge; it states no travel, since no source read gives a locker door's opening, so the door stays shut. No handle is declared, since no source read places the recessed handle.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, its one contact and why the door does not open.
   * @evidence contracts/development/implementation.md#principled-implementation The maker's width, depth and height above its 6 in legs; the hinge on the door's `-X` edge at half its height, its axis down so a positive travel would swing the door out toward `+Z`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Legs, walls, door, then the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No louvres, shelf, hooks, handle or lock; the walls' and legs' sections are construction estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Ten parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one cabinet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function locker(builder: Builder, d: Drawn): void {
    const t: number = ESTIMATES.panel;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const legs: number = d.legs!;
    const top: number = legs + d.height!;
    const mid: number = (top + legs) / 2;
    const body: number = depth - t;
    const back: number = -depth / 2;
    for (const [id, sx, sz] of [
      ["leg-1", 1, 1],
      ["leg-2", -1, 1],
      ["leg-3", 1, -1],
      ["leg-4", -1, -1],
    ] as const)
      builder.box(
        id,
        v(0.03, legs, 0.03),
        v(sx * (width / 2 - 0.015), legs / 2, sz * (depth / 2 - 0.015)),
        { color: STEEL },
      );
    for (const [id, x] of [
      ["side-left", width / 2 - t / 2],
      ["side-right", -width / 2 + t / 2],
    ] as const)
      builder.box(id, v(t, top - legs, body), v(x, mid, back + body / 2), {
        color: STEEL,
      });
    builder.box(
      "back",
      v(width - 2 * t, top - legs, t),
      v(0, mid, back + t / 2),
      { color: STEEL },
    );
    for (const [id, y] of [
      ["bottom", legs + t / 2],
      ["roof", top - t / 2],
    ] as const)
      builder.box(
        id,
        v(width - 2 * t, t, body - t),
        v(0, y, back + t + (body - t) / 2),
        { color: STEEL },
      );
    const face: number = back + depth;
    builder.box("door", v(width, top - legs, t), v(0, mid, face - t / 2), {
      color: "#a3acb4",
    });
    builder.affordance({
      id: "door",
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        v(-width / 2, mid, face),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      parts: ["door"],
    });
    faces(builder, width, top, depth);
  }

  /**
   * An open bookcase: sides, roof and back round a hollow, a plinth at its foot, and its shelves at even steps of its height, numbered from the bottom, each a `stack-top`.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and the shelves' numbering.
   * @evidence contracts/development/implementation.md#principled-implementation The maker's size and shelf count, the shelves' tops dividing the height into equal steps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Carcass panels, then each shelf with its contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The panels' and the plinth's sizes are construction estimates; the shelves stand at even steps, where the maker lets four of them move.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Ten parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one cabinet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bookcase(builder: Builder, d: Drawn): void {
    const t: number = ESTIMATES.panel;
    const plinth: number = ESTIMATES.plinth;
    const width: number = d.width!;
    const height: number = d.height!;
    const depth: number = d.depth!;
    const inner: number = width - 2 * t;
    const shelfDepth: number = depth - t;
    const z: number = t / 2;
    for (const [id, x] of [
      ["side-left", width / 2 - t / 2],
      ["side-right", -width / 2 + t / 2],
    ] as const)
      builder.box(id, v(t, height, depth), v(x, height / 2, 0), {
        color: LAMINATE,
      });
    builder.box(
      "back",
      v(inner, height, t),
      v(0, height / 2, -depth / 2 + t / 2),
      { color: LAMINATE },
    );
    builder.box("plinth", v(inner, plinth, shelfDepth), v(0, plinth / 2, z), {
      color: LAMINATE,
    });
    builder.box("roof", v(inner, t, shelfDepth), v(0, height - t / 2, z), {
      color: LAMINATE,
    });
    for (let k: number = 1; k <= SHELVES; k++) {
      const y: number = (height * k) / (SHELVES + 1);
      builder.box(`shelf-${k}`, v(inner, t, shelfDepth), v(0, y - t / 2, z), {
        color: LAMINATE,
      });
      builder.affordance({
        id: `shelf${k}`,
        kind: "stack-top",
        frame: ArchetypeFrame.upright(v(0, y, z)),
        extent: rectangle(inner, shelfDepth),
      });
    }
    faces(builder, width, height, depth);
  }
}
