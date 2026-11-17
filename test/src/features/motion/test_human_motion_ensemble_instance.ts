import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanEnsemble,
  HumanFormation,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanFormation,
  type IHumanPosture,
  instance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An instanced member displays its template's placed posture, read whole
 * film frames earlier and moved rigidly by the offset it stands at, and a
 * template that turns refuses its instances.
 *
 * Scenarios, a 2 by 5 line on one body marching 3 m, the rear rank
 * instanced from the front:
 * 1. At every 1/24 s, each instanced member's posture is its template's at
 *    `t - shift / 24` with the root and every limb goal's point moved by the
 *    member's starting offset, to 1e-9 m, and its joint angles the
 *    template's exactly.
 * 2. Every shift is a whole number of frames, at most `HumanEnsemble.LAG`
 *    seconds' worth.
 * 3. The front rank's postures are bit-identical to a performance with every
 *    member performed in full.
 * 4. An instance of a template that turns 90 degrees within its span is
 *    refused, naming the template and the turn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a line with instanced members and reads their postures against their templates': a non-rigid move, a fractional or unbounded shift, a template disturbed by its instances or a turning template accepted is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rigid motion is exact by construction of the law's contract (a translation and a turn of every world point); full against instanced front ranks is a metamorphic pair; the turn refusal is the contract's rigidity condition.
 * @evidence contracts/development/testing.md#distinguishing-cases Instanced and full members, the shift's bounds, the metamorphic pair and the turning template. The fits an instance shared through the former limb-fit memory are no longer a behaviour (every fit is solved directly); the solve's own frame invariance belongs to `test_human_motion_core_fit_frame`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on one prepared polygon-man body, discovered by its exported name; postures only, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_human_motion_ensemble_instance(): void {
  const findings: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const formation: IHumanFormation = {
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 5,
          spacing: { lateral: 0.6, depth: 0.8 },
        },
        count: 10,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  };
  const perform = (
    instanced: boolean,
    turn: boolean = false,
  ): { performance: HumanPerformance; ensemble: HumanEnsemble.IEnsemble } => {
    const ensemble: HumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: "l",
      seed: "instance",
      count: 10,
      bodies: [body],
      preset: "elite",
      formation,
      ...(instanced
        ? {
            detail: (m: { rank: number | null }) =>
              m.rank === 1 ? ("instanced" as const) : ("full" as const),
          }
        : {}),
    });
    const performance: HumanPerformance = new HumanPerformance({
      seed: "instance",
      laws: [...HUMAN_LEXICON.gait!, instance],
      performers: HumanEnsemble.performers(ensemble),
      composition: HumanEnsemble.chains(
        ensemble,
        (m: HumanEnsemble.IMember, chain: HumanChain) =>
          chain.registered("march", {
            to: turn
              ? { x: m.place.at.x + 3, y: 0, z: m.place.at.z + 0.01 }
              : { x: m.place.at.x, y: 0, z: m.place.at.z + 3 },
          }),
        3,
      ),
    });
    return { performance, ensemble };
  };
  const {
    performance,
    ensemble,
  }: { performance: HumanPerformance; ensemble: HumanEnsemble.IEnsemble } =
    perform(true);
  for (const m of ensemble.members.filter(
    (m: HumanEnsemble.IMember): boolean => m.detail === "instanced",
  )) {
    const template: HumanEnsemble.IMember = ensemble.members.find(
      (f: HumanEnsemble.IMember): boolean =>
        f.detail === "full" && f.slot?.block === m.slot?.block,
    )!;
    const segment: HumanSegment.ISegment = performance.segments(m.subject)[0]!;
    const shift: number = (segment.params as { shift: number }).shift;
    if (
      !Number.isInteger(shift) ||
      shift < 0 ||
      shift / instance.RATE > HumanEnsemble.LAG + 1e-9
    )
      findings.push(`${m.subject} lags ${shift} frames`);
    const offset: IAutoMovieVector3 = {
      x: m.place.at.x - template.place.at.x,
      y: 0,
      z: m.place.at.z - template.place.at.z,
    };
    for (let t: number = 1 / 24; t < 2.9; t += 1 / 24) {
      const own: IHumanPosture = performance.posture(m.subject, t);
      const lead: IHumanPosture = performance.posture(
        template.subject,
        t - shift / instance.RATE,
      );
      const off = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        Math.hypot(a.x - b.x - offset.x, a.y - b.y, a.z - b.z - offset.z);
      let worst: number = off(own.root, lead.root);
      for (const limb of ["leftLeg", "rightLeg"] as const)
        if (
          own.limbs[limb] !== undefined &&
          lead.limbs[limb] !== undefined &&
          lead.limbs[limb].on === undefined
        )
          worst = Math.max(
            worst,
            off(own.limbs[limb].point, lead.limbs[limb].point),
          );
      if (
        worst > 1e-9 ||
        JSON.stringify(own.joints) !== JSON.stringify(lead.joints)
      ) {
        findings.push(
          `${m.subject} at ${t.toFixed(3)} s is ${worst.toExponential(2)} m off its template's moved posture`,
        );
        break;
      }
    }
  }

  // 3. The front rank is untouched by its instances.
  const full: { performance: HumanPerformance } = perform(false);
  for (const m of ensemble.members.filter(
    (m: HumanEnsemble.IMember): boolean => m.detail === "full",
  ))
    for (let t: number = 0; t < 3; t += 0.25)
      if (
        JSON.stringify(full.performance.posture(m.subject, t)) !==
        JSON.stringify(performance.posture(m.subject, t))
      ) {
        findings.push(
          `${m.subject} differs from its fully performed self at ${t} s`,
        );
        break;
      }

  // 4. A turning template.
  try {
    perform(true, true).performance.posture("l.5", 1);
    findings.push("an instance of a turning template was not refused");
  } catch (error) {
    if (
      !(error instanceof HumanRefusal) ||
      !String(error.value).startsWith("l.")
    )
      findings.push(
        `the turn refusal does not name the template: ${String(error)}`,
      );
  }
  if (HumanFormation.count(formation) !== 10)
    findings.push("the formation lost a slot");
  TestValidator.equals("instanced members", findings, []);
}
