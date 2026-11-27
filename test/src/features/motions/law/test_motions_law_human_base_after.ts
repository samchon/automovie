import type {
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import {
  HumanBase
} from "../../../../../packages/motions/src/law/internal/HumanBase";
import { TestValidator } from "@nestia/e2e";

/**
 * A cut enters the next action on the support displayed at the cut.
 *
 * Scenarios:
 *
 * 1. A seat takes precedence over a lying or kneeling support, and carries
 *    declared seat placement once the seat is displayed.
 * 2. Without a seat, a lying support wins over a shin bearing. A shin alone means
 *    kneeling. A body whose previous seat is gone stands on its feet.
 * 3. A foot contact preserves an otherwise unspecified crouch. The declared ending
 *    base is handed through when the full action is reached.
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
