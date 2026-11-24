import type {
  IAutoMovieAcousticRequest,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
} from "@automovie/interface";

import { assertAnalysisRoomAcousticsPart1 } from "../../../internal/assertAnalysisRoomAcousticsPart1";
import { assertAnalysisRoomAcousticsPart2 } from "../../../internal/assertAnalysisRoomAcousticsPart2";
import { assertAnalysisRoomAcousticsPart3 } from "../../../internal/assertAnalysisRoomAcousticsPart3";

/**
 * Compute broadband room absorption, reverberation, receiver level and composite partition loss while retaining diffuse-field and numerical-range gaps.
 *
 * Scenarios:
 * 1. The declared room reports the Sabine absorption, reverberation time, room constant, receiver level and composite transmission loss by hand arithmetic, with one field sample per receiver.
 * 2. Speech intelligibility is `unsupported` inside an otherwise solved run.
 * 3. A room with no source, and a room with sources but no receiver, gap the level metrics with their own distinct reasons.
 * 4. Perfectly absorbent and reflective rooms gap reverberation time, room constant and level while retaining absorption area; absorption 0.99 still reports the tested reverberation time and room constant.
 * 5. A study with no partition, and one whose partitions transmit nothing at all, gap the composite loss instead of reporting infinity.
 * 6. Declared targets judge the reverberation time in its own unit.
 * 7. A target naming a metric the study never reports is warned about, while a target on a reported-but-unsupported metric is left to that metric's gap.
 * 8. Every malformed room in the existing table is refused at its own message fragment, including a receiver on a source and negative partition transmission loss.
 * 9. A source whose power overflows double precision gaps the level with a reason naming the overflow rather than calling the room silent.
 */
export function test_unit_engine_analysis_room_acoustics(): void {
  const {
    study,
    metrics,
    statusOf,
  }: {
    study: (
      overrides?: Partial<IAutoMovieAcousticRequest>,
    ) => IAutoMovieAnalysisRun;
    metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
    statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
  } = assertAnalysisRoomAcousticsPart1();
  assertAnalysisRoomAcousticsPart2(study, metrics, statusOf);
  assertAnalysisRoomAcousticsPart3(study);
}
