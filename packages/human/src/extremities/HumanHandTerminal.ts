import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";

/** A source-identified single-pole terminal hypothesis, separately qualified
 * from the source's saddle and multiple-maximum terminal classes. */
export namespace HumanHandTerminal {
  /** The five observed digit identities share no specimen-specific controls. */
  export type Digit = "index" | "middle" | "ring" | "pinky" | "thumb";

  /** Existing generated shaft authority and its physical radial endpoint jet. */
  export interface Input {
    /** Observed digit identity selecting one pooled common rule. */
    digit: Digit;
    /** Native geometric side; the right side reflects signed transverse terms. */
    side: "l" | "r";
    /** Existing open generated family, retained unchanged through its last station. */
    shaft: HumanCurveFamily.Family;
    /** Endpoint radial Fourier c0,cos1,sin1 through cos4,sin4, millimetres. */
    radialCoefficientsMm: readonly number[];
    /** The same harmonic channels differentiated by physical shaft station, mm/mm. */
    radialDerivativeCoefficients: readonly number[];
    /** Endpoint centre derivative by physical shaft station, mm/mm. */
    originDerivative: HumanCurve.Vector;
  }

  /** Candidate geometry does not authorize replacing a branched source tip. */
  export interface Result {
    /** Original shaft followed by the exact analytic terminal hypothesis. */
    family: HumanCurveFamily.Family;
    /** Declared broad-form terminal topology, separately from source PL events. */
    terminalTopology: "single-pole-hypothesis";
    /** The fit alone does not qualify source critical-event correspondence. */
    sourceTopologyCorrespondenceQualified: false;
    /** Source fit, sampling, independent-response and unseen-shape qualifications. */
    limitations: string[];
  }

  /**
   * Extend a shaft without changing its coefficients, domain or endpoint jet.
   * A log-radius law guarantees positive interior radii. The physical terminal
   * parameter s has u=(s-s0)/(2 reach), axial fraction 2u-u², so the pole has a
   * finite jet and the shaft's physical longitudinal derivative is retained.
   * Both exact angular derivatives are propagated through the exponential.
   *
   * Eight side-specific observations identify each common rule. Eighty-one
   * regular terminal contours admitted their fit, containment and single-ray
   * hypotheses. Three unresolved fits and four non-star contours were excluded.
   * The original physical cubic Hermite curves remain outside this model.
   * This fit does not reproduce the 28 of 40 source digits with a saddle and
   * two maxima, nor qualify their terminal topology as a single pole.
   */
  export function build(input: Input): Result {
    const shaft: HumanCurveFamily.Family = input.shaft;
    const end: HumanCurve.Section | undefined = shaft.sections.at(-1);
    const start: HumanCurve.Section | undefined = shaft.sections[0];
    if (!end || !start || end.topology === "pole" ||
        input.radialCoefficientsMm.length !== 9 || input.radialDerivativeCoefficients.length !== 9 ||
        ![...input.radialCoefficientsMm, ...input.radialDerivativeCoefficients, ...input.originDerivative].every(Number.isFinite) ||
        !input.radialCoefficientsMm.every((value: number, k: number): boolean => value === end.coefficientsMm[k]))
      throw new Error("A terminal hypothesis requires a finite open shaft and its order-four radial endpoint jet");
    const rule: Rule = rules[input.digit];
    const reachMm: number = rule.reachRatio * (end.stationMm - start.stationMm);
    const stopMm: number = end.stationMm + 2 * reachMm;
    if (!(reachMm > 0 && Number.isFinite(stopMm) && stopMm > end.stationMm))
      throw new Error("The terminal physical interval is not representable");
    const U: HumanCurve.Vector = [...end.axisU], V: HumanCurve.Vector = [...end.axisV];
    const origin: HumanCurve.Vector = [...end.originMm];
    const originDerivative: HumanCurve.Vector = [...input.originDerivative];
    const offset: HumanCurve.Vector = U.map((value: number, k: number): number =>
      value * rule.offset[0] + V[k]! * rule.offset[1] * (input.side === "r" ? -1 : 1)) as HumanCurve.Vector;
    const base: number[] = [...input.radialCoefficientsMm];
    const slope: number[] = [...input.radialDerivativeCoefficients];
    const logarithm: number[] = rule.logarithm.map((value: number, k: number): number =>
      value * (input.side === "r" && k % 9 > 0 && k % 9 % 2 === 0 ? -1 : 1));
    const Gcoefficients: number[] = logarithm.slice(0, 9), Hcoefficients: number[] = logarithm.slice(9);
    const limitations: string[] = [
      "A single-pole broad-form hypothesis; source saddle, multiple-maximum and non-star terminal classes remain unsupported",
      "Source-face continuation between the saved regular planes is not established by containment or this fit",
      "Full-fit terminal radial RMS is 1.02 to 1.56 mm; maximum is 7.51 mm before approximate generated support and reach errors",
      "Person-held-out terminal radial RMS is 1.44 to 2.67 mm; maximum is 12.59 mm for pinky, so unseen morphology prediction is unqualified",
      "Circumference scales radius and the existing independent digit chain scales reach; independent source parameter interventions remain unobserved",
      "The analytic logarithmic expression is retained without reduction to cubic interpolation; recursive intervals only restrict its domain",
    ];
    const pole: HumanCurve.Section = {
      id: end.id + ".single-pole-hypothesis", stationMm: stopMm,
      originMm: origin.map((value: number, k: number): number => value + reachMm * (originDerivative[k]! + offset[k]!)) as HumanCurve.Vector,
      axisU: U, axisV: V, coefficientsMm: new Array<number>(9).fill(0), topology: "pole",
    };
    const family: HumanCurveFamily.Family = HumanCurveFamily.fromFunction(
      [...shaft.sections, pole],
      (stationMm: number, phase: number): HumanCurveFamily.Jet => {
        if (stationMm <= end.stationMm) return shaft.jet(stationMm, phase);
        const u: number = stationMm === stopMm ? 1 : (stationMm - end.stationMm) / (2 * reachMm);
        const z: number = 2 * u - u * u;
        const [A, Aphase]: [number, number] = radial(base, phase);
        const [D, Dphase]: [number, number] = radial(slope, phase);
        if (!(A > 0)) throw new Error("A terminal requires a positive shaft endpoint radius at every phase");
        const [G, Gphase]: [number, number] = radial(Gcoefficients, phase);
        const [H, Hphase]: [number, number] = radial(Hcoefficients, phase);
        const ratioPhase: number = 2 * reachMm * (Dphase * A - D * Aphase) / (A * A);
        const g1: number = 1 + 2 * reachMm * D / A;
        const g: number = u * g1 + u * u * G + u * u * u * H;
        const gu: number = g1 + 2 * u * G + 3 * u * u * H;
        const gphase: number = u * ratioPhase + u * u * Gphase + u * u * u * Hphase;
        const guPhase: number = ratioPhase + 2 * u * Gphase + 3 * u * u * Hphase;
        const exponential: number = Math.exp(g);
        const radius: number = (1 - u) * A * exponential;
        const radialPhase: number = (1 - u) * exponential * (Aphase + A * gphase);
        const Q: number = -1 + (1 - u) * gu;
        const radialSlope: number = exponential * A * Q / (2 * reachMm);
        const mixedSlope: number = exponential * ((Aphase + A * gphase) * Q + A * (1 - u) * guPhase) / (2 * reachMm);
        const cosine: number = Math.cos(phase), sine: number = Math.sin(phase);
        const ray: HumanCurve.Vector = U.map((value: number, k: number): number => value * cosine + V[k]! * sine) as HumanCurve.Vector;
        const rayPhase: HumanCurve.Vector = U.map((value: number, k: number): number => -value * sine + V[k]! * cosine) as HumanCurve.Vector;
        return {
          positionMm: origin.map((value: number, k: number): number => value + reachMm * (z * originDerivative[k]! + z * z * offset[k]!) + radius * ray[k]!) as HumanCurve.Vector,
          longitudinalDerivative: originDerivative.map((value: number, k: number): number => (1 - u) * (value + 2 * z * offset[k]!) + radialSlope * ray[k]!) as HumanCurve.Vector,
          phaseDerivativeMmPerRadian: ray.map((value: number, k: number): number => radius * rayPhase[k]! + radialPhase * value) as HumanCurve.Vector,
          longitudinalPhaseDerivativePerRadian: ray.map((value: number, k: number): number => radialSlope * rayPhase[k]! + mixedSlope * value) as HumanCurve.Vector,
        };
      }, limitations,
    );
    return { family, terminalTopology: "single-pole-hypothesis", sourceTopologyCorrespondenceQualified: false, limitations };
  }

  /** Pooled physical reach, transverse offset and two log-Fourier correction
   * blocks; these are common method coefficients, not source curve snapshots. */
  interface Rule { reachRatio: number; offset: [number, number]; logarithm: number[]; }

  /** Logarithm rows hold G then H, each c0,cos1,sin1 through cos4,sin4. */
  const rules: Record<Digit, Rule> = {
    index: { reachRatio: 1.0386056661917014, offset: [0.06306356590149363,-0.023775606052348533], logarithm: [0.05120914393155423,0.06625283130207246,-6.895561994494829,0.2636415586346557,-0.013928989017353618,0.7914752527917646,0.07839561052151156,0.2791868229616493,0.1588728248250437,-0.22278001016004767,-0.8242026298444375,8.022477961323627,-0.5041711448728574,0.36220753133723677,-0.8352353619995937,-0.06374053279943177,-0.36920354748191325,-0.16107808993167405] },
    middle: { reachRatio: 0.8412281536708102, offset: [0.05727339290285468,0.06972499990615574], logarithm: [1.1485726552877182,0.49642975387644384,-5.099051317819456,-0.8007710745343377,-0.14048458489050744,0.2184517793147995,-0.1413781826282864,0.310562128465509,0.21838752857401503,-1.4530609662117762,-0.9055169549242723,6.385832393916321,0.9646961438906796,0.3948249588642295,-0.24537999335108204,0.010608945340346839,-0.36801605768934575,-0.21802112533331136] },
    ring: { reachRatio: 0.7179222518616494, offset: [0.009792369510637704,0.09047436177938158], logarithm: [1.923289941728246,-1.9899607321903576,-3.815755589996168,0.04562512208103195,-0.1446097125778242,-0.16752880837589298,-0.2620958737995791,-0.07622675257728154,-0.028619959420531787,-2.4615573061216454,1.6222059082443332,5.2547444714257905,-0.8000550222789298,0.17384951583622377,0.1099353249633594,0.1481922132812082,0.21787030147716024,-0.07959581643717316] },
    pinky: { reachRatio: 1.2598486688557557, offset: [0.027387037973025476,0.0046070984820326105], logarithm: [-2.7628256731872867,6.1025753817946615,-2.04782294903267,1.2145276097636406,0.04490740089077917,0.17975843525634397,-1.019003609307815,-0.17913850285454797,-0.5276315418041211,2.732873031834928,-5.738683091300487,4.197754492036457,-1.0390206255142973,-0.14073448413675327,-0.16595855126142123,1.1149638641934907,0.08643281830594932,0.47149811714088524] },
    thumb: { reachRatio: 1.054887376751745, offset: [0.057468262449803936,-0.11196779218386674], logarithm: [-7.087149308252214,6.167755272281864,-4.816322601107532,0.051009786420258114,0.5228613983622316,0.6099060918978421,1.340161471370739,0.45234196421549216,0.09123894698135843,5.785796507330636,-6.828007142701596,5.10739259568611,-0.1971284860797816,-0.6970624681561298,-0.6349303897070445,-1.3800748557519693,-0.5218217294791905,-0.07691491348933405] },
  };

  /** Evaluate the complete order-four series and its exact angular derivative. */
  function radial(c: readonly number[], phase: number): [number, number] {
    let value: number = c[0]!, derivative: number = 0;
    for (let k: number = 1; 2 * k < c.length; k++) {
      value += c[2 * k - 1]! * Math.cos(k * phase) + c[2 * k]! * Math.sin(k * phase);
      derivative += k * (-c[2 * k - 1]! * Math.sin(k * phase) + c[2 * k]! * Math.cos(k * phase));
    }
    return [value, derivative];
  }
}
