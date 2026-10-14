import type { IAutoMovieAcousticRequest } from "@automovie/engine";
import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
} from "@automovie/interface";

import { assertAnalysisRoomAcousticsPart1 } from "../internal/assertAnalysisRoomAcousticsPart1";
import { assertAnalysisRoomAcousticsPart2 } from "../internal/assertAnalysisRoomAcousticsPart2";
import { assertAnalysisRoomAcousticsPart3 } from "../internal/assertAnalysisRoomAcousticsPart3";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls analyzeAutoMovieAcoustics through the ordered parts and checks returned absorption/reverberation/room-constant/transmission values, receiver mean/max/sample levels, categorical gaps/reasons, target verdicts and invalid-input throws. Wrong energy weighting, lost receivers, fabricated infinite levels or silent target omission contradict these observations.
 * @evidence contracts/testing.md#independent-expectations Authored 100 m2 at absorption 0.5 gives 50 sabins; literal coefficient 0.161 and volume 100 give 0.322 s and room constant 100. The local source geometry gives 80+10log10(0.06+0.04)=70 dB at original 1e-9 tolerance, while area-weighted 30/10 dB transmissions give 20 dB. Near-full absorption retains 1e-12/1e-9 limits. These stated broadband model equations, categorical literals and malformed-field fragments are independent expectations; shared production sealing is not an impulse response or a measured room oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the working room, missing source/receiver, absorption 0/1/0.99, finite powers ±4000 whose energy underflows/overflows, absent/numerically opaque partitions, met/missed reverberation targets, unknown versus reported-unsupported keys, coincidence and every existing malformed input. The unit does not test wrong-unit acoustic targets, multiple-source/receiver aggregation accuracy or speech intelligibility.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_analysis_room_acoustics is the discoverable entry and owns the ordered cases delegated to assertAnalysisRoomAcousticsPart1, assertAnalysisRoomAcousticsPart2, assertAnalysisRoomAcousticsPart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_analysis_room_acoustics(): void {
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
