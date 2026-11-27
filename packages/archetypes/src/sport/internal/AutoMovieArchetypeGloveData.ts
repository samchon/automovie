import type { IAutoMovieArchetypeBand } from "../../core";
import { AutoMovieArchetypeBand } from "../../core";

/*
 * The Official Baseball Rules 2024.
 */
export const OBR: string =
  "Official Baseball Rules 2024 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

/*
 * A band in metres at a rule's limit.
 */
export const m = (
  minimum: number,
  maximum: number,
  source: string,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.metres(minimum, maximum, source);
