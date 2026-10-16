import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { curveAutoMovieHumanLips } from "../../junction/curveAutoMovieHumanLips";

/**
 * Paired philtral columns, joining the shared cupid crests to the nasal base.
 *
 * Gray (1918), Anatomy of the Human Body (https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/), describes the philtrum as the interval between the medial nasolabial muscle bands. The two ridge courses therefore use the same crista-philtri span as the lip border. Their width is that physical span, not a chart distance. The medial trough is the space between the two positive ridges, and both ridges vanish smoothly at the shared upper-lip and subnasale endpoints.
 */
export function curveAutoMovieHumanPhiltrum(props: {
  head: IAutoMovieHumanIdentity.IHead;
  lips: curveAutoMovieHumanLips.ICurve;
  span: number;
  subnasaleY: number;
}): curveAutoMovieHumanPhiltrum.ICurve {
  const { head, lips, span, subnasaleY }: typeof props = props;
  const halfSpan: number = span * lips.halfWidth;
  const crestY: number = lips.border(halfSpan, true);
  const height: number = subnasaleY - crestY;
  const column: (t: number, side: number) => { x: number; y: number } = (
    t: number,
    side: number,
  ): { x: number; y: number } => ({
    x: side * halfSpan,
    y: crestY + height * t,
  });
  return {
    column,
    groove: (t: number): { x: number; y: number } => ({
      x: 0,
      y: crestY + height * t,
    }),
    displacement: (x: number, y: number): number => {
      if (!(height > 0) || y <= crestY || y >= subnasaleY) return 0;
      const t: number = (y - crestY) / height;
      // q=±1 are the common cupid-column positions. q² exp(1−q²)
      // gives two positive ridges around the medial interval; sin² closes
      // both longitudinal endpoints with zero slope. Only height is fitted.
      const q: number = x / halfSpan;
      return COLUMN_HEIGHT * head.features.upperVermilionHeight *
        Math.sin(Math.PI * t) ** 2 * q * q * Math.exp(1 - q * q);
    },
  };
}

/** Output contract of the named physical source courses. */
export namespace curveAutoMovieHumanPhiltrum {
  /** Head-frame physical courses and their anterior height field.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Cupid crest at t=0 to nasal base at t=1, head-local millimetres. */
    column: (t: number, side: number) => { x: number; y: number };

    /** Midline interval between the columns, with the same endpoints and units. */
    groove: (t: number) => { x: number; y: number };

    /** Added anterior height, millimetres; vanishes outside the shared Y interval. */
    displacement: (x: number, y: number) => number;
  }
}

/**
 * Paired-column height over upper vermilion height. Equal-reference pooled fit to frontmost physical transverse sections of the four provided campaign reference heads, between each native lip-border crest and its nostril-sill landmark proxy. A per-plane constant/quadratic background is projected out before fitting this one amplitude of the shared paired-ridge basis. All four leave-one-reference-out residuals improve. Grade: geometric reference fit, not a clinical tissue-depth or population norm; unverified older ridge traces are not used.
 */
const COLUMN_HEIGHT: number = 0.12324;
