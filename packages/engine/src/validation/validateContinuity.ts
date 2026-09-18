import { IAutoMovieBeatEndState, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "./ViolationCollector";

/**
 * Validate one cut boundary: the incoming beat's OPENING state against the
 * previous beat's recorded END state. This is the check the forward-written
 * {@link IAutoMovieBeatEndState} always implied but nothing performed: a cut
 * that fails to resume where the prior beat left off is the README's named
 * failure ("characters drift, props disappear").
 *
 * Drift is **advisory** (a `warning`, never a gate): a hard cut can
 * legitimately jump an actor to a new mark, a time-skip, or a new blocking. The
 * linter surfaces the drift with the exact actor, offset, and tolerance so the
 * author decides whether the cut intends it. It does not refuse the film. This
 * mirrors the physical-plausibility advisory tier.
 *
 * Per actor present at the prior beat's end:
 *
 * - World position drift beyond `positionTolerance` metres.
 * - Facing drift beyond `facingToleranceDeg` degrees.
 * - A persistent mount dropped or changed (the rider's horse vanished).
 * - The actor missing entirely from the incoming opening.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateContinuity` locates each actor position, facing, mount, or prop-state mismatch at the incoming beat's opening member.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateContinuity` preserves the previous end observation, opening observation, expected tolerance, and actor identity for one cut boundary.
 */
export const validateContinuity = (props: {
  /** The previous beat's resolved end-state. */
  previous: IAutoMovieBeatEndState;

  /** The incoming beat's resolved opening-state. */
  opening: IAutoMovieBeatEndState;

  /** World-space position drift tolerated (metres); defaults to 0.05. */
  positionTolerance?: number;

  /** Facing drift tolerated (degrees); defaults to 5. */
  facingToleranceDeg?: number;
}): IAutoMovieValidation => {
  const collector = new ViolationCollector();
  const tolerances = readTolerances(
    props.positionTolerance,
    props.facingToleranceDeg,
    "$input",
    collector,
  );
  if (tolerances === null) return collector.toValidation();
  compareBoundary(
    props.previous,
    props.opening,
    "$input",
    tolerances,
    collector,
  );
  return collector.toValidation();
};
