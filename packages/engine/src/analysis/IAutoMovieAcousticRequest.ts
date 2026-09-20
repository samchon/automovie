import { IAutoMovieAnalysisTarget } from "@automovie/interface";
import { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";

/**
 * Everything one room-acoustic study is configured with.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `IAutoMovieAcousticRequest` closes one authored room scenario over geometry-independent surfaces, partitions, emitters, listeners, and targets.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The request binds every operand and revision needed to reproduce the supported scalar acoustic outputs.
 */
export interface IAutoMovieAcousticRequest {
  /**
   * Stable run identity.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary The request `id` gives this acoustic study a stable run identity distinct from its room subject.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The study key anchors deterministic acoustic run identifiers and diagnostics.
   */
  id: string;
  /**
   * Logical space being listened to.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `subject` names the logical room whose acoustic performance the run reports.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The subject label is carried into the sealed run so results remain attributable to the studied space.
   */
  subject: string;
  /**
   * Design revision being read.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `inputRevision` records which authored design state the acoustic evidence measured.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The revision enters the sealed run and later distinguishes current results from stale acoustic evidence.
   */
  inputRevision: string;
  /**
   * Room volume in m^3; strictly positive.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Room `volume` supplies the spatial magnitude needed for the bounded reverberation-time estimate.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The cubic-metre value is the numerator of the scenario's Sabine decay calculation.
   */
  volume: number;
  /**
   * Absorbing surfaces; at least one.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `surfaces` enumerates every declared absorbing area used to characterize this room's diffuse field.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The collection is reduced into total area, equivalent absorption, and mean absorption for supported scalar outputs.
   */
  surfaces: readonly IAutoMovieAcousticSurface[];
  /**
   * Partitions whose composite transmission loss is asked for.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `partitions` declares the room-boundary elements whose combined broadband isolation is requested.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The list feeds area-weighted transmission composition, including the empty-boundary gap case.
   */
  partitions: readonly IAutoMovieAcousticPartition[];
  /**
   * Steady sources inside the room.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `sources` bounds the steady emitters included in the room-noise result rather than inferring an unlisted sound scene.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The declared emitters are summed in linear power at each requested receiver.
   */
  sources: readonly IAutoMovieAcousticSource[];
  /**
   * Listening positions the field is reported at.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `receivers` declares exactly where the supported sound-pressure field is sampled.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario Each listed listener produces one keyed level metric and one spatial sample when the diffuse field is defined.
   */
  receivers: readonly IAutoMovieAcousticReceiver[];
  /**
   * Targets the production declares for this study.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Acoustic `targets` state the author-selected thresholds against which supported metrics receive verdicts.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The target list is validated and resolved by metric key and unit when the scenario run is sealed.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
