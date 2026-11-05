import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import { AutoMovieConicHermiteField } from "./AutoMovieConicHermiteField";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import { AutoMovieViewConic } from "./AutoMovieViewConic";

/** Source Hessian used by the shared conic algebra. */
type Source = AutoMovieConicFieldJet.IJet;

/** Explicit numerical or source-admission failure. */
type Failure = AutoMovieConicArcField.IFailure;

/**
 * One original section field's regular station and polar partials.
 *
 * Inputs must be the actual scalar jets at the same physical station in mm.
 * Effective shoulders already include their owner's departures and cap law.
 * This owner neither interpolates principal sections nor solves a girth.
 * Finite arithmetic is checked; a positive ray denominator is not a general
 * forward-error certificate. Physical poles and world/frame jets are separate.
 *
 * @evidence contracts/common.md#principled-implementation Shared NUMBER/AD conic preparation and normal/tangent shape derivatives lift fixed-clock source partials without dividing by native speed.
 * @evidence contracts/common.md#clear-and-simple-design Station preparation owns explicit numeric/source data; one polar reading returns exactly the required six radial partials.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No principal reinterpolation, finite differences, missing-jet zeros, geometry registry or legacy fallback is present.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes regular station units, source inputs, primal phase geometry, conditioning and unavailable pole/world guarantees.
 * @evidence contracts/performance.md#efficient-algorithms Fixed four-quarter preparation precedes one numeric inverse and one selected source evaluation per phase; no layer traversal or quadrature occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Numeric lookup data projects the same prepared source; all radial derivatives share its single selected clock and source reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared records and fresh radial tuples are caller-owned; no source, station or phase cache is retained.
 */
export namespace AutoMovieViewSectionField {
  /**
   * Actual scalar [value,ds,dss] in regular physical station mm.
   *
   * @evidence contracts/common.md#principled-implementation Retains actual first/second station derivatives, with extent values in mm and shoulders dimensionless.
   * @evidence contracts/common.md#clear-and-simple-design Three entries match the original scalar reader's value and finite station jet.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No singular or unavailable derivative is represented by an invented zero.
   * @evidence contracts/common.md#meaningful-documentation States ordering, scalar units and physical station coordinate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This tuple type performs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scalar preparation belongs to the caller.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The tuple type owns no retention.
   */
  export type IStationJet = readonly [number, number, number];

  /**
   * Radial [value,s,phi,ss,sphi,phiphi], with polar angle in radians.
   *
   * @evidence contracts/common.md#principled-implementation Stores total-order-two derivatives of the same radial field, rather than source-p derivatives or a rectangular higher jet.
   * @evidence contracts/common.md#clear-and-simple-design Six entries suffice for the existing surface product rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-p/phase substitution or unused higher derivative is implied.
   * @evidence contracts/common.md#meaningful-documentation Gives ordering and physical-station/polar coordinate meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A result tuple coordinates no preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each returned mutable tuple belongs to its caller.
   */
  export type IRadialJet = [number, number, number, number, number, number];

  /**
   * Immutable, value-copyable preparation of one station's original field.
   *
   * @evidence contracts/common.md#principled-implementation Numeric lookup data is a primal projection of explicit source tuples from the shared geometry factory.
   * @evidence contracts/common.md#clear-and-simple-design Source derivatives and their numeric lookup snapshot remain visible records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No callback registration or object identity selects geometry; a broken present snapshot is refused.
   * @evidence contracts/common.md#meaningful-documentation States station-local ownership, immutability and equal-value copy semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation and reading own reuse of these records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns four source quarters and their numeric projection until releasing this record.
   */
  export interface IPrepared {
    /** Distinguishes a successful preparation from a named failure. */
    readonly kind: "prepared";

    /** Actual station source tuples; p is an explicitly constant coordinate. */
    readonly source: AutoMovieViewConic.ICurve<Source>;

    /** Numeric values of that same source, without native observation partitions. */
    readonly geometry: AutoMovieViewConic.ICurve;
  }

  /**
   * Prepare original positive extents and effective shoulders at one station.
   *
   * @evidence contracts/common.md#principled-implementation Copies finite actual scalar jets, uses the shared auxiliary-curvature/quarter policy and projects its values once.
   * @evidence contracts/common.md#clear-and-simple-design One admission and one shared factory return explicit source and numeric records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects unavailable derivatives and nonpositive regular extents; does not re-solve a named-site girth, clamp a shoulder or fit layers.
   * @evidence contracts/common.md#meaningful-documentation The namespace states same-station units, effective-shoulder ownership and the separate finite-value/pole capability.
   * @evidence contracts/performance.md#efficient-algorithms Eight copied station tuples, eight own endpoint curvatures and four constant-size quarters; no native-turn partition, length integration or cache is prepared.
   * @evidence contracts/performance.md#reuse-equivalent-work This fixed pure AD invocation reuses its eight own endpoint curvatures for end assembly; numeric geometry projects the same prepared controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned numeric/tuple records with no retained input arrays or algebra table.
   */
  export function prepare(
    extents: readonly IStationJet[],
    shoulders: readonly IStationJet[],
  ): IPrepared | Failure {
    if (
      !Array.isArray(extents) ||
      !Array.isArray(shoulders) ||
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      !extents.every(
        (jet: IStationJet): boolean => stationJet(jet) && jet[0] > 0,
      ) ||
      !shoulders.every(
        (jet: IStationJet): boolean =>
          stationJet(jet) && jet[0] > 0 && jet[0] < 1,
      )
    )
      return failure(
        "A regular section field needs four finite positive extent 2-jets and four shoulder 2-jets inside (0,1).",
      );
    const ops: AutoMovieConicFieldJet.IAlgebra<Source> =
      AutoMovieConicFieldJet.AD;
    const e: Source[] = extents.map(AutoMovieConicFieldJet.fromStation);
    const r: Source[] = shoulders.map(AutoMovieConicFieldJet.fromStation);
    const source: AutoMovieViewConic.ICurve<Source> =
      AutoMovieConicPreparation.source(e, r);
    if (source.failure !== null) return failure(source.failure);
    return {
      kind: "prepared",
      source,
      geometry: AutoMovieViewConic.primal(ops, source),
    };
  }

  /**
   * Read one polar ray and its regular-station radial 2-jet.
   *
   * @evidence contracts/common.md#principled-implementation One numeric descriptor selects raw/G2 source partials; outward-normal shape derivatives remove the material clock.
   * @evidence contracts/common.md#clear-and-simple-design Metadata validation, one source read and one geometric lift remain consecutive explicit steps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the numeric phase owner and reflection exactly once; malformed data, nonpositive B and nonfinite required outputs fail explicitly.
   * @evidence contracts/common.md#meaningful-documentation Gives six radial derivative meanings and finite-arithmetic rather than universal conditioning guarantees.
   * @evidence contracts/performance.md#efficient-algorithms Fixed metadata comparisons, one numeric inverse and one selected AD evaluation; no source-knot or layer traversal occurs here.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses numeric phase jets and log curvature from the same descriptor; no AD occurs inside inverse iterations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh six-number tuple or named failure and stores no query state.
   */
  export function read(prepared: IPrepared, phi: number): IRadialJet | Failure {
    const fault: string | null = validate(prepared);
    if (fault !== null) return failure(fault);
    if (!Number.isFinite(phi))
      return failure("The section field requires a finite polar phase.");
    const ray: AutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
      prepared.geometry,
      phi,
    );
    if (ray === null)
      return failure(
        "The original section has no admitted numeric ray reading.",
      );
    return evaluate(prepared, ray);
  }

  /**
   * Read source2 from the caller's one numeric descriptor of this same preparation.
   *
   * The caller must obtain ray from prepared.geometry, without another geometry,
   * phase rewrap or reflection. This keeps its primal point/direction available
   * to Cartesian consumers without repeating the numeric inverse.
   *
   * @evidence contracts/common.md#principled-implementation The same validated source-dispatch/lift reads the actual fixed clock selected by the caller's same-geometry numeric descriptor.
   * @evidence contracts/common.md#clear-and-simple-design This entry separates numeric lookup from source partial evaluation while sharing their existing authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed present source/descriptor fails; no inverse, different phase, extra reflection or fallback curve is introduced.
   * @evidence contracts/common.md#meaningful-documentation States the same-prepared-geometry caller premise and retained primal-point purpose explicitly.
   * @evidence contracts/performance.md#efficient-algorithms One source validation and one selected AD evaluation, with zero inverse iterations in this entry.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the already selected numeric ray and its phase jet/curvature in the existing geometric lift.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh radial tuple or named failure and retains no descriptor/history/cache.
   */
  export function readRay(
    prepared: IPrepared,
    ray: AutoMovieViewConic.IRay,
  ): IRadialJet | Failure {
    const fault: string | null = validate(prepared);
    return fault === null ? evaluate(prepared, ray) : failure(fault);
  }
}

/** One shared fixed-clock source dispatch follows an admitted same-geometry ray. */
function evaluate(
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

/** Convert a numerical premise into the shared explicit failure record. */
function failure(detail: string): Failure {
  return { kind: "failure", detail };
}

/** Actual regular station jets contain three finite scalars. */
function stationJet(
  value: unknown,
): value is AutoMovieViewSectionField.IStationJet {
  return (
    Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
  );
}

/** Full source inputs are finite; auxiliary branch tuples need only a finite primal. */
function sourceJet(value: unknown, full: boolean): value is Source {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every((entry: unknown): boolean => typeof entry === "number") &&
    (full ? value.every(Number.isFinite) : Number.isFinite(value[0]))
  );
}

/** Compare an explicit tuple's primal value with its numeric lookup snapshot. */
function same(value: unknown, numeric: number, full: boolean = false): boolean {
  return (
    sourceJet(value, full) && Number.isFinite(numeric) && value[0] === numeric
  );
}

/** Fixed-size source/snapshot comparison leaves unused auxiliary Hessians unrequired. */
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

/** Cold reads and value copies use the same explicit source, never admission identity. */
function validate(
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

/** Signed curvature products retain the logarithmic scale until all factors are combined. */
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

/** Normal shape derivatives remove the material clock; the ray remains numeric and fixed. */
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
