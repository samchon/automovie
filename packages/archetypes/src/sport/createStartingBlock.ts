import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's block reads as, not read at a source. */
const MAKER: string = "a common maker's starting block, not read at a source";

/**
 * A sprinter's starting block: a rail along the lane with a front and a rear foot plate.
 *
 * The rail runs back along `-Z` from its front end at the origin, the runner facing `+Z`. The front plate stands `setback` behind the front end and the rear plate `spacing` behind that, each tilted back by `angle` from upright and set a little to its own side of the rail. `front` and `rear` are the plates the soles press, each `+Y` out of its plate toward the sole and `+X` across the foot; which foot goes forward is the runner's.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The starting block.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the block lies, where each plate stands and how it is tilted, and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A rail box, and two plate boxes each turned about `X` by the drawn angle so its face looks forward and up, its lowest edge on the rail's top.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the rail, then each plate with its contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No spikes, ratchets or pedal faces; the rail's and plates' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStartingBlock(
  params: createStartingBlock.IParams = {},
  seed?: number | string,
): Archetype<createStartingBlock.Affordance, createStartingBlock.Dimension> {
  const d: Record<createStartingBlock.Dimension, number> =
    ArchetypeDraw.dimensions(
      "startingBlock",
      createStartingBlock.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createStartingBlock.Affordance,
    createStartingBlock.Dimension
  > = new ArchetypeBuilder({
    archetype: "startingBlock",
    id: params.id,
    name: "starting block",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const rail: number = createStartingBlock.RAIL;
  const plate: Readonly<{ width: number; height: number; thick: number }> =
    createStartingBlock.PLATE;
  const length: number = d.setback + d.spacing + plate.height;
  builder.box("rail", v(rail, rail / 2, length), v(0, rail / 4, -length / 2), {
    color: "#8a8d91",
  });
  const tilt: number = (d.angle * Math.PI) / 180;
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
      rail / 2 + (plate.height / 2) * Math.cos(tilt) + (plate.thick / 2) * Math.sin(tilt),
      -back - (plate.height / 2) * Math.sin(tilt) - (plate.thick / 2) * Math.cos(tilt),
    );
    builder.box(`${id}Plate`, v(plate.width, plate.height, plate.thick), centre, {
      color: "#2c2f33",
      rotation,
    });
    builder.affordance({
      id,
      kind: "pedal",
      frame: ArchetypeFrame.facing(
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

/**
 * Companion types, constants and bands of {@link createStartingBlock}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension, the setting a sprinter adjusts: how far back the plates stand, how far apart and how steep.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two plates a crouch start presses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a block, so every band is provisional; the rail's and plates' sizes are named estimates.
 */
export namespace createStartingBlock {
  /** The rail's width, metres; its height is half of it: an estimate. */
  export const RAIL: number = 0.06;

  /** Each plate's width across the foot, height along its face and thickness, metres: estimates. */
  export const PLATE: Readonly<{ width: number; height: number; thick: number }> = {
    width: 0.12,
    height: 0.2,
    thick: 0.02,
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
   * - `mass`: kilograms.
   */
  export type Dimension = "setback" | "spacing" | "angle" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `startingBlock` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    setback: ArchetypeBand.metres(0.1, 0.25, MAKER, true),
    spacing: ArchetypeBand.metres(
      0.25,
      0.45,
      "a bunched to an elongated start's plate spacing, recalled and not read",
      true,
    ),
    angle: ArchetypeBand.of(
      "degrees",
      25,
      50,
      "plates 40 to 65 degrees from the track, recalled and not read, read as a tilt back from upright",
      true,
    ),
    mass: ArchetypeBand.of("kg", 5, 10, MAKER, true),
  };
}
