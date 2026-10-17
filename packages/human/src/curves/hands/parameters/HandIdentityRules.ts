import { AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH } from "../../../measure/AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH";
import type { IHandCurveMeasurements as P } from "../family/IHandCurveMeasurements";

/** Shared anthropometric ratios and construction conventions for public-identity hands.
 *
 * Greiner 1991 NATICK/TR-92/011 supplies adult joint measurements used for the shared breadth ratios; Wu 2009 Table 1 supplies cylindrical shaft proxies (https://stacks.cdc.gov/view/cdc/187758/cdc_187758_DS1.pdf). These are population inferences and shape conventions, not individual cross-section measurements or guarantees for every age and population.
 */
export namespace HandIdentityRules {
  /** PIP breadth divided by full hand breadth from the shared Greiner-derived table; the thumb reuses the 0.262 thumb-breadth proxy. */
  export const pipBreadth: Readonly<Record<P.Digit, number>> = {
    thumb: 0.262,
    index: AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH.Index,
    middle: AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH.Middle,
    ring: AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH.Ring,
    pinky: AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH.Little,
  } as const;

  /** Greiner-derived DIP breadth divided by full hand breadth; thumb uses the same breadth proxy at both joints. */
  export const dipBreadth: Readonly<Record<P.Digit, number>> = {
    thumb: 0.262,
    index: 0.22,
    middle: 0.217,
    ring: 0.202,
    pinky: 0.189,
  } as const;

  /** Wu cylindrical-proxy breadth divided by its 77 mm hand breadth; the thumb's 0.90 taper is a construction convention. */
  export const shaftBreadth: Readonly<Record<P.Digit, number>> = {
    thumb: 0.262 * 0.9,
    index: 17.8 / 77,
    middle: 17.2 / 77,
    ring: 16.2 / 77,
    pinky: 15.2 / 77,
  } as const;

  /** Wu cylindrical-proxy depth divided by 77 mm hand breadth; thumb combines its inferred joint depth ratio with the conventional 0.90 taper. */
  export const shaftDepth: Readonly<Record<P.Digit, number>> = {
    thumb: 0.262 * 0.932 * 0.9,
    index: 17.4 / 77,
    middle: 18.8 / 77,
    ring: 18.6 / 77,
    pinky: 16.4 / 77,
  } as const;

  /** Depth/breadth inferred by an ellipse from Greiner girths, rather than directly measured cross-section depths. */
  export const jointDepthRatio: Readonly<{
    /** Inferred depth/breadth for non-thumb proximal interphalangeal stations. */
    pip: number;

    /** Inferred depth/breadth for non-thumb distal interphalangeal stations. */
    dip: number;

    /** Shared thumb joint depth/breadth proxy. */
    thumb: number;
  }> = { pip: 0.953, dip: 0.849, thumb: 0.932 } as const;

  /** Unweighted arithmetic mean of the separately reported ANSUR II female/male circumference-to-breadth ratios, (2.388 + 2.406) / 2. No sample-weighted pooled measurement is established here. When independent palm thickness is omitted, this conventional girth proxy feeds an ellipse depth inference; it is not an individually measured palm depth or cross-section perimeter. */
  export const palmGirthPerBreadth: number = 2.397;

  /** Rogers 2008 Table 3 mean breadth ratio 59.1/84.5 (https://stacks.cdc.gov/view/cdc/188402/cdc_188402_DS1.pdf); applying one population mean ratio to an individual is an inference. */
  export const wristBreadthPerHandBreadth: number = 59.1 / 84.5;

  /** Conventional share of palm/root thickness placed dorsally from the mechanical station; qualitative palm asymmetry does not establish this numerical value. */
  export const dorsalShare: number = 0.37;

  /** Conventional dorsal share of each tube thickness; shifting the ellipse centre by (share - 0.5) * depth preserves its full thickness. */
  export const fingerDorsalShare: number = 0.34;

  /** Conventional palmar web displacement as a share of the palmar thickness remaining after dorsalShare. */
  export const webPalmarShare: number = 0.5;

  /** Conventional first free-shaft station at 0.65 of the root interval; the palmar crease must precede it. */
  export const freeProximalFraction: number = 0.65;

  /** Conventional pulp station at 0.65 of the terminal skin-tip interval. */
  export const pulpFraction: number = 0.65;

  /** Conventional rounded-tip station at 0.90 of the terminal interval. */
  export const nearTipFraction: number = 0.9;

  /** Conventional pulp breadth multiplier relative to DIP breadth; pulp depth remains the inferred DIP depth. */
  export const pulpWidthShare: number = 0.95;

  /** Conventional 0.60 multiplier of both DIP breadth and depth at the near-tip station. */
  export const nearTipWidthShare: number = 0.6;

  /** Conventional collar endpoint at one quarter of wrist-to-middle-root distance; dimensions interpolate wrist and palm at the same fraction. */
  export const proximalPalmFraction: number = 0.25;

  /** Conventional wrist-to-middle-root fractions for palm support guides; the factory uses the 0.45 and 0.65 supports beyond the collar. */
  export const palmStations: readonly number[] = [0.25, 0.45, 0.65];

  /** Conventional proximal-thumb station at 0.85 before the IP-root interval ends. */
  export const thumbNearIpFraction: number = 0.85;

  /** Conventional midpoint of a non-thumb middle interval. */
  export const middleShaftFraction: number = 0.5;

  /** Conventional thumb terminal-shaft station at 0.35 of the skin-tip interval. */
  export const thumbDistalShaftFraction: number = 0.35;

  /** Greiner skin-crotch-to-crease offsets divided by hand length, ordered index-middle, middle-ring, ring-pinky; these locate skin junctions rather than mechanical joints. */
  export const nonThumbWebOffsets: readonly number[] = [0, 0.008, -0.021];

  /** Greiner-derived thumb-crotch distance divided by hand length, applied distally from the inferred wrist crease; it is a population placement inference. */
  export const thumbWebPerHandLength: number = 0.352;

  /** Young-adult ultrasound lamina sum used by the public fat estimator (Hung 2022, doi:10.1093/asj/sjac035). Adding the individual-minus-reference difference to gross palm depth is an inference, not a compartment or tendon model. */
  export const referenceDorsalFatMm: number = 4.34;

  /** Estimate ellipse circumference with Ramanujan's second approximation; inputs are positive full diameters in millimetres, and the result is millimetres. */
  export function ellipseGirth(widthMm: number, depthMm: number): number {
    const a: number = widthMm / 2,
      b: number = depthMm / 2;
    const h: number = ((a - b) / (a + b)) ** 2;
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }

  /** Infer full depth in millimetres by 64 bisection steps on ellipseGirth. Require finite positive breadth and girth greater than twice breadth; this solves the declared ellipse approximation rather than a measured skin perimeter. */
  export function depthFromGirth(widthMm: number, girthMm: number): number {
    if (
      !(
        widthMm > 0 &&
        girthMm > 2 * widthMm &&
        Number.isFinite(widthMm + girthMm)
      )
    )
      throw new Error(
        "The declared ellipse inference requires girth exceeding twice breadth; supply compatible physical measurements",
      );
    let lower: number = 0,
      upper: number = girthMm;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (lower + upper) / 2;
      if (ellipseGirth(widthMm, mid) < girthMm) lower = mid;
      else upper = mid;
    }
    return (lower + upper) / 2;
  }
}
