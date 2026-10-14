import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import { isolateHumanPolynomialRoots } from "../../../common/measure/isolateHumanPolynomialRoots";
import type { IHumanFaceSkinProjectionComparison } from "./IHumanFaceSkinProjectionComparison";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";
import type { IHumanFaceSkinProjectionOwnership } from "./IHumanFaceSkinProjectionOwnership";

/**
 * Compare native affine projections using exact rational squared-distance
 * coefficients. Native coordinates and guide values remain exact through
 * the projection equations and comparison, preserving face/edge inclusion
 * even at a nearly coincident distance. Clearing the three denominators
 * produces an integer polynomial without changing its signs or roots.
 * The shared exact rational root owner retains every root-
 * bearing enclosure on [0,1]. Actual validity overlaps are clipped afterward.
 *
 * Parameter boundaries still round to the course's binary64 format; native
 * coordinate precision remains the actual input's precision, not measured
 * anatomical accuracy. A two-crossing interval narrower than that format is
 * refused only when exact quadratic signs prove actual crossings inside the
 * validity overlap. A stationary point alone proves neither root existence
 * nor representation loss. Tangency retains its root enclosure while its
 * open intervals keep the leading-coefficient sign. Interval-wide equality
 * preserves the earlier native owner.
 *
 * Endpoint/derivative signs count strict interior crossings independently of
 * the shared enclosure population: a returned enclosure can contain multiple
 * roots rounding to one parameter. Between ordered crossing enclosures an
 * exact rational sample certifies ownership, including adjacent binary64
 * boundaries without a representable midpoint. Represented boundaries are
 * still a curve representation; clinical/source accuracy is not certified.
 *
 * @evidence contracts/common.md#principled-implementation Exact affine native projections yield a rational squared-distance difference; clearing denominators preserves its integer-quadratic signs, root enclosures and strict crossing count. Final parameter boundaries remain binary64 and unresolved crossing order refuses.
 * @evidence contracts/common.md#clear-and-simple-design One pair closure shares coefficients/root proof between sign and overlap partition readers; the envelope separately owns selection and native-order ties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact samples between root enclosures determine open-interval signs; tangency is not a crossing and interval-wide equality is not a finite root list. No rounded midpoint or tolerance selects a preferred sheet.
 * @evidence contracts/common.md#meaningful-documentation The prose explains represented-versus-exact precision, tangencies, whole-domain ties, validity clipping, crossing separation and the lack of anatomical certification.
 * @evidence contracts/performance.md#efficient-algorithms Three axes and two features produce fixed-degree coefficients; shared root isolation dominates with rational coefficient bit size and isolation depth, while partitions process at most the quadratic crossing population without resampling geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work A pair result retains coefficients and full-guide roots for repeated validity-overlap fragments; createHumanFaceSkinProjectionEnvelope keys this result by the same two feature objects and fixed guide direction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pair closure storage is bounded in entry count by three coefficients and degree-two roots but bigint bytes depend on input precision; guide-local ownership drops it after envelope completion/refusal, with no global handle or task.
 *
 * @author Samchon
 */
export function compareHumanFaceSkinProjectionFeatures(
  first: IHumanFaceSkinProjectionFeature,
  second: IHumanFaceSkinProjectionFeature,
  direction: readonly IHumanExactFraction[],
): IHumanFaceSkinProjectionComparison {
  let qa: IHumanExactFraction = Fraction.create(0n),
    qb: IHumanExactFraction = Fraction.create(0n),
    qc: IHumanExactFraction = Fraction.create(0n);
  for (let owner: number = 0; owner < 2; owner++) {
    const feature: IHumanFaceSkinProjectionFeature = [first, second][owner];
    const origin: IHumanExactFraction[] = feature.origin.map(
        (value: IHumanExactFraction): IHumanExactFraction =>
          Fraction.negate(value),
      ),
      velocity: IHumanExactFraction[] = feature.velocity.map(
        (value: IHumanExactFraction, axis: number): IHumanExactFraction =>
          Fraction.subtract(direction[axis], value),
      ),
      sign: IHumanExactFraction = Fraction.create(owner === 0 ? 1n : -1n);
    for (let axis: number = 0; axis < 3; axis++) {
      qa = Fraction.add(
        qa,
        Fraction.multiply(
          sign,
          Fraction.multiply(velocity[axis], velocity[axis]),
        ),
      );
      qb = Fraction.add(
        qb,
        Fraction.multiply(
          sign,
          Fraction.multiply(
            Fraction.create(2n),
            Fraction.multiply(origin[axis], velocity[axis]),
          ),
        ),
      );
      qc = Fraction.add(
        qc,
        Fraction.multiply(sign, Fraction.multiply(origin[axis], origin[axis])),
      );
    }
  }
  // The least common denominator avoids multiplying redundant denominator
  // factors. Reduction changes neither the distance order nor its roots.
  const denominator: bigint = [qa, qb, qc].reduce(
    (multiple: bigint, value: IHumanExactFraction): bigint =>
      multiple * Fraction.create(multiple, value.denominator).denominator,
    1n,
  );
  const a: bigint = qa.numerator * (denominator / qa.denominator),
    b: bigint = qb.numerator * (denominator / qb.denominator),
    c: bigint = qc.numerator * (denominator / qc.denominator);
  const discriminant: bigint = b * b - 4n * a * c;
  const valueAt: (parameter: IHumanExactFraction) => number = (
    parameter: IHumanExactFraction,
  ): number => {
    const n: bigint = parameter.numerator,
      d: bigint = parameter.denominator;
    const value: bigint = a * n * n + b * n * d + c * d * d;
    return value < 0n ? -1 : value > 0n ? 1 : 0;
  };
  const derivativeAt: (parameter: IHumanExactFraction) => number = (
    parameter: IHumanExactFraction,
  ): number => {
    const value: bigint =
      2n * a * parameter.numerator + b * parameter.denominator;
    return value < 0n ? -1 : value > 0n ? 1 : 0;
  };
  const sign: (parameter: number) => number = (parameter: number): number => {
    if (!Number.isFinite(parameter) || parameter < 0 || parameter > 1)
      throw new Error("Skin projection parameter is outside its guide.");
    return valueAt(Fraction.from(parameter));
  };
  // A constant or strictly root-free quadratic has no finite root events.
  // The identically zero polynomial is an interval-wide tie, not a finite
  // root set for the shared isolation owner to enumerate.
  const rootIntervals: IHumanPolynomialRoot[] =
    (a === 0n && b === 0n) || (a !== 0n && discriminant < 0n)
      ? []
      : isolateHumanPolynomialRoots([
          Fraction.create(c),
          Fraction.create(b),
          Fraction.create(a),
        ]);
  const countCrossings: (
    lo: IHumanExactFraction,
    hi: IHumanExactFraction,
  ) => number = (lo: IHumanExactFraction, hi: IHumanExactFraction): number => {
    if (Fraction.compare(lo, hi) >= 0 || (a === 0n && b === 0n)) return 0;
    const left: number = valueAt(lo),
      right: number = valueAt(hi);
    if (a === 0n) return left * right < 0 ? 1 : 0;
    if (discriminant <= 0n) return 0;
    const leading: 1 | -1 = a > 0n ? 1 : -1;
    const dl: number = leading * derivativeAt(lo),
      dr: number = leading * derivativeAt(hi);
    if (dl >= 0 || dr <= 0) return left * right < 0 ? 1 : 0;
    return Number(leading * left > 0) + Number(leading * right > 0);
  };
  const partition: (
    lower: number,
    upper: number,
  ) => readonly IHumanFaceSkinProjectionOwnership[] = (
    lower: number,
    upper: number,
  ): readonly IHumanFaceSkinProjectionOwnership[] => {
    if (
      ![lower, upper].every(Number.isFinite) ||
      lower < 0 ||
      lower > upper ||
      upper > 1
    )
      throw new Error(
        "Skin comparison needs its actual finite feature-domain overlap.",
      );
    if (lower === upper) return [];
    const lo: IHumanExactFraction = Fraction.from(lower),
      hi: IHumanExactFraction = Fraction.from(upper);
    const refuse: (reason: string, root?: IHumanPolynomialRoot) => never = (
      reason: string,
      root?: IHumanPolynomialRoot,
    ): never => {
      throw new Error(
        reason +
          " " +
          JSON.stringify({
            coefficients: [a, b, c].map(String),
            domain: [lower, upper],
            root:
              root === undefined
                ? undefined
                : {
                    lower: [
                      String(root.lower.numerator),
                      String(root.lower.denominator),
                    ],
                    upper: [
                      String(root.upper.numerator),
                      String(root.upper.denominator),
                    ],
                    parameter: root.parameter,
                  },
          }),
      );
    };
    const events: IHumanPolynomialRoot[] = [];
    if (a === 0n || discriminant > 0n)
      for (const root of rootIntervals) {
        let count: number;
        if (Fraction.compare(root.lower, root.upper) === 0)
          count = Number(
            Fraction.compare(root.lower, lo) > 0 &&
              Fraction.compare(root.lower, hi) < 0,
          );
        else {
          const start: IHumanExactFraction =
            Fraction.compare(root.lower, lo) < 0 ? lo : root.lower;
          const end: IHumanExactFraction =
            Fraction.compare(root.upper, hi) > 0 ? hi : root.upper;
          count = countCrossings(start, end);
        }
        if (count === 0) continue;
        if (count > 1)
          refuse(
            "Skin projection distinct crossings share one represented parameter.",
            root,
          );
        if (!(root.parameter > lower && root.parameter < upper))
          refuse(
            "Skin projection actual crossing cannot be separated from its validity boundary.",
            root,
          );
        if (events.at(-1)?.parameter === root.parameter)
          refuse(
            "Skin projection distinct crossing events have no represented ordering.",
            root,
          );
        events.push(root);
      }
    if (events.length !== countCrossings(lo, hi))
      refuse(
        "Skin projection root intervals do not certify its complete crossing population.",
      );
    const result: IHumanFaceSkinProjectionOwnership[] = [];
    for (let at: number = 0; at <= events.length; at++) {
      const start: IHumanExactFraction = at === 0 ? lo : events[at - 1].upper;
      const end: IHumanExactFraction =
        at === events.length ? hi : events[at].lower;
      if (Fraction.compare(start, end) > 0)
        refuse(
          "Skin projection root enclosures do not certify interval ordering.",
        );
      const middle: IHumanExactFraction = Fraction.divide(
        Fraction.add(start, end),
        Fraction.create(2n),
      );
      // A tangent's isolated point tie does not change either open interval.
      const ownerSign: number =
        a !== 0n && discriminant === 0n ? (a > 0n ? 1 : -1) : valueAt(middle);
      if (ownerSign === 0 && (a !== 0n || b !== 0n || c !== 0n))
        refuse(
          "Skin projection interval has no certified open-interval owner.",
        );
      result.push({
        lower: at === 0 ? lower : events[at - 1].parameter,
        upper: at === events.length ? upper : events[at].parameter,
        sign: ownerSign,
      });
    }
    return result;
  };
  return { rootIntervals, sign, partition };
}
