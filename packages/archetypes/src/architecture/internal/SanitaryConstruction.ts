import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import type { AutoMovieArchetypeSanitary } from "../AutoMovieArchetypeSanitary";
import { AutoMovieArchetypeTap } from "../AutoMovieArchetypeTap";

/*
 * The parts and contacts the named plumbing fixture producers build from their
 * drawn dimensions, with the estimated construction sizes.
 *
 * Every function places its fixture with its back against the wall at the
 * origin's `Z`, centred on `X`, on the floor. Every contact's place and every
 * articulation's range comes from a cited band or is derived from one; the
 * estimates below size only parts no act reads.
 */
export namespace SanitaryConstruction {
  /*
   * The construction sizes no source read gives, metres, each an estimate no
   * act reads and no band declares: `ring` and `lid`, a toilet seat ring's and
   * lid's thickness under and over the seat's cited height; `wall`, a shower
   * stall's wall thickness outside its cited inside; `seatThickness`, its
   * folding seat's under the seat's cited height.
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

  /*
   * A toilet lid's travel, degrees: the quarter turn about its level hinge that
   * lays the lid, upright at rest, flat on the level ring.
   */
  export const LIFT: number = 90;

  /*
   * A basin mixer lever's turn to either side of the middle and its lift from
   * closed to full flow, degrees: GROHE Eurosmart basin mixer technical guide,
   * 50 degrees each side in plan and 39 degrees in elevation
   * (https://digitalassets.reecegroup.com.au/m/17e34382c958ae5c/original/Technical-Guide-GROHE-Eurosmart-New-Basin-Mixer-Chrome-Plated-5-Star.pdf).
   */
  export const MIXER: Readonly<{ turn: number; lift: number }> = {
    turn: 50,
    lift: 39,
  };

  /*
   * A pedestal washbasin: the basin block at its rim height, a pedestal under
   * its middle, and a single-lever mixer on the deck behind the opening, built
   * as `createTap` builds one.
   *
   * The mixer's lever turns about its body as a `knob`, `tap`, by the maker's
   * 50 degrees toward `+X` and, as its `reverse`, as far the other way, and
   * lifts about a level axis across it as a `hinge`, `lift`, by the maker's 39
   * degrees, the lever's part bound to the lift, which rides the turn, so a
   * turned lever turns with it and a lifted one lifts in its turned plane.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
    const spout: number = AutoMovieArchetypeTap.SPOUT;
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, rim, depth),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length: width,
    });
    builder.affordance({
      id: "bowl",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, rim, depth / 2)),
      extent: null,
      width: d.bowlWidth!,
      depth: d.bowlDepth!,
    });
    builder.affordance({
      id: "tap",
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, top, deck),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      travel: MIXER.turn,
      reverse: MIXER.turn,
    });
    builder.affordance({
      id: "lift",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, top, deck),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: MIXER.lift,
      parts: ["tap-lever"],
      rides: "tap",
    });
    builder.affordance({
      id: "spout",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, outlet, deck + d.tapReach!),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }

  /*
   * A close-coupled toilet: the bowl as one block up to the seat ring, the
   * ring, the lid standing open on its hinge at the seat holes, and the tank 19
   * mm off the wall as the maker's sheet sets it.
   *
   * The lid's hinge turns about `+X`, so its quarter-turn travel lays the
   * standing lid forward onto the ring. The trip lever is not drawn: the sheet
   * does not place it.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
      frame: AutoMovieArchetypeFrame.upright(v(0, seat, front)),
      extent: null,
      width,
      depth: d.seatDepth!,
    });
    builder.affordance({
      id: "lid",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, seat, hinge),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: LIFT,
      parts: ["lid"],
    });
  }

  /*
   * A recessed bath: a floor slab at the well's floor and four walls up to the
   * rim around the well, the well centred in the plan; its length runs along
   * `X`.
   *
   * The well's floor stands the sheet's water depth below the rim: the depth to
   * the overflow, so the true floor lies a little lower.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, rim, width),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length,
    });

    // Stepping in over the front wall: its top face and the top's outer
    // edge, which a step over clears going across (`HumanObstacle`).
    builder.affordance({
      id: "edge",
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, rim, width),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length,
    });
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, rim, width - side / 2)),
      extent: null,
      width: length,
      depth: side,
    });
    builder.affordance({
      id: "bottom",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, floor, width / 2)),
      extent: null,
      width: wellX,
      depth: wellZ,
    });

    // A bather sits on the well's floor with the back to the -X end wall,
    // facing along the well: the seat's front edge half the well from that
    // wall, as wide as the well, its back the wall up to the rim.
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, floor, width / 2),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      depth: wellX / 2,
      width: wellZ,
      back: rim - floor,
    });
    builder.affordance({
      id: "backrest",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(-wellX / 2, (rim + floor) / 2, width / 2),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      width: wellZ,
      depth: rim - floor,
    });
  }

  /*
   * A one-piece transfer shower: a tray the threshold's height under the inside
   * and the walls, a back wall and two side walls, the folding seat on the `+X`
   * wall from the back wall to the 75 mm (3 in) short of the entry ADA 610.3
   * allows, and the valve on the `-X` wall across from the seat's middle.
   *
   * The valve is a place to touch, a `knob` without travel, because no source
   * read gives its turn.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
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
      frame: AutoMovieArchetypeFrame.upright(v(0, step, wall + half)),
      extent: null,
      width: inside,
      depth: inside,
    });
    builder.affordance({
      id: "threshold",
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, step, depth),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length: inside,
    });
    builder.affordance({
      id: "entry",
      kind: "aperture",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, step, depth),
        v(0, 1, 0),
        v(-1, 0, 0),
      ),
      extent: null,
      width: inside,
      height: height - step,
    });
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.facing(
        v(-half, d.control!, wall + run / 2),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
    });
  }
}

/*
 * White vitreous china and enamel.
 */
const CHINA: string = "#eef0ee";

/*
 * Chrome fittings.
 */
const CHROME: string = "#c9ccd1";

/*
 * The shorthand every construction below uses.
 */
const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;

/*
 * The builder every kind's construction fills.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeSanitary.Affordance,
  AutoMovieArchetypeSanitary.Dimension
>;

/*
 * The drawn dimensions of one kind.
 */
type Drawn = Partial<Record<AutoMovieArchetypeSanitary.Dimension, number>>;
