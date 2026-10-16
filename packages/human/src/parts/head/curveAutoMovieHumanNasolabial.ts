import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";

/**
 * Nasolabial layout boundary from the shared alar and oral dimensions.
 *
 * Equal-reference least-squares fit of four supplied native upper nasolabial courses gives the transverse reach 1.786238 at stomion height. Every leave-one-reference-out residual improves over a constant alar-width course. The measured traces end above stomion: the lower extension is a layout boundary, not a certified crease or a tissue-depth field. Outside the two endpoint heights extent holds the endpoint width; it never invents an extrapolated facial valley.
 */
export function curveAutoMovieHumanNasolabial(props: {
  head: IAutoMovieHumanIdentity.IHead;
  stomionY: number;
  nose: { alarY: number };
}): curveAutoMovieHumanNasolabial.ICurve {
  const alar: number = props.head.features.noseWidth / 2;
  const oral: number = ORAL_REACH * props.head.features.mouthWidth / 2;
  const height: number = props.nose.alarY - props.stomionY;
  const width: (t: number) => number = (t: number): number => alar + (oral - alar) * t;
  return {
    point: (t: number, side: number): { x: number; y: number } => ({
      x: side * width(t), y: props.nose.alarY - height * t,
    }),
    extent: (y: number): number => width(height > 0 ? Math.min(1, Math.max(0, (props.nose.alarY - y) / height)) : 0),
  };
}

/** Output contract of the shared physical layout boundary. */
export namespace curveAutoMovieHumanNasolabial {
  /** Head-frame XY course defining layout width, not a displacement field.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Alar endpoint at t=0 to the extrapolated oral-height boundary at t=1, head mm. */
    point: (t: number, side: number) => { x: number; y: number };

    /** Nonnegative lateral extent at physical head Y, with endpoint-width continuation. */
    extent: (y: number) => number;
  }
}

/** Geometric four-reference course fit; not a clinical population norm. */
const ORAL_REACH: number = 1.786238;
