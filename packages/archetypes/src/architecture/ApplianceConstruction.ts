import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createAppliance } from "./createAppliance";

/** The builder every kind's construction fills. */
type Builder = ArchetypeBuilder<
  createAppliance.Affordance,
  createAppliance.Dimension
>;

/** The drawn dimensions of one kind. */
type Drawn = Partial<Record<createAppliance.Dimension, number>>;

/** White enamelled steel. */
const WHITE: string = "#e9eae6";

/** Dark glass and plastic. */
const DARK: string = "#3a3d42";

/** Brushed handles and buttons. */
const METAL: string = "#b9bcc0";

/** The shorthand every construction below uses. */
const v: typeof Vector3.create = Vector3.create;

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
 * A hinge on a door's vertical edge whose positive travel swings the door out toward `+Z`.
 *
 * @param at A point of the hinge line, metres.
 * @param side `+1` for a hinge on the `+X` edge, the door reaching toward `-X`; `-1` for the mirror.
 * @returns The hinge frame, `+Y` along the line and `+X` toward the door.
 */
function sideHinge(at: IAutoMovieVector3, side: 1 | -1): IAutoMovieTransform {
  return ArchetypeFrame.facing(at, v(0, side, 0), v(-side, 0, 0));
}

/**
 * How {@link createAppliance} builds each kind of appliance from its drawn dimensions: the parts and the contacts, one function per kind, the counts the makers give and the sizes no source gives.
 *
 * Every function stands its appliance with its back at the origin's `Z`, centred on `X`, its front toward `+Z`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and the frame every construction shares.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions, one construction per kind of the producer's closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer's four constructions with the counts and estimates they read; kept apart from the producer so each file stays one readable responsibility, and read only by `createAppliance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size a sheet does not give is a named estimate here, not a literal in the arithmetic.
 */
export namespace ApplianceConstruction {
  /** A fridge's shelves, as the maker gives them (Bosch KGN36NL30M, four fridge shelves). */
  export const SHELVES: number = 4;

  /** A cooker's hob zones and their diameters, metres, as the Bosch PKF675FP2E hob gives them (https://bosch-home.com/za/en/mkt-product/PKF675FP2E). */
  export const ZONES: readonly number[] = [0.145, 0.145, 0.18, 0.21];

  /**
   * The sizes no source read gives, metres or degrees, each an estimate:
   *
   * - `wall`: a fridge's wall; `door`: a door's thickness; `handle`: how far a fridge handle stands out from its door; `freezer`: the freezer's share of a fridge-freezer's height; `shelf`: a glass shelf's thickness.
   * - `plinth`, `fascia`: a cooker's plinth and control fascia heights; `panel`: a washing machine's control panel height.
   * - `swing`: a side-hung door's opening, degrees; `drop`: an oven door's, to level; `turn`: a knob's turn, degrees; `press`: a button's press.
   */
  export const ESTIMATES: Readonly<{
    wall: number;
    door: number;
    handle: number;
    freezer: number;
    shelf: number;
    plinth: number;
    fascia: number;
    panel: number;
    swing: number;
    drop: number;
    turn: number;
    press: number;
  }> = {
    wall: 0.04,
    door: 0.05,
    handle: 0.04,
    freezer: 0.35,
    shelf: 0.006,
    plinth: 0.1,
    fascia: 0.1,
    panel: 0.15,
    swing: 110,
    drop: 90,
    turn: 270,
    press: 0.005,
  };

  /**
   * A fridge-freezer: a solid freezer block under a hollow fridge whose four walls and four glass shelves are parts, a door on each, hinged on the `+X` edge, and an upright handle on each near the free edge.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the doors hinge and where the handles are.
   * @evidence contracts/development/implementation.md#principled-implementation The carcass is the maker's depth less the door and the handle's stand-off, so the handles' fronts are the depth with handles the sheet gives; the shelves stand at even steps up the inside, the maker's count of them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Freezer, the fridge's walls, the shelves, then each door with its handle and their two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No door shelves, drawers or seals; the wall, door and shelf thickness, the freezer's share and the door's swing are this namespace's estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fourteen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refrigerator(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const carcass: number = d.depth! - E.door - E.handle;
    const freezer: number = height * E.freezer;
    const face: number = carcass + E.door;
    const inner: number = width - 2 * E.wall;
    const fridge: number = height - freezer;
    builder.box(
      "freezer",
      v(width, freezer, carcass),
      v(0, freezer / 2, carcass / 2),
      { color: WHITE },
    );
    for (const [id, sign] of [
      ["side-left", 1],
      ["side-right", -1],
    ] as const)
      builder.box(
        id,
        v(E.wall, fridge, carcass),
        v((sign * (width - E.wall)) / 2, freezer + fridge / 2, carcass / 2),
        { color: WHITE },
      );
    builder.box(
      "roof",
      v(inner, E.wall, carcass),
      v(0, height - E.wall / 2, carcass / 2),
      { color: WHITE },
    );
    builder.box(
      "back",
      v(inner, fridge - E.wall, E.wall),
      v(0, freezer + (fridge - E.wall) / 2, E.wall / 2),
      { color: WHITE },
    );

    // The shelves stand at even steps up the fridge's inside.
    const shelfDepth: number = carcass - E.wall;
    for (let k: number = 1; k <= SHELVES; k++) {
      const y: number = freezer + ((fridge - E.wall) * k) / (SHELVES + 1);
      builder.box(
        `shelf-${k}`,
        v(inner, E.shelf, shelfDepth),
        v(0, y - E.shelf / 2, E.wall + shelfDepth / 2),
        { color: "#cfe3e8", density: 2.5 },
      );
      builder.affordance({
        id: `shelf${k}`,
        kind: "stack-top",
        frame: ArchetypeFrame.upright(v(0, y, E.wall + shelfDepth / 2)),
        extent: rectangle(inner, shelfDepth),
      });
    }

    // A door on each section and an upright handle near each door's free edge, standing out from the door.
    const radius: number = 0.0125;
    const bar: number = face + E.handle - radius;
    const x: number = -width / 2 + 0.05;
    for (const [door, handle, bottom, top, grip] of [
      ["fridgeDoor", "fridgeHandle", freezer, height, freezer + 0.3],
      ["freezerDoor", "freezerHandle", 0, freezer, freezer - 0.2],
    ] as const) {
      builder.box(
        `${door}-leaf`,
        v(width, top - bottom, E.door),
        v(0, (top + bottom) / 2, carcass + E.door / 2),
        { color: WHITE },
      );
      builder.rod(
        `${handle}-bar`,
        radius,
        v(x, grip - 0.15, bar),
        v(x, grip + 0.15, bar),
        { color: METAL },
      );
      builder.affordance({
        id: door,
        kind: "hinge",
        frame: sideHinge(v(width / 2, (top + bottom) / 2, face), 1),
        extent: null,
        travel: E.swing,
        parts: [`${door}-leaf`, `${handle}-bar`],
      });
      builder.affordance({
        id: handle,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(v(x, grip, bar), v(0, 0, 1), v(0, 1, 0)),
        extent: null,
        grip: "power",
        aperture: 2 * radius,
        length: 0.3,
        rides: door,
      });
    }
  }

  /**
   * A freestanding cooker: a body behind a door on its plinth and a fascia above it, the hob's four zones in the top's quarters, a handle across the door's top and four knobs along the fascia.
   *
   * The zones run front left, front right, back left, back right as one faces the cooker (its `-X` is the viewer's left), and their knobs along the fascia in that order.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and how zones and knobs are ordered.
   * @evidence contracts/development/implementation.md#principled-implementation The body at the maker's width and height; the door between the plinth and the fascia, hinged along its bottom edge on the front so its travel lays it level forward; the zones at the maker's hob diameters.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, fascia, plinth, door and handle with their contacts, then each zone with its knob.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No oven cavity or racks; the plinth and fascia heights, the door's thickness and the knobs' turn are this namespace's estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fourteen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function cooker(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const body: number = depth - E.door;
    builder.box("body", v(width, height, body), v(0, height / 2, body / 2), {
      color: WHITE,
    });
    builder.box(
      "fascia",
      v(width, E.fascia, E.door),
      v(0, height - E.fascia / 2, body + E.door / 2),
      { color: WHITE },
    );
    builder.box(
      "plinth",
      v(width, E.plinth, E.door),
      v(0, E.plinth / 2, body + E.door / 2),
      { color: DARK },
    );
    const door: number = height - E.fascia - E.plinth;
    builder.box(
      "oven-door",
      v(width, door, E.door),
      v(0, E.plinth + door / 2, body + E.door / 2),
      { color: DARK },
    );
    const radius: number = 0.01;
    const bar: number = depth + 0.03;
    const handleY: number = E.plinth + door - 0.05;
    builder.rod(
      "oven-handle",
      radius,
      v(-0.22, handleY, bar),
      v(0.22, handleY, bar),
      { color: METAL },
    );
    builder.affordance({
      id: "top",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(0, height, body / 2)),
      extent: rectangle(width, body),
    });
    builder.affordance({
      id: "ovenDoor",
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        v(0, E.plinth, depth),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: E.drop,
      parts: ["oven-door", "oven-handle"],
    });
    builder.affordance({
      id: "ovenHandle",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, handleY, bar), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: 0.44,
      rides: "ovenDoor",
    });
    ZONES.forEach((diameter: number, index: number): void => {
      const k: number = index + 1;
      const x: number = (index % 2 === 0 ? -1 : 1) * (width / 4);
      const z: number = index < 2 ? (body * 3) / 4 : body / 4;
      builder.rod(
        `zone-${k}`,
        diameter / 2,
        v(x, height - 0.004, z),
        v(x, height, z),
        { color: DARK },
      );
      builder.affordance({
        id: `zone${k}`,
        kind: "stack-top",
        frame: ArchetypeFrame.upright(v(x, height, z)),
        extent: rectangle(diameter, diameter),
      });
      const knobX: number = width * (-0.3 + 0.2 * index);
      const knobY: number = height - E.fascia / 2;
      builder.rod(
        `knob-${k}`,
        0.018,
        v(knobX, knobY, depth),
        v(knobX, knobY, depth + 0.025),
        { color: "#55595f" },
      );
      builder.affordance({
        id: `knob${k}`,
        kind: "knob",
        frame: ArchetypeFrame.facing(
          v(knobX, knobY, depth + 0.025),
          v(0, 0, 1),
          v(1, 0, 0),
        ),
        extent: null,
        grip: "precision",
        aperture: 0.036,
        travel: E.turn,
        parts: [`knob-${k}`],
      });
    });
  }

  /**
   * A countertop microwave: walls round the maker's cavity, the cavity on the `-X` side behind a door hinged on that edge, and the control panel on the `+X` side with its door-release button.
   *
   * The side wall is as thick as the top and the bottom, half the height the cavity leaves; the door and the back share equally what the depth leaves in front of and behind the cavity.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the door hinges and how the walls are sized.
   * @evidence contracts/development/implementation.md#principled-implementation Walls placed so their inner faces bound the maker's cavity inside the maker's outside size, the panel taking the width the cavity and the side wall leave.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bottom and roof, side, back, panel, door, button, then the four contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turntable or window; the equal split of the depth between door and back is the one premise the sheet leaves open, and the door's swing and the button's press are this namespace's estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Seven parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function microwave(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const ch: number = d.cavityHeight!;
    const cw: number = d.cavityWidth!;
    const cd: number = d.cavityDepth!;
    const wall: number = (height - ch) / 2;
    const door: number = (depth - cd) / 2;
    const back: number = door;
    const left: number = -width / 2;
    const centre: number = left + wall + cw / 2;
    const shell: number = depth - door;
    for (const [id, y] of [
      ["bottom", wall / 2],
      ["roof", height - wall / 2],
    ] as const)
      builder.box(
        id,
        v(wall + cw, wall, shell),
        v(left + (wall + cw) / 2, y, shell / 2),
        { color: WHITE },
      );
    builder.box(
      "side",
      v(wall, ch, shell),
      v(left + wall / 2, height / 2, shell / 2),
      { color: WHITE },
    );
    builder.box("back", v(cw, ch, back), v(centre, height / 2, back / 2), {
      color: WHITE,
    });
    const panel: number = width - wall - cw;
    builder.box(
      "panel",
      v(panel, height, depth),
      v(width / 2 - panel / 2, height / 2, depth / 2),
      { color: DARK },
    );
    builder.box(
      "door-leaf",
      v(wall + cw, height, door),
      v(left + (wall + cw) / 2, height / 2, shell + door / 2),
      { color: DARK },
    );
    const button: IAutoMovieVector3 = v(
      width / 2 - panel / 2,
      height * 0.25,
      depth,
    );
    builder.box(
      "button",
      v(0.04, 0.02, 0.006),
      Vector3.add(button, v(0, 0, 0.003)),
      { color: METAL },
    );
    builder.affordance({
      id: "door",
      kind: "hinge",
      frame: sideHinge(v(left, height / 2, depth), -1),
      extent: null,
      travel: E.swing,
      parts: ["door-leaf"],
    });
    builder.affordance({
      id: "open",
      kind: "button",
      frame: ArchetypeFrame.facing(
        Vector3.add(button, v(0, 0, 0.006)),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      travel: E.press,
      parts: ["button"],
    });
    builder.affordance({
      id: "floor",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(centre, wall, back + cd / 2)),
      extent: rectangle(cw, cd),
    });
    builder.affordance({
      id: "top",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(0, height, depth / 2)),
      extent: rectangle(width, depth),
    });
  }

  /**
   * A front-loading washing machine: the body, a round door centred across it below the control panel and hinged on its `-X` edge, a handle at the door's free edge and the programme dial on the panel's `+X` side.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the door hinges and where the handle and dial are.
   * @evidence contracts/development/implementation.md#principled-implementation The body at the maker's size and the door at the diameter its open depth gives, hinged at its own edge so a quarter turn reaches the sheet's open-door depth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, door, handle, dial, then the four contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No drum, detergent drawer or porthole glass; the panel's height, the door's thickness and swing and the dial's turn are this namespace's estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function washingMachine(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const body: number = depth - E.door;
    const radius: number = d.door! / 2;
    const centre: number = height - E.panel - radius;
    builder.box("body", v(width, height, body), v(0, height / 2, body / 2), {
      color: WHITE,
    });
    builder.rod(
      "door-ring",
      radius,
      v(0, centre, body),
      v(0, centre, depth),
      { color: "#c9ccd1" },
    );
    const grip: number = 0.01;
    const x: number = radius - 0.04;
    builder.rod(
      "door-handle",
      grip,
      v(x, centre - 0.05, depth + grip),
      v(x, centre + 0.05, depth + grip),
      { color: DARK },
    );
    const dial: IAutoMovieVector3 = v(width / 2 - 0.1, height - E.panel / 2, body);
    builder.rod("dial", 0.03, dial, Vector3.add(dial, v(0, 0, 0.03)), {
      color: METAL,
    });
    builder.affordance({
      id: "door",
      kind: "hinge",
      frame: sideHinge(v(-radius, centre, depth), -1),
      extent: null,
      travel: E.swing,
      parts: ["door-ring", "door-handle"],
    });
    builder.affordance({
      id: "doorHandle",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(x, centre, depth + grip),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "hook",
      aperture: 2 * grip,
      length: 0.1,
      rides: "door",
    });
    builder.affordance({
      id: "dial",
      kind: "knob",
      frame: ArchetypeFrame.facing(
        Vector3.add(dial, v(0, 0, 0.03)),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 0.06,
      travel: E.turn,
      parts: ["dial"],
    });
    builder.affordance({
      id: "top",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(0, height, depth / 2)),
      extent: rectangle(width, depth),
    });
  }
}
