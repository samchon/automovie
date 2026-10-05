import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human";

/**
 * The whole-person reading of a viewer body document, which has no head: a
 * body domain document is evaluated on a body basis alone, so stature and the
 * closed person volume do not exist for it. Asking either refuses by name
 * instead of estimating the missing head; a person document answers them.
 *
 * @author Samchon
 */
export function createHumanViewerHeadlessWhole(basis: string): IAutoMovieHumanBodySimpleWhole {
  const refuse = (): never => {
    throw new Error(`The viewer body ${basis} has no head, so stature and the whole person's volume are person measurements.`);
  };
  return { stature: refuse, volume: refuse };
}
