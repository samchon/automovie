import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeFriction,
} from "../../core";
import { CartWheel } from "./CartWheel";
import { AutoMovieArchetypeCart } from "../AutoMovieArchetypeCart";

/*
 * The drawn carriers on two axles: a wagon and a closed carriage, each with its
 * rear axle along `X` under the origin and its front axle turning about a pivot
 * `wheelbase` ahead, carrying the pole.
 */
export namespace CartCoach {
  /*
   * The Army's six-mule wagon: an open body on the running gear and a tongue.
   * Parameter builder: The carrier under construction.
   * Parameter d: The drawn dimensions.
   */
  export function wagon(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    gear(builder, d, {
      track: d.track!,
      pole: d.poleLength!,
      tip: AutoMovieArchetypeCart.WAGON.drop,
      lock: AutoMovieArchetypeCart.WAGON.lock,
      spokes: [12, 14],
      surface: "steel",
    });
    const floor: number = d.wheelDiameter! / 2 + AutoMovieArchetypeCart.WAGON.bed;
    const length: number = d.length!;
    const width: number = d.width!;
    const depth: number = d.bedDepth!;
    const middle: number = d.wheelbase! / 2;
    builder.box(
      "bed-floor",
      v(width, 0.04, length),
      v(0, floor - 0.02, middle),
      { color: WOOD },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.box(
        `bed-${side}`,
        v(BOARD, depth, length),
        v(sign * (width / 2 + BOARD / 2), floor + depth / 2, middle),
        {
          color: PAINT,
        },
      );
    for (const [end, sign] of [
      ["front", 1],
      ["rear", -1],
    ] as const)
      builder.box(
        `bed-${end}`,
        v(width + 2 * BOARD, depth, BOARD),
        v(0, floor + depth / 2, middle + sign * (length / 2 + BOARD / 2)),
        {
          color: PAINT,
        },
      );
    builder.affordance({
      id: "bed",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, floor, middle)),
      extent: null,
      width,
      depth: length,
    });
  }

  /*
   * A brougham: a closed body behind a driver's box, on the running gear with a
   * pole.
   * Parameter builder: The carrier under construction.
   * Parameter d: The drawn dimensions.
   */
  export function carriage(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const c: typeof AutoMovieArchetypeCart.CARRIAGE = AutoMovieArchetypeCart.CARRIAGE;
    const track: number = d.width! - c.hubs;
    const wheelbase: number = d.wheelbase!;
    const front: number = d.frontWheelDiameter! / 2;
    gear(builder, d, {
      track,
      pole: c.pole,
      tip: front,
      lock: c.lock,
      spokes: [12, 12],
    });

    // The body: from the rear to behind the front wheels' reach, between the rear wheels.
    const rear: number = wheelbase / 2 - d.length! / 2;
    const ahead: number = wheelbase - front - 0.05;
    const half: number = track / 2 - 0.15;
    const top: number = d.height!;
    const length: number = ahead - rear;
    const middle: number = (rear + ahead) / 2;
    builder.box(
      "body-floor",
      v(2 * half, 0.05, length),
      v(0, c.floor - 0.025, middle),
      { color: PAINT },
    );
    builder.box(
      "body-roof",
      v(2 * half, 0.05, length),
      v(0, top - 0.025, middle),
      { color: PAINT },
    );
    for (const [end, z] of [
      ["back", rear],
      ["front", ahead],
    ] as const)
      builder.box(
        `body-${end}`,
        v(2 * half, top - c.floor, 0.04),
        v(0, (top + c.floor) / 2, z),
        { color: PAINT },
      );
    const hinge: number = middle + c.door.width / 2;
    const latch: number = middle - c.door.width / 2;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = sign * half;
      for (const [panel, z0, z1] of [
        ["front", hinge, ahead],
        ["back", rear, latch],
      ] as const)
        builder.box(
          `body-${side}-${panel}`,
          v(0.04, top - c.floor, z1 - z0),
          v(x, (top + c.floor) / 2, (z0 + z1) / 2),
          {
            color: PAINT,
          },
        );
      const leaf: string = `door-${side}`;
      builder.box(
        leaf,
        v(0.04, c.door.height, c.door.width),
        v(x, c.floor + c.door.height / 2, middle),
        { color: PAINT },
      );
      builder.affordance({
        id: `${side}Door`,
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(
          v(x, c.floor + c.door.height / 2, hinge),
          v(0, -sign, 0),
          v(0, 0, -1),
        ),
        extent: null,
        travel: c.door.swing,
        parts: [leaf],
      });
      builder.affordance({
        id: `${side}Aperture`,
        kind: "aperture",
        frame: AutoMovieArchetypeFrame.facing(
          v(x, c.floor, middle),
          v(0, 1, 0),
          v(0, 0, sign),
        ),
        extent: null,
        width: c.door.width,
        height: c.door.height,
      });
    }

    // The seat across the body's back, and the driver's box over the front axle.
    const seat: number = c.floor + c.seat;
    builder.box(
      "seat",
      v(2 * half - 0.1, c.seat, 0.5),
      v(0, c.floor + c.seat / 2, rear + 0.3),
      { color: CLOTH, density: 0.2 },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, seat, rear + 0.55)),
      extent: null,
      depth: 0.5,
      width: 2 * half - 0.1,
      back: top - seat - 0.2,
    });
    builder.box("box", v(1, 0.3, 0.45), v(0, c.box - 0.15, wheelbase), {
      color: PAINT,
    });
    builder.affordance({
      id: "box",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, c.box, wheelbase + 0.225)),
      extent: null,
      depth: 0.45,
      width: 1,
    });

    // The box driver's two rein hand stations, ahead of the box's front edge at ANSUR II's elbow rest height above it (`createCart.REST.elbow`), `BOX_HANDS` apart and ahead, provisional; a team's reins run from the bits to them.
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.affordance({
        id: `${side}LineGrip`,
        kind: "rein",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(
            (sign * BOX_HANDS.apart) / 2,
            c.box + AutoMovieArchetypeCart.REST.elbow,
            wheelbase + 0.225 + BOX_HANDS.ahead,
          ),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        aperture: AutoMovieArchetypeCart.LINE,
      });
  }
}

/*
 * A box driver's hands, metres: `apart` between the two rein hand stations and
 * `ahead` of the box's front edge; a construction estimate no source read
 * gives.
 */
const BOX_HANDS: Readonly<Record<"apart" | "ahead", number>> = {
  apart: 0.2,
  ahead: 0.3,
};

/*
 * A wagon body's boards, metres: a construction estimate no act reads.
 */
const BOARD: number = 0.025;

/*
 * The body's paint.
 */
const PAINT: string = "#2f2f3f";

/*
 * Bare wood.
 */
const WOOD: string = "#8b6a43";

/*
 * A seat's cloth.
 */
const CLOTH: string = "#6b2f2f";

/*
 * Add the running gear: the rear pair under the origin and a steering front
 * axle wheelbase ahead. The fixed-length pole pitches on the front axle through
 * drawbarPitch, riding frontAxle; its coupling rides that pitch. The ±180
 * degree travel is a principal-angle representation chart, not a measured
 * mechanical limit or load rating.
 * Parameter builder: The carrier under construction.
 * Parameter d: The drawn dimensions: `wheelDiameter`, `frontWheelDiameter` and
 * `wheelbase` are read.
 * Parameter gear: The track, the pole's length and its end's height at rest, the
 * lock, the front and rear spoke counts, and the tyres' material where a
 * source gives it.
 */
function gear(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  >,
  d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  gear: {
    track: number;
    pole: number;
    tip: number;
    lock: number;
    spokes: readonly [number, number];
    surface?: AutoMovieArchetypeFriction.Material;
  },
): void {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const wheelbase: number = d.wheelbase!;
  const front: number = d.frontWheelDiameter! / 2;
  CartWheel.pair(builder, {
    track: gear.track,
    radius: d.wheelDiameter! / 2,
    spokes: gear.spokes[1],
    z: 0,
    prefix: "rear-",
    spins: ["rearLeftSpin", "rearRightSpin"],
    ...(gear.surface === undefined ? {} : { surface: gear.surface }),
  });
  const axle: string[] = CartWheel.pair(builder, {
    track: gear.track,
    radius: front,
    spokes: gear.spokes[0],
    z: wheelbase,
    prefix: "front-",
    spins: ["frontLeftSpin", "frontRightSpin"],
    rides: "frontAxle",
    ...(gear.surface === undefined ? {} : { surface: gear.surface }),
  });
  const reach: number = Math.sqrt(gear.pole ** 2 - (front - gear.tip) ** 2);
  const tip: IAutoMovieVector3 = v(0, gear.tip, wheelbase + reach);
  builder.rod("pole", 0.04, v(0, front, wheelbase), tip, { color: WOOD });
  builder.affordance({
    id: "frontAxle",
    kind: "wheel",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, front, wheelbase),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    travel: gear.lock,
    parts: [...axle],
  });
  builder.affordance({
    id: "drawbarPitch",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, front, wheelbase),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    travel: 180,
    reverse: 180,
    parts: ["pole"],
    rides: "frontAxle",
  });
  builder.affordance({
    id: "coupling",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.upright(tip),
    extent: null,
    rides: "drawbarPitch",
  });
}
