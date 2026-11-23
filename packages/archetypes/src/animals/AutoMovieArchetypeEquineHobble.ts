import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/** The pose's frame: the hobble is posed in world coordinates. */
const WORLD: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
  x: 0,
  y: 0,
  z: 0,
});

/**
 * A fore hobble (`createHobble`) worn by a moving equid: at each film second
 * each cuff closes round its foreleg's cannon a little above the fetlock, along
 * the cannon's own axis, and the strap is laid between the cuffs' inner sides.
 *
 * The cuffs are posed in world coordinates from the equid's sample, so the
 * strap's drawn length is the distance the forelegs hold the cuffs apart; read
 * with `AutoMovieArchetype.span("strap")`.
 */
export namespace AutoMovieArchetypeEquineHobble {
  /**
   * How far above the fetlock a cuff's middle sits, metres: authored, a cuff's
   * width above the joint so it closes round the cannon.
   */
  export const ABOVE: number = 0.05;

  /**
   * The hobble's ride on an equid's ride.
   *
   * @param hobble The hobble.
   * @param ride The equid's ride.
   * @returns The hobble's ride.
   */
  export function ride<Id extends string, D extends string>(
    hobble: AutoMovieArchetype<never, never>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
  ): AutoMovieArchetypeRide.IRide<never, never> {
    const at = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<never, never> => {
      const horse: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const cuffs: ReadonlyMap<string, IAutoMovieTransform> = new Map([
        ["leftCuff", cuff(horse, "leftFore")],
        ["rightCuff", cuff(horse, "rightFore")],
      ]);
      const parts: IAutoMovieModelPart[] = hobble.parts.map(
        (part: IAutoMovieModelPart): IAutoMovieModelPart => {
          const transform: IAutoMovieTransform | undefined = cuffs.get(part.id);
          return transform === undefined ? part : { ...part, transform };
        },
      );
      return {
        archetype: hobble.reposed(parts),
        placement: AutoMovieArchetypeFrame.copy(WORLD),
        course: horse.course,
      };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      frame: (): IAutoMovieTransform => AutoMovieArchetypeFrame.copy(WORLD),
    };
  }

  /** A cuff's world frame on a fore cannon of a sample. */
  function cuff<Id extends string, D extends string>(
    sample: AutoMovieArchetypeRide.ISample<Id, D>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieTransform {
    const cannon: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][2],
    )!;
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      sample.placement,
      cannon.transform!,
    );
    const length: number =
      cannon.geometry.type === "primitive" &&
      (cannon.geometry.shape.type === "capsule" ||
        cannon.geometry.shape.type === "cylinder")
        ? cannon.geometry.shape.height
        : NaN;
    const down: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    return {
      translation: Vector3.addScaled(
        frame.translation,
        down,
        length / 2 - ABOVE,
      ),
      rotation: frame.rotation,
      scale: AutoMovieArchetypeFrame.copy(WORLD).scale,
    };
  }
}
