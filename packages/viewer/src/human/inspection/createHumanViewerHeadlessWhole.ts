import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human";

/**
 * The whole-person reading of a viewer body document, which has no head: a body domain document is evaluated on a body basis alone, so stature and the closed person volume do not exist for it. Asking either refuses by name instead of estimating the missing head; a person document answers them.
 *
 * @evidence contracts/common.md#principled-implementation A body-only basis cannot establish whole-person stature or closed person volume, so both requested measurements refuse instead of estimating a missing head.
 * @evidence contracts/common.md#clear-and-simple-design One basis-labeled refusal closure supplies the two unsupported whole-person reading methods without introducing numerical substitutes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population head estimate, hardcoded stature or partial volume is returned as a person measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the body/person measurement boundary and names the missing-head refusal condition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constructing a fixed pair of refusal callbacks selects no anatomical measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The refusal closure carries the supplied basis label and coordinates no computed measurement cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result retains only one basis string through its callbacks and acquires no anatomical mesh or numerical worker.
 *
 * @author Samchon
 */
export function createHumanViewerHeadlessWhole(
  basis: string,
): IAutoMovieHumanBodySimpleWhole {
  const refuse: () => never = (): never => {
    throw new Error(
      `The viewer body ${basis} has no head, so stature and the whole person's volume are person measurements.`,
    );
  };
  return { stature: refuse, volume: refuse };
}
