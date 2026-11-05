import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/**
 * Four rational conics with convex rational cubic G2 end approximations.
 *
 * Supports and shoulders remain exact. Only an incompatible guide curvature
 * changes a short conic end through AutoMovieConicHermite. Its native support
 * vanishes with the curvature contrast, so the composed source is jointly C2
 * for smooth input extents/shoulders on the admitted regular domain. This
 * source statement does not certify a later periodic spline or a physical pole.
 *
 * @evidence contracts/common.md#principled-implementation Positive rational quadratics and fixed-convex-polygon G2 ends preserve supports, shoulders and shared curvature, with the Hermite owner's explicit radial error bound and vanishing-support C2 argument.
 * @evidence contracts/common.md#clear-and-simple-design Four prepared quarters own one function each; observation knots and native quadrature read that function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled replacement, aspect/person exemption, input clamp or exact-conic claim for corrected ends is introduced.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes source C2/error/admission from final phase fitting, longitudinal coefficient interpolation and pole regularity.
 * @evidence contracts/performance.md#efficient-algorithms Four constant-size G2 preparations and retained bounded native-turn partitions; only a query inside a short end pays bounded ray inversion.
 * @evidence contracts/performance.md#reuse-equivalent-work Preparation and native partitions are reused by source, observations and arclength.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each source retains four fixed-size quarters and at most 68 native partition values; no global cache exists.
 */
export namespace AutoMovieViewConic {
  /**
   * One source quarter and its disjoint initial/final C2 supports.
   *
   * @evidence contracts/common.md#principled-implementation The positive extents/shoulder identify the original conic; each optional end holds its distinct convex G2 approximation and native boundary.
   * @evidence contracts/common.md#clear-and-simple-design Two extents, one shoulder, two optional ends and one native partition expose the complete prepared quarter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds no sampled replacement curve or emitted mesh data.
   * @evidence contracts/common.md#meaningful-documentation Members state length, shoulder, optional-end and native-partition meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Data coordinates no requests; create owns preparation reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its section owns the fixed-size record.
   */
  export interface IQuarter {
    /** First and second positive half extents, millimetres. */
    extents: readonly [number, number];

    /** Original conic shoulder in (0,1). */
    shoulder: number;

    /** Optional initial convex G2 end; null preserves the exact quadratic. */
    start: AutoMovieConicHermite.IPatch | null;

    /** Optional reflected final convex G2 end, with the same ownership. */
    end: AutoMovieConicHermite.IPatch | null;

    /** Original quadratic parameters of the bounded native-turn partition. */
    parameters: readonly number[];

    /** Shared radial second derivatives at the two zero-slope main guides, millimetres. */
    guides: readonly [number, number];
  }

  /**
   * Prepared closed source with an explicit admission failure state.
   *
   * @evidence contracts/common.md#principled-implementation Keeps four admitted quarter functions or the exact reason their positive-curvature/finite arithmetic premise failed.
   * @evidence contracts/common.md#clear-and-simple-design One discriminating nullable failure keeps source admission separate from radius reads.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failure does not select a fallback shape, hidden quarter or sampled polygon.
   * @evidence contracts/common.md#meaningful-documentation States successful quarter count and failure meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result record has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation and radius callers own reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns at most four quarter records and one diagnostic string.
   */
  export interface ICurve {
    /** Four source quarters on success; empty on admission failure. */
    quarters: readonly IQuarter[];

    /** Original admission rule and numbers, or null. */
    failure: string | null;
  }

  /**
   * Prepare exact conics and only their necessary shared-curvature supports.
   *
   * @evidence contracts/common.md#principled-implementation Uses the shared positive geometric curvatures and each own endpoint law to prepare disjoint rational G2 ends before native t=1/2; exact shoulder points remain outside those ends.
   * @evidence contracts/common.md#clear-and-simple-design Returns the four-quarter source or its original named premise failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Admits finite positive inputs without normalization to a new shape; a zero shared curvature or failed numerical support remains a failure.
   * @evidence contracts/common.md#meaningful-documentation States input ownership and named failure behavior.
   * @evidence contracts/performance.md#efficient-algorithms Eight fixed-size end preparations and 60 bisections for each of 60 retained native-turn interior parameters.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepares each end and native partition once for every later source or length reading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only four copied records; failed local preparation releases its temporary records.
   */
  export function create(
    extents: readonly number[],
    shoulders: readonly number[],
    curvatures: readonly number[],
  ): ICurve {
    if (
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      curvatures.length !== 4 ||
      !extents.every((v: number): boolean => Number.isFinite(v) && v > 0) ||
      !shoulders.every(
        (v: number): boolean => Number.isFinite(v) && v > 0 && v < 1,
      ) ||
      !curvatures.every((v: number): boolean => Number.isFinite(v) && v > 0)
    )
      return {
        quarters: [],
        failure:
          "conic quarters need four finite positive extents/curvatures and shoulders inside (0,1)",
      };
    const quarters: IQuarter[] = [];
    for (let q: number = 0; q < 4; q++) {
      const a: number = extents[q]!;
      const b: number = extents[(q + 1) % 4]!;
      const r: number = shoulders[q]!;
      const start: AutoMovieConicHermite.IPatch | string | null =
        AutoMovieConicHermite.create(a, b, r, curvatures[q]!);
      const end: AutoMovieConicHermite.IPatch | string | null =
        AutoMovieConicHermite.create(b, a, r, curvatures[(q + 1) % 4]!);
      if (typeof start === "string" || typeof end === "string")
        return {
          quarters: [],
          failure: `quarter ${q}: ${typeof start === "string" ? start : end}`,
        };

      // A positive local support can be smaller than one global-angle ulp.
      // It is still a valid rational piece: keep its native length and exact
      // guide jet. A rounded global query outside it reads the original conic.
      const guides: [number, number] = [
        a - curvatures[q]! * a * a,
        b - curvatures[(q + 1) % 4]! * b * b,
      ];
      if (!guides.every(Number.isFinite))
        return {
          quarters: [],
          failure: `quarter ${q}: shared guide jet is not finitely representable`,
        };
      const parameters: readonly number[] = Array.from(
        { length: 17 },
        (_: unknown, i: number): number =>
          i === 0 ? 0 : i === 16 ? 1 : turned(a, b, r, i / 16),
      );
      quarters.push({
        extents: [a, b],
        shoulder: r,
        start,
        end,
        guides,
        parameters,
      });
    }
    return { quarters, failure: null };
  }

  /**
   * The original conic/G2-end source at a periodic angle.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates the original rational quarter or its sole active G2 end; reflected evaluation changes only the first angular derivative's sign.
   * @evidence contracts/common.md#clear-and-simple-design One evaluator serves source validity, observations and production section sampling; native arclength reads the identical pieces.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never flips a point or clamps its value; an unadmitted/nonfinite query returns a nonfinite jet for the caller's diagnostic path.
   * @evidence contracts/common.md#meaningful-documentation States periodic angle, radial derivative order and explicit nonfinite failure result.
   * @evidence contracts/performance.md#efficient-algorithms Constant quarter lookup and a closed-form conic ray, or at most 64 bisections inside one short G2 end.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses prepared rational controls/weights without repeating admission.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one three-number jet and retains no query state.
   */
  export function radius(curve: ICurve, phi: number): AutoMoviePolarSector.Jet {
    if (curve.failure !== null || !Number.isFinite(phi)) return [NaN, NaN, NaN];
    const turn: number = 2 * Math.PI;
    const quarter: number = Math.PI / 2;
    const remainder: number = phi % turn;
    const index: number = Math.min(
      3,
      Math.floor(Math.abs(remainder) / quarter),
    );
    const distance: number = Math.abs(remainder) - index * quarter;
    const reflected: boolean = remainder < 0 && distance !== 0;
    const q: number = reflected
      ? 3 - index
      : remainder < 0
        ? (4 - index) % 4
        : index;
    const local: number = reflected ? quarter - distance : distance;
    const toEnd: number = reflected ? distance : quarter - local;
    const arc: IQuarter = curve.quarters[q]!;
    if (local === 0) return [arc.extents[0], 0, arc.guides[0]];
    if (arc.start !== null && local < arc.start.angle)
      return AutoMovieConicHermite.radius(arc.start, local);
    if (arc.end !== null && toEnd < arc.end.angle) {
      const jet: AutoMoviePolarSector.Jet = AutoMovieConicHermite.radius(
        arc.end,
        toEnd,
      );
      return [jet[0], -jet[1], jet[2]];
    }
    return AutoMovieConicArc.radius(
      arc.extents[0],
      arc.extents[1],
      arc.shoulder,
      local,
    );
  }

  /**
   * Native conic-turn and G2-end boundary observations, which do not define an interpolant.
   *
   * @evidence contracts/common.md#principled-implementation Uses the retained native-turn partition and optional G2-end boundaries solely as observations; every guide reads the same composed source.
   * @evidence contracts/common.md#clear-and-simple-design The public section's observation list has one owner and no alternate shape interpretation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed initial observations never stand in for the conic or its convexity proof.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes quadrature observations from former polar Hermite construction guides.
   * @evidence contracts/performance.md#efficient-algorithms At most 72 observations reuse the retained native parameters with conic guides and bounded G2-end radius reads.
   * @evidence contracts/performance.md#reuse-equivalent-work The section retains these observations for display and continuity readers; native length uses the retained parameter partition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a bounded list of guide values and retains no global arrays.
   */
  export function samples(curve: ICurve): AutoMoviePolarSector.IGuide[] {
    if (curve.failure !== null) return [];
    const result: AutoMoviePolarSector.IGuide[] = [];
    for (let q: number = 0; q < 4; q++) {
      const arc: IQuarter = curve.quarters[q]!;
      const start: number = (q * Math.PI) / 2;
      const angles: number[] = [
        0,
        ...(arc.start === null ? [] : [arc.start.angle]),
        ...(arc.end === null ? [] : [Math.PI / 2 - arc.end.angle]),
      ];
      for (const parameter of arc.parameters.slice(1, -1))
        angles.push(
          AutoMovieConicArc.guide(
            arc.extents[0],
            arc.extents[1],
            arc.shoulder,
            parameter,
          ).angle,
        );
      for (const angle of [...new Set(angles)].sort(
        (a: number, b: number): number => a - b,
      )) {
        const phi: number = start + angle;
        if (phi >= 2 * Math.PI || result.at(-1)?.angle === phi) continue;
        const jet: AutoMoviePolarSector.Jet = radius(curve, phi);
        result.push({
          angle: phi,
          value: jet[0],
          slope: jet[1],
          curvature: jet[2],
        });
      }
    }
    return result;
  }

  /** The existing bounded native-turn partition, used only to split numerical quadrature. Normalized extents preserve its angular meaning. */
  function turned(a: number, b: number, r: number, share: number): number {
    const scale: number = Math.max(a, b);
    const A: number = a / scale;
    const B: number = b / scale;
    const w: number = r / (1 - r);
    const target: number = share * Math.PI;
    let low: number = 0;
    let high: number = 1;
    for (let k: number = 0; k < 60; k++) {
      const t: number = (low + high) / 2;
      const s: number = 1 - t;
      const D: number = s * s + 2 * w * t * s + t * t;
      const D1: number = -2 * s + 2 * w * (1 - 2 * t) + 2 * t;
      const x: number = A * (s * s + 2 * w * t * s);
      const y: number = B * (2 * w * t * s + t * t);
      const dx: number = (-2 * s * A + 2 * w * (1 - 2 * t) * A) * D - x * D1;
      const dy: number = (2 * w * (1 - 2 * t) * B + 2 * t * B) * D - y * D1;
      if (Math.atan2(dy, dx) - Math.PI / 2 + Math.atan2(y, x) < target) low = t;
      else high = t;
    }
    return (low + high) / 2;
  }
}
