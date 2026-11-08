import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanPhysicalProfile,
  AutoMovieHumanSkeleton,
} from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A fighter's gloves as equipment of his physical profile: one rigid sphere
 * per hand, a glove radius across the fist, centred beyond the wrist along
 * the forearm by the hand's own length, with a 10-ounce glove's mass.
 *
 * ```ts
 * const equipment = FighterGloves.equipment(skeleton({}));
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#hands Gloves on the hands as one rigid sphere each.
 */
export namespace FighterGloves {
  /** Glove radius, metres: a competition glove about 19 cm across the fist (film reading of a 10-ounce glove). */
  export const RADIUS: number = 0.095;

  /** Glove mass, kilograms: 10 ounces. */
  export const MASS: number = 10 * 0.0283495;

  /** Wrist to the glove centre, metres: the hand's length to the knuckles' middle, read as a third of the forearm. */
  export const HAND_LENGTH: number = 0.065;

  /**
   * Both gloves on a body at neutral, each in its hand's frame and named
   * `left-glove` and `right-glove` with material `glove`.
   *
   * @param neutral The body's neutral clinical FK.
   * @returns The equipment of both hands.
   */
  export function equipment(
    neutral: AutoMovieHumanSkeleton.IOutput,
  ): AutoMovieHumanPhysicalProfile.IEquipment[] {
    const at = (bone: string): AutoMovieHumanSkeleton.IPlacement =>
      neutral.posed.find(
        (p: AutoMovieHumanSkeleton.IPlacement): boolean => p.bone === bone,
      )!;
    const v = (p: readonly number[]): IAutoMovieVector3 => ({
      x: p[0]!,
      y: p[1]!,
      z: p[2]!,
    });
    const inertia: number = 0.4 * MASS * RADIUS ** 2;
    return (["left", "right"] as const).map((side) => {
      const hand: AutoMovieHumanSkeleton.IPlacement = at(`${side}Hand`);
      const elbow: AutoMovieHumanSkeleton.IPlacement = at(`${side}LowerArm`);
      const r: readonly number[] = hand.rotation;
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse({ x: r[0]!, y: r[1]!, z: r[2]!, w: r[3]! }),
        Vector3.scale(
          Vector3.normalize(
            Vector3.subtract(v(hand.position), v(elbow.position)),
          ),
          HAND_LENGTH,
        ),
      );
      return {
        bone: `${side}Hand`,
        mass: MASS,
        centerOfMass: offset,
        inertia: { x: inertia, y: inertia, z: inertia },
        shape: {
          id: `${side}-glove`,
          material: "glove",
          kind: "sphere",
          radius: RADIUS,
          transform: { position: offset, rotation: Quaternion.identity() },
        },
      };
    });
  }
}
