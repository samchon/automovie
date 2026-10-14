import { validateObjectArtifact, validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Collect shape and strictly positive finite duration errors for one incoming transition in seconds. Its fit against adjacent played spans belongs to the sequence validator.
 *
 * @evidence contracts/common.md#principled-implementation Raw object admission precedes the open positive finite duration interval; sequence adjacency owns whether that duration fits both played spans.
 * @evidence contracts/common.md#clear-and-simple-design This gate checks one transition and appends findings, leaving list ordering and overlap to the sequence owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No duration is clamped to neighbouring shots and no missing transition record is fabricated.
 * @evidence contracts/common.md#meaningful-documentation States seconds, strict positivity, malformed shape and the adjacent-span ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms One object guard and one range check take constant work and append a fixed number of findings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One transition is inspected per call with no cached or shared result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the finding list; this gate retains no state or resource.
 */
export function validateTransition(transition: unknown, path: string, violations: IAutoMovieConstraintViolation[]): void {
  if (
    !validateObjectArtifact(transition, path, "sequence transition", violations)
  )
    return;
  validateRange(
    transition.duration,
    `${path}.duration`,
    0,
    Infinity,
    "transition duration",
    violations,
    false,
  );
}
