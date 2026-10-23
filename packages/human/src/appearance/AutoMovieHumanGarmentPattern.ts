import { AutoMovieHumanLowerUnderwear } from "../typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../typings/AutoMovieHumanUpperUnderwear";
import { AutoMovieHumanGarmentBody } from "./AutoMovieHumanGarmentBody";

/**
 * Patterns of the basic underwear: which skin a garment covers, drawn as hem
 * curves on the body.
 *
 * A pattern is a set of chains it may cover and a set of hems. Each hem is a
 * smooth signed distance in model metres, positive on the garment's side; the
 * garment is the covered skin where every hem is positive, so each hem line
 * is the zero set of one smooth field and the cut that follows it is smooth.
 * Lengths are fractions of a landmark span of the body
 * ({@link AutoMovieHumanGarmentBody.ILandmarks}), so one pattern sizes itself
 * to every body; the fractions describe the garment cut, not a person.
 *
 * Hem shapes:
 *
 * - **Planes** tilted in the body frame: the waistband of briefs and the leg
 *   openings. A brief's leg opening runs from the gusset at the crotch up the
 *   inguinal fold to the hip and back down across the lower buttock, which a
 *   plane through the leg root tilted up laterally and up forward follows.
 * - **Phase curves**: the bra's top edge, a height that varies with the
 *   angle about the trunk axis, level over the front, falling smoothly
 *   toward the sides and level across the back, symmetric about the
 *   sagittal plane.
 *
 * Each hem also carries a band: the strip of that width along the hem is
 * lifted by an extra thickness, the elastic binding or waistband that
 * reads as the garment's edge.
 */
export namespace AutoMovieHumanGarmentPattern {
  /** One garment's coverage. */
  export interface IPattern {
    /** Part id suffix: `human.garment.<id>`. */
    id: string;

    /** {@link AutoMovieHumanGarmentBody.Chain} bits of the chains it may cover. */
    chains: number;

    /** Hems; the garment is where all are positive. */
    hems: IHem[];
  }

  /** One hem line and its binding. */
  export interface IHem {
    /**
     * Signed distance of a point from the hem in model metres, positive on
     * the garment's side.
     */
    distance: (p: readonly [number, number, number]) => number;

    /** Width of the binding band along the hem, model metres. */
    band: number;

    /** Extra thickness of the binding band, model metres. */
    lift: number;
  }

  /**
   * Patterns requested by an underwear choice, lower garment first.
   *
   * @param bottom Lower garment choice
   * @param top Upper garment choice
   * @param landmarks Landmarks of the body to dress
   * @returns One pattern per garment that is not `none`
   */
  export function create(
    bottom: AutoMovieHumanLowerUnderwear,
    top: AutoMovieHumanUpperUnderwear,
    landmarks: AutoMovieHumanGarmentBody.ILandmarks,
  ): IPattern[] {
    const out: IPattern[] = [];
    if (bottom === AutoMovieHumanLowerUnderwear.Briefs)
      out.push(briefs(landmarks, BRIEFS));
    else if (bottom === AutoMovieHumanLowerUnderwear.BoxerBriefs)
      out.push(briefs(landmarks, BOXER_BRIEFS));
    if (top === AutoMovieHumanUpperUnderwear.Bra) out.push(bra(landmarks));
    return out;
  }

  /** Cut of a lower garment, lengths in crotch-to-waist spans. */
  interface ILowerCut {
    /** Part id suffix. */
    id: string;

    /** Waistband height above the crotch at the crotch centre. */
    rise: number;

    /** Waistband drop per unit of forward distance: lower in front. */
    rake: number;

    /** Waistband width. */
    waistband: number;

    /** Leg opening height above the crotch at the gusset edge. */
    opening: number;

    /** Half-width of the gusset at the crotch. */
    gusset: number;

    /** Leg opening rise per unit of lateral distance from the gusset edge. */
    lateral: number;

    /** Leg opening rise per unit of forward distance from the crotch centre. */
    forward: number;

    /** Leg binding width. */
    binding: number;
  }

  /**
   * Briefs: a mid-rise waist and leg openings cut up to the hip, with a
   * gusset a fifth of the span wide; the back opening crosses the lower
   * buttock.
   */
  const BRIEFS: ILowerCut = {
    id: "briefs",
    rise: 0.45,
    rake: 0.1,
    waistband: 0.07,
    opening: -0.05,
    gusset: 0.1,
    lateral: 0.35,
    forward: 0.3,
    binding: 0.025,
  };

  /**
   * Boxer briefs: a higher waist and level leg openings a third of the span
   * below the crotch, so the legs are covered to the upper thigh.
   */
  const BOXER_BRIEFS: ILowerCut = {
    id: "boxerBriefs",
    rise: 0.55,
    rake: 0.08,
    waistband: 0.1,
    opening: -0.33,
    gusset: 0,
    lateral: 0,
    forward: 0,
    binding: 0.03,
  };

  /** Base thickness of every binding band's lift, model metres. */
  const LIFT: number = 0.0006;

  /** Lower garment of a cut: waistband plane and one leg-opening plane per side. */
  function briefs(
    l: AutoMovieHumanGarmentBody.ILandmarks,
    cut: ILowerCut,
  ): IPattern {
    const S: number = l.span;
    const waist: IHem = {
      ...plane(l.crotch + cut.rise * S, -cut.rake, 0, l, true),
      band: cut.waistband * S,
      lift: 1.4 * LIFT,
    };
    const legs: IHem[] = [1, -1].map(
      (side: number): IHem => ({
        ...plane(
          l.crotch + cut.opening * S - cut.lateral * cut.gusset * S,
          cut.forward,
          side * cut.lateral,
          l,
          false,
        ),
        band: cut.binding * S,
        lift: LIFT,
      }),
    );
    return {
      id: cut.id,
      chains:
        AutoMovieHumanGarmentBody.Chain.Trunk |
        AutoMovieHumanGarmentBody.Chain.LegLeft |
        AutoMovieHumanGarmentBody.Chain.LegRight,
      hems: [waist, ...legs],
    };
  }

  /**
   * Hem plane `y = h + a (x - crotchCentre) + b (z - midline)` as a signed
   * Euclidean distance, positive below the plane when `below` and above it
   * otherwise.
   */
  function plane(
    h: number,
    a: number,
    b: number,
    l: AutoMovieHumanGarmentBody.ILandmarks,
    below: boolean,
  ): Pick<IHem, "distance"> {
    const norm: number = Math.hypot(1, a, b);
    const sign: number = below ? 1 : -1;
    return {
      distance: (p: readonly [number, number, number]): number =>
        (sign *
          (h + a * (p[0] - l.crotchCentre) + b * (p[2] - l.midline) - p[1])) /
        norm,
    };
  }

  /**
   * Bra, cut as a bandeau: an underband a little below the inframammary
   * fold, and a top edge level across the front above the bust that falls
   * under the axillae toward the sides and runs level across the back.
   * Lengths are fractions of the crotch-to-waist span, so the top is sized
   * with the lower garments.
   *
   * The top edge's height is the back height plus the front rise times a
   * plateau of the angle about the trunk axis: one within 25 degrees of the
   * front, falling by a smoothstep to zero at 120 degrees, so the edge is level
   * over both breasts and passes under the anterior axillary folds.
   */
  function bra(l: AutoMovieHumanGarmentBody.ILandmarks): IPattern {
    const S: number = l.span;
    const bottom: number = l.underbust - 0.03 * S;
    const back: number = l.axilla - 0.08 * S;
    const front: number = Math.max(l.bust + 0.15 * S, back);
    const plateau: number = (25 * Math.PI) / 180;
    const fall: number = (95 * Math.PI) / 180;
    return {
      id: "bra",
      chains:
        AutoMovieHumanGarmentBody.Chain.Trunk |
        AutoMovieHumanGarmentBody.Chain.Upper,
      hems: [
        {
          distance: (p: readonly [number, number, number]): number =>
            p[1] - bottom,
          band: 0.08 * S,
          lift: 1.4 * LIFT,
        },
        {
          distance: (p: readonly [number, number, number]): number => {
            const theta: number = Math.abs(
              Math.atan2(p[2] - l.midline, p[0] - l.centre(p[1])),
            );
            const u: number = Math.min(
              1,
              Math.max(0, (theta - plateau) / fall),
            );
            return back + (front - back) * (1 - u * u * (3 - 2 * u)) - p[1];
          },
          band: 0.025 * S,
          lift: LIFT,
        },
      ],
    };
  }
}
