import { Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanKickBall,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { HumanFoot } from "../../posture/HumanFoot";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the ball-strike family: `ball-kick`, a standing instep kick
 * of a 0.11 m ball lying before the right foot, 0.15 m ahead of the toes.
 *
 * It reports the support foot's slip at most 5 mm and no range-of-motion
 * overshoot; at `stroke` the kicking foot's toes' joint (the instep's middle)
 * within 15 mm of the ball's surface (the issue's foot-within-15-mm bound); and
 * no sole socket of the kicking foot below the floor by more than 10 mm at any
 * frame.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 */
export function ballStrikeCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const radius: number = 0.11;
    const foot: IAutoMovieVector3 = who.body.rest.get("rightFoot")!;
    const toe: number = foot.z + HumanFoot.offset(who.body, "right", "toe").z;
    const centre: IAutoMovieVector3 = {
      x: foot.x,
      y: radius,
      z: toe + 0.15 + radius,
    };
    const params: IAutoMovieMotionHumanKickBall.IParams = { ball: "ball" };
    const performance: IAutoMovieMotionHumanPerformance = FamilyCaseKit.perform(
      "ball",
      [{ subject: "a", body: who.body }],
      HumanChain.subject("a").act("kickBall", params),
      [ball(centre, radius)],
    );
    const contact: number = FamilyCaseKit.event(performance, "stroke");
    const instep: IAutoMovieVector3 = performance
      .bones("a", contact)
      .get("rightToes")!.worldPosition;
    let under: number = Infinity;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
      for (const s of HumanFoot.sockets(
        who.body,
        performance.bones("a", t),
        "right",
      ))
        under = Math.min(under, s.point.y);
    out.push({
      name: `ball-kick${suffix}`,
      times: FamilyCaseKit.times(performance, 0.1, [[contact, "contact"]]),
      performers: [FamilyCaseKit.figure(performance, who.man)],
      targets: [{ at: centre, radius, color: 0xe0e0e0 }],
      verdicts: [
        ...everydayVerdicts.standard(performance, "a", who.body),
        everydayVerdicts.within(
          "instep on the ball at contact",
          Math.abs(Vector3.length(Vector3.subtract(instep, centre)) - radius),
          0.015,
          "mm",
        ),
        everydayVerdicts.within(
          "kicking foot below the floor",
          Math.max(0, -under),
          0.01,
          "mm",
        ),
      ],
    });
  }
  return out;
}

/**
 * A ball as a prop: its `grip` at its centre with its diameter as the aperture,
 * the contact `createBall` declares.
 *
 * @param centre The ball's centre, world metres.
 * @param radius Its radius, metres.
 * @returns The ball.
 */
function ball(
  centre: IAutoMovieVector3,
  radius: number,
): IAutoMovieMotionHumanProp {
  return {
    subject: "ball",
    frame: { position: centre, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    points: {},
    affordances: [
      {
        id: "grip",
        kind: "handle",
        frame: Transform.identity(),
        extent: null,
        grip: "power",
        aperture: 2 * radius,
      },
    ],
  };
}
