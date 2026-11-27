import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeHorseRide,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Readers of a horse's ride the gait specs share: its landings and its hooves in the world.
 */
export namespace archetypeHorseRide {
  /**
   * The seconds of every landing of a limb's hoof over the whole ride, in time order.
   *
   * @param ride The ride.
   * @param limb The hoof.
   * @returns The seconds.
   */
  export function footfalls(
    ride: ReturnType<typeof AutoMovieArchetypeHorseRide.ride>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number[] {
    return ride.instants
      .filter((i: { label: string }): boolean => i.label === `${limb}On`)
      .map((i: { seconds: number }): number => i.seconds);
  }

  /**
   * Where a limb's hoof joint, the lower end of its lowest bone, is in the world at a second.
   *
   * @param ride The ride.
   * @param limb The hoof.
   * @param seconds The second.
   * @returns The point.
   */
  export function hoof(
    ride: ReturnType<typeof AutoMovieArchetypeHorseRide.ride>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    seconds: number,
  ): IAutoMovieVector3 {
    const sample: ReturnType<typeof ride.at> = ride.at(seconds);
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (p: IAutoMovieModelPart): boolean =>
        p.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    )!;
    const shape: IAutoMoviePrimitiveShape | null =
      part.geometry.type === "primitive" ? part.geometry.shape : null;
    const half: number =
      shape !== null && (shape.type === "cylinder" || shape.type === "capsule")
        ? shape.height / 2
        : 0;
    return AutoMovieArchetypeFrame.point(
      sample.placement,
      Vector3.add(
        part.transform!.translation,
        Quaternion.rotateVector(part.transform!.rotation, {
          x: 0,
          y: half,
          z: 0,
        }),
      ),
    );
  }

  /**
   * The most any hoof slides along the path through its stances: from just after each landing through a fifth of the time to that hoof's next landing, which no stance is shorter than.
   *
   * @param ride The ride.
   * @returns The worst slide, metres, and where.
   */
  export function slide(ride: ReturnType<typeof AutoMovieArchetypeHorseRide.ride>): {
    worst: number;
    at: string;
  } {
    let worst: number = 0;
    let at: string = "";
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const on: number[] = footfalls(ride, limb);
      for (let i: number = 0; i + 1 < on.length; i++) {
        const gap: number = on[i + 1]! - on[i]!;
        const landed: IAutoMovieVector3 = hoof(
          ride,
          limb,
          on[i]! + 0.005 * gap,
        );
        for (const part of [0.05, 0.1, 0.15, 0.2]) {
          const slid: number = Math.hypot(
            hoof(ride, limb, on[i]! + part * gap).x - landed.x,
            hoof(ride, limb, on[i]! + part * gap).z - landed.z,
          );
          if (slid > worst) {
            worst = slid;
            at = `${limb} landed at ${on[i]} s`;
          }
        }
      }
    }
    return { worst, at };
  }
}
