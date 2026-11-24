import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLayer,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanExpression,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";
import { vclose } from "../../../features/internal/vclose";

const { HumanBreath } = AutoMovieMotionHumanExpression;

/** The observed spinal joints with flexion contributions from a tidal breath. */
const TRUNK = ["spine", "chest"] as const;

/** The two planted foot frames of the guard. */
const FEET = ["leftFoot", "rightFoot"] as const;

/** The stationary guard's duration, seconds. */
const DURATION: number = 10;

/** Numerical tolerance for matching clinical angles and world positions. */
const EPSILON: number = 1e-6;

/**
 * Native breathing follows film time when a stationary guard is subdivided.
 *
 * Scenarios:
 * 1. Compare one ten-second guard with ten one-second guards, with and without native breath.
 * 2. Seek both sides of an action boundary, compare the displayed rate and planted foot frames, and reread in reverse.
 * 3. Compare a scheduled native breath across the boundary and after its window.
 * 4. A caller-authored layer named breath and an overridden native apply still contribute to the entry posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the action, film-clock subdivision, contact measurements and layer provenance cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public HumanPerformance pose and bone samples on a prepared Human body.
 * @evidence contracts/development/testing.md#independent-expectations The guard and film-time breathing are the same continuous motions under any subdivision. The imported layer contributes half a tidal breath, or 0.75 degrees of chest extension, at the next entry.
 * @evidence contracts/development/testing.md#distinguishing-cases Quiet and layered takes isolate the periodic contribution. A native scheduled window and a caller-authored layer with the same name distinguish time bounds from provenance.
 * @evidence contracts/development/testing.md#execution-ownership Composes and samples native actions and layer callbacks in memory without a renderer or process.
 */
export function test_motion_expression_breathing_subdivision(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const native: IAutoMovieMotionHumanLayer = HumanBreath.layer({ rate: 15 });
  const quiet: HumanPerformance = guard(body, 1, []);
  const splitQuiet: HumanPerformance = guard(body, 10, []);
  const breathing: HumanPerformance = guard(body, 1, [native]);
  const splitBreathing: HumanPerformance = guard(body, 10, [native]);
  const scheduled: IAutoMovieMotionHumanLayer.IScheduled = {
    from: 0.25,
    to: 1.25,
    fade: 0.05,
    layer: native,
  };
  const window: HumanPerformance = guard(body, 1, [scheduled]);
  const splitWindow: HumanPerformance = guard(body, 10, [scheduled]);
  const imported: IAutoMovieMotionHumanLayer = {
    name: "breath",
    channels: ["trunk"],
    apply: (posture) => HumanBreath.add(posture, 0.5),
  };
  const importedOne: HumanPerformance = guard(body, 1, [imported]);
  const importedTwo: HumanPerformance = guard(body, 2, [imported]);
  const replaced: IAutoMovieMotionHumanLayer = Object.assign(
    HumanBreath.layer({ rate: 15 }),
    { apply: imported.apply },
  );
  const replacedTwo: HumanPerformance = guard(body, 2, [replaced]);
  const findings: string[] = [];

  const times: number[] = [0.5, 0.999, 1, 1.001, 1.5, 5, 9.999, 10];
  const reference: number[][] = times.map((at: number): number[] =>
    flexion(breathing, at),
  );
  const divided: number[][] = times.map((at: number): number[] =>
    flexion(splitBreathing, at),
  );
  for (const [index, at] of times.entries()) {
    const plain: number[] = flexion(quiet, at);
    const quietSplit: number[] = flexion(splitQuiet, at);
    const nativeSplit: number[] = divided[index]!;
    if (!anglesMatch(plain, quietSplit))
      findings.push(`quiet at ${at}: ${plain} vs ${quietSplit}`);
    if (!anglesMatch(reference[index]!, nativeSplit))
      findings.push(`native at ${at}: ${reference[index]} vs ${nativeSplit}`);
  }
  if (
    times.every((at: number, index: number): boolean =>
      anglesMatch(flexion(quiet, at), reference[index]!),
    )
  )
    findings.push("Breathing must change a displayed joint.");

  for (const at of [...times].reverse())
    if (!anglesMatch(flexion(splitBreathing, at), divided[times.indexOf(at)]!))
      findings.push(`reverse seek at ${at} missed the film-time posture`);

  const rate = (film: HumanPerformance, a: number, b: number): number =>
    (flexion(film, b)[1]! - flexion(film, a)[1]!) / (b - a);
  for (const [from, to] of [
    [0.999, 1],
    [1, 1.001],
  ] as const)
    if (
      !nclose(rate(breathing, from, to), rate(splitBreathing, from, to), 1e-3)
    )
      findings.push(`chest rate at ${from}–${to} changed with subdivision`);

  for (const at of [0.999, 1, 1.001, DURATION]) {
    const root: IAutoMoviePose["root"] = splitQuiet.pose("actor", at).root;
    const shown: IAutoMoviePose["root"] = splitBreathing.pose("actor", at).root;
    if (
      root === null ||
      shown === null ||
      !vclose(shown.translation, root.translation, EPSILON) ||
      !qclose(shown.rotation, root.rotation)
    )
      findings.push(`displayed root moved at ${at}`);

    const quietFeet: ReturnType<HumanPerformance["bones"]> = splitQuiet.bones(
      "actor",
      at,
    );
    const breathingFeet: ReturnType<HumanPerformance["bones"]> =
      splitBreathing.bones("actor", at);
    for (const foot of FEET) {
      const baseline: IAutoMovieResolvedBone = quietFeet.get(foot)!;
      const displayed: IAutoMovieResolvedBone = breathingFeet.get(foot)!;
      if (
        !vclose(displayed.worldPosition, baseline.worldPosition, EPSILON) ||
        !qclose(displayed.worldRotation, baseline.worldRotation)
      )
        findings.push(`${foot} changed its plant at ${at}`);
    }
  }

  for (const at of [0.25, 0.99, 1, 1.01, 1.25, 1.5, DURATION])
    if (!anglesMatch(flexion(window, at), flexion(splitWindow, at)))
      findings.push(`scheduled breath at ${at} changed with subdivision`);
  if (
    !anglesMatch(flexion(splitWindow, 1.5), flexion(quiet, 1.5)) ||
    !anglesMatch(flexion(splitWindow, DURATION), flexion(quiet, DURATION))
  )
    findings.push("Scheduled breath remained after its window.");

  const carried: number =
    flexion(importedTwo, DURATION)[1]! - flexion(importedOne, DURATION)[1]!;
  if (!nclose(carried, -0.75, EPSILON))
    findings.push(
      `caller-authored breath carried ${carried} degrees instead of -0.75`,
    );

  if (
    !anglesMatch(flexion(replacedTwo, DURATION), flexion(importedTwo, DURATION))
  )
    findings.push(
      "The caller override must behave like the same authored layer.",
    );

  TestValidator.predicate(
    `guard subdivision\n${findings.join("\n")}`,
    findings.length === 0,
  );
}

/** Compose one guard and any intended subdivisions of the same action. */
function guard(
  body: IAutoMovieMotionHumanBody,
  segments: number,
  layers: readonly (
    | IAutoMovieMotionHumanLayer
    | IAutoMovieMotionHumanLayer.IScheduled
  )[],
): HumanPerformance {
  let chain: ReturnType<typeof HumanChain.subject> =
    HumanChain.subject("actor");
  for (let index: number = 0; index < segments; ++index)
    chain = chain.guard({
      duration: DURATION / segments,
      stance: "orthodox",
      style: "kickboxing",
    });
  return new HumanPerformance({
    seed: "kickboxing/torso-reproduction",
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
    layers: { actor: layers },
  });
}

/** Read the displayed clinical angles at a film second. */
function flexion(film: HumanPerformance, at: number): number[] {
  const joints: IAutoMoviePose["joints"] = film.pose("actor", at).joints;
  return TRUNK.map((bone: (typeof TRUNK)[number]): number => {
    const angle: number | null | undefined = joints.find(
      (joint): boolean => joint.bone === bone,
    )?.flexion;
    if (typeof angle !== "number")
      throw new Error(
        `The displayed ${bone} has no clinical flexion at ${at} s`,
      );
    return angle;
  });
}

/** Compare all trunk angles at the same film instant. */
function anglesMatch(a: readonly number[], b: readonly number[]): boolean {
  return a.every((angle: number, index: number): boolean =>
    nclose(angle, b[index]!, EPSILON),
  );
}
