import type { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionReading } from "./AutoMovieViewSectionReading";

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
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
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
    return AutoMovieViewSectionReading.evaluate(prepared, ray);
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
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
    return fault === null
      ? AutoMovieViewSectionReading.evaluate(prepared, ray)
      : failure(fault);
  }
}

/** Convert numerical admission into the existing named failure record. */
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
