import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * No part stands absurdly far from the figure before generation.
 *
 * @evidence contracts/testing.md#behavioral-verification Slices the generated body at set shares of stature and compares each part's bounds, catching a part that has left its place or vanished from a height. A law that differs from that figure by a body part's ordinary error passes: agreement is not asked for.
 * @evidence contracts/testing.md#independent-expectations The bound comes from `HUMAN_SLICE_BASELINE`, a coarse record of the fitted figure at a few shares, so unlike the curve rules this oracle is an earlier output. Its allowance of 45 mm plus 30 percent of a part's extent makes it a sanity bound only, and it cannot speak to a shape.
 * @evidence contracts/testing.md#distinguishing-cases Runs on the four references, whose figures were recorded; the extreme people have no record and are not generated here, since the curve units own them. A part's end may fall one slice either way, which is the rule's boundary.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_placement`, reading the cached people and an in-source record, with no external host.
 */
export const test_human_curve_placement = (): void => assertHumanCurves();
