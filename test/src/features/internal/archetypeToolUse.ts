import { createTool, createVessel } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  type useTool,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A tool taken up from a bench works with its own face: a hammer, a saw and a screwdriver bring the `face` they declare onto the work point, and a spoon stirs inside the saucepan it is aimed at, the tool riding the hand rigidly throughout.
 *
 * Each tool (`createTool`) lies level on a bench 0.15 m below the elbow beside the right hand, its working end ahead. The performer stands, picks it up by its `grip` for its use, and works four cycles with `useTool`: a hammer on a nail and a saw on a cut line at bench height 0.5 m ahead, a screwdriver on a screw 0.25 m below the shoulder 0.55 m ahead, and a spoon in a saucepan (`createVessel`) on the bench before the body.
 *
 * Scenarios, on the body named, for each tool:
 * 1. The pick-up and the work plan.
 * 2. At every `contact<n>` the tool's `face`, read from the displayed tool through the archetype's own contact, lies within 10 mm of the work point (the tool cases' tip-meets-work bound); a spoon's lies inside the saucepan, within its inside's radius of its axis and between its floor and its rim.
 * 3. Through the work, read every tenth of a second, the face keeps its place in the hand's grip frame within 1 mm (the campaign's grip bound): the tool never slips in the hand.
 * 4. The same work without the pick-up is refused on `prop`.
 *
 * @param name The polygon man performing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 4 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the pick-up and the work through the public chain on the real tools and vessel and reads the displayed tool and hand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the four works, the four scenarios in order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The face is the archetype's own contact read off the displayed tool, never the plan's.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Eight films.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function archetypeToolUse(name: "m-average" | "f-small"): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const pan: ReturnType<typeof createVessel> = createVessel({
    kind: "saucepan",
  });
    const body: IHumanBody = motionHumanBody(name);
    const bench: number =
      body.measure.shoulderHeight - body.measure.upperArm - 0.15;
    const potAt: IAutoMovieVector3 = { x: 0, y: bench, z: 0.4 };
    const kinds: [useTool.Kind, IAutoMovieVector3][] = [
      ["hammer", { x: -0.2, y: bench, z: 0.5 }],
      ["saw", { x: -0.2, y: bench, z: 0.5 }],
      ["screwdriver", { x: -0.2, y: body.measure.shoulderHeight - 0.25, z: 0.55 }],
      ["stir", potAt],
    ];
    for (const [kind, point] of kinds) {
      const label: string = `${name} ${kind}`;
      const tool: ReturnType<typeof createTool> = createTool({
        kind: kind === "stir" ? "spoon" : kind,
      });
      const props: IHumanProp[] = [
        HumanObject.prop("tool", tool, {
          position: { x: body.rest.get("rightUpperArm")!.x, y: bench, z: 0.3 },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        }),
        HumanObject.prop("pot", pan, { at: potAt, yaw: 0 }),
      ];
      const on: AutoMovieMotionTarget =
        kind === "stir"
          ? { kind: "prop", subject: "pot", point: "inside" }
          : { kind: "point", at: point, frame: "world" };
      const work = (taken: boolean): HumanPerformance => {
        const start: HumanChain = HumanChain.subject("a").stand({
          seconds: 0.3,
        });
        return new HumanPerformance({
          seed: "tool",
          laws: [],
          props,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: (taken
            ? start.pickUp({
                prop: "tool",
                handle: "grip",
                use: {
                  tip: "face",
                  line:
                    kind === "saw" || kind === "screwdriver"
                      ? "forearm"
                      : "square",
                },
              })
            : start
          ).useTool({ tool: kind, prop: "tool", on }).node,
        });
      };

      // 1. It plans.
      let film: HumanPerformance;
      try {
        film = work(true);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const act: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === "useTool")!;
      const face = (seconds: number): IAutoMovieVector3 => {
        const frame: IHumanProp.IFrame = film.prop("tool", seconds);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            tool.affordance("face").frame.translation,
          ),
        );
      };

      // 2. The face is on the work at every contact.
      for (const event of act.plan.events) {
        if (!event.name.startsWith("contact")) continue;
        const at: number = act.start + event.share * act.plan.duration;
        const tip: IAutoMovieVector3 = face(at);
        if (kind === "stir") {
          const inside: IAutoMovieAffordance = pan.affordance("inside");
          const floor: number = potAt.y + inside.frame.translation.y;
          const rim: number = potAt.y + pan.affordance("rim").frame.translation.y;
          const off: number = Math.hypot(tip.x - potAt.x, tip.z - potAt.z);
          if (!(off <= inside.width! / 2 && tip.y >= floor && tip.y <= rim))
            complaints.push(
              `${label}: at ${event.name} the spoon's face is ${mm(off)} mm off the saucepan's axis (inside ${mm(inside.width! / 2)} mm) at ${mm(tip.y - floor)} mm above its floor (rim ${mm(rim - floor)} mm)`,
            );
        } else {
          const miss: number = Vector3.length(Vector3.subtract(tip, point));
          if (!(miss <= 0.01))
            complaints.push(
              `${label}: at ${event.name} the face is ${mm(miss)} mm from the work point, within 10 mm expected`,
            );
        }
      }

      // 3. The tool rides the hand rigidly.
      const inHand = (seconds: number): IAutoMovieVector3 => {
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          "a",
          seconds,
        );
        const socket: IHumanBody["surfaces"]["sockets"]["gripRight"] =
          body.surfaces.sockets.gripRight;
        const hand: IAutoMovieResolvedBone = bones.get(socket.bone)!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            face(seconds),
            resolveAutoMovieHumanoidSurfaces.place(socket, hand).point,
          ),
        );
      };
      const first: IAutoMovieVector3 = inHand(act.start);
      let slip: number = 0;
      for (let s: number = act.start; s <= act.end; s += 0.1)
        slip = Math.max(
          slip,
          Vector3.length(Vector3.subtract(inHand(s), first)),
        );
      if (!(slip <= 0.001))
        complaints.push(
          `${label}: the face moves ${mm(slip)} mm in the hand during the work, within 1 mm expected`,
        );

      // 4. Without the pick-up it is refused.
      try {
        work(false);
        complaints.push(`${label}: a tool left on the bench was worked with`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "prop")
          complaints.push(
            `${label}: a tool not held failed with ${error instanceof Error ? error.message : String(error)}, a refusal on prop expected`,
          );
      }
    }
  TestValidator.equals(
    `${name}: a held tool works with its own face`,
    complaints,
    [],
  );
}
