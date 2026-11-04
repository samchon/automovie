import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadMedianProfile } from "./AutoMovieHumanHeadMedianProfile";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The face's lateral boundary Z: the forward place of its widest point and its
 * half width at a height, from the frontotemporale through the zygion to the
 * gonion and the chin, each a landmark-bounded span joined by a quintic Hermite
 * span between the owners' jets. Frontal, face and mandibular widths are its
 * inputs, measured at their Farkas sites.
 */
export namespace AutoMovieHumanHeadFaceBoundary {
  /** The face's widest place along the forward axis at a height. */
  export function faceWaist(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];
    if (y >= g) {
      const share: number = AutoMovieHumanHeadMath.crownShare(y, g, plan.vertex - g);
      return AutoMovieHumanHeadMedianProfile.profileAt(plan, y) - (m.glabella[0] - m.frontal[0]) * share;
    }
    const zy: number = m.zygion[1];
    if (y >= zy)
      return AutoMovieHumanHeadMath.joined(AutoMovieHumanHeadMath.flat(m.zygion[0]), AutoMovieHumanHeadMath.flat(m.frontal[0]), zy, g, y);
    return AutoMovieHumanHeadMath.joined(AutoMovieHumanHeadMath.flat(m.gonion[0]), AutoMovieHumanHeadMath.flat(m.zygion[0]), m.gonion[1], zy, y);
  }

  /**
   * The face's half-width at its widest place at a height: the frontal width
   * at the brow, the face width at the zygion, the mandibular width at the
   * gonion and half that at the menton, by geometric steps between.
   */
  export function faceHalf(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];
    const zy: number = m.zygion[1];
    const go: number = m.gonion[1];
    const step = (a: number, b: number, u: number): number =>
      a * Math.exp(Math.log(b / a) * AutoMovieHumanHeadMath.joined(AutoMovieHumanHeadMath.flat(0), AutoMovieHumanHeadMath.flat(1), 0, 1, u));
    if (y >= zy) return step(plan.faceWidth, plan.frontalWidth, (y - zy) / (g - zy));
    if (y >= go)
      return step(plan.faceWidth, plan.mandibularWidth, (zy - y) / Math.max(1, zy - go));
    return step(
      plan.mandibularWidth,
      CHIN * plan.mandibularWidth,
      (go - y) / Math.max(1, go - plan.menton),
    );
  }

  /** Share of the vault's height over the glabella across which the face fades into the cranium. */
  export const FOREHEAD: number = 0.35;
}

/** The face's half-width at the menton, per half the mandibular width: the chin's turn. */
const CHIN: number = 0.5;
