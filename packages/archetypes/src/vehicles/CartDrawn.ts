import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeEquine } from "../animals/AutoMovieArchetypeEquine";
import { EquineHarness } from "../animals/EquineHarness";
import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { CartWheel } from "./CartWheel";
import { AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";

/**
 * The drawn carriers on one axle: a horse's cart, a runner's rickshaw and a
 * pair's chariot, each built on its drawn dimensions with its axle along `X`
 * under the origin.
 */
export namespace CartDrawn {
  /**
   * A horse's two-wheeled cart: a body on the axle, a seat over it, two shafts
   * reaching forward level at the horse's tugs, a single tree the traces pull,
   * and the driving lines' held runs behind the terrets.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   */
  export function cart(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const horse: AutoMovieArchetypeEquine.IRig = AutoMovieArchetypeEquine.rig({
      withersHeight: d.withersHeight!,
      girth: d.girth!,
    });
    const barrel: number = horse.barrel;
    const tug: number = horse.back - barrel;
    const tree: number = AutoMovieArchetypeCart.SINGLE_TREE;
    const tip: number = tree + d.shaftLength!;
    const coupling: number = tip - AutoMovieArchetypeEquine.SADDLE;
    const seat: number = d.seatHeight!;
    const half: number = d.track! / 2 - 0.08;
    const middle: number = -0.05;
    const edge: number = 0.15;

    // The body: a floor on the axle from behind it to the single tree, a dash at its front, and the seat over the axle.
    builder.box(
      "floor",
      v(2 * half, 0.04, tree + 0.3),
      v(0, radius + 0.02, (tree - 0.3) / 2),
      {
        color: BODY,
      },
    );
    builder.box("dash", v(2 * half, 0.4, 0.03), v(0, radius + 0.24, tree), {
      color: BODY,
    });
    builder.box(
      "seat-box",
      v(2 * half, seat - 0.05 - radius, 0.4),
      v(0, (seat - 0.05 + radius) / 2, middle),
      {
        color: BODY,
      },
    );
    builder.box(
      "cushion",
      v(2 * half - 0.1, 0.05, 0.4),
      v(0, seat - 0.025, middle),
      { color: CLOTH, density: 0.2 },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, seat, edge)),
      extent: null,
      depth: 0.4,
      width: 2 * half - 0.1,
    });
    builder.affordance({
      id: "footboard",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, radius + 0.04, (tree + 0.15) / 2),
      ),
      extent: null,
      width: 2 * half,
      depth: tree - 0.15,
    });

    // The shafts: level at the tugs either side of the barrel, from their tips back to the dash, each held up on a strut from the floor.
    for (const [side, sign] of EquineHarness.SIDES) {
      const x: number = sign * (barrel + SHAFT);
      builder.rod(`shaft-${side}`, SHAFT, v(x, tug, tree), v(x, tug, tip), {
        color: WOOD,
      });
      builder.rod(
        `strut-${side}`,
        SHAFT,
        v(sign * half, radius + 0.04, tree),
        v(x, tug, tree),
        { color: WOOD },
      );
    }
    builder.affordance({
      id: "coupling",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, tug, coupling)),
      extent: null,
    });

    // The single tree across the front at the points of draft's height and spread, hung from a bar between the shafts, so the traces run straight back from the collar.
    const draft: IAutoMovieVector3 = horse.draft;
    builder.rod(
      "bar",
      SHAFT,
      v(-(barrel + SHAFT), tug, tree),
      v(barrel + SHAFT, tug, tree),
      { color: WOOD },
    );
    builder.rod("stay", SHAFT / 2, v(0, tug, tree), v(0, draft.y, tree), {
      color: METAL,
    });
    builder.rod(
      "single-tree",
      SHAFT,
      v(-draft.x, draft.y, tree),
      v(draft.x, draft.y, tree),
      { color: WOOD },
    );

    // The driving lines' held runs: each line's length behind its terret, IVC's 14 ft single-horse lines less their run from the bit through the ring to the terret, laid from the terret toward the line's rest point over the seat. The driving act's hands choose where along it they hold.
    const pass: ReturnType<typeof EquineHarness.passes> =
      EquineHarness.passes(horse);
    const ahead: number = coupling - horse.hitch.z;
    const used: number =
      Vector3.length(Vector3.subtract(pass.ring, pass.bit)) +
      Vector3.length(Vector3.subtract(pass.terret, pass.ring));
    const run: number = AutoMovieArchetypeCart.LINES - used;
    const rest: IAutoMovieVector3 = v(0, seat + AutoMovieArchetypeCart.REST.elbow, edge);
    for (const [side, sign] of EquineHarness.SIDES) {
      const terret: IAutoMovieVector3 = v(
        sign * pass.terret.x,
        pass.terret.y,
        pass.terret.z + ahead,
      );
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(rest, terret),
      );
      const up: IAutoMovieVector3 = Vector3.subtract(
        v(0, 1, 0),
        Vector3.scale(along, along.y),
      );
      builder.affordance({
        id: `${side}Line`,
        kind: "rein",
        symmetry: "round",
        // `+X` runs forward along the run to the terret, `+Y` up, square to it.
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.add(terret, Vector3.scale(along, run / 2)),
          up,
          Vector3.scale(along, -1),
        ),
        extent: null,
        grip: "power",
        aperture: AutoMovieArchetypeCart.LINE,
        length: run,
      });

      // A driver holds the line ahead of the seat, with the two lines kept
      // apart by their terret spacing. The rest of the measured run continues
      // behind the hand. The hand station is provisional for this cart.
      const station: number = edge + (tree - edge) / 3;
      const toHand: IAutoMovieVector3 = Vector3.subtract(
        v(
          terret.x,
          terret.y + ((station - terret.z) / along.z) * along.y,
          station,
        ),
        terret,
      );
      const reach: number = Vector3.length(toHand);
      const toward: IAutoMovieVector3 =
        reach === 0 ? along : Vector3.scale(toHand, 1 / reach);
      const grip: IAutoMovieVector3 = Vector3.addScaled(
        terret,
        toward,
        Math.min(run, reach),
      );
      const handUp: IAutoMovieVector3 = Vector3.subtract(
        v(0, 1, 0),
        Vector3.scale(toward, toward.y),
      );
      builder.affordance({
        id: `${side}LineGrip`,
        kind: "rein",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          grip,
          handUp,
          Vector3.scale(toward, -1),
        ),
        extent: null,
        grip: "power",
        aperture: AutoMovieArchetypeCart.LINE,
      });
      builder.affordance({
        id: `${side}LineEnd`,
        kind: "rein",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.addScaled(terret, toward, run),
          handUp,
          Vector3.scale(toward, -1),
        ),
        extent: null,
      });
    }
    CartWheel.pair(builder, {
      track: d.track!,
      radius,
      spokes: 12,
      z: 0,
      prefix: "",
      spins: ["leftSpin", "rightSpin"],
    });
  }

  /**
   * A runner's rickshaw: a seat over the axle, a footboard ahead of it, and two
   * shafts reaching forward to the runner's hands.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   */
  export function rickshaw(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const track: number = d.width! - TYRE;
    const half: number = AutoMovieArchetypeCart.RICKSHAW_SEAT_WIDTH / 2;
    const seat: number = AutoMovieArchetypeCart.RICKSHAW_SEAT;
    const front: number = 0.2;
    const board: number = front + AutoMovieArchetypeCart.RICKSHAW_FOOTBOARD;
    const tip: number = d.length! - radius;
    const grip: number = d.gripHeight!;
    builder.box(
      "floor",
      v(2 * half, 0.04, board + 0.25),
      v(0, radius + 0.02, (board - 0.25) / 2),
      {
        color: BODY,
      },
    );
    builder.box(
      "seat-box",
      v(2 * half, seat - 0.05 - radius, 0.45),
      v(0, (seat - 0.05 + radius) / 2, front - 0.225),
      {
        color: BODY,
      },
    );
    builder.box(
      "cushion",
      v(2 * half, 0.05, 0.45),
      v(0, seat - 0.025, front - 0.225),
      { color: CLOTH, density: 0.2 },
    );
    builder.box(
      "backrest",
      v(2 * half, 0.45, 0.05),
      v(0, seat + 0.225, front - 0.475),
      { color: CLOTH, density: 0.2 },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, seat, front)),
      extent: null,
      depth: 0.45,
      width: 2 * half,
      back: 0.45,
    });
    builder.affordance({
      id: "footboard",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, radius + 0.04, (front + board) / 2),
      ),
      extent: null,
      width: 2 * half,
      depth: board - front,
    });
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = (sign * AutoMovieArchetypeCart.RICKSHAW_SHAFTS) / 2;
      builder.rod(`shaft-${side}`, SHAFT, v(x, grip, board), v(x, grip, tip), {
        color: WOOD,
      });
      builder.rod(
        `strut-${side}`,
        SHAFT,
        v(sign * half, radius + 0.04, board),
        v(x, grip, board),
        { color: WOOD },
      );
      builder.affordance({
        id: `${side}Shaft`,
        kind: "handle",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(x, grip, tip - GRIP / 2),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        aperture: 2 * SHAFT,
        length: GRIP,
      });
    }
    builder.affordance({
      id: "coupling",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, grip, tip - GRIP / 2)),
      extent: null,
    });
    CartWheel.pair(builder, {
      track: track,
      radius,
      spokes: 12,
      z: 0,
      prefix: "",
      spins: ["leftSpin", "rightSpin"],
    });
  }

  /**
   * A pair's chariot: a floor on the axle with a siding round its front, and a
   * pole rising from the axle to the yoke on the horses' withers.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   */
  export function chariot(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const width: number = d.floorWidth!;
    const depth: number = d.floorDepth!;
    const floor: number = radius + 0.03;
    const rail: number = floor + d.railHeight!;
    builder.box(
      "floor",
      v(width, 0.03, depth),
      v(0, radius + 0.015, depth / 2),
      { color: WOOD, density: 0.4 },
    );
    builder.box(
      "siding-front",
      v(width, d.railHeight!, 0.02),
      v(0, (floor + rail) / 2, depth),
      {
        color: BODY,
        density: 0.3,
      },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.box(
        `siding-${side}`,
        v(0.02, d.railHeight!, depth),
        v((sign * width) / 2, (floor + rail) / 2, depth / 2),
        {
          color: BODY,
          density: 0.3,
        },
      );
    builder.rod(
      "rim",
      0.015,
      v(-width / 2, rail, depth),
      v(width / 2, rail, depth),
      { color: WOOD },
    );
    builder.affordance({
      id: "floor",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, floor, depth / 2)),
      extent: null,
      width,
      depth,
    });
    builder.affordance({
      id: "rim",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(v(0, rail, depth)),
      extent: null,
      grip: "power",
      aperture: 0.03,
      length: width,
    });
    const yoke: number = d.withersHeight!;
    const rise: number = yoke - radius;
    const reach: number = Math.sqrt(d.poleLength! ** 2 - rise ** 2);
    builder.rod("pole", 0.028, v(0, radius, 0), v(0, yoke, reach), {
      color: WOOD,
    });
    builder.affordance({
      id: "coupling",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, yoke, reach)),
      extent: null,
    });
    CartWheel.pair(builder, {
      track: d.track!,
      radius,
      spokes: 6,
      z: 0,
      prefix: "",
      spins: ["leftSpin", "rightSpin"],
    });
  }
}

/**
 * A shaft's radius, metres: a construction estimate no act reads beyond the
 * grip's aperture.
 */
const SHAFT: number = 0.025;

/**
 * A rickshaw shaft's held run at its tip, metres: a hand's breadth, a
 * construction estimate.
 */
const GRIP: number = 0.12;

/**
 * A rickshaw's tyre width, metres: 1 in, the Hong Kong rules of 1882; the track
 * is the overall width less it.
 */
const TYRE: number = AutoMovieArchetypeUnits.INCH;

/** The body's paint. */
const BODY: string = "#2f4f3f";

/** Bare wood. */
const WOOD: string = "#8b6a43";

/** A seat's cloth. */
const CLOTH: string = "#6b2f2f";

/** Iron. */
const METAL: string = "#55595f";
