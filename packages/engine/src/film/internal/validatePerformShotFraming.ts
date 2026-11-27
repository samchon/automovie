import {
  IAutoMovieCameraAction,
  type IAutoMovieValidatePerformShotFraming,
  type IAutoMovieViolationAppendSink,
} from "@automovie/interface";

import { describeInvalidValue } from "../../validation/internal/describeInvalidValue";
import { CAMERA_FRAMINGS } from "../CAMERA_FRAMINGS";
import { CAMERA_MOVES } from "../CAMERA_MOVES";

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
 * A refused value whose string conversion throws is described as `an
 * uninspectable value`; its original reference remains in the finding and the
 * other vocabulary is still checked.
 *
 * @param out Collector the violations are pushed into.
 * @param path Violation path of the action or intent.
 * @param framing The framing as authored.
 * @param move The move as authored.
 * @returns Whether the framing and the move are each one the grammar accepts.
 */
export function validatePerformShotFraming(
  out: IAutoMovieViolationAppendSink,
  path: string,
  framing: unknown,
  move: unknown,
): IAutoMovieValidatePerformShotFraming.IResult {
  const framed: boolean = CAMERA_FRAMINGS.has(
    framing as IAutoMovieCameraAction["framing"],
  );
  if (!framed)
    out.push(
      "type",
      `${path}.framing`,
      `camera framing must be one of ${[...CAMERA_FRAMINGS].join(", ")}, but was "${describeInvalidValue(framing)}"`,
      framing,
    );
  const moved: boolean = CAMERA_MOVES.has(
    move as IAutoMovieCameraAction["move"],
  );
  if (!moved)
    out.push(
      "type",
      `${path}.move`,
      `camera move must be one of ${[...CAMERA_MOVES].join(", ")}, but was "${describeInvalidValue(move)}"`,
      move,
    );
  return { framed, moved };
}
