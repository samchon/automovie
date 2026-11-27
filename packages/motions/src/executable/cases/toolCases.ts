import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanToolWork, IAutoMovieMotionHumanUseTool, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./internal/everydayVerdicts";
import { toolCaseHeld } from "./internal/toolCaseHeld";
import { toolCasePot } from "./internal/toolCasePot";

/**
 * Capture cases of the cyclic tool-use family, four cycles each with the right
 * hand from quiet standing, the tool first taken up from a bench beside the
 * right hand: `tool-hammer` on a nail at bench height, `tool-saw` over a cut
 * line at bench height, `tool-stir` in a pot on a counter, `tool-screwdriver`
 * on a screw in a wall at chest height.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot,
 * and that at every `contact<n>` the tool's working point, read from the
 * displayed grip socket and hand through the tool's offset in the hand, lies
 * within 10 mm of the work point (the issue's tip-meets-work bound, at decision
 * 11's declared accuracy).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @param only Whether to build a case with this name, or every case when
 *   absent.
 * @returns The cases.
 */
export function toolCases(
  bodies: readonly string[] = ["m-average"],
  only?: (name: string) => boolean,
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const tools: [IAutoMovieMotionHumanToolWork.Kind, IAutoMovieVector3][] = [
      ["hammer", { x: -0.2, y: 0.85, z: 0.5 }],
      ["saw", { x: -0.2, y: 0.85, z: 0.5 }],
      ["stir", { x: -0.15, y: 0.95, z: 0.4 }],
      ["screwdriver", { x: -0.2, y: 1.15, z: 0.55 }],
    ];
    const bench: number =
      who.body.measure.shoulderHeight - who.body.measure.upperArm - 0.15;
    for (const [tool, point] of tools) {
      const name: string = `tool-${tool}${suffix}`;
      if (only?.(name) === false) continue;
      const props: IAutoMovieMotionHumanProp[] = [
        toolCaseHeld(tool, { x: -0.2, y: bench, z: 0.3 }),
      ];
      if (tool === "stir")
        props.push(toolCasePot({ x: point.x, y: point.y - 0.1, z: point.z }));
      const params: IAutoMovieMotionHumanUseTool.IParams = {
        tool,
        prop: "tool",
        on:
          tool === "stir"
            ? { kind: "prop", subject: "pot", point: "inside" }
            : { kind: "point", at: point, frame: "world" },
      };
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(out, name, () =>
          FamilyCaseKit.perform(
            "tool",
            [{ subject: "a", body: who.body }],
            HumanChain.subject("a")
              .stand({ hold: 0.3 })
              .pickUp({
                prop: "tool",
                handle: "grip",
                use: {
                  tip: "face",
                  line:
                    tool === "saw" || tool === "screwdriver"
                      ? "forearm"
                      : "square",
                },
              })
              .act("useTool", params).node,
            props,
          ),
        );
      if (performance === null) continue;
      const offer: IAutoMovieMotionHumanActionPlan.IOffer | undefined =
        performance
          .segments("a")
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean => s.name === "useTool",
          )!.plan.offers;
      if (offer?.family !== "useTool")
        throw new Error("The tool's plan offers no tool");
      const at: IAutoMovieVector3 = offer.tool.on;
      const tip = (t: number): IAutoMovieVector3 => {
        const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
          performance.bones("a", t);
        const frame: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["gripRight"] =
          who.body.surfaces.sockets.gripRight;
        const grip: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          bones.get(frame.bone)!,
        ).point;
        return Vector3.add(
          grip,
          Quaternion.rotateVector(
            bones.get("rightHand")!.worldRotation,
            offer.tool.offset,
          ),
        );
      };
      let worst: IToolCasesWorst = { value: 0, where: "none" };
      for (let k: number = 1; k <= 4; k++) {
        const t: number = FamilyCaseKit.event(performance, `contact${k}`);
        const gap: number = Vector3.length(Vector3.subtract(tip(t), at));
        if (gap > worst.value)
          worst = { value: gap, where: `contact${k} at ${t.toFixed(2)} s` };
      }
      const trail: IAutoMovieVector3[] = [];
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
        trail.push(tip(t));
      out.push({
        name,
        times: FamilyCaseKit.times(performance, 0.15, [
          [FamilyCaseKit.event(performance, "contact1"), "contact1"],
        ]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        trails: [{ color: 0xd08020, points: trail }],
        targets: [{ at, radius: 0.015, color: 0xd04040 }],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          {
            name: "working point on the work at every contact",
            passed: worst.value <= 0.01,
            detail: `${(worst.value * 1000).toFixed(1)} mm (limit 10.0 mm), worst ${worst.where}`,
          },
        ],
      });
    }
  }
  return out;
}

/** The record of `IToolCasesWorst`'s site. */
type IToolCasesWorst = { value: number; where: string };
