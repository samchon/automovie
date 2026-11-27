import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieClipShapeFault,
  IAutoMovieClipTrackShapeFaults,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Clip tracks report all clock faults before stride faults and preserve the
 * address and value of each.
 *
 * Scenarios:
 *
 * 1. Keys at both clip boundaries are valid.
 * 2. Out-of-range keys, a decreasing key and an equal key report separately, then
 *    a wrong value width reports its length.
 * 3. A missing clock and payload report both empty arrays. A zero duration leaves
 *    the upper bound to its caller and keeps the lower bound.
 */
export function test_engine_validation_clip_track_clock(): void {
  const track: IAutoMovieClipTrackShapeFaults.ITrack = {
    channel: {
      kind: "pointer",
      pointer: "/lights/key/intensity",
      valueType: "scalar",
    },
    interpolation: "linear",
    times: [0, 2],
    values: [0, 1],
  };
  TestValidator.equals(
    "both clock boundaries are accepted",
    AutoMovieEngineValidation.clipTrackShapeFaults(track, 2),
    [],
  );

  const locations = (faults: readonly IAutoMovieClipShapeFault[]): unknown[] =>
    faults.map(({ kind, field, value }) => [kind, field, value]);
  TestValidator.equals(
    "clock bounds precede ordering and value-width faults",
    locations(
      AutoMovieEngineValidation.clipTrackShapeFaults(
        {
          ...track,
          times: [-1, 3, 2, 2],
          values: [0, 0, 0, 0, 1, 1, 1, 1],
        },
        2,
      ),
    ),
    [
      ["temporal", "times[0]", -1],
      ["temporal", "times[1]", 3],
      ["temporal", "times[2]", 2],
      ["temporal", "times[3]", 2],
      ["type", "values", 8],
    ],
  );
  TestValidator.equals(
    "each empty input is reported without trying to divide by it",
    locations(AutoMovieEngineValidation.clipTrackShapeFaults({ ...track, times: [], values: [] }, 2)),
    [
      ["type", "times", []],
      ["type", "values", []],
    ],
  );
  TestValidator.equals(
    "a nonpositive clip duration applies no upper bound to the track",
    locations(AutoMovieEngineValidation.clipTrackShapeFaults({ ...track, times: [-1, 2] }, 0)),
    [["temporal", "times[0]", -1]],
  );
}
