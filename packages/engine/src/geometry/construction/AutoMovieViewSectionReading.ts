import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import type { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import { AutoMovieConicHermiteField } from "./AutoMovieConicHermiteField";
import type { AutoMovieViewConic } from "./AutoMovieViewConic";
import type { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";

/** Full source Hessian [value,s,p,ss,sp,pp]; p is not the polar clock. */
type Source = AutoMovieConicFieldJet.IJet;

/** Original named numerical/source refusal, without a replacement geometry. */
type Failure = AutoMovieConicArcField.IFailure;

/**
 * Internal validation and fixed-clock reading of the existing section data.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the source/numeric snapshot checks, selected raw/G2 dispatch and normal shape-derivative formula verbatim.
 * @evidence contracts/common.md#clear-and-simple-design Public Field callers validate each supplied record; Native.jet alone reuses successful validation of its copied, unexposed preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source, clock, derivative, tolerance, input admission or geometry fallback is changed.
 * @evidence contracts/common.md#meaningful-documentation Separates metadata consistency from numerical evaluation and states the private ownership premise for reuse.
 * @evidence contracts/performance.md#efficient-algorithms Validation scans four fixed quarters and their bounded tuples; evaluation reads one selected source and its fixed-size total2 arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses only successful metadata validation in an existing private station closure; public cold/copy/stale checks remain live.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This module retains no preparation or query; the existing caller owns source lifetime and every result is fresh.
 */
export namespace AutoMovieViewSectionReading {
  /**
   * Check explicit source data against its copied numeric geometry.
   * Null certifies this metadata check, not pole regularity or derivative accuracy.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the original discriminators, four-quarter structure, required finite input jets and primal equality. Unused auxiliary Hessians retain their original primal-only requirement.
   * @evidence contracts/common.md#clear-and-simple-design One unchanged validator serves public records and the private station owner's first successful reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity registry, frozen-object guess, missing-jet replacement or weaker comparison admits data.
   * @evidence contracts/common.md#meaningful-documentation Null and named failure retain their meanings; successful private reuse requires copied records that never escape or mutate.
   * @evidence contracts/performance.md#efficient-algorithms Four quarters, at most eight four-control patches and fixed six-component tuples; no source-layer or phase traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Callers decide whether they own an unchanged preparation; public Field calls always recheck, and Native stores no failed result or exception.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps only local scalar/record references and returns null or a string; no data is retained by the module.
   */
  export function validate(
    prepared: AutoMovieViewSectionField.IPrepared,
  ): string | null {
    if (
      prepared === null ||
      prepared.kind !== "prepared" ||
      prepared.source === undefined ||
      prepared.geometry === undefined ||
      prepared.source === null ||
      prepared.geometry === null
    )
      return "The section field has no explicit source and numeric preparation.";
    const source: AutoMovieViewConic.ICurve<Source> = prepared.source;
    const geometry: AutoMovieViewConic.ICurve = prepared.geometry;
    if (
      (source.failure !== null && typeof source.failure !== "string") ||
      (geometry.failure !== null && typeof geometry.failure !== "string")
    )
      return "The section field has a malformed admission-state discriminator.";
    if (source.failure !== null || geometry.failure !== null)
      return source.failure ?? geometry.failure;
    if (
      !Array.isArray(source.quarters) ||
      !Array.isArray(geometry.quarters) ||
      source.quarters.length !== 4 ||
      geometry.quarters.length !== 4
    )
      return "The section field requires four explicit source and numeric quarters.";
    for (let q: number = 0; q < 4; q++) {
      const a: AutoMovieViewConic.IQuarter<Source> | undefined =
        source.quarters[q];
      const b: AutoMovieViewConic.IQuarter | undefined = geometry.quarters[q];
      if (
        a === undefined ||
        b === undefined ||
        a === null ||
        b === null ||
        !Array.isArray(a.extents) ||
        !Array.isArray(b.extents) ||
        a.extents.length !== 2 ||
        b.extents.length !== 2 ||
        !same(a.extents[0], b.extents[0], true) ||
        !same(a.extents[1], b.extents[1], true) ||
        !same(a.shoulder, b.shoulder, true) ||
        !(
          b.extents[0] > 0 &&
          b.extents[1] > 0 &&
          b.shoulder > 0 &&
          b.shoulder < 1
        ) ||
        !Array.isArray(a.guides) ||
        !Array.isArray(b.guides) ||
        a.guides.length !== 2 ||
        b.guides.length !== 2 ||
        !Array.isArray(a.curvatures) ||
        !Array.isArray(b.curvatures) ||
        a.curvatures.length !== 2 ||
        b.curvatures.length !== 2 ||
        !same(a.guides[0], b.guides[0]) ||
        !same(a.guides[1], b.guides[1]) ||
        !same(a.curvatures[0], b.curvatures[0]) ||
        !same(a.curvatures[1], b.curvatures[1]) ||
        !patchMatches(a.start, b.start) ||
        !patchMatches(a.end, b.end)
      )
        return `The section field's source and numeric quarter ${q} are malformed or differ.`;
    }
    return null;
  }

  /**
   * Evaluate one descriptor after this preparation's metadata validation.
   * Public Field validates now; Native holds the same unexposed copied records.
   *
   * @evidence contracts/common.md#principled-implementation Preserves descriptor admission, raw/G2 source evaluation and the original normal/tangent product rule through total order two.
   * @evidence contracts/common.md#clear-and-simple-design One arithmetic owner serves public and privately owned source readings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not redo the inverse, select a different clock, waive finite required outputs or change reflection.
   * @evidence contracts/common.md#meaningful-documentation The ray belongs to this same prepared geometry; radial results use physical station mm and polar radians.
   * @evidence contracts/performance.md#efficient-algorithms One fixed descriptor check and one selected AD source reading; no four-quarter metadata scan, knot traversal or inverse iteration.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the caller's existing descriptor and shared validation boundary, without storing evaluated rays or failed readings.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh radial tuples or named failures belong to callers; local temporaries die on return or throw and no cache or resource handle is acquired.
   */
  export function evaluate(
    prepared: AutoMovieViewSectionField.IPrepared,
    ray: AutoMovieViewConic.IRay,
  ): AutoMovieViewSectionField.IRadialJet | Failure {
    if (
      ray === null ||
      ray === undefined ||
      !Number.isInteger(ray.quarter) ||
      ray.quarter < 0 ||
      ray.quarter >= 4 ||
      (ray.kind !== "conic" && ray.kind !== "start" && ray.kind !== "end") ||
      !Array.isArray(ray.point) ||
      ray.point.length !== 2 ||
      !ray.point.every(Number.isFinite) ||
      !Array.isArray(ray.tangent) ||
      ray.tangent.length !== 2 ||
      !ray.tangent.every(Number.isFinite) ||
      !Array.isArray(ray.radial) ||
      ray.radial.length !== 3 ||
      !ray.radial.every(Number.isFinite) ||
      !Number.isFinite(ray.logCurvature) ||
      !Number.isFinite(ray.angle) ||
      !Number.isFinite(ray.distance) ||
      typeof ray.reverse !== "boolean" ||
      (ray.position !== "first" &&
        ray.position !== "interior" &&
        ray.position !== "last") ||
      (ray.kind === "conic" &&
        (ray.native === null || !Number.isFinite(ray.native))) ||
      (ray.kind !== "conic" &&
        ray.position === "interior" &&
        (ray.clock === null || !Number.isFinite(ray.clock)))
    )
      return failure(
        "The section field has no supported same-geometry numeric ray descriptor.",
      );
    const quarter: AutoMovieViewConic.IQuarter<Source> =
      prepared.source.quarters[ray.quarter]!;
    let reading: AutoMovieConicArcField.IReading | Failure;
    if (ray.kind === "conic")
      reading = AutoMovieConicArcField.read(
        quarter.extents,
        quarter.shoulder,
        ray,
      );
    else {
      const patch: AutoMovieConicHermite.IPatch<Source> | null =
        ray.kind === "start" ? quarter.start : quarter.end;
      if (patch === null)
        return failure(
          "The selected G2 piece has no corresponding source preparation.",
        );
      reading = AutoMovieConicHermiteField.read(patch, ray);
    }
    return reading.kind === "failure" ? reading : lift(reading);
  }
}

/** Convert the original numerical premise into its named failure record. */
function failure(detail: string): Failure {
  return { kind: "failure", detail };
}

/** Required source jets are finite; auxiliary branch tuples retain the original primal-only rule. */
function sourceJet(value: unknown, full: boolean): value is Source {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every((entry: unknown): boolean => typeof entry === "number") &&
    (full ? value.every(Number.isFinite) : Number.isFinite(value[0]))
  );
}

/** Compare one explicit tuple primal with the numeric snapshot, preserving required-jet admission. */
function same(value: unknown, numeric: number, full: boolean = false): boolean {
  return (
    sourceJet(value, full) && Number.isFinite(numeric) && value[0] === numeric
  );
}

/** Check the fixed control/weight snapshot without requiring unused auxiliary Hessians. */
function patchMatches(
  a: AutoMovieConicHermite.IPatch<Source> | null,
  b: AutoMovieConicHermite.IPatch | null,
): boolean {
  if (a === null || b === null) return a === null && b === null;
  if (
    a === undefined ||
    b === undefined ||
    a.angle !== b.angle ||
    !same(a.extent, b.extent) ||
    !same(a.deficit, b.deficit) ||
    !same(a.height, b.height) ||
    !same(a.native, b.native) ||
    !same(a.curvature, b.curvature) ||
    !Array.isArray(a.points) ||
    !Array.isArray(b.points) ||
    a.points.length !== 4 ||
    b.points.length !== 4 ||
    !Array.isArray(a.weights) ||
    !Array.isArray(b.weights) ||
    a.weights.length !== 4 ||
    b.weights.length !== 4
  )
    return false;
  for (let i: number = 0; i < 4; i++) {
    const point: readonly [Source, Source] | undefined = a.points[i];
    const numeric: readonly [number, number] | undefined = b.points[i];
    if (
      !Array.isArray(point) ||
      !Array.isArray(numeric) ||
      point.length !== 2 ||
      numeric.length !== 2 ||
      !same(point[0], numeric[0]) ||
      !same(point[1], numeric[1]) ||
      !same(a.weights[i], b.weights[i]!)
    )
      return false;
  }
  return true;
}

/** Keep signed curvature products in logarithmic scale until the original final exponential. */
function curvatureProduct(
  logCurvature: number,
  a: number,
  b: number = 1,
): number {
  if (a === 0 || b === 0) return 0;
  return (
    Math.sign(a) *
    Math.sign(b) *
    Math.exp(logCurvature + Math.log(Math.abs(a)) + Math.log(Math.abs(b)))
  );
}

/** Remove the material clock with the unchanged normal shape-derivative formula. */
function lift(
  reading: AutoMovieConicArcField.IReading,
): AutoMovieViewSectionField.IRadialJet | Failure {
  const [x, y]: readonly [Source, Source] = reading.point;
  const tx: readonly [number, number, number] = reading.tangent[0];
  const ty: readonly [number, number, number] = reading.tangent[1];
  const length: number = Math.hypot(x[0], y[0]);
  const ex: number = x[0] / length;
  const ey: number = y[0] / length;
  const nx: number = ty[0];
  const ny: number = -tx[0];
  const B: number = nx * ex + ny * ey;
  if (!(Number.isFinite(length) && length > 0 && Number.isFinite(B) && B > 0))
    return failure(
      "The section field has no finite positive point norm and outward ray denominator.",
    );
  const A: number = tx[0] * ex + ty[0] * ey;
  const first: number = (nx * x[1] + ny * y[1]) / B;
  const slide: number = first * A - (tx[0] * x[1] + ty[0] * y[1]);
  const turn: number = nx * tx[1] + ny * ty[1];
  const second: number =
    (nx * x[3] +
      ny * y[3] +
      2 * turn * slide -
      curvatureProduct(reading.logCurvature, slide, slide)) /
    B;
  const mixed: number =
    (first * A) / B +
    (reading.radial[0] *
      (turn - curvatureProduct(reading.logCurvature, slide))) /
      B /
      B;
  const result: AutoMovieViewSectionField.IRadialJet = [
    reading.radial[0],
    first,
    reading.radial[1],
    second,
    mixed,
    reading.radial[2],
  ];
  return result.every(Number.isFinite)
    ? result
    : failure(
        "The required radial station/phase partials are not finitely representable.",
      );
}
