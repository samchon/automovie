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
 * How {@link createAppliance} builds each kind of appliance from its drawn dimensions: the parts and the contacts, one function per kind, the counts and openings the makers give, and the construction sizes no source gives.
 *
 * Every function stands its appliance with its back at the origin's `Z`, centred on `X`, its front toward `+Z`. Every contact's place and every articulation's range comes from a cited band or is derived from one; the estimates below size only parts no act reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds, the shared frame and what the estimates may size.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions, one construction per kind of the producer's closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer's four constructions with the counts and estimates they read; kept apart from the producer so each file stays one readable responsibility, and read only by `createAppliance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size a sheet does not give is a named construction estimate here, none placing a contact; a door the makers give no opening for does not open.
 */
export namespace ApplianceConstruction {
  /** A fridge's shelves, as the maker gives them (Bosch KGN36NL30M, four fridge shelves). */
  export const SHELVES: number = 4;

  /** The freezer's share of a fridge-freezer's height: its 87 l of the 302 l net capacity of the Bosch KGN36NL30M, the compartments sharing one width and depth. */
  export const FREEZER: number = 87 / 302;

  /** A fridge door's opening, degrees: the 90 degrees a Bosch KGN 36A63's door opens to 55 mm from the wall (https://www.manualsdir.com/manuals/17511/bosch-kgn-36a63.html?page=6). */
  export const FRIDGE_SWING: number = 90;

  /** A washing machine door's opening, degrees: the 90 degrees at which Bosch gives the WAN28255GB's depth with the door open. */
  export const WASHER_SWING: number = 90;

  /** A cooker's hob zones and their diameters, metres, as the Bosch PKF675FP2E hob gives them (https://bosch-home.com/za/en/mkt-product/PKF675FP2E). */
  export const ZONES: readonly number[] = [0.145, 0.145, 0.18, 0.21];

  /**
   * The construction sizes no source read gives, metres, each an estimate no act reads and no band declares:
   *
   * - `wall`: a fridge's wall; `door`: a door's thickness; `handle`: how far a fridge handle bar stands out from its door; `shelf`: a glass shelf's thickness.
   * - `plinth`, `fascia`: a cooker's drawn plinth and control fascia; `panel`: a washing machine's control panel, above its door.
   */
  export const ESTIMATES: Readonly<{
    wall: number;
    door: number;
    handle: number;
    shelf: number;
    plinth: number;
    fascia: number;
    panel: number;
  }> = {
    wall: 0.04,
    door: 0.05,
    handle: 0.04,
    shelf: 0.006,
    plinth: 0.1,
    fascia: 0.1,
    panel: 0.15,
  };

  /**
   * A fridge-freezer: a solid freezer block under a hollow fridge whose four walls and four glass shelves are parts, a door on each, hinged on the `+X` edge, and a handle bar on each near the free edge.
   *
   * `fridgeHandle` is the fridge door's free edge at the drawn pull height, `freezerHandle` the freezer door's free edge at its top; each rides its door.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the doors hinge and where the handles are.
   * @evidence contracts/development/implementation.md#principled-implementation The carcass is the maker's depth less the door and the handle's stand-off, so the handle bars' fronts are the depth with handles the sheet gives; the freezer the share of the height its capacity is of the total; the shelves at even steps up the inside, the maker's count of them; the doors open the 90 degrees the maker's manual gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Freezer, the fridge's walls, the shelves, then each door with its handle bar and their two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No door shelves, drawers or seals; the wall, door and shelf thickness and the bar's stand-off are construction estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fourteen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refrigerator(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const carcass: number = d.depth! - E.door - E.handle;
    const freezer: number = height * FREEZER;
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

    // A door on each section; each handle is the door's free edge, where a bar stands out from the door.
    const radius: number = 0.0125;
    const bar: number = face + E.handle - radius;
    const edge: number = -width / 2;
    for (const [door, handle, bottom, top, grip] of [
      ["fridgeDoor", "fridgeHandle", freezer, height, d.pullHeight!],
      ["freezerDoor", "freezerHandle", 0, freezer, freezer],
    ] as const) {
      builder.box(
        `${door}-leaf`,
        v(width, top - bottom, E.door),
        v(0, (top + bottom) / 2, carcass + E.door / 2),
        { color: WHITE },
      );
      const low: number = Math.min(grip - 0.15, top - 0.3);
      builder.rod(
        `${handle}-bar`,
        radius,
        v(edge + radius, low, bar),
        v(edge + radius, low + 0.3, bar),
        { color: METAL },
      );
      builder.affordance({
        id: door,
        kind: "hinge",
        frame: sideHinge(v(width / 2, (top + bottom) / 2, face), 1),
        extent: null,
        travel: FRIDGE_SWING,
        parts: [`${door}-leaf`, `${handle}-bar`],
      });
      builder.affordance({
        id: handle,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(v(edge, grip, face), v(0, 0, 1), v(0, 1, 0)),
        extent: null,
        grip: "power",
        rides: door,
      });
    }
  }

  /**
   * A freestanding cooker: a body behind a door on its plinth and a fascia above it, the hob's four zones in the top's quarters, a handle across the door's top and four knobs along the fascia.
   *
   * The hob and its zones are contacts; the oven door, its handle and the knobs are drawn but are not contacts, since no source read places them or gives their travel.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, which parts are contacts and why the rest are not.
   * @evidence contracts/development/implementation.md#principled-implementation The body at the maker's width and height; the zones at the maker's hob diameters, centred in the top's four quarters, front left, front right, back left and back right as one faces it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, fascia, plinth, door and handle, knobs, then the top and each zone with its contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No oven cavity or racks; the plinth, fascia, door thickness and knob sizes are construction estimates.
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
    const handleY: number = E.plinth + door - 0.05;
    builder.rod(
      "oven-handle",
      0.01,
      v(-0.22, handleY, depth + 0.03),
      v(0.22, handleY, depth + 0.03),
      { color: METAL },
    );
    builder.affordance({
      id: "top",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(0, height, body / 2)),
      extent: rectangle(width, body),
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
    });
  }

  /**
   * A countertop microwave: walls round the maker's cavity, the cavity on the `-X` side behind a door hinged on that edge, and the control panel on the `+X` side.
   *
   * The side wall is as thick as the top and the bottom, half the height the cavity leaves; the door and the back share equally what the depth leaves in front of and behind the cavity. The door's hinge states no travel, since the maker gives no opening angle: it stays shut until one is read.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the door hinges, how the walls are sized and why the door does not open.
   * @evidence contracts/development/implementation.md#principled-implementation Walls placed so their inner faces bound the maker's cavity inside the maker's outside size, the panel taking the width the cavity and the side wall leave.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bottom and roof, side, back, panel, door, then the three contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turntable or window; the equal split of the depth between door and back is the one premise the sheet leaves open.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one appliance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function microwave(builder: Builder, d: Drawn): void {
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
    builder.affordance({
      id: "door",
      kind: "hinge",
      frame: sideHinge(v(left, height / 2, depth), -1),
      extent: null,
      parts: ["door-leaf"],
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
   * A front-loading washing machine: the body, a round door across it below the control panel and hinged on its `-X` edge, a handle bar at the door's free edge and the programme dial on the panel's `+X` side.
   *
   * The door opens the 90 degrees at which the maker gives its open depth; the handle and dial are drawn but are not contacts, since no source read places them.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the door hinges, how far it opens and which parts are not contacts.
   * @evidence contracts/development/implementation.md#principled-implementation The body at the maker's size and the door at the diameter its open depth gives, hinged at its own edge so a quarter turn reaches the sheet's open-door depth; the hinge line is vertical, so where along it its frame stands moves nothing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, door, handle, dial, then the two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No drum, detergent drawer or porthole glass; the panel's height and the door's thickness are construction estimates.
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
    builder.rod(
      "door-handle",
      0.01,
      v(radius - 0.04, centre - 0.05, depth + 0.01),
      v(radius - 0.04, centre + 0.05, depth + 0.01),
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
      travel: WASHER_SWING,
      parts: ["door-ring", "door-handle"],
    });
    builder.affordance({
      id: "top",
      kind: "stack-top",
      frame: ArchetypeFrame.upright(v(0, height, depth / 2)),
      extent: rectangle(width, depth),
    });
  }
}
