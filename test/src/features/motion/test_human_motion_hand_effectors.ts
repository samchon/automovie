import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A touch meets its place with the part of the hand it names, and lands
 * where along a prop's contact it is told to (#3357: effectors, and sites
 * along an affordance).
 *
 * The average man stands 0.6 m from another, face to face, and from a rail
 * 0.6 m long that runs left to right at his chest height, 0.45 m ahead of
 * him.
 *
 * Scenarios, read at the middle of the touch's hold:
 * 1. `with: "handEdge"` on the partner's sternum: the hand's edge, the
 *    effector's own point, lies within 15 mm of the sternum (the campaign's
 *    contact bound), and the palm's centre lies further from it than the
 *    edge does.
 * 2. `with: "heel"`: the heel of the palm lies within 15 mm of the sternum,
 *    and nearer than the palm's centre.
 * 3. A palm on the rail's middle lies within 15 mm of it.
 * 4. With `site: { along: 0.4 }` the palm lies 0.24 m further along the rail
 *    than at its middle, within 15 mm.
 * 5. `site: { along: 0.6 }`, past the rail's end, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and reads the displayed effector point against the region or the rail; a named part that is ignored, a site that stays in the middle or a share past the end that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations The 15 mm is the campaign's contact bound (#3354); 0.24 m is 0.4 of the rail's own 0.6 m; neither is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two hand parts against the palm, and a rail's middle, a place along it and a place past its end.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds five short performances, each read at one instant; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 5 scenarios with their bounds.
 */
export function test_human_motion_hand_effectors(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const middle: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth,
    y: body.measure.chestHeight,
    z: 0.45,
  };
  const rail: IHumanProp = {
    subject: "rail",
    frame: { position: middle, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    points: {
      bar: { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: -1 } },
    },
    affordances: [
      {
        id: "bar",
        kind: "bar",
        frame: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        length: 0.6,
      },
    ],
  };

  /** One touch: the performance and the middle of its hold. */
  const perform = (
    params: touch.IParams,
  ): { performance: HumanPerformance; held: number } => {
    const performance: HumanPerformance = new HumanPerformance({
      seed: "effector",
      props: [rail],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: 0.6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .touch(params)
        .with(HumanChain.subject("b").stand({ seconds: 4 })).node,
    });
    const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        placed.plan.duration;
    return {
      performance,
      held: (instant("strokeEnd") + instant("relax")) / 2,
    };
  };
  const part = (
    read: { performance: HumanPerformance; held: number },
    name: touch.With,
  ): IAutoMovieVector3 =>
    AutoMovieMotionHumanTouchEffector.point(
      body,
      read.performance.bones("a", read.held),
      "right",
      touch.EFFECTORS[name],
    );

  // 1, 2. The named part of the hand on the sternum.
  for (const name of ["handEdge", "heel"] as const)
    try {
      const read: { performance: HumanPerformance; held: number } = perform({
        target: { kind: "person", subject: "b", region: "sternum" },
        with: name,
        kind: "hold",
        hold: 0.6,
      });
      const sternum: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(read.performance, "b", body, 0),
        "sternum",
        read.held,
      );
      const off: number = gap(part(read, name), sternum);
      const palm: number = gap(part(read, "palm"), sternum);
      if (!(off <= 0.015))
        complaints.push(
          `${name}: it lies ${mm(off)} mm from the sternum, within 15 mm expected`,
        );
      if (!(palm > off))
        complaints.push(
          `${name}: the palm's centre lies ${mm(palm)} mm from the sternum and the ${name} ${mm(off)} mm, the ${name} nearer expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

  // 3, 4. A place along the rail.
  try {
    const onRail = (along?: number): IAutoMovieVector3 =>
      part(
        perform({
          target: { kind: "prop", subject: "rail", point: "bar" },
          kind: "hold",
          hold: 0.6,
          ...(along === undefined ? {} : { site: { along } }),
        }),
        "palm",
      );
    const centre: IAutoMovieVector3 = onRail();
    if (!(gap(centre, middle) <= 0.015))
      complaints.push(
        `the rail's middle: the palm lies ${mm(gap(centre, middle))} mm from it, within 15 mm expected`,
      );
    const moved: number = onRail(0.4).x - centre.x;
    if (!(Math.abs(moved - 0.24) <= 0.015))
      complaints.push(
        `0.4 along the rail: the palm lies ${mm(moved)} mm along it from the middle, 240 mm within 15 mm expected`,
      );
  } catch (error) {
    complaints.push(
      `a place along the rail: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 5. Past the rail's end.
  let refused: string = "planned";
  try {
    perform({
      target: { kind: "prop", subject: "rail", point: "bar" },
      kind: "hold",
      site: { along: 0.6 },
    });
  } catch (error) {
    refused =
      error instanceof HumanRefusal
        ? "refused"
        : error instanceof Error
          ? error.message
          : String(error);
  }
  if (refused !== "refused")
    complaints.push(
      `0.6 along the rail, past its end: ${refused}, a HumanRefusal expected`,
    );
  TestValidator.equals("a touch's hand part and its place", complaints, []);
}
