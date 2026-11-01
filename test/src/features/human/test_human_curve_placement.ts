import { assertHumanCurves } from "../internal/assertHumanCurves";

/** No part stands absurdly far from the figure before generation. */
export const test_human_curve_placement = (): void => assertHumanCurves();
