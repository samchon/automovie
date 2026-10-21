import type { IAutoMovieHumanArmIdentity } from "../structures/body/IAutoMovieHumanArmIdentity";
import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import { HumanHandFrame } from "../internal/HumanHandFrame";
import { HumanHandTerminal } from "./HumanHandTerminal";

/** Pooled distal finger rules from four fixed references and both actual sides. Generated skin and
 * construction consume the same families. Original source Hermite coefficients
 * remain outside the product. This candidate retains explicit fidelity limits.
 */
export namespace HumanHandShafts {
  /** Observed branches, without inferred additional digits. */
  export type Digit = "index" | "middle" | "ring" | "pinky" | "thumb";

  /** Independent existing hand fields; lengths use millimetres. */
  export type Dimensions = Pick<IAutoMovieHumanArmIdentity, "handLength" | "palmLength" | "thumbLength" | "handBreadth">;

  /** Borrowed distal boundary and exact channels from the existing shaft owner.
   * The station is a support-domain endpoint, not a qualified skin-tip feature.
   * Its canonical angle remains the shaft angle; no feature-phase map is implied.
   */
  export interface DistalPort {
    /** Existing shaft function consumed by its skin and construction. */
    readonly family: HumanCurveFamily.Family;
    /** Same hand-frame instance supplied to the shaft builder. */
    readonly handFrame: HumanHandFrame.Result;
    /** Borrowed endpoint plane and its original oriented orthonormal axes. */
    readonly chart: {
      /** Existing last section centre in world millimetres. */
      readonly originMm: HumanCurve.Vector;
      /** Actual unit support-plane normal used by the shaft owner. */
      readonly axis: HumanCurve.Vector;
      /** Original cosine direction of the endpoint angular chart. */
      readonly axisU: HumanCurve.Vector;
      /** Original sine direction of the endpoint angular chart. */
      readonly axisV: HumanCurve.Vector;
    };
    /** Existing last physical longitudinal station, millimetres. */
    readonly stationMm: number;
    /** Actual endpoint radial channels c0, cos1, sin1, ... in millimetres. */
    readonly radialCoefficientsMm: readonly number[];
    /** Same channels differentiated by physical shaft station, mm/mm. */
    readonly radialDerivativeCoefficients: readonly number[];
    /** Existing centre derivative by physical shaft station, mm/mm. */
    readonly originDerivative: HumanCurve.Vector;
    /** Borrow the family endpoint jet at its unchanged angle in radians. */
    readonly jet: (phaseRadians: number) => HumanCurveFamily.Jet;
  }

  /** Partial surface output does not authorize unobserved attachments or caps. */
  export interface Result {
    /** Actual generating families for both skin and construction. */
    families: { digit: Digit; family: HumanCurveFamily.Family }[];
    /** Neighbors borrow the actual endpoint evaluator and its analytic channels. */
    distalPorts: ReadonlyMap<Digit, DistalPort>;
    /** Separate single-pole hypotheses do not qualify branched source tips. */
    terminalCandidates: { digit: Digit; terminal: HumanHandTerminal.Result }[];
    /** Locally owned finger supports; the caller owns the wrist. */
    supports: ReadonlyMap<string, HumanCurve.Vector>;
    /** Unrepresented domains remain absent. */
    unsupported: string[];
    /** Measured residuals and unsupported parameter effects remain visible. */
    limitations: string[];
  }

  /**
   * Generate the second-to-third support interval of every digit. Palm length
   * sets the exact middle-root reach, breadth sets the exact index-to-pinky
   * root chord. Hand-minus-palm length sets the exact middle chain and scales the other three finger chains;
   * thumb length sets its own exact chain. Incompatible breadth and axial root
   * separation refuse generation instead of clamping a coordinate.
   * Hand circumference independently scales the observed distal radial law.
   *
   * A quadratic in physical shaft station describes each generated harmonic.
   * Exact endpoint derivatives clamp HumanCurveFamily, so recursive subdivision
   * restricts this same world polynomial. Source support-chord proxies calibrated
   * the independent dimensions; clinical skin-endpoint correspondence remains
   * unresolved. Full-fit radial residuals remain 1.09 to 1.71 mm RMS and at most
   * 5.68 mm. This finite candidate is not accepted reference fidelity or an
   * identified law of independent parameter response.
   */
  export function build(wristMm: HumanCurve.Vector, side: "l" | "r", dimensions: Dimensions, handCircumferenceMm: number, suppliedFrame?: HumanHandFrame.Result): Result {
    if (!wristMm.every(Number.isFinite) || ![dimensions.handLength, dimensions.palmLength, dimensions.thumbLength, dimensions.handBreadth, handCircumferenceMm].every((x: number): boolean => Number.isFinite(x) && x > 0) || dimensions.handLength <= dimensions.palmLength)
      throw new Error("Positive independent hand dimensions and hand length greater than palm length are required");
    const frame: HumanHandFrame.Result = suppliedFrame ?? HumanHandFrame.build(wristMm,side);
    if (frame.side !== side || frame.originMm.some((value: number,index: number): boolean => value !== wristMm[index]))
      throw new Error("Finger and palm consumers must share the same generated wrist frame");
    const long: HumanCurve.Vector = frame.longitudinal;
    const across: HumanCurve.Vector = frame.across;
    const normal: HumanCurve.Vector = frame.normal;
    const supports: Map<string, HumanCurve.Vector> = new Map();
    const branch: Map<Digit, [HumanCurve.Vector, HumanCurve.Vector, HumanCurve.Vector]> = new Map();
    const digits: Digit[] = ["index", "middle", "ring", "pinky", "thumb"];
    // Breadth is the full root chord. Axial and normal offsets already consume
    // part of that chord, so solve its remaining transverse component directly.
    const axialSpanMm: number = (supportRules.index.root[0] - supportRules.pinky.root[0]) * dimensions.palmLength;
    const normalSpanMm: number = (supportRules.index.root[2] - supportRules.pinky.root[2]) * dimensions.palmLength;
    const transverseSquaredMm: number = dimensions.handBreadth ** 2 - axialSpanMm ** 2 - normalSpanMm ** 2;
    if (!(transverseSquaredMm > 0 && Number.isFinite(transverseSquaredMm)))
      throw new Error("Hand breadth cannot satisfy the declared independent palm and root offsets");
    const transverseSpanMm: number = Math.sqrt(transverseSquaredMm);
    for (const digit of digits) {
      const rule: (typeof supportRules)[Digit] = supportRules[digit];
      const root: HumanCurve.Vector = add(wristMm, combine(long, across, normal, [rule.root[0] * dimensions.palmLength, rule.root[1] * transverseSpanMm, rule.root[2] * dimensions.palmLength]));
      const lengthMm: number = digit === "thumb" ? dimensions.thumbLength : rule.ratio * (dimensions.handLength - dimensions.palmLength);
      const first: HumanCurve.Vector = unit(combine(long, across, normal, rule.first));
      const second: HumanCurve.Vector = unit(combine(long, across, normal, rule.second));
      const middle: HumanCurve.Vector = add(root, scale(first, lengthMm * rule.split));
      const end: HumanCurve.Vector = add(middle, scale(second, lengthMm * (1 - rule.split)));
      supports.set(digit + "_01_" + side, root); supports.set(digit + "_02_" + side, middle); supports.set(digit + "_03_" + side, end);
      branch.set(digit, [root, middle, end]);
    }
    const palmReference: HumanCurve.Vector = unit(cross(sub(branch.get("index")![0], wristMm), sub(branch.get("pinky")![0], wristMm)));
    const families: Result["families"] = [];
    const distalPorts: Map<Digit, DistalPort> = new Map();
    const terminalCandidates: Result["terminalCandidates"] = [];
    for (const digit of digits) {
      const [root, start, end]: [HumanCurve.Vector, HumanCurve.Vector, HumanCurve.Vector] = branch.get(digit)!;
      const axis: HumanCurve.Vector = unit(sub(end, root));
      const reference: HumanCurve.Vector = digit === "thumb" ? unit(cross(sub(root, wristMm), sub(start, wristMm))) : palmReference;
      const axisU: HumanCurve.Vector = unit(cross(reference, axis)), axisV: HumanCurve.Vector = unit(cross(axis, axisU));
      const widthMm: number = dot(sub(end, start), axis);
      if (!(widthMm > 0 && Number.isFinite(widthMm))) throw new Error("A distal interval must have positive physical projection");
      const shape: number[] = shapeRules[digit], count: number = shape.length / 3;
      const coefficients: (t: number, derivative: boolean) => number[] = (t: number, derivative: boolean): number[] => Array.from({ length: count }, (_: unknown, i: number): number => {
        const value: number = derivative ? (shape[count + i]! + 2 * t * shape[2 * count + i]!) / widthMm : shape[i]! + t * shape[count + i]! + t * t * shape[2 * count + i]!;
        return value * handCircumferenceMm * (side === "r" && i > 0 && i % 2 === 0 ? -1 : 1);
      });
      const principal: HumanCurve.Section[] = [0, 1].map((t: number): HumanCurve.Section => {
        const values: number[] = coefficients(t, false); positive(values);
        return { id: "hand." + side + "." + digit + ".distal." + t, stationMm: t * widthMm, originMm: t === 0 ? [...start] : [...end], axisU: [...axisU], axisV: [...axisV], coefficientsMm: values };
      });
      const originSlope: HumanCurve.Vector = scale(sub(end, start), 1 / widthMm);
      const boundary: (t: number) => HumanCurveFamily.EndpointDerivative = (t: number): HumanCurveFamily.EndpointDerivative => {
        const slope: number[] = coefficients(t, true);
        return {
          evaluate: (phase: number): HumanCurve.Vector => { const [r]: [number, number] = radial(slope, phase); return add(originSlope, combine(axisU, axisV, [0, 0, 0], [Math.cos(phase) * r, Math.sin(phase) * r, 0])); },
          phaseDerivative: (phase: number): HumanCurve.Vector => { const [r, dr]: [number, number] = radial(slope, phase); return combine(axisU, axisV, [0, 0, 0], [-Math.sin(phase) * r + Math.cos(phase) * dr, Math.cos(phase) * r + Math.sin(phase) * dr, 0]); },
        };
      };
      const family: HumanCurveFamily.Family = HumanCurveFamily.build(principal, { start: boundary(0), end: boundary(1) });
      families.push({ digit, family });
      const last: HumanCurve.Section = family.sections.at(-1)!;
      const endSlope: number[] = coefficients(1, true);
      distalPorts.set(digit, {
        family, handFrame: frame,
        chart: { originMm: last.originMm, axis, axisU: last.axisU, axisV: last.axisV },
        stationMm: last.stationMm, radialCoefficientsMm: last.coefficientsMm,
        radialDerivativeCoefficients: endSlope, originDerivative: originSlope,
        jet: (phase: number): HumanCurveFamily.Jet => family.jet(last.stationMm, phase),
      });
      terminalCandidates.push({ digit, terminal: HumanHandTerminal.build({ digit, side, shaft: family,
        radialCoefficientsMm: last.coefficientsMm, radialDerivativeCoefficients: endSlope, originDerivative: originSlope }) });
    }
    return { families, distalPorts, terminalCandidates, supports, unsupported: ["Palm, thenar, digit-root and interdigital-web surfaces", "First-to-second finger intervals and every qualified distal skin tip", "Wrist skin and its shared transverse derivative"], limitations: [
      "Open distal support domains add no cap or hidden attachment surface",
      "Independent dimensions were calibrated with source support-chord proxies, not clinical skin endpoints",
      "Common neutral support rules use all eight actual side-specific frames and scalar proxy inputs; individual support reproduction remains approximate",
      "Middle root reach, middle chain length, thumb chain length and index-to-pinky root chord obey the independent geometric dimensions directly",
      "Pooled root RMS is 2.49 mm and maximum is 7.67 mm; exact dimension constraints do not establish individual root fidelity",
      "Full-fit radial RMS is 1.09 to 1.71 mm, maximum 5.68 mm; source fidelity and unseen morphology prediction remain unqualified",
      "Independent dimension responses require source intervention comparison",
      "Observed hand-circumference calibration is 178.87441635131836 to 237.3563575744629 mm; other ranges are unsupported empirical extrapolation",
    ] };
  }

  /** Intrinsic root coefficients, length ratios, segment fractions and neutral
   * directions are pooled support fits. They are shared across people. */
  const supportRules: Record<Digit, { root: HumanCurve.Vector; ratio: number; split: number; first: HumanCurve.Vector; second: HumanCurve.Vector }> = {
    index: {root: [0.9999815476990137, 0.35008969525576417, 0.11512378360221612], ratio: 0.844636466350386, split: 0.6442709168593691, first: [0.9249857134036691, -0.05028088899604603, 0.3766606724903363], second: [0.8269381850768958, -0.1093750583389847, 0.551552658116225]},
    middle: {root: [1, 0, 0], ratio: 1, split: 0.6164512695670219, first: [0.9280252530509092, -0.12010306886827139, 0.35262498854763413], second: [0.746523527091015, -0.15864355741453132, 0.6461693626213276]},
    ring: {root: [0.893077789097539, -0.3392095629388557, 0.026645901622655604], ratio: 0.9490390067315515, split: 0.5707935764082166, first: [0.9085305077672008, -0.2802367534570561, 0.30990269193429343], second: [0.6829726430711625, -0.2688597243511036, 0.6791633216231859]},
    pinky: {root: [0.7890348784666472, -0.6499103047442358, 0.11512378360221612], ratio: 0.6213370039103059, split: 0.6087845177300999, first: [0.8358272691662364, -0.4019399811769311, 0.37394789429758835], second: [0.6610095132459053, -0.3418869897174023, 0.6679668477255322]},
    thumb: {root: [0.19555625320611847, 0.3214415175004977, 0.21270442831975195], ratio: 1, split: 0.6242018350823333, first: [0.7788027302896777, 0.464368647527956, 0.4216966522115161], second: [0.865679668648266, 0.13371394006524523, 0.4824098812433847]},
  };

  /** Constant, t and t² Fourier blocks c0,cos1,sin1 through cos4,sin4. Twice
   * reorthogonalized QR fitted the four references and both sides at observed
   * physical stations; this is a new conditional model, not basis conversion. */
  const shapeRules: Record<Digit, number[]> = {
    index: [0.04578145015247824,-0.004059737230370841,-0.004224635697065357,0.0017831650138405183,0.0019605698601833487,-0.00021876228241374878,-0.0010351516809535995,-0.0001150467358162436,0.00012452982846208915,-0.007762298643391522,-0.005265578825798651,-0.00897273483514444,-0.00045299335840212905,-0.00041714245811161273,0.0010375725095469602,0.00004505138883254805,0.0002769402286116892,-0.0005794932441106391,-0.000626977937756878,0.007586033792399796,0.010302540302467347,0.0016175950276247691,-0.0005303141555072483,-0.0012444467460096355,0.000016614038883919414,-0.00011440872681765167,0.00027486344201764116],
    middle: [0.04872090988807648,-0.00001657745442187404,0.00597738969405993,0.0024203243697992222,0.001607213625671608,0.00015493681743315997,0.0003668524814034884,-0.000008194728210194907,-0.00007585489175895057,-0.01112416558438321,0.004197941014308546,-0.0073751194676272575,-0.002760431037039838,-0.003049287949790954,-0.0004381226556197738,-0.001656038103500927,-0.0001415125034394804,-0.00006721714995069027,0.0009004312564149631,-0.0015758463871130615,0.005158512359742214,0.0037868101928256854,0.0013481320197899689,0.00029135153696318954,0.0015170620671742998,0.00008059607555851786,-0.000249741948011447],
    ring: [0.04410915490013394,0.011120430042946822,0.0016838986550906383,0.003703148170627171,-0.000248161767997376,0.0009426492586532383,-0.0003552178421737905,0.00019146403611517213,0.00020665467156455203,-0.007458142823637942,-0.012193572700324522,0.002012513578812128,-0.008832907432680673,0.0008709766776818802,-0.0017364433322254208,-0.0005676460885274364,-0.0003117151493322269,-0.001206348966556538,-0.0012907812962365218,0.009508668823815881,-0.002663382746731387,0.008294591378604343,-0.0003648277403089008,0.001938099990333257,0.0009804166841404568,0.0003041177602126884,0.0010887245703053066],
    pinky: [0.04022157087274912,0.004858426407226426,-0.00897556275342534,-0.0011847886460246637,-0.002672889957719109,-0.0012147140912736989,-0.00030006210053494373,0.000028070268020870452,0.00010445034024248198,-0.014865647293331704,0.022005454095146586,0.024662301200707067,0.010471883462815754,0.0022432594211308546,0.004681496530656394,-0.002466037006560711,-0.0009772285556222757,-0.0017151626424427315,0.008512550242393573,-0.02218067808807632,-0.016492260369667788,-0.007574481797340486,-0.000901668139839571,-0.0030733498428271466,0.002344563144157642,0.0008970822041092004,0.0017383532050820963],
    thumb: [0.05771691226489559,0.0019785429491936176,-0.01344604234126101,-0.001192125900726907,-0.002147447886683065,-0.0021515315227885502,-0.0030922409123170414,-0.0021199136146076982,-0.0002484735370680781,-0.030299049858652113,0.0046172848195676595,0.01985500039924489,0.001656428206759993,0.0003225640279604025,0.005374476321482869,0.009014576220694088,0.005609597501150708,0.000505520042444792,0.022775600594917296,-0.0014163663191834705,-0.012300434479018596,-0.000672104687339223,0.0015842026244560757,-0.0029489430021611557,-0.00599461732407388,-0.0037700121237144693,-0.0005283915655594793],
  };

  /** Evaluate one radial series and its exact circumferential derivative. */
  function radial(c: readonly number[], phase: number): [number, number] {
    if (!Number.isFinite(phase)) throw new Error("Circumferential phase must be finite radians");
    let r: number = c[0]!, derivative: number = 0;
    for (let k: number = 1; 2 * k < c.length; k++) { r += c[2 * k - 1]! * Math.cos(k * phase) + c[2 * k]! * Math.sin(k * phase); derivative += k * (-c[2 * k - 1]! * Math.sin(k * phase) + c[2 * k]! * Math.cos(k * phase)); }
    return [r, derivative];
  }
  /** A derivative bound extends finite angular samples to a radial lower
   * bound in real arithmetic. A failed bound receives no coordinate clamp. */
  function positive(c: number[]): void {
    let bound: number = 0, minimum: number = Infinity;
    for (let k: number = 1; 2 * k < c.length; k++) bound += k * (Math.abs(c[2 * k - 1]!) + Math.abs(c[2 * k]!));
    for (let i: number = 0; i < 256; i++) minimum = Math.min(minimum, radial(c, 2 * Math.PI * i / 256)[0]);
    if (!(minimum - bound * Math.PI / 256 > 0)) throw new Error("The distal radial rule lacks an admitted positive lower bound");
  }
  /** Combine coefficients in the already owned intrinsic chart. */
  function combine(a: HumanCurve.Vector, b: HumanCurve.Vector, c: HumanCurve.Vector, q: HumanCurve.Vector): HumanCurve.Vector { return [a[0] * q[0] + b[0] * q[1] + c[0] * q[2], a[1] * q[0] + b[1] * q[1] + c[1] * q[2], a[2] * q[0] + b[2] * q[1] + c[2] * q[2]]; }
  /** Translate physical vectors without changing their authority. */
  function add(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  /** Take a physical support chord. */
  function sub(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Scale a physical or dimensionless vector once. */
  function scale(a: HumanCurve.Vector, q: number): HumanCurve.Vector { return [a[0] * q, a[1] * q, a[2] * q]; }
  /** Dot product in the shared world chart. */
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Oriented product of actual generating chords. */
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  /** Degenerate or nonfinite directions refuse generation. */
  function unit(a: HumanCurve.Vector): HumanCurve.Vector { const n: number = Math.hypot(...a); if (!(n > 0 && Number.isFinite(n))) throw new Error("A finite nonzero hand direction is required"); return scale(a, 1 / n); }
  /** Reflect signed lateral coordinates once for the other native side. */
}
