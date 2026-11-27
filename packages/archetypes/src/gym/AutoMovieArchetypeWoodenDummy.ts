import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The dummies, from a search only. */
const LISTINGS: string =
  "wing chun wooden dummies (muk yan jong): trunk about 55 to 60 in tall and 8 to 9 in across, arms protruding about 12 in (29.5 cm), the leg about 25 in, 9.5 in from the upper arms to the middle arm and 13 in from the middle arm to the leg, as makers' and retailers' listings give them in search results; not read";

/** Constructs the wooden dummy archetype from its recipe. */
export namespace AutoMovieArchetypeWoodenDummy {
/**
 * A wing chun wooden dummy: an upright trunk with two upper arms, a middle arm
 * below them and one leg angled down to the floor, all toward `+Z`.
 *
 * The origin is on the floor under the trunk's axis, `+Y` up, the arms and the
 * leg reaching toward `+Z`, the side the trainee stands on. Its affordances are
 * the surfaces a strike lands on: `trunk`, the trunk's face between the upper
 * and middle arms; `armLeft` and `armRight`, the upper arms' ends, `armMiddle`
 * the middle arm's, and `leg`, the leg's knee where it bends down. Each faces
 * `+Z` except the leg's, which faces up and forward. The upper arms' height is
 * the trainee's shoulder's, which the listings leave to the stand; its band is
 * provisional.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The wooden dummy.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeWoodenDummy.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeWoodenDummy.Affordance,
  AutoMovieArchetypeWoodenDummy.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWoodenDummy.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeWoodenDummy.Dimension>(
      "woodenDummy",
      AutoMovieArchetypeWoodenDummy.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeWoodenDummy.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeWoodenDummy.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWoodenDummy.Affordance,
    AutoMovieArchetypeWoodenDummy.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "wooden dummy",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.diameter / 2;
  const arm: number = 0.025;
  const upper: number = d.shoulder;
  const middle: number = upper - AutoMovieArchetypeWoodenDummy.UPPER_TO_MIDDLE;
  const knee: number = middle - AutoMovieArchetypeWoodenDummy.MIDDLE_TO_LEG;
  const top: number = Math.max(upper + 0.15, knee + d.height);
  const bottom: number = top - d.height;
  const color: string = "#7a4a26";
  builder.rod("trunk", radius, v(0, bottom, 0), v(0, top, 0), { color });
  const reach: number = radius + d.arm;
  for (const [name, x] of [
    ["armLeft", 0.06],
    ["armRight", -0.06],
  ] as const)
    builder.rod(name, arm, v(x, upper, 0), v(x * 2, upper, reach), { color });
  builder.rod("armMiddle", arm, v(0, middle, 0), v(0, middle, reach), {
    color,
  });
  // The leg leaves the trunk level, then bends down to the floor.
  const legEnd: number = radius + d.leg;
  builder.rod("legUpper", arm * 1.4, v(0, knee, 0), v(0, knee, 0.55 * legEnd), {
    color,
  });
  builder.rod(
    "legLower",
    arm * 1.4,
    v(0, knee, 0.55 * legEnd),
    v(0, 0, legEnd),
    {
      color,
    },
  );

  const face = (
    id: AutoMovieArchetypeWoodenDummy.Affordance,
    point: ReturnType<typeof v>,
    normal: ReturnType<typeof v>,
    width: number,
  ): void => {
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(point, normal, v(1, 0, 0)),
      extent: null,
      width,
      depth: width,
    });
  };
  face("trunk", v(0, (upper + middle) / 2, radius), v(0, 0, 1), d.diameter);
  face("armLeft", v(0.12, upper + arm, reach - 0.05), v(0, 1, 0), 2 * arm);
  face("armRight", v(-0.12, upper + arm, reach - 0.05), v(0, 1, 0), 2 * arm);
  face("armMiddle", v(0, middle + arm, reach - 0.05), v(0, 1, 0), 2 * arm);
  face(
    "leg",
    v(0, knee, 0.55 * legEnd + 1.4 * arm),
    Vector3.normalize(v(0, 0.4, 1)),
    2.8 * arm,
  );
  return builder.build(d.mass);
}

  /**
   * The affordance ids:
   *
   * - `trunk`: the trunk's face between the upper and middle arms, along `+Z`.
   * - `armLeft`, `armRight`: the top of each upper arm near its end.
   * - `armMiddle`: the top of the middle arm near its end.
   * - `leg`: the leg's knee, facing up and forward.
   */
  export type Affordance =
    | "trunk"
    | "armLeft"
    | "armRight"
    | "armMiddle"
    | "leg";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the trunk's.
   * - `diameter`: the trunk's.
   * - `arm`: how far an arm protrudes from the trunk.
   * - `leg`: how far the leg reaches forward of the trunk.
   * - `shoulder`: the upper arms' height above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "diameter"
    | "arm"
    | "leg"
    | "shoulder"
    | "mass";

  /** The upper arms' height above the middle arm's, metres: 9.5 in. */
  export const UPPER_TO_MIDDLE: number = 9.5 * AutoMovieArchetypeUnits.INCH;

  /** The middle arm's height above the leg's, metres: 13 in. */
  export const MIDDLE_TO_LEG: number = 13 * AutoMovieArchetypeUnits.INCH;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    arm: "m",
    leg: "m",
    shoulder: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `woodenDummy` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      55 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      LISTINGS,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      8 * AutoMovieArchetypeUnits.INCH,
      9 * AutoMovieArchetypeUnits.INCH,
      LISTINGS,
      true,
    ),
    arm: AutoMovieArchetypeBand.metres(
      0.295,
      12 * AutoMovieArchetypeUnits.INCH,
      LISTINGS,
      true,
    ),
    leg: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      LISTINGS,
      true,
    ),
    shoulder: AutoMovieArchetypeBand.metres(
      1.2,
      1.4,
      "provisional: a trainee's shoulder height, which the listings leave to the stand",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      25,
      45,
      "provisional: no listing read gives a mass",
      true,
    ),
  };
}
