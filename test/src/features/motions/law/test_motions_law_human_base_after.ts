import type {
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import {
  HumanBase
} from "../../../../../packages/motions/src/law/internal/HumanBase";
import { TestValidator } from "@nestia/e2e";

/**
 * Check the entry base carried through a cut or a completed action.
 *
 * Scenarios:
 *
 * 1. At a cut, prefer a displayed seat with its placement over lying and shin
 *    supports. Without a seat prefer lying to kneeling, and infer kneeling
 *    from a shin alone.
 * 2. When a previous seat is gone and feet bear, infer standing. Preserve an
 *    otherwise unspecified crouch with foot support and return the declared
 *    full-action ending base at completion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name support precedence, carried placement and the full-action exception.
 * @evidence contracts/development/testing.md#behavioral-verification The base selection owner receives explicit support windows and cut or completion context.
 * @evidence contracts/development/testing.md#independent-expectations The expected bases follow the fixed support records, selection precedence and supplied action end value.
 */
export function test_motions_law_human_base_after(): void {
  const grounded: IAutoMovieMotionHumanEntryState.ISupport = {
    part: "leftFoot",
    kind: "plant",
    support: { kind: "ground" },
  };
  const knees: IAutoMovieMotionHumanEntryState.ISupport = {
    ...grounded,
    part: "rightLowerLeg",
    kind: "bear",
  };
  const lying: IAutoMovieMotionHumanEntryState.ISupport = {
    ...grounded,
    part: "back",
    kind: "lie",
  };
  const sitting: IAutoMovieMotionHumanEntryState.ISupport = {
    part: "seat",
    kind: "seat",
    support: { kind: "prop", subject: "bench" },
  };
  const entered: IAutoMovieMotionHumanBase = { kind: "standing" };
  const atCut: IAutoMovieMotionHumanBase.IAfterProps = {
    entered,
    declared: undefined,
    share: 0.5,
    supports: [],
  };
  const seat: IAutoMovieMotionHumanBase = {
    kind: "seated",
    seat: {
      at: { x: 1, y: 0.5, z: 0 },
      yaw: 90,
    },
  };
  TestValidator.predicate(
    "the current support owns the cut's base and keeps a matching declaration",
    HumanBase.after({
      ...atCut,
      supports: [knees, lying, sitting],
      declared: seat,
    }) === seat &&
      HumanBase.after({ ...atCut, supports: [knees, lying] }).kind ===
        "lying" &&
      HumanBase.after({ ...atCut, supports: [grounded, knees] }).kind ===
        "kneeling" &&
      HumanBase.after({ ...atCut, entered: seat, supports: [grounded] })
        .kind === "standing",
  );
  const crouch: IAutoMovieMotionHumanBase = { kind: "crouched" };
  const hanging: IAutoMovieMotionHumanBase = { kind: "hanging" };
  TestValidator.predicate(
    "an undeclared foot contact retains unsupported base detail until the stated end",
    HumanBase.after({ ...atCut, entered: crouch, supports: [grounded] }) ===
      crouch &&
      HumanBase.after({
        ...atCut,
        declared: hanging,
        supports: [grounded],
        share: 1,
      }) === hanging,
  );
}
