import {
  IAutoMovieAnalysisTarget,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisLuminaire } from "./IAutoMovieAnalysisLuminaire";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";

/** Everything one daylight or artificial-light study is configured with. */
export interface IAutoMovieDaylightRequest {
  /** Stable run identity. */
  id: string;
  /** Logical space or surface being studied. */
  subject: string;
  /** Design revision being read. */
  inputRevision: string;
  /** Read-only external world. */
  context: IAutoMovieEnvironmentContext;
  /** Instant id to study, or null for an artificial-light-only study. */
  instant: string | null;
  /** Measurement grid. */
  workplane: IAutoMovieAnalysisWorkplane;
  /** Building-owned convex shading solids such as a canopy or a fin. */
  shades: readonly IAutoMovieAnalysisSolid[];
  /** Artificial sources contributing to the same plane. */
  luminaires: readonly IAutoMovieAnalysisLuminaire[];
  /** Sky luminance distribution requested. */
  sky: string;
  /** Sky-vault sample count per measurement point; a positive whole number. */
  diffuseSamples: number;
  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
