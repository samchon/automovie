import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { HumanHeadFrame } from "./HumanHeadFrame";
import { HumanMouthLowerProfile } from "./HumanMouthLowerProfile";
import type { HumanSurface } from "../internal/HumanSurface";

/** Common open outer-lip boundaries, separate from unresolved oral contact. */
export namespace HumanMouthFeatures {
  /** One open center-to-corner polynomial in a declared normalized domain. */
  export interface Curve {
    /** Feature identity consumed by construction and a conforming skin boundary. */
    id: string;
    /** World position in mm at u in [0,1]. */
    evaluate: (u: number) => HumanCurve.Vector;
    /** Exact dP/du in mm per normalized parameter. */
    derivative: (u: number) => HumanCurve.Vector;
  }

  /** One exact pair of corner authorities bounds an unmodeled oral/vermilion domain. */
  export interface Result {
    /** Center-to-corner upper and lower boundaries on each signed side. */
    curves: { left: { upper: Curve; lower: Curve }; right: { upper: Curve; lower: Curve } };
    /** Shared geometric mouth corner positions in world mm. */
    cornersMm: { left: HumanCurve.Vector; right: HumanCurve.Vector };
    /** Sole exact lower-lip principal restrictions consumed by incident external skin. */
    lowerCentral: LowerCentral;
    /** The generated corner-to-corner Euclidean chord in mm. */
    widthMm: number;
    /** This outer loop is not the inner lip opening or neutral contact sheet. */
    limitations: string[];
  }


  /** One exact existing lower-lip half restricted by source commissural stations. */
  export interface LowerPort {
    /** Geometric side of the existing center-to-corner authority. */
    side: "left" | "right";
    /** Sole exact restriction; future lip and external skin share this object. */
    boundary: HumanSurface.Boundary;
  }

  /** Actual mouth frame and exact restrictions of the shared lower principal. */
  export interface LowerCentral {
    /** Euclidean chord of the actual existing corner objects, mm. */
    widthMm: number;
    /** Actual commissural midpoint in registered world mm. */
    centerMm: HumanCurve.Vector;
    /** Unit increasing-left-to-right plane normal. */
    normal: HumanCurve.Vector;
    /** Registered forward projected into the actual commissural plane. */
    forward: HumanCurve.Vector;
    /** Unit up direction of that same plane. */
    up: HumanCurve.Vector;
    /** Actual shared center's commissural fraction, retained without snapping. */
    centerU: number;
    /** Two exact half restrictions, sharing the current central endpoint. */
    ports: LowerPort[];
  }

  /** Generate a shared symmetric outer lip network from four-source constrained fits.
   * Source upper philtrum and upper-outer pieces form the upper half course.
   * The separate lower principal consumes whole original named Hermite curves in
   * the physical commissural chart and removes the former artificial center turn.
   * Source lateral chord projection establishes its common coordinate. Shared
   * endpoint and residual coefficients retain actual geometric proxy definitions.
   * No independent vermilion-height or active jaw response is inferred here.
   * The assembly may inject its existing shared head frame; omission retains
   * standalone construction through that same frame law.
   */
  export function build(parameters: IAutoMovieHumanHeadIdentity, skeleton: HumanSkeleton.Result, suppliedFrame?: HumanHeadFrame.Result): Result {
    const frame: HumanHeadFrame.Result = suppliedFrame ?? HumanHeadFrame.build(parameters, skeleton);
    const width: number = parameters.face.mouth.width;
    if (!(width > 0 && Number.isFinite(width))) throw new Error("A finite positive mouth chord is required");
    const center: HumanCurve.Vector = [
      frame.supportMm[0] + 0.5800699223833127 * frame.lengthMm,
      frame.chinY + 0.3612623374547717 * frame.eyeHeightMm,
      frame.supportMm[2],
    ];
    const corners: { left: HumanCurve.Vector; right: HumanCurve.Vector } = {
      left: [center[0], center[1], center[2] - width / 2],
      right: [center[0], center[1], center[2] + width / 2],
    };
    const lowerProfile: HumanMouthLowerProfile.Result = HumanMouthLowerProfile.build(corners);
    const make: (side: "left" | "right") => Curve =
      (side: "left" | "right"): Curve => {
        const sign: number = side === "left" ? -1 : 1;
        const profile: readonly (readonly number[])[] = upper;
        const offset: readonly number[] = [0.3398849962756245, 0.2016223045962786, 0];
        const start: HumanCurve.Vector = [center[0] + offset[0]! * width, center[1] + offset[1]! * width, center[2]];
        const corner: HumanCurve.Vector = corners[side];
        return {
          id: `head.mouth.${side}.upper.outer`,
          evaluate: (u: number): HumanCurve.Vector => {
            admit(u);
            if (u === 0) return [...start];
            if (u === 1) return [...corner];
            return start.map((value: number, axis: number): number => value + u * (corner[axis]! - value) +
              width * (axis === 2 ? sign : 1) * residual(profile[axis]!, u)[0]) as HumanCurve.Vector;
          },
          derivative: (u: number): HumanCurve.Vector => {
            admit(u);
            return start.map((value: number, axis: number): number => corner[axis]! - value +
              width * (axis === 2 ? sign : 1) * residual(profile[axis]!, u)[1]) as HumanCurve.Vector;
          },
        };
      };
    return {
      curves: {
        left: { upper: make("left"), lower: lowerProfile.curves.left },
        right: { upper: make("right"), lower: lowerProfile.curves.right },
      }, cornersMm: corners, widthMm: width, lowerCentral: lowerProfile.central,
      limitations: [
        "Outer lip curves bound an unmodeled oral and vermilion domain; they are not a physical inner-lip aperture or a contact solution",
        "The source upper philtrum and upper outer-lip half courses are combined by actual shared endpoints; original recovered pieces remain independent observations",
        "The existing upper profile retains its endpoint-conditioned fit. The separate common lower principal has corner-frame-conditioned RMS/max 2.686/4.520 mm over 796 whole-curve observations, tangent RMS/max 6.24/20.07 degrees and whole-person omitted maximum 5.991 mm; shared-frame placement and unseen morphology remain unverified",
        "The symmetric lower principal shares one analytic central tangent and exact current corner authorities. Original left/right native and Hermite center turns of 1.97-3.65 degrees remain unsupported asymmetry, not re-labelled source C1 continuity",
        "The mouth corner chord follows the width input; vermilion heights, active mouth opening, mandibular laterotrusion and independent source parameter interactions remain unsupported",
        "This symmetric common network does not reproduce individual asymmetry, facial expression, teeth, saliva, tongue or inside-mouth sheets",
      ],
    };
  }

  // Endpoint-constrained joint fit: u(1-u) sum(theta[k](2u-1)^k).
  const upper: readonly (readonly number[])[] = [
    [0.43690095090051534,0.17536112186463254,0.02409384644612579,-0.08029090146317772,0.22426505047236545,0.30405570891030215],
    [0.3583364007459766,-0.10958288874871217,-0.01839201079472167,-0.03858905563517401,0.12291507851262416,0.4750687687091915],
    [0.0008957238800586538,-0.0019274122777572181,-0.02512379902206354,0.04910804500675389,0.038988791208675586,-0.07008700873344732],
  ];

  /** Horner evaluation retains the full degree and exact endpoint vanishing factor. */
  function residual(coefficients: readonly number[], u: number): [number, number] {
    const x: number = 2 * u - 1;
    let value: number = 0, derivative: number = 0;
    for (let k: number = coefficients.length - 1; k >= 0; k--) {
      derivative = derivative * x + value;
      value = value * x + coefficients[k]!;
    }
    return [u * (1 - u) * value, (1 - 2 * u) * value + 2 * u * (1 - u) * derivative];
  }

  /** Preserve the explicit domain rather than extending an unobserved polynomial. */
  function admit(u: number): void {
    if (!(Number.isFinite(u) && u >= 0 && u <= 1)) throw new Error("Lip parameter must lie in [0,1]");
  }
}
