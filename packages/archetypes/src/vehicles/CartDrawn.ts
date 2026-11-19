import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HorseHarness } from "../animals/HorseHarness";
import { createHorse } from "../animals/createHorse";
import { type ArchetypeBuilder, ArchetypeFrame, ArchetypeUnits } from "../core";
import { CartWheel } from "./CartWheel";
import { createCart } from "./createCart";

/**
 * The drawn carriers on one axle: a horse's cart, a runner's rickshaw and a pair's chariot, each built on its drawn dimensions with its axle along `X` under the origin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and where the axle stands.
 * @evidence contracts/development/design.md#principled-representation Each kind's body on its axle, its road wheels on spin knobs, and its coupling ahead where it is drawn from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three builders `createCart` calls for its two-wheeled drawn kinds; the limber is `CartLimber`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wheels are `CartWheel.pair`, shared with the four-wheelers, not a copy per kind.
 */
export namespace CartDrawn {
  /**
   * A horse's two-wheeled cart: a body on the axle, a seat over it, two shafts reaching forward level at the horse's tugs, a single tree the traces pull, and the driving lines' held runs behind the terrets.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and where each place comes from.
   * @evidence contracts/development/implementation.md#principled-implementation The shafts hang level at the horse's tugs, which sit on the saddle pad at the middle of the barrel, so their height is the horse's back less its barrel's radius (`createHorse.rig`, the girth over two pi), and they run either side of the barrel, a barrel's width apart (the girth over pi; In Harness's 23 to 24 in at 15 to 16 hh agrees). The shafts' tips stand at the point of the horse's shoulder (the Carriage Association of America's fitting guidance, seen only in search results), so the tugs, and the `coupling` between them, stand `createHorse.SADDLE` behind the tips. The tips stand `shaftLength` ahead of the single tree, a read cart's own shafts or, unread, the horse's point of shoulder to its point of buttock and the drawn `clearance` behind it (`createCart`), so the single tree stands clear of the horse; the single tree stands `SINGLE_TREE` ahead of the axle. The floor rests on the axle and the seat stands over it at `seatHeight`. The single tree stands across the front at the points of draft's height and spread (`createHorse.rig`'s `draft`), so the traces run straight back from the collar; it hangs from a bar between the shafts. The driving lines' held runs, `leftLine` and `rightLine`, are each line's length behind its terret: `createCart.LINES`, IVC Carriage's 14 ft stock single-horse lines, less the line's run from the bit ring through the neck strap's ring to the terret (`HorseHarness.passes`), laid from the terret on the horse's saddle at the coupling toward the line's rest point, `createCart.REST`'s elbow height over the seat. Where along a run the hands hold is the driving act's choice, as a grasp chooses within its bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The horse's places, then the body, the shafts and the wheels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SINGLE_TREE` is a named provisional value and the seat's height a band seen only in search results; the body's own boards, a construction no act reads, are sized from the track and the seat. The single tree's height, level with the points of draft so the traces run level, is a provisional value: the fitting guides read give the trace's angle to the hame, not the single tree's height; the lines' rest point over the seat is their rest geometry only, never where a hand is put.
   * @evidence contracts/development/implementation.md#efficient-algorithms About a dozen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function cart(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const horse: createHorse.IRig = createHorse.rig({
      withersHeight: d.withersHeight!,
      girth: d.girth!,
    });
    const barrel: number = horse.barrel;
    const tug: number = horse.back - barrel;
    const tree: number = createCart.SINGLE_TREE;
    const tip: number = tree + d.shaftLength!;
    const coupling: number = tip - createHorse.SADDLE;
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
      frame: ArchetypeFrame.upright(v(0, seat, edge)),
      extent: null,
      depth: 0.4,
      width: 2 * half - 0.1,
    });
    builder.affordance({
      id: "footboard",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, radius + 0.04, (tree + 0.15) / 2)),
      extent: null,
      width: 2 * half,
      depth: tree - 0.15,
    });

    // The shafts: level at the tugs either side of the barrel, from their tips back to the dash, each held up on a strut from the floor.
    for (const [side, sign] of HorseHarness.SIDES) {
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
      frame: ArchetypeFrame.upright(v(0, tug, coupling)),
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
    const pass: ReturnType<typeof HorseHarness.passes> =
      HorseHarness.passes(horse);
    const ahead: number = coupling - horse.hitch.z;
    const used: number =
      Vector3.length(Vector3.subtract(pass.ring, pass.bit)) +
      Vector3.length(Vector3.subtract(pass.terret, pass.ring));
    const run: number = createCart.LINES - used;
    const rest: IAutoMovieVector3 = v(0, seat + createCart.REST.elbow, edge);
    for (const [side, sign] of HorseHarness.SIDES) {
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
        frame: ArchetypeFrame.facing(
          Vector3.add(terret, Vector3.scale(along, run / 2)),
          up,
          Vector3.scale(along, -1),
        ),
        extent: null,
        grip: "power",
        aperture: createCart.LINE,
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
        frame: ArchetypeFrame.facing(grip, handUp, Vector3.scale(toward, -1)),
        extent: null,
        grip: "power",
        aperture: createCart.LINE,
      });
      builder.affordance({
        id: `${side}LineEnd`,
        kind: "rein",
        symmetry: "round",
        frame: ArchetypeFrame.facing(
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
   * A runner's rickshaw: a seat over the axle, a footboard ahead of it, and two shafts reaching forward to the runner's hands.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and where each place comes from.
   * @evidence contracts/development/implementation.md#principled-implementation The shafts are held level at the standing runner's hanging hands, so they stand at `gripHeight`, the measured wrist's height; their tips are the rickshaw's front, `length` ahead of its wheels' rear; each grip is a `handle` along its shaft at the tip, and the `coupling` is the middle between the grips. The floor rests on the axle; the seat (`RICKSHAW_SEAT`, `RICKSHAW_SEAT_WIDTH`) stands over it, and the footboard ends `RICKSHAW_FOOTBOARD` ahead of the seat's front edge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, shafts, wheels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The seat's height and the shafts' spacing are named provisional values; the hood is not modelled.
   * @evidence contracts/development/implementation.md#efficient-algorithms About a dozen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rickshaw(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const track: number = d.width! - TYRE;
    const half: number = createCart.RICKSHAW_SEAT_WIDTH / 2;
    const seat: number = createCart.RICKSHAW_SEAT;
    const front: number = 0.2;
    const board: number = front + createCart.RICKSHAW_FOOTBOARD;
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
      frame: ArchetypeFrame.upright(v(0, seat, front)),
      extent: null,
      depth: 0.45,
      width: 2 * half,
      back: 0.45,
    });
    builder.affordance({
      id: "footboard",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, radius + 0.04, (front + board) / 2)),
      extent: null,
      width: 2 * half,
      depth: board - front,
    });
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = (sign * createCart.RICKSHAW_SHAFTS) / 2;
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
        frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(v(0, grip, tip - GRIP / 2)),
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
   * A pair's chariot: a floor on the axle with a siding round its front, and a pole rising from the axle to the yoke on the horses' withers.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and where each place comes from.
   * @evidence contracts/development/implementation.md#principled-implementation The floor, `floorWidth` across and `floorDepth` deep, rests on the axle at its rear edge, so its height is the wheel's radius; the siding rises `railHeight` round its front, its top the `rim` the crew holds. The pole runs `poleLength` from the axle up to the yoke, which sits on the pair's withers, so the yoke's height is the horse's `withersHeight`; the `coupling` is the pole's end at the yoke. The wheels have the six spokes of the Tutankhamun chariots.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Floor, siding, pole, wheels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The D-shaped floor is a rectangle and the siding three panels; the floor's place on the axle is the chariots' arrangement as described, its boards a construction no act reads.
   * @evidence contracts/development/implementation.md#efficient-algorithms About a dozen parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chariot(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
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
      frame: ArchetypeFrame.upright(v(0, floor, depth / 2)),
      extent: null,
      width,
      depth,
    });
    builder.affordance({
      id: "rim",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.upright(v(0, rail, depth)),
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
      frame: ArchetypeFrame.upright(v(0, yoke, reach)),
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

/** A shaft's radius, metres: a construction estimate no act reads beyond the grip's aperture. */
const SHAFT: number = 0.025;

/** A rickshaw shaft's held run at its tip, metres: a hand's breadth, a construction estimate. */
const GRIP: number = 0.12;

/** A rickshaw's tyre width, metres: 1 in, the Hong Kong rules of 1882; the track is the overall width less it. */
const TYRE: number = ArchetypeUnits.INCH;

/** The body's paint. */
const BODY: string = "#2f4f3f";

/** Bare wood. */
const WOOD: string = "#8b6a43";

/** A seat's cloth. */
const CLOTH: string = "#6b2f2f";

/** Iron. */
const METAL: string = "#55595f";
