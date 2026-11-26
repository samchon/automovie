import type { IAutoMovieProductionCheck } from "@automovie/interface";

/**
 * The model, motion or film targets this production has chosen to verify. Add
 * each check at its authoring scope with a comment describing the expectation,
 * the exact views or interval and the evidence used to judge it. The command
 * derives status from measurements and owning records.
 */
const targets: readonly IAutoMovieProductionCheck[] = [];

export default targets;
