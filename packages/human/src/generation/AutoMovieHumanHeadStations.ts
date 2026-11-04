import { AutoMovieHumanHeadEarRoots } from "./AutoMovieHumanHeadEarRoots";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The control and sample counts of the head's chains and the controls of a
 * sagittal section gathered over the face; the stations the chains are cut
 * at are `AutoMovieHumanHeadStationDensity`'s.
 */
export namespace AutoMovieHumanHeadStations {
  /** Uniform control rings of a sagittal section from its two sides. */
  export function sagittal(
    left: readonly Vec3[],
    right: readonly Vec3[],
    order: number,
    weight: (p: Vec3) => number,
  ): Vec3[] {
    const half: number = order / 2;
    const a: Vec3[] = AutoMovieHumanHeadEarRoots.resample(left, half + 1, weight);
    const b: Vec3[] = AutoMovieHumanHeadEarRoots.resample(right, half + 1, weight);
    return [...a.slice(0, half), ...b.slice(1).reverse()];
  }

  /**
   * Controls per millimetre of section at a point, against the back of the head.
   *
   * The same counts, gathered over the face: the nose, lids and lips hold the
   * small features, and 1.6 to 2.3 mm between controls could not carry them.
   * It reads only the point's place, so a control stays on its feature from one
   * section to the next instead of sliding with the arclength. It stops below
   * the mouth: a tilted ring's mean height is its layer's, and controls gathered
   * at the raised front crowded those layers to 0.4 mm. It stops slowly: over
   * 8 mm the controls slid along the ring within a few layers and creased it.
   */
  export function gathered(plan: IAutoMovieHumanHeadLayout): (p: Vec3) => number {
    // Each side reaches out to its own eye's lateral canthus.
    const reach = (o: IAutoMovieHumanHeadEyeOpening): number => o.place + o.length / 2;
    const left: number = reach(plan.left);
    const right: number = reach(plan.right);
    const k: number = plan.scale;
    return (p: Vec3): number =>
      1 +
      GATHER *
        AutoMovieHumanHeadMath.bell(p[2] / (p[2] >= 0 ? left : right)) *
        AutoMovieHumanHeadMath.smooth((p[0] - plan.centre + 10 * k) / (30 * k)) *
        AutoMovieHumanHeadMath.smooth((p[1] - plan.stomion + 30 * k) / (40 * k));
  }

  /** Control points of the head's sections. */
  export const ORDER: number = 256;

  /** Ring samples of the lower head's chain, the skin's points round each of its rings. */
  export const SAMPLES_LOWER: number = 424;

  /** Ring samples of the middle head's chain. */
  export const SAMPLES_MIDDLE: number = 720;

  /** Ring samples of the upper head's chain. */
  export const SAMPLES_UPPER: number = 504;

  /** Last section below the vertex, world millimetres. */
  export const CROWN: number = 0.25;
}

/** Extra controls per millimetre over the face. */
const GATHER: number = 2;


/** A point. */
type Vec3 = [number, number, number];
