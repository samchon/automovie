import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones } from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES } from "../internal/MOTION_HUMAN_LAW_STAGES";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * Displayed joint frames agree with fresh forward kinematics of the public pose
 * and preserve the skeleton's independently authored link lengths.
 *
 * Scenarios:
 * 1. Pick-up's rotated hand goal, walk's planted legs, and a partner strike each yield the same frame from the public pose and bones readers.
 * 2. On the average man and small woman, the arm, foot and digit frames keep the same rigid rest offsets and parent composition at both sampled instants.
 * 3. The pick-up leaves the bottle at its authored place through grip closure, raises it by the law's specified default lift, and keeps its position in the moving hand between lift-off and the lifted event.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the public pose seam, the rigid-link rule and the three distinct producer paths.
 * @evidence contracts/development/testing.md#behavioral-verification Performs real actions, queries the actual displayed frame and resolves the returned pose afresh. The test catches divergent pose and bone paths, stale or missing output channels, and a loss of rigid ancestry.
 * @evidence contracts/development/testing.md#independent-expectations Rigid translation preserves Euclidean length and attachment coordinates. Rest offsets come from authored rig geometry. The object-affordance contract admits 80–120 mm for the 100 mm default lift and at most 1 mm of in-hand slip.
 * @evidence contracts/development/testing.md#distinguishing-cases A rotated wrist goal, planted foot contacts and an aimed reach, on contrasting rigs, at two interior points from the original regression.
 * @evidence contracts/development/testing.md#execution-ownership Six portable real performances run in memory. The discovered test owns the skeletal hierarchy and both reader calls.
 */
export function test_human_motion_core_pose_regression(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const stages: Record<string, motionHumanLawSweep.Stage> = Object.assign(
    {},
    ...Object.values(MOTION_HUMAN_LAW_STAGES),
  );
  for (const law of LAWS)
    for (const [name, partner] of BODIES) {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const scene: motionHumanLawSweep.IScene = motionHumanLawSweep.staged(
        "default",
        stages[law]!,
        [name, partner],
        (): void => {},
      );
      const film: motionHumanLaw.IFilm = motionHumanLawSweep.perform("corpus", scene);
      if (law === "pickUp") pickup(complaints, name, film);
      for (const share of SHARES) {
        const t: number = film.duration * share;
        const label: string = `${law} ${name} at ${t.toFixed(3)} s`;
        const shown: motionHumanLaw.Bones = film.bones("a", t);
        const fresh: motionHumanLaw.Bones = poseBones(body, film.performance.pose("a", t));
        complaints.check(
          `${label}: admit all rig bones in both readers`,
          shown.size === body.skeleton.bones.length && fresh.size === shown.size,
        );
        for (const joint of body.skeleton.bones) {
          const display: IAutoMovieResolvedBone | undefined = shown.get(joint.bone);
          const recomputed: IAutoMovieResolvedBone | undefined = fresh.get(joint.bone);
          if (display === undefined || recomputed === undefined) {
            complaints.check(`${label}: missing ${joint.bone}`, false);
            continue;
          }
          complaints.check(
            `${label}: ${joint.bone} world frame differs from fresh FK`,
            vclose(display.worldPosition, recomputed.worldPosition, EXACT) &&
              qclose(display.worldRotation, recomputed.worldRotation, EXACT),
          );
          if (joint.parent === null) continue;
          const parent: IAutoMovieResolvedBone | undefined = shown.get(joint.parent);
          if (parent === undefined) {
            complaints.check(`${label}: missing parent of ${joint.bone}`, false);
            continue;
          }
          const p: IAutoMovieVector3 = parent.worldPosition;
          const q: IAutoMovieVector3 = display.worldPosition;
          const rest: IAutoMovieVector3 = joint.rest.translation;
          complaints.check(
            `${label}: ${joint.bone} changes the rig's rigid link`,
            nclose(
              Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z),
              Math.hypot(rest.x, rest.y, rest.z),
              EXACT,
            ) &&
              qclose(
                display.worldRotation,
                Quaternion.multiply(parent.worldRotation, display.localRotation),
                EXACT,
              ),
          );
        }
      }
    }
  complaints.assert("reader parity and rigid FK hold at the same displayed instant");
}

/** Observe the bottle at three named instants and measure its hand-relative displacement. */
function pickup(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  film: motionHumanLaw.IFilm,
): void {
  const initial: IAutoMovieRigidTransform = film.performance.prop("bottle", 0);
  const closed: number = motionHumanLaw.event(film, "gripClosed");
  const lifted: number = motionHumanLaw.event(film, "lifted");
  const liftOff: number = motionHumanLaw.event(film, "liftOff");
  const held: IAutoMovieRigidTransform = film.performance.prop("bottle", closed);
  const up: IAutoMovieRigidTransform = film.performance.prop("bottle", lifted);
  const rise: number = up.position.y - initial.position.y;
  complaints.check(
    `${name}: grip closure keeps the bottle at its authored position`,
    distance(held.position, initial.position) <= ATTACHMENT,
  );
  complaints.check(
    `${name}: the bottle rises ${(rise * 1000).toFixed(1)} mm by lifted, 80–120 mm expected`,
    rise >= 0.08 && rise <= 0.12,
  );
  const inHand: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = film.bones("a", t).get("rightHand")!;
    const prop: IAutoMovieVector3 = film.performance.prop("bottle", t).position;
    const handToProp: IAutoMovieVector3 = {
      x: prop.x - hand.worldPosition.x,
      y: prop.y - hand.worldPosition.y,
      z: prop.z - hand.worldPosition.z,
    };
    return Quaternion.rotateVector(Quaternion.inverse(hand.worldRotation), handToProp);
  };
  complaints.check(
    `${name}: the bottle remains rigidly in the same hand frame from lift-off to lifted`,
    distance(inHand(liftOff), inHand(lifted)) <= ATTACHMENT,
  );
}

/** Euclidean drift in metres between two observations in the same frame. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Distinct posed contact dependencies shared by the original regression. */
const LAWS: readonly string[] = ["pickUp", "walk", "punch"];

/** Opposite performers on unchanged stage geometry. */
const BODIES: readonly BodyPair[] = [["m-average", "f-small"], ["f-small", "m-average"]];

/** Lead and partner body names. */
type BodyPair = readonly [motionHumanBody.Name, motionHumanBody.Name];

/** The original interior frame demands. */
const SHARES: readonly number[] = [0.5, 0.75];

/** The existing repeat-test roundoff limit for matching numeric frame computations. */
const EXACT: number = 1e-9;

/** Metres of hand-relative drift admitted by the existing object-affordance spec. */
const ATTACHMENT: number = 0.001;
