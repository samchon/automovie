import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The jaw piece: the cuts that hand the mandible's skin to the jaw.
 *
 * The jaw turns about its hinge, so skin behind the hinge's forward plane stays
 * with the head. With a mouth, the lips' contact line cuts the skin below the
 * lips ({@link AutoMovieHumanLipBinding}); a mouth whose skin is not open keeps
 * a level cut across the face instead, since a hand-over narrower than the
 * opening across whole skin would tear it.
 */
export namespace AutoMovieHumanJawBinding {
  /** The region of the `jaw` joint: no cut until the jaw's planes are set. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "jaw",
    bones: /^jaw$/,
    plane: (): null => null,
  };

  /** Half of the jaw's cut, as a share of the distance from hinge to chin (convention, from the first 20 mm opening that tore). */
  export const JAW_RAMP: number = 0.07;

  /** How far forward of its hinge the jaw starts, as a share of the same distance (convention). */
  export const JAW_BACK: number = 0.15;

  /**
   * The lips' height below the eyes, as a share of the eyes' height below the
   * crown. The share holds from 1450 to 2000 mm of stature, where a share of
   * the stature does not: a head does not grow with the body.
   */
  export const MOUTH: number = 0.735;

  /**
   * The jaw's cuts.
   *
   * @param hinge The jaw's hinge, metres.
   * @param chin The jaw's end at the chin, metres.
   * @param eye A globe's centre, metres.
   * @param crown The head's crown, metres.
   * @param lips The lips' contact line, or null for a mouth whose skin is not open.
   * @returns The planes the share must pass.
   */
  export function planes(
    hinge: Math3D.Vector,
    chin: Math3D.Vector,
    eye: Math3D.Vector,
    crown: Math3D.Vector,
    lips: IAutoMovieHumanBindingLips | null,
  ): IAutoMovieHumanBindingPlane[] {
    const span: number = Math.hypot(...Math3D.sub(chin, hinge));
    const mouth: number = eye[1] - MOUTH * (crown[1] - eye[1]);
    return [
      ...(lips === null
        ? [
            {
              at: [hinge[0], mouth, 0] as Math3D.Vector,
              normal: [0, -1, 0] as Math3D.Vector,
              half: JAW_RAMP * span,
              step: AutoMovieHumanSkinStep.ramp,
            },
          ]
        : []),
      {
        at: Math3D.add(hinge, Math3D.times([1, 0, 0], JAW_BACK * span)),
        normal: [1, 0, 0] as Math3D.Vector,
        half: JAW_RAMP * span,
        step: AutoMovieHumanSkinStep.ramp,
      },
    ];
  }
}
