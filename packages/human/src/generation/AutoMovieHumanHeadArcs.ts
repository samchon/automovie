import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieAffineCoefficients,
  IAutoMovieHumanHeadArcs,
  IAutoMovieHumanHeadIdentity,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The head's surface arcs over the head from tragion to tragion and the
 * tragion's drop below the vertex: the girths the head mass's fullness is
 * solved to and the ear's height on the side outline.
 *
 * Source: ANSUR 1988 (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and
 * 1,774 men, `docs/sources/ansur-1988.md`) takes six bitragion arcs, from
 * tragion to tragion over the coronal plane, the crinion, the minimum frontal
 * breadth, the subnasale, the menton and under the mandible; ANSUR II (Gordon
 * et al. 2014; 1,986 women and 4,082 men) takes the tragion to the top of the
 * head. Each is the ordinary least squares line by sex on the Human head input
 * with the best R2 (`test_human_survey_head_arcs`): the head circumference
 * for the vault's arcs and the tragion's drop, the bizygomatic breadth (the
 * Human's `faceWidth`, zy-zy) for the face's arcs.
 *
 * Limits: the head's arcs follow any one input weakly (R2 0.14 to 0.46), so a
 * default places a person near the survey's arc for the input, not near their
 * own; the arcs are surface lengths over the skin and hair-free scalp as the
 * survey's tape takes them.
 */
export namespace AutoMovieHumanHeadArcs {
  /**
   * Each arc's line, women and men: the vault's on the head circumference
   * (coronal R2 0.35 and 0.32, crinion 0.38 and 0.42, minimum frontal 0.42 and
   * 0.46), the face's on the bizygomatic breadth (subnasale 0.37 and 0.40,
   * menton 0.29 and 0.31, submandibular 0.26 and 0.26).
   */
  export const ARCS: Readonly<
    Record<
      keyof IAutoMovieHumanHeadArcs.IArcs,
      readonly [IAutoMovieAffineCoefficients, IAutoMovieAffineCoefficients]
    >
  > = {
    coronal: [
      { a: 49.88, b: 0.5246 },
      { a: 82.07, b: 0.4778 },
    ],
    crinion: [
      { a: 61.23, b: 0.4509 },
      { a: 47.15, b: 0.4919 },
    ],
    minimumFrontal: [
      { a: 48.52, b: 0.4382 },
      { a: 36.42, b: 0.472 },
    ],
    subnasale: [
      { a: 91.29, b: 1.4083 },
      { a: 115.09, b: 1.2595 },
    ],
    menton: [
      { a: 116.97, b: 1.4163 },
      { a: 139.84, b: 1.3239 },
    ],
    submandibular: [
      { a: 107.8, b: 1.281 },
      { a: 117.68, b: 1.3281 },
    ],
  };

  /** The arcs read on the head circumference; the rest read the bizygomatic breadth. */
  export const ON_CIRCUMFERENCE: readonly (keyof IAutoMovieHumanHeadArcs.IArcs)[] =
    ["coronal", "crinion", "minimumFrontal"];

  /** Tragion to the top of the head on the head circumference, ANSUR II: R2 0.14 and 0.15, residual SD 6.1 and 5.7 mm. */
  export const TRAGION_DROP_ON_CIRCUMFERENCE: readonly [
    IAutoMovieAffineCoefficients,
    IAutoMovieAffineCoefficients,
  ] = [
    { a: 55.33, b: 0.1268 },
    { a: 45.85, b: 0.1485 },
  ];

  /**
   * The person's six arcs.
   *
   * @param head The person's resolved head measures.
   * @param sex The person's sex.
   */
  export function of(
    head: IAutoMovieHumanHeadIdentity,
    sex: AutoMovieHumanSexType,
  ): IAutoMovieHumanHeadArcs.IArcs {
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const arc = (name: keyof IAutoMovieHumanHeadArcs.IArcs): number => {
      const fit: IAutoMovieAffineCoefficients = ARCS[name][k];
      return (
        fit.a +
        fit.b *
          (ON_CIRCUMFERENCE.includes(name)
            ? head.circumference
            : head.faceWidth)
      );
    };
    return {
      coronal: head.bitragionCoronalArc ?? arc("coronal"),
      crinion: arc("crinion"),
      minimumFrontal: arc("minimumFrontal"),
      subnasale: head.bitragionSubnasaleArc ?? arc("subnasale"),
      menton: head.bitragionMentonArc ?? arc("menton"),
      submandibular: arc("submandibular"),
    };
  }

  /**
   * The tragion's drop below the vertex: the person's own ANSUR II tragion to top of head (head in FH) when given, else the women's or men's line on the head circumference.
   *
   * @param head The person's resolved head measures.
   * @param sex The person's sex.
   * @returns Vertex to tragion, vertical, mm.
   */
  export function tragionDrop(
    head: IAutoMovieHumanHeadIdentity,
    sex: AutoMovieHumanSexType,
  ): number {
    if (head.tragionTopOfHead !== undefined) return head.tragionTopOfHead;
    const fit: IAutoMovieAffineCoefficients =
      TRAGION_DROP_ON_CIRCUMFERENCE[sex === AutoMovieHumanSex.Female ? 0 : 1];
    return fit.a + fit.b * head.circumference;
  }
}
