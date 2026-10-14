import { AutoMovieRepaintClaimAdmission } from "./repaintAttemptClaim";

/**
 * The project protocol's acquired, already-active, prefix-changed and unknown-outcome statuses populate one module-owned four-entry Set. Admission shares this vocabulary across requests and separately validates the nonblank owner required by active/unknown statuses; it never treats membership as claim acquisition. Bounded construction/membership retain only four strings for the module lifetime, with no dispatch, handle or fixture-specific branch.
 */
export const repaintExecutionADMISSION_STATUSES: ReadonlySet<
  AutoMovieRepaintClaimAdmission["status"]
> = new Set([
  "acquired",
  "already-active",
  "prefix-changed",
  "unknown-outcome",
]);
