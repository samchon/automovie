import {
  IAutoMovieAnalysisTarget,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieEnvelopeAssembly } from "./IAutoMovieEnvelopeAssembly";
import { IAutoMovieEnvelopeBridge } from "./IAutoMovieEnvelopeBridge";
import { IAutoMovieIndoorCondition } from "./IAutoMovieIndoorCondition";

/** Everything one envelope study is configured with. */
export interface IAutoMovieEnvelopeRequest {
  /** Stable study identity; each produced run suffixes its own domain. */
  id: string;
  /** Logical space the envelope encloses. */
  subject: string;
  /** Design revision being read. */
  inputRevision: string;
  /** Read-only external world. */
  context: IAutoMovieEnvironmentContext;
  /** Instant supplying the exterior boundary condition, or null. */
  instant: string | null;
  /** Indoor air. */
  indoor: IAutoMovieIndoorCondition;
  /** Envelope build-ups; at least one. */
  assemblies: readonly IAutoMovieEnvelopeAssembly[];
  /** Linear thermal bridges. */
  bridges: readonly IAutoMovieEnvelopeBridge[];
  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
