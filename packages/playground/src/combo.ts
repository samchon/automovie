import type { IAutoMovieMotion } from "@automovie/interface";
import { sequenceMotion } from "@automovie/engine";
import { jumpingJack } from "./jumpingJack";
import { walk } from "./walk";
import { run } from "./run";
import { kick } from "./kick";

/**
 * Concatenate two walks, two runs, one jumping jack and one kick into the existing looping routine, all targeting the caller's compatible stick rig. Component spans sum to 5.2 seconds. Component legacy angles remain unchanged; sequencing requires positive finite component durations and matching skeleton ids, without validating every keyframe time, clinical ROM, contact or observed appearance.
 *
 * @evidence contracts/common.md#principled-implementation The canonical sequenceMotion owner shifts six parts onto one clock, preserving incoming seam easing while dropping duplicated later time-zero frames.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper names only the authored part order and loop choice; component construction and the engine's sequencing remain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Concatenation does not cure unsupported component angles or validate anatomy; its loop choice does not constitute a visual seam judgment.
 * @evidence contracts/common.md#meaningful-documentation The comment states exact part order, derived seconds and the limited admission performed by sequencing.
 * @evidence contracts/performance.md#efficient-algorithms Six fixed component builds plus one pass over their total k keyframes cost O(k) time/output, including repeated walk/run construction; later sampling/FK/rendering remains downstream work.
 * @evidence contracts/performance.md#reuse-equivalent-work Sequencing borrows each part's pose records while copying shifted keys. Repeated components are independently constructed mutable vocabularies; no numerical or cross-call motion cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the combined keys while nested part poses remain borrowed by them; no player, worker, clock or GPU handle is started here.
 *
 * @author Samchon
 */
export const combo: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion =>
  sequenceMotion(
    "combo",
    [walk(sk), walk(sk), run(sk), run(sk), jumpingJack(sk), kick(sk)],
    true,
  );
