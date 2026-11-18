import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBend,
} from "@automovie/interface";
import { HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * The three bend strategies have distinct motions of the knees, trunk and pelvis.
 *
 * Scenarios:
 * 1. A stoop keeps knee flexion at most 30° and inclines the trunk at least 45°. The hips move back relative to the entrance posture.
 * 2. A squat bends the knees at least 90° with a more upright trunk. The semi-squat's flexion is between the two.
 * 3. Both feet still bear at the deepest point of each bend, and the law's unrequested balance stays outside the audit.
 * 4. Quiet stance on the same bodies inclines no more than 3° from vertical (Kendall et al. 2005).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each direction and threshold at the decisive event and the two support conditions.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each strategy and reads displayed knees, hips, trunk and foot support. Tipping the stoop forward at the hips or giving all strategies the same knee angle fails.
 * @evidence contracts/development/testing.md#independent-expectations The provisional angle gates follow Burgess-Limerick's lifting-posture classification (2003, doi:10.1016/S0169-8141(02)00190-7). Posterior hip translation follows Kim and Yoo's independent observation (2018, doi:10.1589/jpts.30.534); the paper supports the direction without claiming an exact displacement for a different body or task.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares all three postures on the small and large bodies. The automatic selector and both sides are tested separately in the bend branch and mirror specs.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test instantiates six bend performances and two quiet stances in memory.
 */
export function test_human_motion_signature_bend(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of BODIES) {
    const knees: Partial<Record<Strategy, number>> = {};
    const trunk: Partial<Record<Strategy, number>> = {};
    for (const strategy of STRATEGIES) {
      const label: string = `${name} ${strategy}`;
      const bend: M.IStaged = M.stage("bend", `strategy=${strategy}`, name);
      const t: number = M.event(bend, "deepest")!;
      knees[strategy] = (M.knee(bend, t, "left") + M.knee(bend, t, "right")) / 2;
      trunk[strategy] = M.trunk(bend, t);
      complaints.check(
        `${label}: both feet bear at the deepest`,
        M.bears(bend, t, "left") && M.bears(bend, t, "right"),
      );
      complaints.check(
        `${label}: omitted balance stays outside the audit`,
        !bend.film.segments("a").some(
          (span: IAutoMovieMotionHumanAuditMotion.ISpan): boolean => HumanPhysics.judged(span),
        ),
      );
      if (strategy === "stoop") {
        const retreat: number =
          M.joint(bend, 0, "hips").z - M.joint(bend, t, "hips").z;
        complaints.check(
          `${label}: hip retreat ${(retreat * 1000).toFixed(1)} mm, positive expected`,
          retreat > 0,
        );
      }
    }
    const stoop: number = knees.stoop!;
    const intermediate: number = knees.semiSquat!;
    const squat: number = knees.squat!;
    complaints.check(
      `${name} stoop: knees ${stoop.toFixed(1)}° and trunk ${trunk.stoop!.toFixed(1)}°, at most 30° and at least 45°`,
      stoop <= 30 && trunk.stoop! >= 45,
    );
    complaints.check(
      `${name} squat: knees ${squat.toFixed(1)}° and trunk ${trunk.squat!.toFixed(1)}°, at least 90° and below the stoop's trunk angle`,
      squat >= 90 && trunk.squat! < trunk.stoop!,
    );
    complaints.check(
      `${name} semi-squat: knees ${intermediate.toFixed(1)}° between ${stoop.toFixed(1)}° and ${squat.toFixed(1)}°`,
      stoop < intermediate && intermediate < squat,
    );
    const upright: number = M.trunk(M.stage("stand", "default", name), 1);
    complaints.check(
      `${name} quiet stance inclines ${upright.toFixed(2)}°, within ${M.STANCE}° expected`,
      Math.abs(upright) <= M.STANCE,
    );
  }
  complaints.assert("the bend distinguishes the stoop, semi-squat and squat");
}

/** The explicit strategy chosen before posture is read. */
type Strategy = Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">;

/** Read the three distinct postures on each comparison body. */
const STRATEGIES: readonly Strategy[] = ["stoop", "semiSquat", "squat"];

/** Bracket the supported body sizes while comparing postures within each body. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
