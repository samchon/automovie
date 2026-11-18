import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBodyFit,
  HumanChain,
  HumanHand,
  HumanPerformance,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The whole-body fit holds the centre of mass over a base of support whose
 * corners move with the posture: the feet that bear may slide fore and aft,
 * and the fit's model of the balance moves the base with them as its merit's
 * reading of the next posture does, so the fit converges inside the base
 * instead of stalling short of it.
 *
 * The seed is the crouch law's full squat held at its lowest, as in
 * `test_human_motion_posture_body_fit`; the palms land flat with their side
 * place held, and each foot's toes' joint is held only across, its fore-aft
 * place free. The balance is kept on the feet alone, so the base is the
 * outline of the feet wherever they slide. The bounds are the fit's own
 * contract: the centre of mass inside the feet's base within the audits'
 * contact skin (`AutoMovieMotionHumanAuditSkin.BUILT`, 10 mm), the loop's own
 * convergence flag, and no stop at its round guard (`IResult.reason`
 * `rounds`). A model that keeps the base where the linearisation found it
 * while the merit reads it where the feet slid ends this fit about 25 mm
 * outside the base, unconverged.
 *
 * Scenarios, on the average man and the small woman (`m-average`,
 * `f-small`):
 * 1. The fit converges, not at its round guard, with the centre within the
 *    skin of the base the feet bear on.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the fit on real bodies from a real crouch and reads its own convergence, stop reason and balance residual; a base frozen in the model while its feet slide fails with the body and its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The balance bound is the audits' skin and a body standing still holds its centre over its feet; convergence and its guard are the fit's own contract, not values read from it.
 * @evidence contracts/development/testing.md#distinguishing-cases The feet free fore and aft with the balance on them alone, the case a fixed base cannot model; fixed feet and palm contacts are `test_human_motion_posture_body_fit`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and runs two fits in memory, seconds alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the fit asked, the seed, the free feet, the bounds with their sources and the scenario.
 */
export function test_human_motion_body_fit_sliding_base(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const SKIN: number = 10;
  const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  for (const name of ["m-average", "f-small"] as const) {
    const body = motionHumanBody(name);
    const standing: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const bones = poseBones(body, resolveHumanPosture(body, standing));

    // The crouch's full squat at its lowest, by its joint angles.
    const perf: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "fit",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act("crouch", {
        depth: "full",
        hold: 1,
      }).node,
    });
    const segment = perf.segments("a")[0]!;
    const pose = perf.pose("a", segment.start + segment.plan.duration / 2);
    const root = pose.root;
    if (root === null) throw new Error("the crouch displays no root");
    const squat: IAutoMovieMotionHumanPosture = {
      root: root.translation,
      ...resolveHumanPosture.angles(root.rotation),
      joints: Object.fromEntries(
        pose.joints.map((j) => [
          j.bone,
          [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0] as const,
        ]),
      ),
      limbs: {},
    };

    // Each foot held only across, free fore and aft; each palm flat with
    // its side place held.
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [];
    for (const side of ["left", "right"] as const) {
      targets.push({
        bone: `${side}Toes`,
        goal: bones.get(`${side}Toes`)!.worldPosition,
        axes: ["x"],
        normal: {
          local: Quaternion.rotateVector(
            Quaternion.inverse(bones.get(`${side}Toes`)!.worldRotation),
            DOWN,
          ),
          world: DOWN,
        },
      });
      targets.push({
        bone: `${side}Hand`,
        goal: bones.get(`${side}UpperArm`)!.worldPosition,
        axes: ["x"],
        normal: {
          local: HumanHand.offset(body, side, "palm").normal,
          world: DOWN,
        },
      });
    }
    const feet: RegExp[] = [/^left(Foot|Toes)$/, /^right(Foot|Toes)$/];
    const result: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: squat,
      targets,
      bearing: [
        ...feet,
        /^left(Hand|Thumb|Index|Middle|Ring|Little)/,
        /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
      ],
      balance: { parts: feet },
    });

    // 1. Converged inside the base the feet slid to.
    all.check(
      `${name}: the fit converged (${result.reason})`,
      result.converged,
    );
    all.check(
      `${name}: the fit stopped at its round guard`,
      result.reason !== "rounds",
    );
    all.check(
      `${name}: the centre of mass ${result.balance.toFixed(1)} mm outside the feet, within ${SKIN}`,
      result.balance <= SKIN,
    );
  }
  all.assert("the whole-body fit holds the centre over a base that slides");
}
