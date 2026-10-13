import { IAutoMovieCameraAction } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { CAMERA_FRAMINGS } from "./constants/CAMERA_FRAMINGS";
import { CAMERA_MOVES } from "./constants/CAMERA_MOVES";

/**
 * Refuse a camera framing or move the framing grammar cannot compile, and say
 * which of the two are usable.
 *
 * The values are `unknown` because a `frame` action and a blocking coverage
 * intent reach `performShot` in-process without the transport's structural
 * gate. Each unknown value is one `type` violation at `<path>.framing` or
 * `<path>.move` listing the accepted values, the members of
 * {@link CAMERA_FRAMINGS} and {@link CAMERA_MOVES} in declaration order.
 *
 * @param out Collector the violations are pushed into.
 * @param path Violation path of the action or intent.
 * @param framing The framing as authored.
 * @param move The move as authored.
 * @returns Whether the framing and the move are each one the grammar accepts.
 *
 * @evidence contracts/common.md#principled-implementation Membership in the two closed vocabularies `compileCameraMove` dispatches on, taken from the shared sets that are built from records keyed by the interface unions, so a value accepted here is one the framing grammar has a rule for and a new union member cannot be missed.
 * @evidence contracts/common.md#clear-and-simple-design One check shared by the `frame` action gate and the coverage gate, which each carried the two vocabularies and both messages; the vocabularies themselves are the film constants blocking also reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No framing or move is defaulted or coerced; an unknown value is refused and reported as authored.
 * @evidence contracts/common.md#meaningful-documentation States why the values are untyped, the two violation paths, where the accepted vocabularies come from and in what order they are listed, and what the two returned flags mean.
 * @evidence contracts/performance.md#efficient-algorithms Constant time for a valid pair, two set lookups; a refusal also lists the small vocabulary once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One check per call with no shared mutable state; the vocabularies are module constants.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pushes at most two violations into the caller's collector and keeps nothing itself.
 */
export function validatePerformShotFraming (
  out: ViolationCollector,
  path: string,
  framing: unknown,
  move: unknown,
): { framed: boolean; moved: boolean } {
  const framed: boolean = CAMERA_FRAMINGS.has(
    framing as IAutoMovieCameraAction["framing"],
  );
  if (!framed)
    out.push(
      "type",
      `${path}.framing`,
      `camera framing must be one of ${[...CAMERA_FRAMINGS].join(", ")}, but was "${String(framing)}"`,
      framing,
    );
  const moved: boolean = CAMERA_MOVES.has(
    move as IAutoMovieCameraAction["move"],
  );
  if (!moved)
    out.push(
      "type",
      `${path}.move`,
      `camera move must be one of ${[...CAMERA_MOVES].join(", ")}, but was "${String(move)}"`,
      move,
    );
  return { framed, moved };
}
