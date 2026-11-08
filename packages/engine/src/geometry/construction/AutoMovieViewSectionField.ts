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
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes regular station units, source inputs, primal phase geometry, conditioning and unavailable pole/world guarantees.
 * @evidence contracts/development/design.md#principled-representation Represents One original section field's regular station and polar partials: companion namespace of 6 members (`IStationJet`, `IRadialJet`, `IPrepared`, `prepare`, `read`, `readRay`); units and frames named in its text: second, radians, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewSectionField` in packages/engine/src/geometry/construction/AutoMovieViewSectionField.ts; its surface is the 6 members listed and the text shows 8 other files naming it, mostly packages/engine (4), test (4), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewSectionField {
  /**
   * Actual scalar [value,ds,dss] in regular physical station mm.
   *
   * @evidence contracts/development/design.md#principled-representation Retains actual first/second station derivatives, with extent values in mm and shoulders dimensionless.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three entries match the original scalar reader's value and finite station jet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No singular or unavailable derivative is represented by an invented zero.
   * @evidence contracts/development/common.md#meaningful-documentation States ordering, scalar units and physical station coordinate.
   */
  export type IStationJet = readonly [number, number, number];

  /**
   * Radial [value,s,phi,ss,sphi,phiphi], with polar angle in radians.
   *
   * @evidence contracts/development/design.md#principled-representation Stores total-order-two derivatives of the same radial field, rather than source-p derivatives or a rectangular higher jet.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six entries suffice for the existing surface product rule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source-p/phase substitution or unused higher derivative is implied.
   * @evidence contracts/development/common.md#meaningful-documentation Gives ordering and physical-station/polar coordinate meanings.
   */
  export type IRadialJet = [number, number, number, number, number, number];

  /**
   * Immutable, value-copyable preparation of one station's original field.
   *
   * @evidence contracts/development/design.md#principled-representation Numeric lookup data is a primal projection of explicit source tuples from the shared geometry factory.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source derivatives and their numeric lookup snapshot remain visible records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback registration or object identity selects geometry; a broken present snapshot is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States station-local ownership, immutability and equal-value copy semantics.
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
   * @evidence contracts/development/implementation.md#principled-implementation Copies finite actual scalar jets, uses the shared auxiliary-curvature/quarter policy and projects its values once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission and one shared factory return explicit source and numeric records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects unavailable derivatives and nonpositive regular extents; does not re-solve a named-site girth, clamp a shoulder or fit layers.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace states same-station units, effective-shoulder ownership and the separate finite-value/pole capability.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight copied station tuples, eight own endpoint curvatures and four constant-size quarters; no native-turn partition, length integration or cache is prepared.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This fixed pure AD invocation reuses its eight own endpoint curvatures for end assembly; numeric geometry projects the same prepared controls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns owned numeric/tuple records with no retained input arrays or algebra table.
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
   * @evidence contracts/development/implementation.md#principled-implementation One numeric descriptor selects raw/G2 source partials; outward-normal shape derivatives remove the material clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Metadata validation, one source read and one geometric lift remain consecutive explicit steps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the numeric phase owner and reflection exactly once; malformed data, nonpositive B and nonfinite required outputs fail explicitly.
   * @evidence contracts/development/common.md#meaningful-documentation Gives six radial derivative meanings and finite-arithmetic rather than universal conditioning guarantees.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed metadata comparisons, one numeric inverse and one selected AD evaluation; no source-knot or layer traversal occurs here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses numeric phase jets and log curvature from the same descriptor; no AD occurs inside inverse iterations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh six-number tuple or named failure and stores no query state.
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
   * @evidence contracts/development/implementation.md#principled-implementation The same validated source-dispatch/lift reads the actual fixed clock selected by the caller's same-geometry numeric descriptor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This entry separates numeric lookup from source partial evaluation while sharing their existing authority.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A malformed present source/descriptor fails; no inverse, different phase, extra reflection or fallback curve is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation States the same-prepared-geometry caller premise and retained primal-point purpose explicitly.
   * @evidence contracts/development/implementation.md#efficient-algorithms One source validation and one selected AD evaluation, with zero inverse iterations in this entry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the already selected numeric ray and its phase jet/curvature in the existing geometric lift.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh radial tuple or named failure and retains no descriptor/history/cache.
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
