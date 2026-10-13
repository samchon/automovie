import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCameraDepthPrecisionReport } from "../scene/IAutoMovieCameraDepthPrecisionReport";
import { IAutoMovieCompiledPredicateResult } from "./IAutoMovieCompiledPredicateResult";

/**
 * Measurements that grade one shot contract against its compiled scene and motion. Failure records preserve missing measurements instead of treating contract prose as execution evidence.
 *
 * @evidence contracts/common.md#principled-implementation Opening and closing predicates sample zero and duration, events use their authoritative source times, camera checks sample review instants with current bounds and depth precision, and formations compare designed counts, chunks and promoted hero placement.
 * @evidence contracts/common.md#clear-and-simple-design Separate outcome lists keep state predicates, event timing, camera readability and population integrity attributable to their owning contract clause while sharing the scalar predicate result representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Echoed ids or authored prose cannot satisfy a realization; unresolvable subjects fail their outcome, and sampled moving-camera placements override the staging input rather than grading a camera that did not render.
 * @evidence contracts/common.md#meaningful-documentation States authoritative sampling times, per-outcome pass semantics, camera placement omission, depth precision, required/resolved/readable counts and formation count and bounds units.
 * @author Samchon
 */
export interface IAutoMovieCompiledContractRealization {
  /** Realization format. */
  version: 1;

  /** Exact compiled shot id. */
  shot: string;

  /** Opening-state outcomes sampled at time zero. */
  opening: Array<{
    /** Exact state id. */
    id: string;

    /** Compiler-owned predicate results. */
    predicates: IAutoMovieCompiledPredicateResult[];

    /** Whether every predicate passed. */
    passed: boolean;
  }>;

  /** Closing-state outcomes sampled at the shot duration. */
  closing: Array<{
    /** Exact state id. */
    id: string;

    /** Compiler-owned predicate results. */
    predicates: IAutoMovieCompiledPredicateResult[];

    /** Whether every predicate passed. */
    passed: boolean;
  }>;

  /** Semantic event outcomes sampled inside their declared windows. */
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

  /** Camera required-bound projection checks at authoritative review times. */
  camera: Array<{
    /** Shot-local sample time. */
    time: number;

    /**
     * World placement this sample measured, present only when the shot compiled a camera move.
     *
     * A `frame` action solves the live camera's placement from the framing and its subject, keeping the staged camera's bearing but replacing its distance, so the staged `scene.cameras[i].transform` beside this record is the solve's input rather than the placement that renders. Absent means the two are the same camera and the staged transform is exact.
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

  /** Compiler-materialized formation summaries. */
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
