import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import { ADA_RANGES } from "./constants/ADA_RANGES";

/** The accessible car read. */
const ADA: string =
  "2010 ADA Standards 407.4.1 and Table 407.4.1, centered door: door clear width 42 in (1065 mm), inside car 80 in (2030 mm) side to side, 51 in (1295 mm) back wall to front return, 54 in (1370 mm) back wall to inside face of door; a tolerance of minus 5/8 in (16 mm) on the door (https://www.access-board.gov/ada/chapter/ch04/)";

/** The call button's height read. */
const CALL: string = `2010 ADA Standards 407.2.1.1, call buttons "located within one of the reach ranges specified in 308", measured to the centreline of the highest operable part (https://www.access-board.gov/ada/chapter/ch04/); ${ADA_RANGES.reach.source}`;

/**
 * A landing call station's faceplate, metres: KONE KSS 280's landing call
 * station, 58 wide, 180 high and 15 thick
 * (https://www.kone.com.au/Images/KONE%20KSS280%20Signalisation_tcm46-17878.pdf).
 */
const STATION: Readonly<{ width: number; height: number; depth: number }> = {
  width: 0.058,
  height: 0.18,
  depth: 0.015,
};

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `wall`, the car's wall and roof thickness;
 * `leaf`, a door leaf's thickness; `across`, the call station's place across
 * the `+X` front return, as a share of the return's width from the opening,
 * which no source read places and no act reads until a press act places the
 * hand.
 */
const ESTIMATES: Readonly<{ wall: number; leaf: number; across: number }> = {
  wall: 0.05,
  leaf: 0.03,
  across: 0.5,
};

/**
 * A passenger lift car, with its construction and companion types.
 */
export namespace AutoMovieArchetypeElevator {

/**
 * A passenger lift's car at a landing: the accessible car with a centred,
 * centre-opening door.
 *
 * The car's floor is at the landing's level, `y = 0`, and the inside face of
 * its closed door lies in the plane `z = 0`, the car behind it toward `-Z` and
 * the landing toward `+Z`; a person enters walking `-Z`. The front returns
 * flank the door at the depth the regulation gives between the door's face and
 * the front return. Each door leaf slides out toward its own side by half the
 * clear width, opening the entrance.
 *
 * A landing call station, KONE's faceplate, stands on the `+X` front return's
 * landing face at the drawn call height; `call` is its button. Its place across
 * the return is a construction estimate, since no source read places it. The
 * car is built for static use: riding it between floors is standing on a moving
 * support, which no motion law covers yet (#3491). The car's own buttons are
 * not declared, since no source read places them.
 *
 * @param params The car's and the door's heights and any dimension the author
 *   fixes.
 * @param seed The seed that draws each height not given and every dimension
 *   left free inside its band; absent, the least heights and the middle of each
 *   band.
 * @returns The lift car.
 * @throws {AutoMovieArchetypeRefusal} For a car height the guide does not list,
 *   a door height it does not list or one not below the car's, or a fixed
 *   dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeElevator.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeElevator.Affordance, AutoMovieArchetypeElevator.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeElevator.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeElevator.Dimension>(
      "elevator",
      AutoMovieArchetypeElevator.UNITS,
      seed,
      params,
    );
  type Picked = {
    name: AutoMovieArchetypeElevator.Height | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeElevator.Dimension, number>>>;
  };
  const car: Picked = draw.model<AutoMovieArchetypeElevator.Height>(
    "car",
    params.car,
    AutoMovieArchetypeElevator.CARS,
  );
  const height: number = car.figures.height!;
  // A door is picked only among the heights below the car's, so it never reaches the roof.
  const door: Picked = draw.model<AutoMovieArchetypeElevator.Height>(
    "doorway",
    params.doorway,
    Object.fromEntries(
      Object.entries(AutoMovieArchetypeElevator.DOORS).filter(
        ([, figures]: [
          string,
          (
            | Readonly<Partial<Record<AutoMovieArchetypeElevator.Dimension, number>>>
            | undefined
          ),
        ]): boolean => figures!.doorHeight! < height,
      ),
    ),
  );
  const doorHeight: number = door.figures.doorHeight!;
  const d: Record<
    Exclude<AutoMovieArchetypeElevator.Dimension, "height" | "doorHeight">,
    number
  > = draw.dimensions(AutoMovieArchetypeElevator.BANDS);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeElevator.Affordance,
    AutoMovieArchetypeElevator.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `lift car ${car.name} mm, door ${door.name} mm`,
    draw,
  });
  const E: typeof ESTIMATES = ESTIMATES;
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width;
  const back: number = -d.depth;
  const returns: number = back + d.returnDepth;
  const clear: number = d.door;
  const half: number = clear / 2;
  const middle: number = back / 2;
  const grey: string = "#9aa1a8";
  builder.box(
    "floor",
    v(width + 2 * E.wall, E.wall, d.depth),
    v(0, -E.wall / 2, middle),
    { color: "#5d6166" },
  );
  builder.box(
    "roof",
    v(width + 2 * E.wall, E.wall, d.depth),
    v(0, height + E.wall / 2, middle),
    { color: grey },
  );
  builder.box(
    "back",
    v(width + 2 * E.wall, height, E.wall),
    v(0, height / 2, back - E.wall / 2),
    { color: grey },
  );
  for (const [id, sign] of [
    ["side-left", 1],
    ["side-right", -1],
  ] as const)
    builder.box(
      id,
      v(E.wall, height, d.depth),
      v((sign * (width + E.wall)) / 2, height / 2, middle),
      { color: grey },
    );
  const strip: number = (width - clear) / 2;
  for (const [id, sign] of [
    ["return-left", 1],
    ["return-right", -1],
  ] as const)
    builder.box(
      id,
      v(strip, height, E.wall),
      v(sign * (half + strip / 2), height / 2, returns + E.wall / 2),
      { color: grey },
    );
  builder.box(
    "header",
    v(clear, height - doorHeight, E.wall),
    v(0, (height + doorHeight) / 2, returns + E.wall / 2),
    { color: grey },
  );
  for (const [id, sign] of [
    ["leftDoor", 1],
    ["rightDoor", -1],
  ] as const) {
    const part: string = `${id}-leaf`;
    const x: number = (sign * half) / 2;
    builder.box(
      part,
      v(half, doorHeight, E.leaf),
      v(x, doorHeight / 2, E.leaf / 2),
      { color: "#c3c8cd" },
    );
    builder.affordance({
      id,
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, doorHeight / 2, E.leaf),
        v(0, 0, 1),
        v(sign, 0, 0),
      ),
      extent: null,
      travel: half,
      parts: [part],
    });
  }
  const station: number = returns + E.wall + STATION.depth / 2;
  const across: number = half + strip * E.across;
  builder.box(
    "call-station",
    v(STATION.width, STATION.height, STATION.depth),
    v(across, d.callHeight, station),
    { color: "#b9bec4" },
  );
  builder.affordance({
    id: "call",
    kind: "button",
    frame: AutoMovieArchetypeFrame.facing(
      v(across, d.callHeight, station + STATION.depth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "entrance",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: clear,
    height: doorHeight,
  });
  builder.affordance({
    id: "floor",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, middle)),
    extent: null,
    width,
    depth: d.depth,
  });
  return builder.build(d.mass);
}

}

/** Companion types and bands of {@link AutoMovieArchetypeElevator}. */
export namespace AutoMovieArchetypeElevator {
  /**
   * The affordance ids:
   *
   * - `entrance`: the door's clear opening, an aperture in the plane of the
   *   door's inside face.
   * - `leftDoor`, `rightDoor`: the leaves on `+X` and `-X`, sliders running out
   *   along their own side by half the clear width.
   * - `floor`: the car's floor, the surface the riders stand on.
   * - `call`: the landing call button, pressed along `-Z`.
   */
  export type Affordance =
    | "entrance"
    | "leftDoor"
    | "rightDoor"
    | "floor"
    | "call";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: inside the car, side to side.
   * - `depth`: from the back wall to the door's inside face.
   * - `returnDepth`: from the back wall to the front return.
   * - `door`: the door's clear width.
   * - `height`: inside the car, its model's; `doorHeight`: the door's clear
   *   height, its model's.
   * - `callHeight`: the landing call button's centre above the floor.
   * - `mass`: the car, kilograms.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "returnDepth"
    | "door"
    | "height"
    | "doorHeight"
    | "callHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    returnDepth: "m",
    door: "m",
    height: "m",
    doorHeight: "m",
    callHeight: "m",
    mass: "kg",
  };

  /**
   * The car and door heights the KONE guide lists, millimetres: KONE MonoSpace
   * 4 DX Core and Pro / 300 and 500 DX planning guide: p. 2, car heights 2 100
   * and 2 200 mm (Core) and 2 100, 2 200, 2 300 and 2 400 mm (Pro); p. 9, door
   * heights 2 000, 2 100, 2 200 and 2 300 mm; centre-opening doors
   * (https://www.kone.co.uk/Images/KONE-MonoSpace-4-DX-Core-and-Pro-Planning-Guide-GBIR_tcm45-139450.pdf).
   */
  export type Height = "2000" | "2100" | "2200" | "2300" | "2400";

  /**
   * The car heights inside the car, the MonoSpace 4 DX Pro's, metres, the least
   * first.
   */
  export const CARS: Readonly<
    Partial<Record<Height, Readonly<Partial<Record<Dimension, number>>>>>
  > = {
    "2100": { height: 2.1 },
    "2200": { height: 2.2 },
    "2300": { height: 2.3 },
    "2400": { height: 2.4 },
  };

  /** The door's clear heights, metres, the least first. */
  export const DOORS: Readonly<
    Partial<Record<Height, Readonly<Partial<Record<Dimension, number>>>>>
  > = {
    "2000": { doorHeight: 2.0 },
    "2100": { doorHeight: 2.1 },
    "2200": { doorHeight: 2.2 },
    "2300": { doorHeight: 2.3 },
  };

  /**
   * The parameters: the heights, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "height" | "doorHeight">, number>
  > {
    /** The car's height inside; drawn from the seed when absent. */
    car?: Height;

    /**
     * The door's clear height, below the car's; drawn from the seed when
     * absent.
     */
    doorway?: Height;

    /** The model's id, unique in a scene; `elevator` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "height" | "doorHeight">, IAutoMovieArchetypeBand>
  > = {
    width: AutoMovieArchetypeBand.metres(2.03, 2.03, ADA),
    depth: AutoMovieArchetypeBand.metres(1.37, 1.37, ADA),
    returnDepth: AutoMovieArchetypeBand.metres(1.295, 1.295, ADA),
    door: AutoMovieArchetypeBand.metres(1.049, 1.065, ADA),
    callHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.reach.low,
      ADA_RANGES.reach.high,
      CALL,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      500,
      1000,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
