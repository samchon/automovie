import {
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";

/**
 * The capture case of quiet standing on the polygon man (`stand`): the
 * smallest, the average and the tallest sweep bodies stand for 2 s on a
 * diagonal, 0.8 m apart along each axis, drawn at the start, after settling
 * and at the end.
 *
 * The verdicts are the clinical standing alignment the stand law claims, read
 * on the displayed bones at the end: the shoulder joints' midpoint and the
 * head joint (the ear's proxy) each within 3 cm of the hip joints' vertical
 * along the heading (Kendall's plumb line, fitted on the simplified neck);
 * the head's
 * forward axis level within 2°; the centre of mass 2 to 6 cm in front of the
 * ankles' midpoint (Winter 1995); and each heel and toe on the floor within
 * 5 mm.
 *
 * @returns The case.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the instants and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures the displayed bones, the body's sockets and the engine's centre of mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance, one measurement pass per body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed pose, not the law's goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function standCases(): IMotionCaptureCase[] {
  const names = ["f-small", "m-average", "m-tall"] as const;
  const men = names.map((name) => MotionBodies.population(name));
  const bodies: IHumanBody[] = men.map((man) =>
    createHumanBody(man.body.skeleton, man.body.profile),
  );
  let chain: HumanChain | undefined;
  names.forEach((_, i: number): void => {
    const one: HumanChain = HumanChain.subject(`s${i}`).stand({ seconds: 2 });
    chain = chain === undefined ? one : chain.with(one);
  });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stand",
    performers: bodies.map((body: IHumanBody, i: number) => ({
      subject: `s${i}`,
      body,
      // A diagonal lane, so the bodies part in the front and the side views alike.
      at: { x: (i - 1) * 0.8, y: 0, z: (i - 1) * 0.8 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: chain!.node,
  });
  const end: number = performance.duration;
  const plumb: string[] = [];
  const level: string[] = [];
  const lean: string[] = [];
  const floor: string[] = [];
  let plumbOk: boolean = true;
  let levelOk: boolean = true;
  let leanOk: boolean = true;
  let floorOk: boolean = true;
  names.forEach((name, i: number): void => {
    const body: IHumanBody = bodies[i]!;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(`s${i}`, end);
    const z = (bone: AutoMovieHumanoidBone): number =>
      bones.get(bone)!.worldPosition.z;
    const hips: number = (z("leftUpperLeg") + z("rightUpperLeg")) / 2;
    const shoulders: number = (z("leftUpperArm") + z("rightUpperArm")) / 2;
    const ear: number = z("head");
    plumb.push(
      `${name} shoulders ${((shoulders - hips) * 1000).toFixed(1)} mm, ear ${((ear - hips) * 1000).toFixed(1)} mm`,
    );
    if (Math.abs(shoulders - hips) > 0.03 || Math.abs(ear - hips) > 0.03)
      plumbOk = false;
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      bones.get("head")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    const pitch: number = (Math.asin(forward.y) * 180) / Math.PI;
    level.push(`${name} ${pitch.toFixed(1)} deg`);
    if (Math.abs(pitch) > 2) levelOk = false;
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
    const ahead: number = com.z - (z("leftFoot") + z("rightFoot")) / 2;
    lean.push(`${name} ${(ahead * 100).toFixed(1)} cm`);
    if (ahead < 0.02 || ahead > 0.06) leanOk = false;
    for (const side of ["left", "right"] as const)
      for (const { socket, point } of HumanFoot.sockets(body, bones, side)) {
        if (socket === "ball" || Math.abs(point.y) <= 0.005) continue;
        floorOk = false;
        floor.push(
          `${name} ${side} ${socket} ${(point.y * 1000).toFixed(1)} mm`,
        );
      }
  });
  return [
    {
      name: "stand",
      times: [
        { seconds: 0, label: "start" },
        { seconds: 0.5, label: "settled" },
        { seconds: end, label: "end" },
      ],
      performers: names.map(
        (_, i: number): IMotionCaptureCase.IPerformer => ({
          id: `s${i}`,
          body: men[i]!.body,
          pose: (seconds: number): IAutoMoviePose =>
            performance.pose(`s${i}`, seconds),
        }),
      ),
      verdicts: [
        {
          name: "shoulders and ear within 3 cm of the hips' vertical",
          passed: plumbOk,
          detail: plumb.join("; "),
        },
        {
          name: "head level within 2 degrees",
          passed: levelOk,
          detail: level.join("; "),
        },
        {
          name: "centre of mass 2 to 6 cm ahead of the ankles",
          passed: leanOk,
          detail: lean.join("; "),
        },
        {
          name: "heels and toes on the floor within 5 mm",
          passed: floorOk,
          detail: floor.join("; ") || "all within 5 mm",
        },
      ],
    },
  ];
}
