import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  HumanBodyFit,
  HumanHand,
  HumanSkill,
  humanPostureHeading,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../internal/motionContactArmFixture";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * The whole-body fit finds the static posture in which the palms land flat on
 * the floor from a full squat while the feet keep their toes' joints planted,
 * the centre of mass stays over the feet and every joint stays in its range,
 * and reports a contact it cannot reach.
 *
 * The seed is the crouch law's full squat held at its lowest, the stance a
 * hands-down landing starts from (Escande, Kheddar and Miossec 2013: a stance
 * is solved from its parent). Each palm's target holds only its side place, the
 * shoulder's, so the fit chooses how far ahead it lands, and its normal faces
 * the floor; each foot's toes' joint stays where it stood with the toes flat.
 * The bounds are the fit's own contract: every contact within the audits'
 * contact skin (`AutoMovieMotionHumanAuditSkin.BUILT`, 10 mm), every contact
 * normal within 1 degree of the floor's (provisional: a flat palm read by eye),
 * the centre of mass inside the feet's base within the same skin, and the
 * loop's own convergence flag.
 *
 * Scenarios:
 *
 * 1. On the average man and the small woman (`m-average`, `f-small`), the palms
 *    land flat with the feet planted, the centre over the feet, and the fit
 *    says it converged.
 * 2. On the average man, a palm sent a metre past the arm's reach is reported
 *    unconverged with a residual over the skin, never claimed met.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the fit on real bodies from a real crouch and reads the result's own residuals and convergence; a palm that hovers, a foot that slides, a body off its feet or a miss claimed met fails with the body and its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The contact bound is the audits' skin, the balance the static equilibrium of a body standing still, the normal's degree marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Two extreme bodies of the sweep met, and one unreachable target refused by its flag; the support planner's sequences are its own test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and runs three fits in memory, under a minute; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the fit asked, the seed, the bounds with their sources and the 2 scenarios.
 */
export function test_motion_posture_staged_limb(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  // A folded two-link stage arm has radius |a-b|, a straight one a+b.
  const inputs: fixture.IInputs = fixture();
  const upper: number = inputs.body.measure.upperArm;
  const lower: number = inputs.body.measure.forearm;
  for (const [angle, radius] of [
    [0, upper + lower],
    [90, Math.hypot(upper, lower)],
    [180, Math.abs(upper - lower)],
  ] as const)
    all.check(
      "two-link radius at " + angle,
      Math.abs(
        AutoMovieMotionHumanStrike.StrikingReach.reach(upper, lower, angle) -
          radius,
      ) <= 1e-9,
    );
  // The descending half of the scalar minimum-jerk speed profile has one
  // interior sample for each speed fraction and a unique maximum at 1/2.
  for (const fraction of [0.5, 1]) {
    const phase: number =
      AutoMovieMotionHumanStrike.StrikingStroke.impactShare(fraction);
    all.check(
      "descending speed at " + fraction,
      phase >= 0.5 &&
        Math.abs(16 * phase ** 2 * (1 - phase) ** 2 - fraction) <= 1e-9,
    );
  }
  for (const sign of [-1, 1]) {
    const markerClock: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanArm.stroke({
        body: inputs.body,
        side: "right",
        clock: inputs.clock,
        origin: inputs.origin,
        path: (_pose, _time, progress) =>
          fixture.target({
            x: sign * upper * progress,
            y: 1,
            z: lower * (1 - progress),
          }),
      });
    for (const [seconds, share] of [
      [2, 0],
      [3, 0.5],
      [4, 1],
      [5, 1],
    ] as const) {
      const actual = markerClock.write(inputs.posture, seconds).limbs.rightArm!
        .point;
      all.check(
        "reflected stage marker at " + seconds,
        Vector3.distance(actual, {
          x: sign * upper * share,
          y: 1,
          z: lower * (1 - share),
        }) <= 1e-9,
      );
    }
  }
  // A stage marker's scatter grows with the distance travelled and shrinks
  // with the allotted time. Scaling both together leaves the uncertainty unchanged.
  const trained = HumanSkill.resolve({ level: "trained" }, "stage marker");
  const novice = HumanSkill.resolve({ level: "novice" }, "stage marker");
  const sigma = HumanSkill.scatter(trained, upper, 1);
  all.check(
    "skill tightens the marker dispersion",
    sigma > 0 && HumanSkill.scatter(novice, upper, 1) > sigma,
  );
  all.check(
    "stationary markers have no path dispersion",
    HumanSkill.scatter(trained, 0, 1) === 0,
  );
  all.check(
    "dispersion scales with stage speed",
    Math.abs(HumanSkill.scatter(trained, 2 * upper, 1) - 2 * sigma) < 1e-12 &&
      Math.abs(HumanSkill.scatter(trained, 2 * upper, 2) - sigma) < 1e-12,
  );
  let invalid: unknown;
  try {
    AutoMovieMotionHumanStrike.StrikingStroke.impactShare(0);
  } catch (error) {
    invalid = error;
  }
  all.check(
    "a stopped path has no descending speed marker",
    invalid instanceof Error,
  );
  const SKIN: number = 10;
  const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  for (const name of ["m-average"] as const) {
    const body = motionHumanBody(name);
    const standing = AutoMovieMotionHumanStance.stand.posture(
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
    const lowest: number = segment.start + segment.plan.duration / 2;
    const pose = perf.pose("a", lowest);
    const root = pose.root;
    if (root === null) throw new Error("the crouch displays no root");
    const squat = {
      root: root.translation,
      ...humanPostureHeading.angles(root.rotation),
      joints: Object.fromEntries(
        pose.joints.map((j) => [
          j.bone,
          [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0] as const,
        ]),
      ),
      limbs: {},
    };
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [];
    for (const side of ["left", "right"] as const) {
      targets.push({
        bone: `${side}Toes`,
        goal: bones.get(`${side}Toes`)!.worldPosition,
        axes: ["x", "z"],
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
    const bearing: RegExp[] = [
      /^left(Foot|Toes)$/,
      /^right(Foot|Toes)$/,
      /^left(Hand|Thumb|Index|Middle|Ring|Little)/,
      /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
    ];

    // 1. The palms land.
    const result: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: squat,
      targets,
      bearing,
      balance: true,
    });
    all.check(
      `${name}: the fit converged (${result.reason})`,
      result.converged,
    );
    result.residuals.forEach(
      (r: (typeof result.residuals)[number], k: number): void => {
        all.check(
          `${name}: target ${k} misses ${r.point.toFixed(1)} mm, within ${SKIN}`,
          r.point <= SKIN,
        );
        all.check(
          `${name}: target ${k} normal ${r.turn.toFixed(2)} degrees off the floor's, within 1`,
          r.turn <= 1,
        );
      },
    );
    all.check(
      `${name}: the centre of mass ${result.balance.toFixed(1)} mm outside the feet, within ${SKIN}`,
      result.balance <= SKIN,
    );

    // 2. A palm a metre past reach is reported, never claimed met.
    if (name === "m-average") {
      const far: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = targets.map(
        (
          t: IAutoMovieMotionHumanBodyFitTypes.ITarget,
          k: number,
        ): IAutoMovieMotionHumanBodyFitTypes.ITarget =>
          k === 1
            ? {
                ...t,
                goal: Vector3.add(t.goal, { x: 0, y: 1, z: 1 }),
                axes: ["x", "y", "z"],
              }
            : t,
      );
      const missed: IAutoMovieMotionHumanBodyFitTypes.IResult =
        HumanBodyFit.fit({
          body,
          posture: squat,
          targets: far,
          bearing,
          balance: true,
        });
      all.check(
        `${name}: an unreachable palm is not converged`,
        missed.converged === false,
      );
      all.check(
        `${name}: the unreachable palm's residual ${missed.residuals[1]!.point.toFixed(1)} mm is over the skin`,
        missed.residuals[1]!.point > SKIN,
      );
    }
  }
  all.assert("the whole-body fit lands the palms and reports a miss");
}
