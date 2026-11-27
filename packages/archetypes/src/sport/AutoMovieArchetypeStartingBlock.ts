import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** What no source read gives. */
const UNREAD: string =
  "World Athletics Technical Rule 15.2 (2020 edition, https://athletics.lv/file/download/61151) sets no size or setting, and the makers' pages read state none";

/** Constructs the starting block archetype from its recipe. */
export namespace AutoMovieArchetypeStartingBlock {
/**
 * A sprinter's starting block: a rail along the lane with a front and a rear
 * foot plate.
 *
 * The rail runs back along `-Z` from its front end at the origin, the runner
 * facing `+Z`. The front plate stands `setback` behind the front end and the
 * rear plate `spacing` behind that, each tilted back by `angle` from upright
 * and set a little to its own side of the rail. `front` and `rear` are the
 * plates the soles press, each `+Y` out of its plate toward the sole and `+X`
 * across the foot; which foot goes forward is the runner's.
 *
 * @param params The block's model and any setting the author fixes.
 * @param seed The seed that draws the model when it is not given and every
 *   setting left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The starting block.
 * @throws {AutoMovieArchetypeRefusal} For a model Polanik does not list with
 *   its sizes, or a fixed setting outside its band.
 */
export function create(
  params: AutoMovieArchetypeStartingBlock.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStartingBlock.Affordance,
  AutoMovieArchetypeStartingBlock.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStartingBlock.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeStartingBlock.Dimension>(
      "startingBlock",
      AutoMovieArchetypeStartingBlock.UNITS,
      seed,
      params,
    );
  const model: {
    name: AutoMovieArchetypeStartingBlock.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeStartingBlock.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeStartingBlock.Model>(
    "model",
    params.model,
    AutoMovieArchetypeStartingBlock.MODELS,
  );
  const d: Record<AutoMovieArchetypeStartingBlock.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeStartingBlock.BANDS),
    rail: model.figures.rail!,
    plateWidth: model.figures.plateWidth!,
    plateHeight: model.figures.plateHeight!,
    mass: model.figures.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStartingBlock.Affordance,
    AutoMovieArchetypeStartingBlock.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `starting block ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const rail: number = d.rail;
  const plate: Readonly<{ width: number; height: number; thick: number }> = {
    width: d.plateWidth,
    height: d.plateHeight,
    thick: AutoMovieArchetypeStartingBlock.PLATE_THICKNESS,
  };
  const length: number = d.setback + d.spacing + plate.height;
  builder.box("rail", v(rail, rail / 2, length), v(0, rail / 4, -length / 2), {
    color: "#8a8d91",
  });
  const tilt: number = d.angle * AutoMovieArchetypeUnits.DEGREE;
  // Turned about -X, the plate's top leans back toward -Z and its face
  // (+Z) looks forward and up.
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    v(1, 0, 0),
    -d.angle,
  );
  const normal: IAutoMovieVector3 = v(0, Math.sin(tilt), Math.cos(tilt));
  for (const [id, back, side] of [
    ["front", d.setback, -1],
    ["rear", d.setback + d.spacing, 1],
  ] as const) {
    // The plate's centre: its lowest (back) edge on the rail's top, its
    // face's bottom edge `back` behind the rail's front end.
    const centre: IAutoMovieVector3 = v(
      (side * (rail + plate.width)) / 2,
      rail / 2 +
        (plate.height / 2) * Math.cos(tilt) +
        (plate.thick / 2) * Math.sin(tilt),
      -back -
        (plate.height / 2) * Math.sin(tilt) -
        (plate.thick / 2) * Math.cos(tilt),
    );
    builder.box(
      `${id}Plate`,
      v(plate.width, plate.height, plate.thick),
      centre,
      {
        color: "#2c2f33",
        rotation,
      },
    );
    builder.affordance({
      id,
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.add(centre, Vector3.scale(normal, plate.thick / 2)),
        normal,
        v(1, 0, 0),
      ),
      extent: null,
      width: plate.width,
      depth: plate.height,
    });
  }
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createStartingBlock}. */
export namespace AutoMovieArchetypeStartingBlock {
  /** Each plate's thickness, metres: an estimate. */
  export const PLATE_THICKNESS: number = 0.02;

  /** Polanik's competition blocks. */
  export type Model = "PBS-01" | "PBS15-02-W";

  /**
   * Each block's figures, metres and kilograms, the default first: the steel
   * PBS-01 "with an 85 x 7.5 cm centre bar and 19 x 11.5 cm footplates, 7.7 kg"
   * (https://www.athleticsdirect.co.uk/product/polanik-competition-steel-starting-blocks);
   * the aluminium PBS15-02-W "with a 90.8 x 8 cm bar and 24.5 x 13 cm plates,
   * 5.4 kg"
   * (https://www.athleticsdirect.co.uk/product/polanik-competition-aluminium-starting-block).
   * A plate's larger figure is its height along the face, its smaller its width
   * across the foot.
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "PBS-01": { rail: 0.075, plateWidth: 0.115, plateHeight: 0.19, mass: 7.7 },
    "PBS15-02-W": {
      rail: 0.08,
      plateWidth: 0.13,
      plateHeight: 0.245,
      mass: 5.4,
    },
  };

  /**
   * The affordance ids:
   *
   * - `front`: the front plate's face.
   * - `rear`: the rear plate's face.
   */
  export type Affordance = "front" | "rear";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `setback`: the front plate behind the rail's front end.
   * - `spacing`: the rear plate behind the front plate.
   * - `angle`: each plate tilted back from upright, degrees.
   * - `rail`: the bar's width; its height is half of it, an estimate.
   * - `plateWidth`, `plateHeight`: each plate across the foot and along its face.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "setback"
    | "spacing"
    | "angle"
    | "rail"
    | "plateWidth"
    | "plateHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    setback: "m",
    spacing: "m",
    angle: "degrees",
    rail: "m",
    plateWidth: "m",
    plateHeight: "m",
    mass: "kg",
  };

  /** The settings a sprinter adjusts. */
  export type Setting = "setback" | "spacing" | "angle";

  /**
   * The parameters: the block, and any setting fixed to a value inside its
   * band.
   */
  export interface IParams extends Partial<Record<Setting, number>> {
    /** Polanik's block; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `startingBlock` when absent. */
    id?: string;
  }

  /** The band of each setting. */
  export const BANDS: Readonly<Record<Setting, IAutoMovieArchetypeBand>> = {
    setback: AutoMovieArchetypeBand.metres(0.1, 0.25, UNREAD, true),
    spacing: AutoMovieArchetypeBand.metres(0.25, 0.45, UNREAD, true),
    angle: AutoMovieArchetypeBand.of("degrees", 25, 50, UNREAD, true),
  };
}
