import type {
  IAutoMovieAnalysisRun,
  IAutoMovieAnalyzeAcoustics,
  IAutoMovieAnalyzeDaylight,
  IAutoMovieAnalyzeEnvelope,
  IAutoMovieAnalyzeSpaceAir,
} from "@automovie/interface";

import { analyzeAutoMovieAcoustics } from "./internal/analyzeAutoMovieAcoustics";
import { analyzeAutoMovieDaylight } from "./internal/analyzeAutoMovieDaylight";
import { analyzeAutoMovieEnvelope } from "./internal/analyzeAutoMovieEnvelope";
import { analyzeAutoMovieSpaceAir } from "./internal/analyzeAutoMovieSpaceAir";

/** Deterministic analyses for declared acoustic, daylight, envelope and air studies. */
export namespace AutoMovieEngineAnalysis {
  /** Solve one acoustic request and return its sealed analysis run. */
  export function acoustics(
    props: IAutoMovieAnalyzeAcoustics.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieAcoustics(props);
  }

  /** Measure one daylight workplane and return its sealed analysis run. */
  export function daylight(
    props: IAutoMovieAnalyzeDaylight.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieDaylight(props);
  }

  /** Solve one envelope request as paired thermal and moisture runs. */
  export function envelope(
    props: IAutoMovieAnalyzeEnvelope.IProps,
  ): IAutoMovieAnalyzeEnvelope.IResult {
    return analyzeAutoMovieEnvelope(props);
  }

  /** Solve one well-mixed space-air request and return its sealed run. */
  export function spaceAir(
    props: IAutoMovieAnalyzeSpaceAir.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieSpaceAir(props);
  }
}
