import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanVerdicts } from "@automovie/motions";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/**
 * `AutoMovieMotionHumanVerdicts` reads every physical bound on a performance: the generic
 * audit's checks, contact, range, spin, statics and timing, each reading past
 * its limit a finding placed at its act.
 *
 * Scenarios, the average man holding a quiet stance for 1 s at the origin, his
 * planted feet the declared contacts, read at 4 Hz on a typed minimal
 * performance (`AutoMovieMotionHumanVerdicts.IPerformance`) that displays the stance:
 *
 * 1. Displayed still, the report is clean.
 * 2. Displayed sliding 0.1 m along +X over the second, the planted feet slip past
 *    the 5 mm bound: a `slip` finding on the `stand` act, and the report is not
 *    clean.
 *
 * The body is built whole (`humanFixtureBody`): the checks read its colliders,
 * soles, tangle model and mass model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names a clean held stance and the resulting slip finding when the same planted stance travels 0.1 m.
 * @evidence contracts/development/testing.md#behavioral-verification Runs HumanVerdicts on prepared stored-body performances with no displacement and with an authored horizontal slide.
 * @evidence contracts/development/testing.md#independent-expectations A planted foot travels 0.1 m over the moving fixture's second, exceeding the 0.005 m limit. The literal action id stand fixes the expected location of its slip finding.
 */
export async function test_motions_audit_human_verdicts(): Promise<void> {
  // Runs every check: every collider, the tangle model, the soles and the mass model, a whole-body read.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = motionActionContext(body, {});
  const plan: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 1,
    posture: context.entry.posture,
    contacts: [
      { part: "leftFoot", kind: "plant", support: { kind: "ground" }, from: 0, to: 1 },
      { part: "rightFoot", kind: "plant", support: { kind: "ground" }, from: 0, to: 1 },
    ],
  });
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    context.entry.pose,
  );
  const performance = (
    shift: (seconds: number) => IAutoMovieVector3,
  ): AutoMovieMotionHumanVerdicts.IPerformance => ({
    duration: 1,
    performers: [{ subject: "a", body }],
    pose: () => context.entry.pose,
    bones: (_subject: string, seconds: number) =>
      new Map(
        [...still].map(
          ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
            AutoMovieHumanoidBone,
            IAutoMovieResolvedBone,
          ] => [
            name,
            {
              ...bone,
              worldPosition: AutoMovieEngineVector3.add(bone.worldPosition, shift(seconds)),
            },
          ],
        ),
      ),
    prop: () => {
      throw new Error("No props");
    },
    flights: () => [],
    segments: () => [
      {
        id: "stand",
        index: 0,
        name: "stand",
        start: 0,
        entryTime: 0,
        end: 1,
        params: {},
        plan,
        law: {},
      },
    ],
  });
  const clean: IAutoMovieMotionHumanVerdicts.IReport = AutoMovieMotionHumanVerdicts.read(
    performance(() => ({ x: 0, y: 0, z: 0 })),
    4,
  );
  TestValidator.predicate("still", clean.clean);
  const slid: IAutoMovieMotionHumanVerdicts.IReport = AutoMovieMotionHumanVerdicts.read(
    performance((t: number) => ({ x: 0.1 * t, y: 0, z: 0 })),
    4,
  );
  TestValidator.predicate(
    "sliding",
    !slid.clean &&
      slid.findings.some(
        (f: IAutoMovieMotionHumanVerdicts.IFinding): boolean =>
          f.check === "slip" && f.act === "stand",
      ),
  );
}
