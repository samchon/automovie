import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { createTap } from "./createTap";
import type { createSanitary } from "./createSanitary";

/** The builder every kind's construction fills. */
type Builder = ArchetypeBuilder<
  createSanitary.Affordance,
  createSanitary.Dimension
>;

/** The drawn dimensions of one kind. */
type Drawn = Partial<Record<createSanitary.Dimension, number>>;

/** White vitreous china and enamel. */
const CHINA: string = "#eef0ee";

/** Chrome fittings. */
const CHROME: string = "#c9ccd1";

/** The shorthand every construction below uses. */
const v: typeof Vector3.create = Vector3.create;

/**
 * How {@link createSanitary} builds each kind of fixture from its drawn dimensions: the parts and the contacts, one function per kind, and the construction sizes no source gives.
 *
 * Every function places its fixture with its back against the wall at the origin's `Z`, centred on `X`, on the floor. Every contact's place and every articulation's range comes from a cited band or is derived from one; the estimates below size only parts no act reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds, the frame every construction shares and what the estimates may size.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions, one construction per kind of the producer's closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer's four constructions and the estimates they read; kept apart from the producer so each file stays one readable responsibility, and read only by `createSanitary`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No construction reads another kind's dimension; the estimates are named here, not hidden in the arithmetic, and none places a contact.
 */
export namespace SanitaryConstruction {
  /**
   * The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `ring` and `lid`, a toilet seat ring's and lid's thickness under and over the seat's cited height; `wall`, a shower stall's wall thickness outside its cited inside; `seatThickness`, its folding seat's under the seat's cited height.
   */
  export const ESTIMATES: Readonly<{
    ring: number;
    lid: number;
    wall: number;
    seatThickness: number;
  }> = {
    ring: 0.025,
    lid: 0.02,
    wall: 0.05,
    seatThickness: 0.03,
  };

  /** A toilet lid's travel, degrees: the quarter turn about its level hinge that lays the lid, upright at rest, flat on the level ring. */
  export const LIFT: number = 90;

  /**
   * A pedestal washbasin: the basin block at its rim height, a pedestal under its middle, and a single-lever mixer on the deck behind the opening, built as `createTap` builds one.
   *
   * The mixer's lever is a place to touch, a `knob` without travel, because no source read gives its turn.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the mixer stands and why its lever does not turn.
   * @evidence contracts/development/implementation.md#principled-implementation A block of the maker's plan size and basin depth under the rim, on a pedestal a sixth of the basin's width in radius, a construction proportion; the mixer from the basin mixer's drawn bands in the middle of the deck strip between the wall and the opening's back edge, so its spout of the maker's reach ends over the opening, and the `spout` socket at the maker's outlet height and reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Basin, pedestal, mixer, then the four contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The basin is not hollowed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `createTap`'s bands, so a basin's mixer is the tap's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function washbasin(builder: Builder, d: Drawn): void {
    const rim: number = d.rim!;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const basin: number = d.basinDepth!;
    builder.box(
      "basin",
      v(width, basin, depth),
      v(0, rim - basin / 2, depth / 2),
      { color: CHINA },
    );
    builder.rod(
      "pedestal",
      width / 6,
      v(0, 0, depth / 2),
      v(0, rim - basin, depth / 2),
      { color: CHINA },
    );

    // The mixer stands in the middle of the deck strip between the wall and the opening's back edge, its spout reaching out over the opening.
    const deck: number = (depth - d.bowlDepth!) / 4;
    const spout: number = createTap.SPOUT;
    const outlet: number = rim + d.tapOutlet!;
    const top: number = rim + d.tapHeight!;
    builder.rod("tap-body", 0.02, v(0, rim, deck), v(0, top, deck), {
      color: CHROME,
    });
    builder.rod(
      "tap-spout",
      spout / 2,
      v(0, outlet + spout / 2, deck),
      v(0, outlet + spout / 2, deck + d.tapReach!),
      { color: CHROME },
    );
    builder.box("tap-lever", v(0.015, 0.012, 0.09), v(0, top + 0.006, deck), {
      color: "#b9bcc0",
    });
    builder.affordance({
      id: "rim",
      kind: "ledge",
      frame: ArchetypeFrame.facing(v(0, rim, depth), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      length: width,
    });
    builder.affordance({
      id: "bowl",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, rim, depth / 2)),
      extent: null,
      width: d.bowlWidth!,
      depth: d.bowlDepth!,
    });
    builder.affordance({
      id: "tap",
      kind: "knob",
      frame: ArchetypeFrame.facing(v(0, top, deck), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "precision",
    });
    builder.affordance({
      id: "spout",
      kind: "socket",
      frame: ArchetypeFrame.facing(
        v(0, outlet, deck + d.tapReach!),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }

  /**
   * A close-coupled toilet: the bowl as one block up to the seat ring, the ring, the lid standing open on its hinge at the seat holes, and the tank 19 mm off the wall as the maker's sheet sets it.
   *
   * The lid's hinge turns about `+X`, so its quarter-turn travel lays the standing lid forward onto the ring. The trip lever is not drawn: the sheet does not place it.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, which way the lid moves and why there is no lever.
   * @evidence contracts/development/implementation.md#principled-implementation Blocks from the seat height and the maker's plan: the ring's top at the drawn seat height, the hinge line the seat's depth behind the bowl's front, the tank between its sheet's offset and depth up to its top.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bowl, ring, lid, tank, then the two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bowl is a block, not a rim; the ring's and lid's thickness are this namespace's construction estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one fixture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function toilet(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const seat: number = d.seat!;
    const width: number = d.width!;
    const front: number = d.length!;
    const hinge: number = front - d.seatDepth!;
    const tankBack: number = 0.019;
    const tankFront: number = tankBack + d.tankDepth!;
    const bowlTop: number = seat - E.ring;
    builder.box(
      "bowl",
      v(width, bowlTop, front - tankBack),
      v(0, bowlTop / 2, (front + tankBack) / 2),
      { color: CHINA },
    );
    builder.box(
      "ring",
      v(width, E.ring, d.seatDepth!),
      v(0, seat - E.ring / 2, (front + hinge) / 2),
      { color: CHINA },
    );

    // The lid stands open, upright on the hinge line just in front of the tank, and its travel lays it on the ring.
    builder.box(
      "lid",
      v(width, d.seatDepth!, E.lid),
      v(0, seat + d.seatDepth! / 2, hinge - E.lid / 2),
      { color: CHINA },
    );
    builder.box(
      "tank",
      v(d.tankWidth!, d.tankTop! - bowlTop, d.tankDepth!),
      v(0, (d.tankTop! + bowlTop) / 2, (tankBack + tankFront) / 2),
      { color: CHINA },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: ArchetypeFrame.upright(v(0, seat, front)),
      extent: null,
      width,
      depth: d.seatDepth!,
    });
    builder.affordance({
      id: "lid",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, seat, hinge), v(1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: LIFT,
      parts: ["lid"],
    });
  }

  /**
   * A recessed bath: a floor slab at the well's floor and four walls up to the rim around the well, the well centred in the plan; its length runs along `X`.
   *
   * The well's floor stands the sheet's water depth below the rim: the depth to the overflow, so the true floor lies a little lower.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, its orientation and how the well's floor is placed.
   * @evidence contracts/development/implementation.md#principled-implementation A slab and four walls whose inner faces bound the maker's well bottom, so the `bottom` surface is the sheet's basin area; the floor the sheet's water depth under the rim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Slab, back and apron, two ends, then the two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The well's sloped back and rounded corners are not drawn; the overflow's depth stands for the well's, said above.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one fixture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bathtub(builder: Builder, d: Drawn): void {
    const rim: number = d.rim!;
    const length: number = d.length!;
    const width: number = d.width!;
    const floor: number = rim - d.waterDepth!;
    const wellX: number = d.wellLength!;
    const wellZ: number = d.wellWidth!;
    const end: number = (length - wellX) / 2;
    const side: number = (width - wellZ) / 2;
    builder.box("floor", v(length, floor, width), v(0, floor / 2, width / 2), {
      color: CHINA,
    });
    for (const [id, z] of [
      ["back", side / 2],
      ["apron", width - side / 2],
    ] as const)
      builder.box(
        id,
        v(length, rim - floor, side),
        v(0, (rim + floor) / 2, z),
        { color: CHINA },
      );
    for (const [id, sign] of [
      ["end-left", 1],
      ["end-right", -1],
    ] as const)
      builder.box(
        id,
        v(end, rim - floor, wellZ),
        v((sign * (length - end)) / 2, (rim + floor) / 2, width / 2),
        { color: CHINA },
      );
    builder.affordance({
      id: "rim",
      kind: "ledge",
      frame: ArchetypeFrame.facing(v(0, rim, width), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      length,
    });
    builder.affordance({
      id: "bottom",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, floor, width / 2)),
      extent: null,
      width: wellX,
      depth: wellZ,
    });
  }

  /**
   * A one-piece transfer shower: a tray the threshold's height under the inside and the walls, a back wall and two side walls, the folding seat on the `+X` wall from the back wall to the 75 mm (3 in) short of the entry ADA 610.3 allows, and the valve on the `-X` wall across from the seat's middle.
   *
   * The valve is a place to touch, a `knob` without travel, because no source read gives its turn.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built, where the seat and the valve stand and why the valve does not turn.
   * @evidence contracts/development/implementation.md#principled-implementation Boxes whose inner faces bound the clause's inside square; the seat's front edge its drawn depth from its wall, its run from the back wall to the clause's 3 in from the entry; the valve on the `-X` wall's inner face at its drawn height opposite the seat's middle, as ADA 608.5.1 places it within 15 in of the seat's centreline.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Tray, walls, seat, valve, then the five contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shower head or hose: their heights are not given by a source read; the wall and seat thickness are this namespace's construction estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one fixture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shower(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const inside: number = d.interior!;
    const wall: number = E.wall;
    const height: number = d.wallHeight!;
    const step: number = d.threshold!;
    const outer: number = inside + 2 * wall;
    const depth: number = inside + wall;
    const half: number = inside / 2;
    builder.box("tray", v(outer, step, depth), v(0, step / 2, depth / 2), {
      color: CHINA,
    });
    builder.box(
      "wall-back",
      v(outer, height - step, wall),
      v(0, (height + step) / 2, wall / 2),
      { color: CHINA },
    );
    for (const [id, sign] of [
      ["wall-left", 1],
      ["wall-right", -1],
    ] as const)
      builder.box(
        id,
        v(wall, height - step, inside),
        v(sign * (half + wall / 2), (height + step) / 2, wall + half),
        { color: CHINA },
      );

    // The seat runs from the back wall to 75 mm short of the entry and stands out its drawn depth from the +X wall.
    const run: number = inside - 0.075;
    const seat: number = d.seat!;
    const out: number = half - d.seatDepth!;
    builder.box(
      "seat",
      v(d.seatDepth!, E.seatThickness, run),
      v((half + out) / 2, seat - E.seatThickness / 2, wall + run / 2),
      { color: "#d8d4cc" },
    );
    builder.rod(
      "valve",
      0.03,
      v(-half, d.control!, wall + run / 2),
      v(-half + 0.03, d.control!, wall + run / 2),
      { color: CHROME },
    );
    builder.affordance({
      id: "tray",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, step, wall + half)),
      extent: null,
      width: inside,
      depth: inside,
    });
    builder.affordance({
      id: "threshold",
      kind: "ledge",
      frame: ArchetypeFrame.facing(v(0, step, depth), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      length: inside,
    });
    builder.affordance({
      id: "entry",
      kind: "aperture",
      frame: ArchetypeFrame.facing(v(0, step, depth), v(0, 1, 0), v(-1, 0, 0)),
      extent: null,
      width: inside,
      height: height - step,
    });
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: ArchetypeFrame.facing(
        v(out, seat, wall + run / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      width: run,
      depth: d.seatDepth!,
    });
    builder.affordance({
      id: "control",
      kind: "knob",
      frame: ArchetypeFrame.facing(
        v(-half, d.control!, wall + run / 2),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
    });
  }
}
