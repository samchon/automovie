import {
  ArchetypeTrackProfile
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeTrackProfile";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Covers cancellation in the logarithmic inverse at the tested exponent. */
const PROFILE_ROUNDING: number = 2048 * Number.EPSILON;

/** Both physical endpoints anchor the descending minimum-jerk profile. */
export function test_archetypes_internal_track_profile(): void {
  const track = ArchetypeTrackProfile("gate", 8, -24, 4);
  // At u = 1/4, s(u) = 53/512 and s'(u) = 135/128.
  TestValidator.equals(
    "quarter-phase distance from each end",
    [track.value(1 / 4, false), track.value(1 / 4, true)],
    [75 / 16, -331 / 16],
  );
  for (const [goal, fromEnd] of [
    [75 / 16, false],
    [-331 / 16, true],
  ] as const) {
    const event = track.crossing(goal);
    TestValidator.predicate(
      "equal signed rates and one second from the respective endpoint",
      event.fromEnd === fromEnd &&
        nclose(event.offset, 1, PROFILE_ROUNDING) &&
        nclose(event.rate, -135 / 16, PROFILE_ROUNDING),
    );
  }
  TestValidator.equals("closed endpoint", track.crossing(-24), {
    offset: 0,
    fromEnd: true,
    rate: 0,
  });
  TestValidator.error("crossing outside travel", (): unknown =>
    track.crossing(9),
  );
  TestValidator.error("unrepresentable endpoint difference", (): unknown =>
    ArchetypeTrackProfile("gate", -Number.MAX_VALUE, Number.MAX_VALUE, 1),
  );

  const span: number = 2 ** 800;
  const phase: number = 2 ** -400;
  const displacement: number = 10 * phase;
  const scaled = ArchetypeTrackProfile("gate", 0, span, 4);
  // The cube of the phase rounds to zero before it is multiplied by the span.
  TestValidator.equals(
    "endpoint displacement survives the unrepresentable dimensionless cube",
    scaled.value(phase, false),
    displacement,
  );
  const crossing = scaled.crossing(displacement);
  TestValidator.predicate(
    "inverse retains the tiny clock offset and its ordinary physical velocity",
    !crossing.fromEnd &&
      nclose(crossing.offset / (4 * phase), 1, PROFILE_ROUNDING) &&
      nclose(crossing.rate, 30 / 4, PROFILE_ROUNDING),
  );
}
