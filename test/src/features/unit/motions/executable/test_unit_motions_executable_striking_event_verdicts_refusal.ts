import { StrikingEventVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingEventVerdicts.refusal` passes only when a late redirect is refused
 * as an illegal cut into a kick.
 *
 * Scenarios:
 *
 * 1. The cut refusal passes and is shown.
 * 2. Another error fails.
 * 3. An accepted redirect fails and reads as accepted.
 */
export function test_unit_motions_executable_striking_event_verdicts_refusal(): void {
  const refusing = (): never => {
    throw new Error("punch cannot be cut into kick after its chamber");
  };
  const other = (): never => {
    throw new Error("out of reach");
  };
  TestValidator.equals(
    "refused, refused otherwise, accepted",
    [
      StrikingEventVerdicts.refusal(refusing).passed,
      StrikingEventVerdicts.refusal(other).passed,
      StrikingEventVerdicts.refusal((): number => 1).detail,
    ],
    [true, false, 'accepted; bound the "cannot be cut into kick" refusal'],
  );
}
