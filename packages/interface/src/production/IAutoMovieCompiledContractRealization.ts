import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCameraDepthPrecisionReport } from "../scene/IAutoMovieCameraDepthPrecisionReport";
import { IAutoMovieCompiledPredicateResult } from "./IAutoMovieCompiledPredicateResult";

/** Compiler-derived realization of one shot contract. */
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
