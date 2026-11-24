import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { slipRingScene } from "../../internal/slipRingScene";

/**
 * A partner presents a hand for a ring, on its own: the presentHand step of
 * `test_motion_get_dressed_slip_ring`, the small woman's left hand and the
 * average man's right as the original's two exchanges present them, entered
 * standing alone at the partner's place facing the dresser's (the presenting is
 * the partner's first action).
 *
 * Scenarios, read at the presentation's `ready` on the displayed arm against
 * the body's own measures, as the presentHand contract places the palm: "the
 * place the arm reaches with the upper arm hanging and the forearm level
 * ahead", inward of the shoulder's half width:
 *
 * 1. The upper arm hangs: the elbow lies the upper arm's length below the
 *    shoulder, within the touch contract's 10 mm.
 * 2. The forearm lies level: the palm lies at the elbow's height, within 10 mm.
 * 3. The palm lies the forearm and half the hand from the elbow, read level and
 *    ahead of it, within 10 mm.
 * 4. The palm lies between the midline and the shoulder on its own side, within 10
 *    mm outside that band.
 * 5. The palm stays there from `ready` to `relax`, within 10 mm.
 * 6. The presentation keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies, the hands and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the presentation alone and reads the displayed shoulder, elbow, hips and palm at its events and the verdict report over its span; an upper arm raised or swung, a forearm tilted, a palm short or far out, drifting while held or a finding in the presentation fails.
 * @evidence contracts/development/testing.md#independent-expectations The arm's place is the presentHand contract's, read from the body's measured upper arm, forearm, hand and shoulder half width (`IAutoMovieBodyMeasure`) on the displayed joints; the bound is the touch contract's 10 mm; the inward share is the law's own, so only its band from the midline to the shoulder is asserted.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature presenting opposite hands; the ring's slip onto the presented hand is `test_motion_get_dressed_slip_ring_slip`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_get_dressed_slip_ring_present_hand`.
 */
export function test_motion_get_dressed_slip_ring_present_hand(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of slipRingScene.CASES) {
    const label: string = `${c.partner} presents the ${c.hand} hand`;
    try {
      present(checks, label, motionHumanBody(c.partner), c.hand);
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("a hand is presented where the arm's measures place it");
}

/** One body's presentation and its checks. */
function present(
  checks: motionComplaints.IGatherer,
  label: string,
  b: IAutoMovieMotionHumanBody,
  hand: AutoMovieHumanSide,
): void {
  const film: HumanPerformance = new HumanPerformance({
    seed: "slip-ring",
    laws: [AutoMovieMotionHumanGetDressed.presentHand],
    performers: [
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: slipRingScene.APART },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: slipRingScene.present(hand).node,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "b",
    "presentHand",
  );
  const ready: number = motionActionUnit.event(act, "ready");
  const relax: number = motionActionUnit.event(act, "relax");
  const grip: number = motionActionUnit.GRIP;

  // Facing yaw 180, the partner's forward is -Z and its left +X's opposite,
  // as a body facing +Z has its left at +X.
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const outward: IAutoMovieVector3 = {
    x: hand === "left" ? -1 : 1,
    y: 0,
    z: 0,
  };
  const palm: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 =>
    HumanHand.frame(b, film.bones("b", t), hand, "palm", "flat").point;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "b",
    ready,
  );
  const shoulder: IAutoMovieVector3 = bones.get(
    `${hand}UpperArm`,
  )!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get(`${hand}LowerArm`)!.worldPosition;
  const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
  const at: IAutoMovieVector3 = palm(ready);

  // 1 and 2. The upper arm hangs and the forearm lies level.
  const hung: number = shoulder.y - elbow.y;
  checks.check(
    `${label}: the upper arm hangs, the elbow its length below the shoulder (${(hung * 1000).toFixed(0)} mm of ${(b.measure.upperArm * 1000).toFixed(0)})`,
    Math.abs(hung - b.measure.upperArm) <= grip,
  );
  checks.check(
    `${label}: the forearm lies level, the palm at the elbow's height (${((at.y - elbow.y) * 1000).toFixed(0)} mm)`,
    Math.abs(at.y - elbow.y) <= grip,
  );

  // 3. The level reach from the elbow, ahead of it.
  const level: IAutoMovieVector3 = { ...Vector3.subtract(at, elbow), y: 0 };
  const reach: number = b.measure.forearm + b.measure.hand / 2;
  checks.check(
    `${label}: the palm lies the forearm and half the hand ahead of the elbow, read level (${(Vector3.length(level) * 1000).toFixed(0)} mm of ${(reach * 1000).toFixed(0)}, ${(Vector3.dot(level, forward) * 1000).toFixed(0)} mm of it ahead)`,
    Math.abs(Vector3.length(level) - reach) <= grip &&
      Vector3.dot(level, forward) > 0,
  );

  // 4. Inward of the shoulder's half width.
  const out: number = Vector3.dot(Vector3.subtract(at, hips), outward);
  checks.check(
    `${label}: the palm lies between the midline and the shoulder (${(out * 1000).toFixed(0)} mm out, the shoulder at ${(b.measure.shoulderHalfWidth * 1000).toFixed(0)})`,
    out >= -grip && out <= b.measure.shoulderHalfWidth + grip,
  );

  // 5. Held there.
  let moved: number = 0;
  for (let i: number = 1; i <= 24; ++i)
    moved = Math.max(
      moved,
      Vector3.distance(palm(ready + ((relax - ready) * i) / 24), at),
    );
  checks.check(
    `${label}: the palm is held while presented (${(moved * 1000).toFixed(1)} mm)`,
    moved <= grip,
  );
  motionActionUnit.bounds(checks, label, film, "b", act);
}
