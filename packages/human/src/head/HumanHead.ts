import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { HumanHeadFrame } from "./HumanHeadFrame";
import { HumanHeadMeridian } from "./HumanHeadMeridian";
import { HumanHeadRadial } from "./HumanHeadRadial";

/**
 * Generate the currently identified cranial shell from common recovered curves.
 * The four source-bound head-transverse families identify brow, maximum vault
 * breadth, forehead and a half-area upper crown course. Named feature curves
 * establish their correspondence. The lower face remains a separate open domain.
 */
export namespace HumanHead {
  /** Identified cranial courses and explicit ungenerated facial domains. */
  export interface Result {
    /** Principal curves shared by the skin and construction consumers. */
    sections: HumanCurve.Section[];

    /** Horizontal crown tangent plane; natural lower end remains unqualified. */
    endpointDerivatives: HumanCurveFamily.Endpoints;

    /** The sole owner's neck boundary is retained, not bridged through missing face. */
    neckBoundary: HumanCurve.Section | undefined;

    /** Finite-grid loss introduced by generated world-radial Fourier projection, mm. */
    projectionMaximumMm: number;

    /** Supported meridian chord parameter domain in mm, independent of world Y. */
    coverage: { lowerStationMm: number; upperStationMm: number; complete: false };

    /** Omitted anatomy, unsupported correspondence and prediction claims. */
    limitations: string[];
  }

  /**
   * Apply physical cranial dimensions to identified common normalized courses.
   * Length and length×index/100 define independent forward/lateral scales. Eye-to-
   * chin and crown heights locate the observed upper courses. Source measurements
   * used geometric proxies; this mapping does not certify their clinical names.
   * An injected frame retains the assembly's common crown, eye and chin datum;
   * omitting it preserves standalone construction through the same frame owner.
   * No reference files, subject controls or source mesh arrays are read at runtime.
   */
  export function build(
    parameters: IAutoMovieHumanHeadIdentity,
    skeleton: HumanSkeleton.Result,
    neckBoundary?: HumanCurve.Section,
    suppliedFrame?: HumanHeadFrame.Result,
  ): Result {
    const frame: HumanHeadFrame.Result = suppliedFrame ?? HumanHeadFrame.build(parameters, skeleton);
    const length: number = frame.lengthMm, breadth: number = frame.breadthMm;
    const height: number = frame.heightMm, eyeHeight: number = frame.eyeHeightMm;
    const head: HumanCurve.Vector = frame.supportMm;
    const eyeY: number = frame.eyeY;
    const sections: HumanCurve.Section[] = [];
    let projectionMaximumMm: number = 0;
    for (const rule of rules) {
      const projected: { coefficients: number[]; maximumMm: number } = HumanHeadRadial.project(rule.radial, length, breadth);
      const station: number = eyeY + rule.aboveEye * (height - eyeHeight);
      sections.push({
        id: "head." + rule.name, stationMm: station,
        originMm: [head[0] + rule.centerForward * length, station, head[2]],
        axisU: [1, 0, 0], axisV: [0, 0, 1], coefficientsMm: projected.coefficients,
      });
      projectionMaximumMm = Math.max(projectionMaximumMm, projected.maximumMm);
    }
    const crown: number = frame.crownY;
    sections.push({
      id: "head.crown", stationMm: crown,
      originMm: [head[0] + 0.06801177631817769 * length, crown, head[2]],
      axisU: [1, 0, 0], axisV: [0, 0, 1], coefficientsMm: [0], topology: "pole",
    });
    const meridian: HumanCurve.Section[] = HumanHeadMeridian.parameterize(sections);
    return {
      sections: meridian, neckBoundary, projectionMaximumMm,
      endpointDerivatives: { end: {
        evaluate: (phase: number): HumanCurve.Vector => [-Math.cos(phase), 0, -Math.sin(phase)],
        phaseDerivative: (phase: number): HumanCurve.Vector => [Math.sin(phase), 0, -Math.cos(phase)],
        phaseSecondDerivative: (phase: number): HumanCurve.Vector => [Math.cos(phase), 0, Math.sin(phase)],
      } },
      coverage: { lowerStationMm: meridian[0]!.stationMm, upperStationMm: meridian.at(-1)!.stationMm, complete: false },
      limitations: [
        "Only the brow-to-crown shell is generated; lower face, eye/lid and lip openings, nose, ears, teeth and tongue remain ungenerated domains",
        "Four-source normalized cranial approximation has 1.46–4.51 mm pooled radial RMS and up to 8.19 mm sample residual; held-out morphology prediction is unverified",
        "Source courses are nearest physical observation planes within their finite acquisition spacing, not certified clinical landmark sections",
        "Length/index/head-height/face-height define generated geometric axes; clinical equivalence and independent native parameter response remain unqualified",
        "Circumference, minimum frontal width and other facial inputs have no identified independent cranial-shape influence in this partial model",
        "The supplied neck boundary is not joined to the cranial shell through the absent lower face; its ownership remains with the assembly",
        "Longitudinal stations are mean corresponding meridian chord lengths in mm, not world Y or exact spline arc lengths; principal world positions retain their physical observation correspondence",
        "The crown closes the observed contour death with a horizontal tangent-plane condition; equal radial speed per meridian chord mm remains a common parameter convention, not a measured tissue law",
      ],
    };
  }

  /** Common course coefficients, fitted jointly to four registered Hermite families. */
  interface Rule {
    /** Shared geometric feature defining the course. */
    name: string;

    /** Eye-to-crown normalized physical station. */
    aboveEye: number;

    /** Forward centre offset from the common head support, in head-length units. */
    centerForward: number;

    /** Dimensionless radial Fourier coefficients in the length/breadth normalized plane. */
    radial: readonly number[];
  }

  // Pooled least squares uses 128 geometric ray directions per source course.
  // Membership is native skin section 0 and the unique contour enclosing the
  // head support axis. Nonunique ray intersections are omitted and reported in
  // the source analysis, not replaced with an outermost or largest component.
  // Degree 8 preserves the measured broad cranial signal; original Hermite
  // curves retain their degree, intervals and unsupported topology independently.
  const rules: readonly Rule[] = [
    { name: "brow", aboveEye: 0.22635046574663387, centerForward: 0.10188579549238105,
      radial: [0.5482236544978155,-0.0024134323503145357,0.0027577711806022055,0.008251225086537549,-0.0005568812440688754,0.01033125853309843,0.000010603730090941537,-0.01059447425174662,-0.00005376552706064041,-0.00962546566918674,-0.000426368949632566,-0.00266416578172567,-0.00029623288125162734,0.0018552663393682008,-0.00008447157406269954,0.0002447311455584412,0.00014557087549683378] },
    { name: "vault-width", aboveEye: 0.29319397591134866, centerForward: 0.10074968653298919,
      radial: [0.5441632830896478,-0.005232730534493898,0.002289169130655653,0.007532702570905006,-0.0006311578281560842,0.012582080977619077,0.0002399403018800406,-0.007562802903363163,-0.00035131320373238195,-0.0073504957454765575,-0.0005107972177306982,-0.0022437286345813826,-0.000413448517546877,0.0009009486302199132,-0.00011162366186486063,-0.0011894817081703904,0.000024015375280463585] },
    { name: "forehead", aboveEye: 0.6026899819189648, centerForward: 0.08726457363602225,
      radial: [0.47985085149426043,-0.010502757260421096,0.0012438461198312613,0.00038849753974794964,0.0013666371355891265,0.014184918841781143,0.0005133510415407546,-0.003102751520777016,-0.001506727805842808,-0.0023134846455558924,-0.00030706371889099203,-0.0012758402054826464,0.00009604400385005906,-0.0006586893395413243,0.00012760127163751944,-0.000656459068746043,0.00007907175774087436] },
    { name: "upper-crown", aboveEye: 0.8460619532422303, centerForward: 0.0778761300792957,
      radial: [0.3392306820297109,-0.009886297663472252,0.002128022194859792,0.008889142523748757,0.0018615077545912166,0.010318840623219494,0.00021654648818693833,-0.0017483477031693358,-0.0010981100330165069,0.000069815671674175,-0.00014848167673447803,0.00033795288991443677,0.0004972424198253795,0.00005837471776880456,-0.0002625675652001197,0.00024561287790365394,-0.00003966103232341898] },
  ];

}
