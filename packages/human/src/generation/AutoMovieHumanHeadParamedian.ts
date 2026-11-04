import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadJet } from "./IAutoMovieHumanHeadJet";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The paramedian guide A: the longitudinal curve a few centimetres off the
 * midline that runs down the face from the medial canthus (the endocanthion
 * column), by the alar crease and the philtral column to the cheilion and the
 * mentolabial end. It is a guide, a curve of the face's frame: it owns the
 * lateral place of the sector boundary between the median sector S1 and the
 * cheek sector S2 at every height, with its tangent and curvature, so the
 * sectors on both sides copy its jet instead of inventing their own.
 *
 * Between landmarks it runs by a quintic Hermite span with level jets at each
 * (`AutoMovieHumanHeadMath.joined` of `flat` jets): C2 across every landmark's
 * height. The knots, from the top: the endocanthion at the eye level, at half
 * the intercanthal width; the alar crease at the nostril's level, at the nose's
 * half width; the cheilion at the stomion, at the mouth's half width; the
 * mentolabial end at the sublabiale, back on the midline.
 *
 * Reads: the skeleton's eye level and intercanthal half width, subnasale and
 * nasion heights, nose and mouth half widths, stomion height and the
 * sublabiale's place. Publishes the guide's lateral place as a jet in
 * millimetres per height.
 */
export namespace AutoMovieHumanHeadParamedian {
  /** What the guide reads. */
  export interface IInput {
    /** The landmark skeleton. */
    plan: Pick<
      IAutoMovieHumanHeadLayout,
      "eye" | "left" | "subnasale" | "nasion" | "tip" | "noseWidth" | "mouthWidth" | "stomion" | "landmarks"
    >;

    /** The prior's alar row, which places the alar crease's height in nose spans over the subnasale. */
    face: Pick<AutoMovieHumanHeadPrior.IFace, "ala">;
  }

  /** One knot of the guide: a landmark's height and the guide's lateral place there. */
  export interface IKnot {
    /** Height of the landmark, calibration millimetres. */
    y: number;

    /** The guide's distance from the midline there, millimetres. */
    z: number;
  }

  /**
   * The guide's knots from the top: endocanthion, alar crease, cheilion and
   * the mentolabial end.
   *
   * @param input What the guide reads.
   * @returns The knots, highest first.
   */
  export function knots(input: IInput): IKnot[] {
    const plan: IInput["plan"] = input.plan;
    const span: number = plan.nasion - plan.tip;
    return [
      { y: plan.eye, z: plan.left.inner },
      { y: plan.subnasale + input.face.ala[2]! * span, z: plan.noseWidth },
      { y: plan.stomion, z: plan.mouthWidth },
      { y: plan.landmarks.pogonion[1], z: 0 },
    ];
  }

  /**
   * The guide's lateral place at a height, with its slope and curvature.
   *
   * @param input What the guide reads.
   * @param y Height of the point.
   * @returns The jet of the guide's distance from the midline.
   */
  export function jet(input: IInput, y: number): IAutoMovieHumanHeadJet {
    const at: (h: number) => number = (h: number): number => value(knots(input), h);
    const step: number = 0.05;
    const a: number = at(y - step);
    const b: number = at(y);
    const c: number = at(y + step);
    return {
      value: b,
      slope: (c - a) / (2 * step),
      curvature: (a - 2 * b + c) / (step * step),
    };
  }

  /**
   * The guide's value between knots: a quintic span with level jets at both
   * knots, held at the end knots' values beyond them.
   */
  function value(knots: readonly IKnot[], y: number): number {
    if (y >= knots[0]!.y) return knots[0]!.z;
    for (let i: number = 1; i < knots.length; i++) {
      const hi: IKnot = knots[i - 1]!;
      const lo: IKnot = knots[i]!;
      if (y >= lo.y)
        return AutoMovieHumanHeadMath.joined(
          AutoMovieHumanHeadMath.flat(lo.z),
          AutoMovieHumanHeadMath.flat(hi.z),
          lo.y,
          hi.y,
          y,
        );
    }
    return knots[knots.length - 1]!.z;
  }
}
