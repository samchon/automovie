import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { slipRingScene } from "../../internal/slipRingScene";

/** The rigid custody bound: a worn ring's drift on its bone, metres. */
const RIGID: number = 0.001;

/**
 * How near the worn ring's centre lies to the finger's axis, metres: the ring's
 * own wire, a band seated round the finger.
 */
const SEATED: number = 0.005;

/**
 * The ring slipped onto the partner's presented finger, on its own: the
 * slipRing step of `test_motion_get_dressed_slip_ring`, the average man's right
 * hand on the small woman's left hand and the mirrored exchange, entered by the
 * minimal chain the partner's presentHand, the dresser's pickUp(ring) (the
 * grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The ring hand's grip on the ring ends as the ring is worn, at the slip's
 *    `strokeEnd`.
 * 2. The other hand holds the partner in a grip window on person `b`.
 * 3. The worn ring's centre lies on the partner's ring finger's axis within its
 *    wire, 5 mm.
 * 4. The worn ring keeps its place on the proximal bone within 1 mm through the
 *    rest of the take.
 * 5. The slip keeps the shipped bounds over its own span, the partner bound
 *    between the two bodies included.
 *
 * Decomposes the original's checks 1 to 3; the original stops at its first
 * failure, so case 1's refusal hid case 2 and the self refusal, which is
 * `test_motion_get_dressed_slip_ring_refusal`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's windows, the displayed ring against the partner's displayed finger bones and the verdict report over the slip's span; a ring off the finger, sliding on it, a grip that outlasts the wear, a missing steadying hold, a hand through the other's arm or a finding in the slip fails, each exchange on its own.
 * @evidence contracts/development/testing.md#independent-expectations A ring seated on a finger lies on its axis within its wire; a worn prop is rigid on its bone within 1 mm, the dressing specifications' bound, as the original.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs with mirrored hands; the presenting and the pickUp are their own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_slip_ring_slip`.
 */
export function test_motion_get_dressed_slip_ring_slip(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of slipRingScene.CASES) {
    const label: string = `${c.dresser} rings ${c.partner}'s ${c.hand} hand`;
    try {
      verify(checks, label, c);
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the ring is slipped onto the partner's finger");
}

/** One exchange's slip and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  c: slipRingScene.ICase,
): void {
  const b: IAutoMovieMotionHumanBody = motionHumanBody(c.partner);
  const film: HumanPerformance = slipRingScene.exchange(
    motionHumanBody(c.dresser),
    b,
    c,
    "b",
  );
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "a",
    "slipRing",
  );
  const worn: number = motionActionUnit.event(act, "strokeEnd");
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    act.plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "prop" &&
        w.support.subject === "ring",
    );
  checks.check(
    `${label}: the ring hand lets go as the ring is worn`,
    grip !== undefined &&
      Math.abs(act.start + grip.to * act.plan.duration - worn) <= 1e-9,
  );
  checks.check(
    `${label}: the other hand holds the partner's palm`,
    act.plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "person" &&
        w.support.subject === "b",
    ),
  );
  const bone: AutoMovieHumanoidBone = `${c.hand}RingProximal`;
  const middle: AutoMovieHumanoidBone = `${c.hand}RingIntermediate`;
  const at: number = worn + 0.02;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "b",
    at,
  );
  const centre: IAutoMovieVector3 = film.prop("ring", at).position;
  const off: number = slipRingScene.toAxis(
    centre,
    bones.get(bone)!.worldPosition,
    bones.get(middle)!.worldPosition,
  );
  checks.check(
    `${label}: the worn ring lies on the finger's axis (${(off * 1000).toFixed(1)} mm)`,
    off <= SEATED,
  );
  const first: IAutoMovieVector3 = slipRingScene.local(
    film.prop("ring", at),
    bones.get(bone)!,
  );
  const drifts: readonly number[] = [0.5, 1].map((share: number): number => {
    const t: number = at + share * (film.duration - at);
    return Vector3.distance(
      slipRingScene.local(film.prop("ring", t), film.bones("b", t).get(bone)!),
      first,
    );
  });
  checks.check(
    `${label}: the ring rides the finger (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
    drifts.every((d: number): boolean => d <= RIGID),
  );
  motionActionUnit.bounds(checks, label, film, "a", act);
}
