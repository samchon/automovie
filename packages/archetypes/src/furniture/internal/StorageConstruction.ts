import "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeStorage } from "../AutoMovieArchetypeStorage";
import { StorageConstructionData } from "./StorageConstructionData";


/*
 * How createStorage builds each kind of cabinet: a wardrobe, a chest of
 * drawers or a filing cabinet, a locker and a bookcase, each standing on the
 * floor at the origin with its front toward `+Z`.
 */
export namespace StorageConstruction {
  /*
   * How each drawer cabinet is made: `count`, its drawers, a chest's three and
   * the HON 510's four; `pulls`, whether each drawer front carries a bar pull,
   * which no source read places on the filing cabinet; `color`, its finish.
   */
  export const DRAWERS: Readonly<
    Record<
      "chest" | "filingCabinet",
      Readonly<{ count: number; pulls: boolean; color: string }>
    >
  > = {
    chest: { count: 3, pulls: true, color: StorageConstructionData.WOOD },
    filingCabinet: { count: 4, pulls: false, color: StorageConstructionData.STEEL },
  };

  /*
   * A single-tier locker's hat shelf above the locker's bottom, metres: Penco
   * Vanguard specification, "Hat shelf 48 inches from locker bottom"
   * (https://www.pencoproducts.com/media/3677/vanguard-snapshot-specs_jan2019.pdf).
   */
  export const LOCKER_SHELF: number = 48 * AutoMovieArchetypeUnits.INCH;

  /*
   * A bookcase's shelves above its bottom, as the BILLY's one fixed and four
   * adjustable.
   */
  export const SHELVES: number = 5;

  /*
   * The construction sizes no source read gives, metres, each an estimate:
   * `panel`, a door's, front's or wall's thickness; `pull`, how far a pull
   * stands off a front and how thick its bar is; `grip`, a pull's length;
   * `plinth`, a bookcase's base board under its lowest shelf.
   */
  export const ESTIMATES: Readonly<{
    panel: number;
    pull: number;
    grip: number;
    plinth: number;
  }> = { panel: 0.02, pull: 0.012, grip: 0.12, plinth: 0.12 };

  /*
   * The `push` face on the `+X` side, where a cabinet is pushed when it is
   * moved, and its `top`.
   * Parameter builder: The builder to fill.
   * Parameter width: The cabinet along `X`, metres.
   * Parameter height: Along `Y`, metres.
   * Parameter depth: Along `Z`, metres.
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
      frame: AutoMovieArchetypeFrame.facing(
        StorageConstructionData.v(width / 2, height / 2, 0),
        StorageConstructionData.v(1, 0, 0),
        StorageConstructionData.v(0, 0, 1),
      ),
      extent: null,
      width: depth,
      depth: height,
    });
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(StorageConstructionData.v(0, height, 0)),
      extent: null,
      width,
      depth,
    });
  }

  /*
   * A wardrobe: a carcass box and two doors meeting at the middle, each hinged
   * on its outer edge and pulled near the meeting edge; a positive travel
   * swings a door out toward `+Z`.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
      StorageConstructionData.v(width, height, depth - E.panel),
      StorageConstructionData.v(0, height / 2, -E.panel / 2),
      { color: StorageConstructionData.WOOD, density: 0.3 },
    );
    faces(builder, width, height, depth);
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      builder.box(
        `door-${side}`,
        StorageConstructionData.v(width / 2, height, E.panel),
        StorageConstructionData.v((sign * width) / 4, height / 2, face - E.panel / 2),
        { color: FRONT },
      );
      builder.rod(
        `pull-${side}`,
        E.pull / 2,
        StorageConstructionData.v(sign * 0.04, pull - E.grip / 2, face + E.pull),
        StorageConstructionData.v(sign * 0.04, pull + E.grip / 2, face + E.pull),
        { color: HARDWARE },
      );
      builder.affordance({
        id: `${side}Door`,
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(
          StorageConstructionData.v((sign * width) / 2, pull, face),
          StorageConstructionData.v(0, sign, 0),
          StorageConstructionData.v(-sign, 0, 0),
        ),
        extent: null,
        travel: d.swing!,
        parts: [`door-${side}`, `pull-${side}`],
      });
      builder.affordance({
        id: `${side}Pull`,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          StorageConstructionData.v(sign * 0.04, pull, face + E.pull),
          StorageConstructionData.v(0, 0, 1),
          StorageConstructionData.v(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: E.pull,
        length: E.grip,
        rides: `${side}Door`,
      });
    }
  }

  /*
   * A chest of drawers or a filing cabinet: a carcass box and a stack of
   * drawers, each a front, its pull where the cabinet has them, and a box
   * behind it on a slider that runs out along `+Z`, numbered from the bottom.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
   * Parameter make: The cabinet's drawer count, pulls and finish.
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
      StorageConstructionData.v(width, height, depth - E.panel),
      StorageConstructionData.v(0, height / 2, -E.panel / 2),
      { color: make.color, density: 0.3 },
    );
    faces(builder, width, height, depth);
    const run: number = depth - E.panel - 0.03;
    for (let index: number = 1; index <= count; index++) {
      const y: number = (height * (index - 0.5)) / count;
      const front: number = make.pulls ? face + E.pull : face;
      builder.box(
        `box-${index}`,
        StorageConstructionData.v(width - 0.06, height / count - 0.06, run),
        StorageConstructionData.v(0, y, face - E.panel - run / 2),
        { color: "#c9a77c", density: 0.1 },
      );
      builder.box(
        `front-${index}`,
        StorageConstructionData.v(width - 0.02, height / count - 0.02, E.panel),
        StorageConstructionData.v(0, y, face - E.panel / 2),
        { color: make.color === StorageConstructionData.WOOD ? FRONT : make.color },
      );
      if (make.pulls)
        builder.rod(
          `pull-${index}`,
          E.pull / 2,
          StorageConstructionData.v(-E.grip / 2, y, face + E.pull),
          StorageConstructionData.v(E.grip / 2, y, face + E.pull),
          { color: HARDWARE },
        );
      builder.affordance({
        id: `drawer${index}`,
        kind: "slider",
        frame: AutoMovieArchetypeFrame.facing(
          StorageConstructionData.v(0, y, front),
          StorageConstructionData.v(0, 1, 0),
          StorageConstructionData.v(0, 0, 1),
        ),
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
          frame: AutoMovieArchetypeFrame.facing(
            StorageConstructionData.v(0, y, front),
            StorageConstructionData.v(0, 0, 1),
            StorageConstructionData.v(1, 0, 0),
          ),
          extent: null,
          grip: "power",
          aperture: E.pull,
          length: E.grip,
          rides: `drawer${index}`,
        });
    }
  }

  /*
   * A single-tier steel locker on its legs: a hollow body of back, sides, roof
   * and bottom with its hat shelf, closed by a door hung on its `-X` edge.
   *
   * `door` is the door's hinge; it states no travel, since no source read gives
   * a locker door's opening, so the door stays shut. `shelf1` is the hat shelf,
   * a `stack-top` 48 in above the locker's bottom. No handle is declared, since
   * no source read places the recessed handle.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
        StorageConstructionData.v(0.03, legs, 0.03),
        StorageConstructionData.v(sx * (width / 2 - 0.015), legs / 2, sz * (depth / 2 - 0.015)),
        { color: StorageConstructionData.STEEL, surface: "steel" },
      );
    for (const [id, x] of [
      ["side-left", width / 2 - t / 2],
      ["side-right", -width / 2 + t / 2],
    ] as const)
      builder.box(id, StorageConstructionData.v(t, top - legs, body), StorageConstructionData.v(x, mid, back + body / 2), {
        color: StorageConstructionData.STEEL,
        surface: "steel",
      });
    builder.box(
      "back",
      StorageConstructionData.v(width - 2 * t, top - legs, t),
      StorageConstructionData.v(0, mid, back + t / 2),
      { color: StorageConstructionData.STEEL, surface: "steel" },
    );
    for (const [id, y] of [
      ["bottom", legs + t / 2],
      ["roof", top - t / 2],
    ] as const)
      builder.box(
        id,
        StorageConstructionData.v(width - 2 * t, t, body - t),
        StorageConstructionData.v(0, y, back + t + (body - t) / 2),
        { color: StorageConstructionData.STEEL, surface: "steel" },
      );
    const shelf: number = legs + LOCKER_SHELF;
    const inside: number = back + t + (body - t) / 2;
    builder.box(
      "shelf",
      StorageConstructionData.v(width - 2 * t, t, body - t),
      StorageConstructionData.v(0, shelf - t / 2, inside),
      { color: StorageConstructionData.STEEL, surface: "steel" },
    );
    builder.affordance({
      id: "shelf1",
      kind: "stack-top",
      frame: AutoMovieArchetypeFrame.upright(StorageConstructionData.v(0, shelf, inside)),
      extent: rectangle(width - 2 * t, body - t),
    });
    const face: number = back + depth;
    builder.box("door", StorageConstructionData.v(width, top - legs, t), StorageConstructionData.v(0, mid, face - t / 2), {
      color: "#a3acb4",
      surface: "steel",
    });
    builder.affordance({
      id: "door",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        StorageConstructionData.v(-width / 2, mid, face),
        StorageConstructionData.v(0, -1, 0),
        StorageConstructionData.v(1, 0, 0),
      ),
      extent: null,
      parts: ["door"],
    });
    faces(builder, width, top, depth);
  }

  /*
   * An open bookcase: sides, roof and back round a hollow, a plinth at its
   * foot, and its shelves at even steps of its height, numbered from the
   * bottom, each a `stack-top`.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
      builder.box(id, StorageConstructionData.v(t, height, depth), StorageConstructionData.v(x, height / 2, 0), {
        color: LAMINATE,
      });
    builder.box(
      "back",
      StorageConstructionData.v(inner, height, t),
      StorageConstructionData.v(0, height / 2, -depth / 2 + t / 2),
      { color: LAMINATE },
    );
    builder.box("plinth", StorageConstructionData.v(inner, plinth, shelfDepth), StorageConstructionData.v(0, plinth / 2, z), {
      color: LAMINATE,
    });
    builder.box("roof", StorageConstructionData.v(inner, t, shelfDepth), StorageConstructionData.v(0, height - t / 2, z), {
      color: LAMINATE,
    });
    for (let k: number = 1; k <= SHELVES; k++) {
      const y: number = (height * k) / (SHELVES + 1);
      builder.box(`shelf-${k}`, StorageConstructionData.v(inner, t, shelfDepth), StorageConstructionData.v(0, y - t / 2, z), {
        color: LAMINATE,
      });
      builder.affordance({
        id: `shelf${k}`,
        kind: "stack-top",
        frame: AutoMovieArchetypeFrame.upright(StorageConstructionData.v(0, y, z)),
        extent: rectangle(inner, shelfDepth),
      });
    }
    faces(builder, width, height, depth);
  }
}

/*
 * A wooden front.
 */
const FRONT: string = "#b08a60";

/*
 * Dark metal hardware.
 */
const HARDWARE: string = "#55595f";

/*
 * White laminate.
 */
const LAMINATE: string = "#efece6";

/*
 * A rectangle's corners in a stack-top's plane, centred.
 * Parameter width: Along `X`, metres.
 * Parameter depth: Along `Z`, metres.
 * Returns: Four corners.
 */
function rectangle(width: number, depth: number): IAutoMovieVector3[] {
  return [
    StorageConstructionData.v(-width / 2, 0, -depth / 2),
    StorageConstructionData.v(width / 2, 0, -depth / 2),
    StorageConstructionData.v(width / 2, 0, depth / 2),
    StorageConstructionData.v(-width / 2, 0, depth / 2),
  ];
}

/*
 * The builder every construction fills.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeStorage.Affordance,
  AutoMovieArchetypeStorage.Dimension
>;

/*
 * The drawn dimensions.
 */
type Drawn = Partial<Record<AutoMovieArchetypeStorage.Dimension, number>>;
