import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBend,
} from "@automovie/interface";
import { HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The three bend strategies have distinct motions of the knees, trunk and pelvis.
 * The paths through each strategy keep their contact, timing, skin and joint
 * constraints from lowering through return, including both acting sides.
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
 * @evidence contracts/development/testing.md#distinguishing-cases Compares all three postures on the small and large bodies. The default selector and both acting sides have whole-path checks. The mirror spec has the separate symmetry relation.
 * @evidence contracts/development/testing.md#execution-ownership Four audited films and two matched-body comparison films supply all six strategy measurements. The upright references come from the same stoops at entry.
 */
export function test_human_motion_law_sweep_posture_bend(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const audited: Map<string, M.IStaged> = new Map();
  complaints.list.push(...motionPostureBranches(AUDITED, (film, [, row, name]): void => {
    // The default target is above mid-shank, so auto must produce a stoop;
    // the observations below check that independently on the displayed body.
    const strategy: string = row === "default" ? "stoop" : row.split(",")[0]!.slice("strategy=".length);
    audited.set(`${name} ${strategy}`, { film, body: motionHumanBody(name), yaw: 0 });
  }));
  for (const name of BODIES) {
    const knees: Partial<Record<Strategy, number>> = {};
    const trunk: Partial<Record<Strategy, number>> = {};
    for (const strategy of STRATEGIES) {
      const label: string = `${name} ${strategy}`;
      const missing: boolean = (name === "m-large" && strategy === "semiSquat") ||
        (name === "f-small" && strategy === "squat");
      let bend: M.IStaged | undefined = audited.get(label);
      if (missing)
        try {
          bend = M.stage("bend", `strategy=${strategy}`, name);
        } catch (error) {
          complaints.check(`${label}: refused, ${error instanceof Error ? error.message : String(error)}`, false);
        }
      if (bend === undefined) continue;
      if (strategy === "stoop") {
        const upright: number = M.trunk(bend, 0);
        complaints.check(`${name} quiet entry inclines ${upright.toFixed(2)}°, within ${M.STANCE}° expected`,
          Math.abs(upright) <= M.STANCE);
      }
      const t: number | undefined = M.event(bend, "deepest");
      if (t === undefined) {
        complaints.check(`${label}: the deepest event is absent`, false);
        continue;
      }
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
    const stoop: number | undefined = knees.stoop;
    const intermediate: number | undefined = knees.semiSquat;
    const squat: number | undefined = knees.squat;
    if (stoop !== undefined)
      complaints.check(
        `${name} stoop: knees ${stoop}° and trunk ${trunk.stoop!.toFixed(1)}°, at most ${STOOP_KNEE}° and at least 45°`,
        stoop <= STOOP_KNEE + STOOP_ANGLE_ROUNDOFF && trunk.stoop! >= 45,
      );
    if (squat !== undefined)
      complaints.check(
        `${name} squat: knees ${squat.toFixed(9)}° and trunk ${trunk.squat!.toFixed(1)}°, knees at least 90°`,
        squat >= 90,
      );
    if (stoop !== undefined && squat !== undefined) {
      complaints.check(
        `${name} squat trunk inclines ${trunk.squat!.toFixed(1)}°, less than the stoop's ${trunk.stoop!.toFixed(1)}°`,
        trunk.squat! < trunk.stoop!,
      );
      if (intermediate !== undefined)
        complaints.check(
          `${name} semi-squat: knees ${intermediate.toFixed(1)}° between ${stoop.toFixed(1)}° and ${squat.toFixed(1)}°`,
          stoop < intermediate && intermediate < squat,
        );
    }
  }
  complaints.assert("the bend distinguishes the stoop, semi-squat and squat");
}

/** The audit stages retain their original inputs and reading intervals. */
const AUDITED: readonly motionPostureBranches.Branch[] = [
  ["bend", "default", "f-small"],
  ["bend", "strategy=stoop,side=right", "m-large"],
  ["bend", "strategy=semiSquat,side=left", "f-small"],
  ["bend", "strategy=squat", "m-large"],
];

/** The explicit strategy chosen before posture is read. */
type Strategy = Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">;

/** Read the three distinct postures on each comparison body. */
const STRATEGIES: readonly Strategy[] = ["stoop", "semiSquat", "squat"];

/** Bracket the supported body sizes while comparing postures within each body. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];

/** Burgess-Limerick's maximum knee flexion classified as a stoop, degrees. */
const STOOP_KNEE: number = 30;

/** Roundoff when recovering the exact limiting angle from two measured joint vectors. */
const STOOP_ANGLE_ROUNDOFF: number =
  // Six subtractions, three products, two additions, two norms,
  // their product and the quotient, rounded up to a binary operation bound.
  (2 ** Math.ceil(Math.log2(6 + 3 + 2 + 2 + 1 + 1)) * Number.EPSILON * 180) /
  // Convert the angular derivative of acos from radians to degrees.
  (Math.PI * Math.sin((STOOP_KNEE * Math.PI) / 180));
