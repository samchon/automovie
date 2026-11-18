import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanFoot, HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * The crouch's optional balance moves its trunk only while the low pose is held.
 *
 * Scenarios:
 * 1. The full squat with raised heels is performed with omitted, zero, half and full correction. The law's recommendation selects the trunk from lowest to ascend.
 * 2. The enabled correction leaves the trunk and supporting legs unchanged outside those events. Omitted and zero options leave the held pose equal and never read the owned input's mass model.
 * 3. At the held instant the half correction has the arithmetic midpoint of the untreated and fully treated spine angle. Both leg chains and the pelvis keep their world frames.
 * 4. When the active correction is judged, its centre of mass projects inside the hull of the actual soles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual law, event boundaries, weight comparisons and measured contact geometry.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real public law with its published options and observes the displayed skeleton and actual support hull. The test catches timing leaks, treating zero as on, moving a leg, or a full correction leaving the centre outside the support.
 * @evidence contracts/development/testing.md#independent-expectations The event names identify the held interval. Affine interpolation gives the arithmetic midpoint at half angle. A projection outside the convex support hull cannot be statically supported under the premise of Hof et al. 2005.
 * @evidence contracts/development/testing.md#distinguishing-cases Requests full and half corrections from the same kinematic pose, with omitted and zero requests on the same stage. The clock unit spec owns arbitrary cues and ramps.
 * @evidence contracts/development/testing.md#execution-ownership Four films of one in-memory polygon body use the public applied-pose and balance-audit seams.
 */
export function test_human_motion_crouch_balance(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const passive: IAutoMovieMotionHumanBody = {
    ...body,
    get massModel(): IAutoMovieMotionHumanBody["massModel"] {
      throw new Error("A disabled crouch balance requested a mass model");
    },
  };
  const base: motionHumanLaw.IFilm = crouch(passive);
  const zero: motionHumanLaw.IFilm = crouch(passive, { weight: 0 });
  const half: motionHumanLaw.IFilm = crouch(body, { weight: 1 / 2 });
  const full: motionHumanLaw.IFilm = crouch(body, {});
  const span: IAutoMovieMotionHumanSegment = full.performance.segments("a")[0]!;
  const from: number = motionHumanLaw.event(full, "lowest");
  const to: number = motionHumanLaw.event(full, "ascend");
  const during: number = (from + to) / 2;
  const before: number = (span.entryTime + from) / 2;
  const after: number = (to + span.end) / 2;

  all.check(
    "the law's recommendation selects the trunk over the low hold",
    span.plan.balanceWindow?.by === "trunk" &&
      nclose(span.start + span.plan.balanceWindow.from, from, FRAME) &&
      nclose(span.start + span.plan.balanceWindow.to, to, FRAME),
  );
  all.check(
    "only the positive requested correction is judged during the hold",
    !HumanPhysics.judged(base.performance.segments("a")[0]!, during) &&
      !HumanPhysics.judged(zero.performance.segments("a")[0]!, during) &&
      HumanPhysics.judged(half.performance.segments("a")[0]!, during) &&
      HumanPhysics.judged(span, during),
  );
  for (const t of [before, after]) {
    all.check(
      `full correction is dormant and leaves the trunk and legs unchanged at ${t.toFixed(3)} s`,
      !HumanPhysics.judged(span, t) &&
        sameFrames(base.bones("a", t), full.bones("a", t), OUTSIDE),
    );
  }
  const reference: motionHumanLaw.Bones = base.bones("a", during);
  all.check(
    "explicit zero is dormant even at the lowest pose",
    sameFrames(reference, zero.bones("a", during)),
  );
  const shifted: motionHumanLaw.Bones = full.bones("a", during);
  all.check(
    "the correction leaves both foot chains and the pelvis fixed",
    sameFrames(reference, shifted, BEARING),
  );
  const middle: number = flexion(half, during);
  const expected: number = (flexion(base, during) + flexion(full, during)) / 2;
  all.check(
    `half weight gives spine flexion ${expected.toFixed(6)}°, read ${middle.toFixed(6)}°`,
    nclose(middle, expected, FRAME),
  );

  if (HumanPhysics.judged(span, during)) {
    const margin: number = resolveAutoMovieCenterOfMass.margin(
      resolveAutoMovieCenterOfMass.place(body.massModel, shifted),
      HumanFoot.base(body, shifted),
    );
    all.check(
      `the full correction's support margin is ${(margin * 1000).toFixed(3)} mm, at least zero expected`,
      margin >= 0,
    );
  }
  all.assert("the crouch shifts only its requested part and interval");
}

/** Construct the same full crouch for each balance request. */
function crouch(
  body: IAutoMovieMotionHumanBody,
  balance?: IAutoMovieMotionHumanBalance,
): motionHumanLaw.IFilm {
  return motionHumanLaw.perform(
    "signature",
    [{ subject: "a", body }],
    HumanChain.subject("a").crouch({
      depth: "full",
      hold: 0.5,
      ...(balance === undefined ? {} : { balance }),
    }),
  );
}

/** The displayed clinical lumbar flexion at a film second. */
function flexion(film: motionHumanLaw.IFilm, seconds: number): number {
  return film.performance.pose("a", seconds).joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === "spine",
  )?.flexion ?? 0;
}

/** The unchanged-world-frame assertion, over every bone or a fixed subset. */
function sameFrames(
  before: motionHumanLaw.Bones,
  after: motionHumanLaw.Bones,
  names: Iterable<AutoMovieHumanoidBone> = before.keys(),
): boolean {
  if (before.size !== after.size) return false;
  for (const name of names) {
    const a: IAutoMovieResolvedBone = before.get(name)!;
    const b: IAutoMovieResolvedBone | undefined = after.get(name);
    if (b === undefined ||
        !vclose(a.worldPosition, b.worldPosition, FRAME) ||
        !qclose(a.worldRotation, b.worldRotation, FRAME)) return false;
  }
  return true;
}

/** Hips and the descendants that bear the crouch, outside the moved trunk. */
const BEARING: readonly AutoMovieHumanoidBone[] = [
  "hips", "leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes",
  "rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes",
];

/** The corrected spine and the fixed support both keep their baseline outside the hold. */
const OUTSIDE: readonly AutoMovieHumanoidBone[] = [
  ...BEARING, "spine", "chest",
];

/** The original deterministic world-frame comparison tolerance. */
const FRAME: number = 1e-9;
