import { Transform, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanLadder,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { climbLadder } from "../../climbing/climbLadder";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/** The record of `IClimbCasesFewest`'s site. */
type IClimbCasesFewest = { value: number; at: number };

/** The record of `IClimbCasesHeld`'s site. */
type IClimbCasesHeld = { value: number; where: string };

/**
 * Capture cases of the climbing family: `climb-ladder`, three rungs of a fixed
 * ladder with 0.3 m spacing (OSHA 1910.23) in the four-beat pattern, from quiet
 * standing before it; the ladder is a fixture prop whose rungs stand 0.35 m
 * ahead of the climber's feet.
 *
 * It reports foot slip at most 5 mm in the plant windows and no range-of-motion
 * overshoot; each gripping hand's grip socket within 10 mm of its rung's axis
 * through its grip windows (the issue's hand-on-rung bound); and, from
 * `handsOn` on, at least three limbs on the ladder at every frame (Jensen and
 * Holland 2020's three points of control), a hand counting within 15 mm of a
 * rung's axis and a foot with a sole socket within 15 mm of a rung's top or the
 * floor.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 */
export function climbCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const params: IAutoMovieMotionHumanClimbLadder.IParams = {
      ladder: "ladder",
      rungs: 3,
    };
    const performance: IAutoMovieMotionHumanPerformance = FamilyCaseKit.perform(
      "climb",
      [{ subject: "a", body: who.body }],
      HumanChain.subject("a").act("climbLadder", params),
      [ladderProp()],
    );
    const segment = performance.segments("a")[0]!;
    const ladder: IAutoMovieMotionHumanLadder.ILadder = (
      segment.plan as IAutoMovieMotionHumanClimbLadder.IPlan
    ).ladder;
    const local = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.local(ladder.frame, p);

    // Distance of a point to the nearest rung's axis, and height over its top.
    const toRung = (p: IAutoMovieVector3): number => {
      const q: IAutoMovieVector3 = local(p);
      const i: number = Math.max(1, Math.round(q.y / ladder.spacing));
      return Math.hypot(q.y - i * ladder.spacing, q.z - ladder.ahead);
    };
    const onTop = (p: IAutoMovieVector3): number => {
      const q: IAutoMovieVector3 = local(p);
      if (Math.abs(q.z - ladder.ahead) > 0.05) return Math.abs(q.y);
      const i: number = Math.round(q.y / ladder.spacing);
      return Math.abs(q.y - (i * ladder.spacing + climbLadder.RUNG));
    };
    const grip = (side: AutoMovieHumanSide, t: number): IAutoMovieVector3 => {
      const frame =
        who.body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        performance.bones("a", t).get(frame.bone)!,
      ).point;
    };
    const at = (share: number): number =>
      segment.start + share * segment.plan.duration;

    let held: IClimbCasesHeld = { value: 0, where: "none" };
    for (const c of segment.plan.contacts) {
      if (c.kind !== "grip") continue;
      const side: AutoMovieHumanSide = c.part === "leftHand" ? "left" : "right";
      for (let t: number = at(c.from); t <= at(c.to) + 1e-9; t += 1 / 24) {
        const d: number = toRung(grip(side, t));
        if (d > held.value)
          held = { value: d, where: `${side} at ${t.toFixed(2)} s` };
      }
    }
    const handsOn: number = FamilyCaseKit.event(performance, "handsOn");
    let fewest: IClimbCasesFewest = {
      value: Infinity,
      at: handsOn,
    };
    for (
      let t: number = handsOn;
      t <= performance.duration + 1e-9;
      t += 1 / 24
    ) {
      const bones = performance.bones("a", t);
      let count: number = 0;
      for (const side of ["left", "right"] as const) {
        if (toRung(grip(side, t)) <= 0.015) count++;
        if (
          HumanFoot.sockets(who.body, bones, side).some(
            (s) => onTop(s.point) <= 0.015,
          )
        )
          count++;
      }
      if (count < fewest.value) fewest = { value: count, at: t };
    }
    // No instant read is no limb seen bearing, not all four.
    if (fewest.value === Infinity) fewest = { value: 0, at: handsOn };

    const boxes: NonNullable<IMotionCaptureCase["boxes"]> = [];
    for (let i: number = 1; i <= 3 + 6; i++)
      boxes.push({
        centre: climbLadder.rung(ladder, i, 0),
        half: { x: 0.22, y: climbLadder.RUNG, z: climbLadder.RUNG },
        color: 0x9aa4b0,
      });
    out.push({
      name: `climb-ladder${suffix}`,
      times: FamilyCaseKit.times(performance, 0.4, [[handsOn, "handsOn"]]),
      performers: [FamilyCaseKit.figure(performance, who.man)],
      boxes,
      verdicts: [
        ...everydayVerdicts.standard(performance, "a", who.body),
        everydayVerdicts.within(
          "gripping hand on its rung",
          held.value,
          0.01,
          "mm",
        ),
        {
          name: "three limbs on the ladder at every frame",
          passed: fewest.value >= 3,
          detail: `${fewest.value} limbs at ${fewest.at.toFixed(2)} s`,
        },
      ],
    });
  }
  return out;
}

/**
 * A fixed ladder as a fixture prop: ten rungs `rung1` upward at 0.3 m (OSHA
 * 1910.23(b)(2)), 0.41 m wide and 30 mm round, its rungs 0.35 m ahead of the
 * origin along `+Z`, each facing the climber at `-Z` as `createLadder`'s do.
 *
 * @returns The ladder.
 */
function ladderProp(): IAutoMovieMotionHumanProp {
  // Each rung's frame turns +Y to -Z, toward the climber.
  const out: IAutoMovieQuaternion = {
    x: -Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const affordances: IAutoMovieAffordance[] = Array.from(
    { length: 10 },
    (_: unknown, i: number): IAutoMovieAffordance => ({
      id: `rung${i + 1}`,
      kind: "bar",
      frame: Transform.of({ x: 0, y: 0.3 * (i + 1), z: 0 }, out),
      extent: null,
      grip: "power",
      aperture: 0.03,
      length: 0.41,
    }),
  );
  return {
    subject: "ladder",
    frame: {
      position: { x: 0, y: 0, z: 0.35 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances,
    fixed: true,
  };
}
