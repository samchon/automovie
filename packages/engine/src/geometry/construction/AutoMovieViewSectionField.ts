import type {
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionReading } from "./AutoMovieViewSectionReading";

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
    extents: readonly IAutoMovieViewSectionField.IStationJet[],
    shoulders: readonly IAutoMovieViewSectionField.IStationJet[],
  ): IAutoMovieViewSectionField.IPrepared | IAutoMovieConicArcField.IFailure {
    if (
      !Array.isArray(extents) ||
      !Array.isArray(shoulders) ||
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      !extents.every(
        (jet: IAutoMovieViewSectionField.IStationJet): boolean =>
          stationJet(jet) && jet[0] > 0,
      ) ||
      !shoulders.every(
        (jet: IAutoMovieViewSectionField.IStationJet): boolean =>
          stationJet(jet) && jet[0] > 0 && jet[0] < 1,
      )
    )
      return failure(
        "A regular section field needs four finite positive extent 2-jets and four shoulder 2-jets inside (0,1).",
      );
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const e: IAutoMovieConicFieldJet.IJet[] = extents.map(
      AutoMovieConicFieldJet.fromStation,
    );
    const r: IAutoMovieConicFieldJet.IJet[] = shoulders.map(
      AutoMovieConicFieldJet.fromStation,
    );
    const source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet> =
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
  export function read(
    prepared: IAutoMovieViewSectionField.IPrepared,
    phi: number,
  ): IAutoMovieViewSectionField.IRadialJet | IAutoMovieConicArcField.IFailure {
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
    if (fault !== null) return failure(fault);
    if (!Number.isFinite(phi))
      return failure("The section field requires a finite polar phase.");
    const ray: IAutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
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
    prepared: IAutoMovieViewSectionField.IPrepared,
    ray: IAutoMovieViewConic.IRay,
  ): IAutoMovieViewSectionField.IRadialJet | IAutoMovieConicArcField.IFailure {
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
    return fault === null
      ? AutoMovieViewSectionReading.evaluate(prepared, ray)
      : failure(fault);
  }
}

/** Convert numerical admission into the existing named failure record. */
function failure(detail: string): IAutoMovieConicArcField.IFailure {
  return { kind: "failure", detail };
}

/** Actual regular station jets contain three finite scalars. */
function stationJet(
  value: unknown,
): value is IAutoMovieViewSectionField.IStationJet {
  return (
    Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
  );
}
