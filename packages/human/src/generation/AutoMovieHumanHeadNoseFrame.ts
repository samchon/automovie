import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The nose's own frame: origin at the pronasale's height, the axis running
 * from the tip up to the nasion, so that every nasal piece reads one
 * normalised height `v` (0 at the tip, 1 at the nasion) and the person's own
 * half width. The dorsum, the tip, the alae, the crease and the base all take
 * their place along the nose from it, in the nose's own measures rather than
 * in the head's.
 *
 * Reads: the skeleton's nasion, pronasale and subnasale heights, the nose's
 * half width and the tip's lead past the face. Publishes {@link IFrame}.
 */
export namespace AutoMovieHumanHeadNoseFrame {
  /** The nose's measures at one height. */
  export interface IFrame {
    /** Length of the nose's axis, nasion over the pronasale, millimetres. */
    span: number;

    /** The nose's half width, the alar lobules' half span, millimetres. */
    width: number;

    /** The tip's lead past the face, millimetres. */
    lead: number;

    /** Normalised height: 0 at the tip, 1 at the nasion, negative under the tip. */
    v: number;

    /** Height of the alar lobules' centre: the subnasale's plus a share of the span. */
    lobeY: number;
  }

  /**
   * The nose's frame at a height.
   *
   * @param plan The landmark skeleton.
   * @param face The prior's face constants (the alar lobule's place).
   * @param y Height of the point.
   * @returns The measures every nasal piece reads.
   */
  export function at(
    plan: Pick<
      IAutoMovieHumanHeadLayout,
      "nasion" | "tip" | "subnasale" | "noseWidth" | "noseLead"
    >,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "ala">,
    y: number,
  ): IFrame {
    const span: number = plan.nasion - plan.tip;
    return {
      span,
      width: plan.noseWidth,
      lead: plan.noseLead,
      v: (y - plan.tip) / span,
      lobeY: plan.subnasale + face.ala[2]! * span,
    };
  }
}
