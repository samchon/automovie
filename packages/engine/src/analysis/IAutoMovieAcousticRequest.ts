import { IAutoMovieAnalysisTarget } from "@automovie/interface";

import { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";

/** Everything one room-acoustic study is configured with. */
export interface IAutoMovieAcousticRequest {
  /** Stable run identity. */
  id: string;
  /** Logical space being listened to. */
  subject: string;
  /** Design revision being read. */
  inputRevision: string;
  /** Room volume in m^3; strictly positive. */
  volume: number;
  /** Absorbing surfaces; at least one. */
  surfaces: readonly IAutoMovieAcousticSurface[];
  /** Partitions whose composite transmission loss is asked for. */
  partitions: readonly IAutoMovieAcousticPartition[];
  /** Steady sources inside the room. */
  sources: readonly IAutoMovieAcousticSource[];
  /** Listening positions the field is reported at. */
  receivers: readonly IAutoMovieAcousticReceiver[];
  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
