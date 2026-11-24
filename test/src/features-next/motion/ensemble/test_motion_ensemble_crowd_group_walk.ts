import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * Four named walkers follow one authored social-group course through a bend.
 *
 * Scenarios:
 * 1. Before stepping off, ankle centres retain their relative slot positions.
 *    Each performer arrives at its own authored floor mark.
 * 2. During the turn, two neighbours keep travelling at distinct positions.
 * 3. Reading late, early and then late again gives the same displayed root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the cast, explicit station assignments, bend and seek witnesses.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the actual walk and reads displayed body roots before, during and after the turn.
 * @evidence contracts/development/testing.md#independent-expectations Slot differences locate the held ankles relative to one another. Each authored destination locates the stopped ankle midpoint within one centimetre. Distinct left-to-right slots require lateral separation through the turn. The companion shape test supplies independently measured slot geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Four separate walking laws share a moving frame with authored heading changes, with off-grid, reverse and repeated reads.
 * @evidence contracts/development/testing.md#execution-ownership Uses prepared polygon-man bodies and the public performance. It starts no viewer or renderer.
 */
export function test_motion_ensemble_crowd_group_walk(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const half: number =
    body.measure.shoulderHalfWidth + body.measure.upperArmRadius;
  const start: number = 1;
  const end: number = 10;
  const formation: IAutoMovieMotionHumanFormation =
    AutoMovieMotionHumanEnsemble.humanCrowdGroupFormation(
      {
        kind: "course",
        samples: [
          { seconds: start, x: 0, y: 0, z: 0, heading: 0 },
          { seconds: start + 3, x: 0, y: 0, z: 2.4, heading: 0 },
          { seconds: start + 6, x: 0.55, y: 0, z: 4.8, heading: 24 },
          { seconds: end, x: 1.6, y: 0, z: 7.2, heading: 24 },
        ],
      },
      [half, half, half, half],
      0.25,
    );
  const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble =
    AutoMovieMotionHumanEnsemble.HumanEnsemble.of({
      id: "quartet",
      seed: "quartet",
      count: 4,
      bodies: [body],
      formation,
    });
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "quartet",
    performers: AutoMovieMotionHumanEnsemble.HumanEnsemble.performers(ensemble),
    composition: AutoMovieMotionHumanEnsemble.HumanEnsemble.chains(
      ensemble,
      (
        member: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ): IAutoMovieMotionHumanChain =>
        chain.stand({ hold: start }).walk({
          to: AutoMovieMotionHumanEnsemble.HumanFormation.slot(
            formation,
            member.index,
            end,
          ).at,
          station: { formation, slot: member.index, until: end },
        }),
    ),
  });
  const earlier: number = start + 3.317;
  const later: number = start + 5.729;
  const roots: IAutoMovieVector3[] = [];
  const findings: string[] = [];
  /** Read the root of the pose used for display, in world metres. */
  const root = (subject: string, seconds: number): IAutoMovieVector3 =>
    performance.pose(subject, seconds).root!.translation;

  /** Read the ground-plane mark from the displayed ankle centres. */
  const markAt = (subject: string, seconds: number): IAutoMovieVector3 => {
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(subject, seconds);
    const left: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const right: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
    return { x: (left.x + right.x) / 2, y: 0, z: (left.z + right.z) / 2 };
  };

  const allowance: number = 0.01;
  const firstMember: IAutoMovieMotionHumanEnsemble.IMember =
    ensemble.members[0]!;
  const reference: IAutoMovieVector3 = markAt(firstMember.subject, 0.75);
  for (const member of ensemble.members) {
    const first: IAutoMovieVector3 = markAt(member.subject, 0.75);
    const stopped: IAutoMovieVector3 = markAt(member.subject, 30);
    const mark: IAutoMovieVector3 =
      AutoMovieMotionHumanEnsemble.HumanFormation.slot(
        formation,
        member.index,
        end,
      ).at;
    if (
      !nclose(
        first.x - reference.x,
        member.place.at.x - firstMember.place.at.x,
        allowance,
      ) ||
      !nclose(
        first.z - reference.z,
        member.place.at.z - firstMember.place.at.z,
        allowance,
      ) ||
      !vclose(first, markAt(member.subject, 0.8), 1e-12)
    )
      findings.push(
        `${member.subject} does not hold its relative station before step-off`,
      );
    if (
      !nclose(stopped.x, mark.x, allowance) ||
      !nclose(stopped.z, mark.z, allowance)
    )
      findings.push(
        `${member.subject} stops at (${stopped.x}, ${stopped.z}), planned (${mark.x}, ${mark.z})`,
      );

    const late: IAutoMovieVector3 = root(member.subject, later);
    const early: IAutoMovieVector3 = root(member.subject, earlier);
    const sought: IAutoMovieVector3 = root(member.subject, later);
    if (!(late.z > early.z + 1 && vclose(late, sought, 1e-12)))
      findings.push(
        `${member.subject} advances ${late.z - early.z} m or fails to replay at ${later} s`,
      );
    roots.push(late);
  }
  const heading: number = (((later - start - 3) / 3) * (24 * Math.PI)) / 180;
  for (let i: number = 1; i < roots.length; ++i) {
    const left: IAutoMovieVector3 = roots[i - 1]!;
    const right: IAutoMovieVector3 = roots[i]!;
    const span: number =
      (left.x - right.x) * Math.cos(heading) -
      (left.z - right.z) * Math.sin(heading);
    if (!(span > half))
      findings.push(
        `displayed neighbours ${i - 1} and ${i} are only ${span} m apart laterally`,
      );
  }
  TestValidator.equals(
    "the quartet walks and seeks on its assigned slots",
    findings,
    [],
  );
}
