import {
  type AutoMovieArchetypeEquineFordPlan,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The shared authored crossing of the ford and swim specs and their independent geometric readers.
 *
 * A ford descends along +Z from Y=0 at a grade of 0.07, which the wading
 * course follows with its rise, to a deep channel at Y=-3; the far bank is a
 * flat shelf at a chosen height. The water stands so that the floating 1.72 m
 * horse's standing sole level, the water less the immersion and the back's
 * height (0.95 of the withers height, `createHorse.BACK`), is `LEVEL`. The
 * specs read these heights back only through the planes.
 */
export namespace equineFordScene {
  /** The horse's back below the water while floating, metres. */
  export const IMMERSION: number = 0.1;

  /** The floating 1.72 m horse's standing sole level, metres: just above the ford's bed under the last wading hooves. */
  export const LEVEL: number = -1.85;

  /** The water's surface height, metres: the standing sole level raised by the immersion and the back's height. */
  export const WATER: number = LEVEL + IMMERSION + 0.95 * 1.72;

  /** The swimming speed, metres per second: inside the forelimb study's Table 1 1.1 ± 0.2 m/s and above the horse's slowest declared walk, which the wading's end and the climbing's start share. */
  export const SPEED: number = 1.2;

  /** One stroke cycle, seconds: the forelimb study's Table 1 mean. */
  export const CYCLE: number = 1.1;

  /** Where the wading course ends, metres along +Z. */
  export const FLOAT_AT: number = 28;

  /** The straight swim, metres. */
  export const LENGTH: number = 7.5;

  /** The far bank shelf's start, metres along +Z. */
  export const SHELF_AT: number = 31;

  /**
   * The crossing's parameters with a far shelf at a chosen height.
   *
   * @param shelf The far bank shelf's height, world metres.
   * @returns The parameters.
   */
  export function params(
    shelf: number,
  ): AutoMovieArchetypeEquineFordPlan.IParams {
    return {
      water: WATER,
      footing: footing(shelf),
      start: { x: 0, z: 0, heading: 0 },
      entry: {
        legs: [{ kind: "straight", length: FLOAT_AT, rise: -0.07 * FLOAT_AT }],
        cruise: SPEED,
        acceleration: 0.5,
        gait: "walk",
      },
      swim: {
        length: LENGTH,
        speed: SPEED,
        cycle: CYCLE,
        immersion: IMMERSION,
        neck: 40,
      },
      recovery: {
        legs: [{ kind: "straight", length: 5 }],
        cruise: SPEED,
        deceleration: 0.5,
        gait: "walk",
      },
      transition: 0.6,
    };
  }

  /**
   * The planes: the ford, the channel and the far shelf.
   *
   * @param shelf The shelf's height, world metres.
   * @returns The footing scene.
   */
  export function footing(
    shelf: number,
  ): AutoMovieArchetypeQuadrupedFooting.IScene {
    return {
      planes: [
        {
          id: "ford",
          origin: { x: 0, y: 0, z: 0 },
          x: [-6, 6],
          z: [-6, 29.5],
          slope: { x: 0, z: -0.07 },
        },
        {
          id: "channel",
          origin: { x: 0, y: -3, z: 29.5 },
          x: [-6, 6],
          z: [29.5, SHELF_AT],
          slope: { x: 0, z: 0 },
        },
        {
          id: "shelf",
          origin: { x: 0, y: shelf, z: SHELF_AT },
          x: [-6, 6],
          z: [SHELF_AT, 60],
          slope: { x: 0, z: 0 },
        },
      ],
    };
  }

  /**
   * The world frame of an emitted part.
   *
   * @param sample A displayed second.
   * @param id The part.
   * @returns Its world transform.
   */
  export function frame(
    sample: AutoMovieArchetypeEquineFordPlan.ISample<string, string>,
    id: string,
  ): IAutoMovieTransform {
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    )!;
    return AutoMovieArchetypeFrame.compose(sample.placement, part.transform!);
  }

  /**
   * The two ends of an emitted bar along its own axis, in model space: its upper joint first.
   *
   * @param part The bar.
   * @returns The two ends.
   */
  export function ends(
    part: IAutoMovieModelPart,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    if (
      part.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule")
    )
      throw new Error(`${part.id} is not a bar`);
    const half: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: part.geometry.shape.height / 2, z: 0 },
    );
    return [
      AutoMovieEngineVector3.subtract(part.transform!.translation, half),
      AutoMovieEngineVector3.add(part.transform!.translation, half),
    ];
  }

  /**
   * The included side-view angle at a joint between two emitted bars, measured on the front of the joint, degrees in [0, 360).
   *
   * @param upper The bar above the joint.
   * @param lower The bar below it.
   * @returns The front-side angle from the lower ray round to the upper ray.
   */
  export function front(
    upper: IAutoMovieModelPart,
    lower: IAutoMovieModelPart,
  ): number {
    const [top, joint] = ends(upper);
    const [, bottom] = ends(lower);
    const polar = (to: IAutoMovieVector3): number =>
      (Math.atan2(to.y - joint.y, to.z - joint.z) * 180) / Math.PI;
    const angle: number = polar(top) - polar(bottom);
    return angle - 360 * Math.floor(angle / 360);
  }

  /**
   * The lowest world surface of an emitted solid along a plane's normal, as signed separation from that plane.
   *
   * @param part The emitted part.
   * @param placement Its model's placement.
   * @param plane The authored plane.
   * @returns Metres above the plane, negative inside it.
   */
  export function separation(
    part: IAutoMovieModelPart,
    placement: IAutoMovieTransform,
    plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
  ): number {
    if (part.geometry.type !== "primitive")
      throw new Error(`${part.id} is not a primitive`);
    const shape = part.geometry.shape;
    const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      placement,
      part.transform!,
    );
    const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
      x: -plane.slope.x,
      y: 1,
      z: -plane.slope.z,
    });
    const centre: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(world.translation, plane.origin),
      normal,
    );
    const axis = (local: IAutoMovieVector3): number =>
      Math.abs(
        AutoMovieEngineVector3.dot(AutoMovieEngineQuaternion.rotateVector(world.rotation, local), normal),
      );
    if (shape.type === "sphere") return centre - shape.radius;
    if (shape.type === "box")
      return (
        centre -
        (axis({ x: shape.width / 2, y: 0, z: 0 }) +
          axis({ x: 0, y: shape.height / 2, z: 0 }) +
          axis({ x: 0, y: 0, z: shape.depth / 2 }))
      );
    if (shape.type === "capsule")
      return centre - axis({ x: 0, y: shape.height / 2, z: 0 }) - shape.radius;
    if (shape.type === "cylinder") {
      const along: number = axis({ x: 0, y: 1, z: 0 });
      return (
        centre -
        (along * shape.height) / 2 -
        shape.radius * Math.sqrt(Math.max(0, 1 - along * along))
      );
    }
    throw new Error(`${part.id} has an unsupported ${shape.type}`);
  }

  /** The bars of each limb, top down. */
  export const BONES: typeof AutoMovieArchetypeQuadrupedBody.BONES =
    AutoMovieArchetypeQuadrupedBody.BONES;
}
