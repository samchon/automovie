import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human";

/**
 * The whole-person reading of a viewer body document, which has no head: a
 * body domain document is evaluated on a body basis alone, so stature and the
 * closed person volume do not exist for it. Asking either refuses by name
 * instead of estimating the missing head; a person document answers them.
 *
 * @evidence contracts/common.md#principled-implementation A body-only basis cannot establish whole-person stature or closed volume, so both readings explicitly refuse instead of inventing a head contribution.
 * @evidence contracts/common.md#clear-and-simple-design One named refusal supplies the two unsupported whole-person readings on this body-only adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no fitted height ratio, subject constant or estimated head volume to manufacture a person measurement.
 * @evidence contracts/common.md#meaningful-documentation Identifies the missing-head precondition and directs whole-person measurements to the person document owner.
 *
 * @author Samchon
 */
export function createHumanViewerHeadlessWhole(
  basis: string,
): IAutoMovieHumanBodySimpleWhole {
  const refuse = (): never => {
    throw new Error(
      `The viewer body ${basis} has no head, so stature and the whole person's volume are person measurements.`,
    );
  };
  return { stature: refuse, volume: refuse };
}
