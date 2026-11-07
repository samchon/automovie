import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import assert from "node:assert/strict";

import { Resolve } from "../../../src/motion/contact/Resolve";
import { filmGuard } from "../../../src/motion/contact/filmGuard";
import { Fighter } from "../../../src/motion/fighter/Fighter";
import { FighterBody } from "../../../src/motion/fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../../../src/motion/rig/FilmBodyRig";
import { FilmVector as V } from "../../../src/motion/rig/FilmVector";
import { Strike } from "../../../src/motion/striking/Strike";
import { BoutTargetSource } from "../../../src/physics/BoutTargetSource";
import { BoutScript } from "../../../src/shots/kickboxing/ring-bout/BoutScript";
import { observedBoutHeadCenter } from "../../internal/observedBoutHeadCenter";

/** Low, body and high kicks retain head protection through preparation, chamber, contact, recoil and replant. Actual rig geometry bounds forward posts on both sides; the resolved Human FK must retain the protective glove height. */
export function test_physical_kick_guard(): void {
  const source: BoutTargetSource = new BoutTargetSource();
  const rig: Rig = source.rigs.a;
  const findings: string[] = [];
  for (const technique of ["low-kick", "body-kick", "high-kick"] as const) {
    const action: BoutScript.Action = BoutScript.actions.find(
      (candidate: BoutScript.Action): boolean =>
        candidate.technique === technique,
    )!;
    const side: Rig.Side = BoutScript.specs[technique].side;
    const other: Rig.Side = side === "left" ? "right" : "left";
    const window: readonly [number, number] = Strike.window(action);
    const times: number[] = [
      window[0] + (action.at - window[0]) / 4,
      action.at - (action.at - window[0]) * 0.55,
      action.at,
      action.at + 0.12,
      window[1] - 0.01,
    ];
    for (const seconds of times) {
      const frame: FighterBody.Frame = source.fighters.a.frame(0);
      frame.time = seconds;
      Fighter.attack(frame, action, Strike.envelope(action, seconds), seconds);
      const request: Rig.Request = Resolve.requests({ a: frame }, { a: rig })
        .requests.a!;
      const trunk: Rig.Trunk = rig.trunk(request.pose, request.root);
      /** Derive the oracle from actual FK and the provider shape, independently of trunk.headCenter. */
      const headCenter: (output: Rig.Result["output"]) => V.Value = (
        output: Rig.Result["output"],
      ): V.Value => {
        const head: Rig.Result["output"]["posed"][number] = output.posed.find(
          (placement: Rig.Result["output"]["posed"][number]): boolean =>
            placement.bone === "head",
        )!;
        const rotation: readonly [number, number, number, number] = V.multiply(
          request.root.rotation,
          head.rotation,
        );
        return observedBoutHeadCenter(rig.profile, {
          position: V.vector(
            V.add(
              request.root.position,
              V.rotate(head.position, request.root.rotation),
            ),
          ),
          rotation: {
            x: rotation[0],
            y: rotation[1],
            z: rotation[2],
            w: rotation[3],
          },
        });
      };
      const expectedHead: V.Value = headCenter(rig.evaluate(request.pose));
      const forward: V.Value = V.rotateY([1, 0, 0], frame.heading);
      const left: V.Value = V.rotateY([0, 0, 1], frame.heading);
      for (const own of [side, other]) {
        const shape: P.IShape = rig.profile.segments
          .find(
            (segment: P.ISegment): boolean => segment.bone === `${own}Hand`,
          )!
          .shapes.find((candidate: P.IShape): boolean =>
            candidate.id.endsWith("glove"),
          )!;
        if (shape.kind !== "sphere")
          throw new Error("Expected the actual film glove sphere");
        const goal: Rig.Goal = request.arms![own]!;
        if (goal.point[1] < expectedHead[1] - shape.radius)
          findings.push(
            `${technique}/${own}@${seconds}: glove goal dropped below protective head height`,
          );
        const post: Rig.Goal = filmGuard(
          { rig, trunk, forward, left },
          own,
          1,
          1,
        );
        if (
          Math.abs(post.point[1] - expectedHead[1]) > 1e-10 ||
          V.distance(post.point, trunk.shoulders[own]) >
            rig.armReach[own] + 1e-10 ||
          V.dot(V.sub(post.point, trunk.shoulders[own]), forward) <= 0
        )
          findings.push(
            `${technique}/${own}@${seconds}: forward post disagrees with actual arm reach`,
          );
      }
      const solved: Rig.Result = rig.solve(request);
      for (const own of [side, other]) {
        const hand: Rig.Result["output"]["posed"][number] =
          solved.output.posed.find(
            (placement: Rig.Result["output"]["posed"][number]): boolean =>
              placement.bone === `${own}Hand`,
          )!;
        const shape: P.IShape = rig.profile.segments
          .find(
            (segment: P.ISegment): boolean => segment.bone === `${own}Hand`,
          )!
          .shapes.find((candidate: P.IShape): boolean =>
            candidate.id.endsWith("glove"),
          )!;
        if (shape.kind !== "sphere")
          throw new Error("Expected the actual film glove sphere");
        const glove: V.Value = V.add(
          request.root.position,
          V.rotate(
            V.add(
              hand.position,
              V.rotate(V.tuple(shape.transform.position), hand.rotation),
            ),
            request.root.rotation,
          ),
        );
        if (glove[1] < headCenter(solved.output)[1] - shape.radius)
          findings.push(
            `${technique}/${own}@${seconds}: solved glove dropped below protective head height`,
          );
      }
      if (seconds === action.at) {
        const handIntent: FighterBody.Hand = frame.hands[side];
        if (handIntent.kind !== "guard" || handIntent.extension !== 1)
          findings.push(
            `${technique}: kicking-side arm is not the forward post at contact`,
          );
      }
    }
  }
  assert.deepEqual(findings, []);
}
