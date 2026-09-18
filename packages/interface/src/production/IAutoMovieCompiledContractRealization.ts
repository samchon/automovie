import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCameraDepthPrecisionReport } from "../scene/IAutoMovieCameraDepthPrecisionReport";
import { IAutoMovieCompiledPredicateResult } from "./IAutoMovieCompiledPredicateResult";

/**
 * Compiler-derived realization of one shot contract.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieCompiledContractRealization` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieCompiledContractRealization` for the validation derived result finding system contract.
 */
export interface IAutoMovieCompiledContractRealization {
  /**
   * Realization format.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `version` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `version` for the validation derived result finding system contract.
   */
  version: 1;
  /**
   * Exact compiled shot id.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `shot` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `shot` for the validation derived result finding system contract.
   */
  shot: string;
  /**
   * Opening-state outcomes sampled at time zero.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `opening` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `opening` for the validation derived result finding system contract.
   */
  opening: Array<{
    /** Exact state id. */
    id: string;
    /** Compiler-owned predicate results. */
    predicates: IAutoMovieCompiledPredicateResult[];
    /** Whether every predicate passed. */
    passed: boolean;
  }>;
  /**
   * Closing-state outcomes sampled at the shot duration.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `closing` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `closing` for the validation derived result finding system contract.
   */
  closing: Array<{
    /** Exact state id. */
    id: string;
    /** Compiler-owned predicate results. */
    predicates: IAutoMovieCompiledPredicateResult[];
    /** Whether every predicate passed. */
    passed: boolean;
  }>;
  /**
   * Semantic event outcomes sampled inside their declared windows.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `events` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `events` for the validation derived result finding system contract.
   */
  events: Array<{
    /** Exact event id. */
    id: string;
    /** Compiler-checked event sample time. */
    time: number;
    /** Compiler-owned predicate results. */
    predicates: IAutoMovieCompiledPredicateResult[];
    /** Whether timing and every predicate passed. */
    passed: boolean;
  }>;
  /**
   * Camera required-bound projection checks at authoritative review times.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `camera` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `camera` for the validation derived result finding system contract.
   */
  camera: Array<{
    /** Shot-local sample time. */
    time: number;
    /**
     * World placement this sample measured, present only when the shot
     * compiled a camera move.
     *
     * A `frame` action solves the live camera's placement from the framing and
     * its subject, keeping the staged camera's bearing but replacing its
     * distance, so the staged `scene.cameras[i].transform` beside this record is
     * the solve's input rather than the placement that renders. Absent means the
     * two are the same camera and the staged transform is exact.
     */
    placement?: {
      /** Sampled camera origin in world space. */
      position: IAutoMovieVector3;
      /** Sampled camera orientation in world space. */
      rotation: IAutoMovieQuaternion;
    };
    /**
     * Required-range depth precision measured for this exact camera time.
     */
    depthPrecision: IAutoMovieCameraDepthPrecisionReport;
    /** Number of required subjects. */
    requiredSubjects: number;
    /** Number resolved in current compiled output. */
    resolvedSubjects: number;
    /** Number whose current bound intersects the clip range and frame. */
    readableSubjects: number;
    /** Whether every required current bound is readable at this sample. */
    passed: boolean;
  }>;
  /**
   * Compiler-materialized formation summaries.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `formations` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `formations` for the validation derived result finding system contract.
   */
  formations: Array<{
    /** Exact formation id. */
    id: string;
    /** Exact materialized slot count. */
    count: number;
    /** World-space minimum bound. */
    min: IAutoMovieVector3;
    /** World-space maximum bound. */
    max: IAutoMovieVector3;
    /** Whether count, slots, hero ids and placement passed. */
    passed: boolean;
  }>;
}
