import {
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IHumanProp } from "../../perform/IHumanProp";
import type { HumanSegment } from "../../perform/HumanSegment";
import type { useTool } from "../../tasks/useTool";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the cyclic tool-use family (#3255), four cycles each with
 * the right hand from quiet standing, the tool first taken up from a bench
 * beside the right hand: `tool-hammer` on a nail at bench height, `tool-saw`
 * over a cut line at bench height, `tool-stir` in a pot on a counter,
 * `tool-screwdriver` on a screw in a wall at chest height.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot,
 * and that at every `contact<n>` the tool's working point, read from the
 * displayed grip socket and hand through the tool's offset in the hand,
 * lies within 10 mm of the work point (the issue's tip-meets-work bound, at
 * decision 11's declared accuracy).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The working point is the displayed hand carrying the plan's rigid tool.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over four tools over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function toolCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const tools: [useTool.Kind, IAutoMovieVector3][] = [
      ["hammer", { x: -0.2, y: 0.85, z: 0.5 }],
      ["saw", { x: -0.2, y: 0.85, z: 0.5 }],
      ["stir", { x: -0.15, y: 0.95, z: 0.4 }],
      ["screwdriver", { x: -0.2, y: 1.15, z: 0.55 }],
    ];
    const bench: number =
      who.body.measure.shoulderHeight - who.body.measure.upperArm - 0.15;
    for (const [tool, point] of tools) {
      const props: IHumanProp[] = [held(tool, { x: -0.2, y: bench, z: 0.3 })];
      if (tool === "stir")
        props.push(pot({ x: point.x, y: point.y - 0.1, z: point.z }));
      const params: useTool.IParams = {
        tool,
        prop: "tool",
        on:
          tool === "stir"
            ? { kind: "prop", subject: "pot", point: "inside" }
            : { kind: "point", at: point, frame: "world" },
      };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "tool",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "tool",
            handle: "grip",
            use: {
              tip: "face",
              line: tool === "saw" || tool === "screwdriver" ? "forearm" : "square",
            },
          })
          .act("useTool", params),
        props,
      );
      const plan: useTool.IPlan = performance
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === "useTool")!
        .plan as useTool.IPlan;
      const at: IAutoMovieVector3 = plan.tool.on;
      const tip = (t: number): IAutoMovieVector3 => {
        const bones: ReturnType<HumanPerformance["bones"]> = performance.bones(
          "a",
          t,
        );
        const frame: IHumanBody["surfaces"]["sockets"]["gripRight"] =
          who.body.surfaces.sockets.gripRight;
        const grip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          frame,
          bones.get(frame.bone)!,
        ).point;
        return Vector3.add(
          grip,
          Quaternion.rotateVector(
            bones.get("rightHand")!.worldRotation,
            plan.tool.offset,
          ),
        );
      };
      let worst: { value: number; where: string } = { value: 0, where: "none" };
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
        name: `tool-${tool}${suffix}`,
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

/** A contact frame at a point whose `+Y` is `out`, its `+X` along `along`. */
function contact(
  id: string,
  kind: IAutoMovieAffordance["kind"],
  at: IAutoMovieVector3,
  out: IAutoMovieVector3,
  along: IAutoMovieVector3,
  extra: Partial<IAutoMovieAffordance> = {},
): IAutoMovieAffordance {
  const rotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
    along,
    out,
    Vector3.cross(along, out),
  );
  return {
    id,
    kind,
    frame: { translation: at, rotation, scale: { x: 1, y: 1, z: 1 } },
    extent: null,
    ...extra,
  };
}

/**
 * A one-hand tool shaped as `createTool` shapes it, lying level on a bench
 * with its working end ahead: a 0.3 m handle along its `+Y`, its `grip`
 * taken from `-Z` near the butt and its `face` at the working end (a
 * hammer's on the head's `+Z` side, a saw's teeth along `+Z`, a screwdriver's
 * tip and a spoon's bowl).
 *
 * @param kind The work the tool serves.
 * @param at Where its butt lies, world metres.
 * @returns The tool.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shape, the contacts and how it lies.
 * @evidence contracts/development/implementation.md#principled-implementation The `grip` and `face` contacts `createTool` declares, at its frames, on one handle collider a pick-up can grasp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One collider, two contacts.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The motions package does not depend on the archetypes, so the case declares the tool's contacts itself.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
function held(kind: useTool.Kind, at: IAutoMovieVector3): IHumanProp {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const face: IAutoMovieAffordance =
    kind === "hammer"
      ? contact("face", "surface", { x: 0, y: 0.285, z: 0.055 }, z, x)
      : kind === "saw"
        ? contact("face", "ledge", { x: 0, y: 0.2, z: 0.05 }, z, y)
        : kind === "screwdriver"
          ? contact("face", "surface", { x: 0, y: 0.3, z: 0 }, y, x)
          : contact("face", "surface", { x: 0, y: 0.27, z: 0.001 }, z, x);
  return {
    subject: "tool",
    frame: {
      position: at,
      rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
    },
    points: {},
    shapes: [
      {
        id: "handle",
        material: "wood",
        transform: {
          position: { x: 0, y: 0.15, z: 0 },
          rotation: Quaternion.identity(),
        },
        kind: "capsule",
        radius: 0.015,
        halfLength: 0.135,
      },
    ],
    affordances: [
      contact(
        "grip",
        "handle",
        { x: 0, y: 0.06, z: 0 },
        { x: 0, y: 0, z: -1 },
        y,
        { grip: "power", aperture: 0.03, length: 0.1 },
      ),
      face,
    ],
  };
}

/**
 * A pot standing on a counter: a 0.24 m wide, 0.2 m deep vessel whose
 * `inside` floor and `rim` are the contacts `createVessel` declares.
 *
 * @param at Where its base stands, world metres.
 * @returns The pot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the size and the contacts.
 * @evidence contracts/development/implementation.md#principled-implementation `createVessel`'s `inside` and `rim` contacts at its frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two contacts.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The motions package does not depend on the archetypes, so the case declares the pot's contacts itself.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
function pot(at: IAutoMovieVector3): IHumanProp {
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  return {
    subject: "pot",
    frame: { position: at, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      contact("rim", "surface", { x: 0, y: 0.2, z: 0 }, up, x, {
        width: 0.24,
        depth: 0.24,
      }),
      contact("inside", "surface", { x: 0, y: 0.005, z: 0 }, up, x, {
        width: 0.23,
        depth: 0.23,
      }),
    ],
  };
}
