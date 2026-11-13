import { createDoor } from "@automovie/archetypes";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  HumanTravelLeaf,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person opens a door by its handle and holds it: the hand takes the
 * handle and goes with it as the leaf swings, closed on it, while the feet
 * stay where they stood; a door swung beyond the arm's reach is refused.
 *
 * Scenarios, the average man and the small woman, each standing on the
 * pull side of a mid-band right-hinged door with a pull bar, a quarter of
 * a metre beside the bar's line toward the latch and 0.45 m from the
 * door, facing it; the scene swings the leaf 30 degrees open over two
 * seconds from half a second after the start (minimum-jerk), and the
 * person holds the pull for three seconds:
 * 1. The opening plans.
 * 2. Read four times a second from when the hand has arrived, the wrist is
 *    within 0.7 of the hand's length of the handle where the handle then
 *    is (the palm's middle lies about half a hand from the wrist; the share
 *    is provisional), and the middle finger's last joint is nearer the
 *    wrist than its knuckle is (the hand is closed).
 * 3. The balls of both feet move at most 5 mm over the hold (the
 *    campaign's slip bound).
 * 4. The same door swung 85 degrees, which carries the handle past the
 *    person's shoulder, is refused as a `reach` refusal on `handle`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real door archetype whose leaf the scene swings, performs the opening through the public chain and reads the displayed wrist, fingers and feet; a hand left where the handle was, an open hand, a body dragged by the door or an impossible swing accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the handle is at each instant comes from the archetype's own articulation, the 5 mm is the campaign's bound; neither is read from the law. Limitation: whether the person should step with a wide swing is not read.
 * @evidence contracts/development/testing.md#distinguishing-cases A swing within reach against one beyond it, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two openings and two refused plans in memory, reading about a dozen instants of each opening.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_door_leaf(): void {
  const complaints: string[] = [];
  const door: ReturnType<typeof createDoor> = createDoor({
    hinge: "right",
    hardware: "plate",
  });
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const where: HumanObject.Placement = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const bar: IAutoMovieVector3 = door.placed("pull", placement).translation;
  const OPEN: number = 0.5;
  const SWING: number = 2;
  const swung =
    (degrees: number): ((seconds: number) => number) =>
    (seconds: number): number => {
      const u: number = Math.min(1, Math.max(0, (seconds - OPEN) / SWING));
      return degrees * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
    };
  const perform = (
    body: IHumanBody,
    degrees: number,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "door",
      laws: [HumanTravelLeaf.openDoor],
      props: [
        HumanObject.prop(
          "door",
          door,
          where,
          undefined,
          (id: string, seconds: number): IAutoMovieTransform =>
            door
              .articulate({ hinge: swung(degrees)(seconds) })
              .placed(id as Parameters<typeof door.placed>[0], placement),
        ),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: bar.x + (bar.x > 0 ? 0.25 : -0.25), y: 0, z: 0.45 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered("openDoor", {
        door: "door",
        handle: "pull",
        seconds: 3,
      }).node,
    });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = perform(body, 30);
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      180,
    );
    const hold: HumanSegment.ISegment = performance.segments("a")[0]!;
    const span = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
        (s: HumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point;
    const first: Record<"left" | "right", IAutoMovieVector3> = {
      left: ball("left", hold.entryTime + 0.05),
      right: ball("right", hold.entryTime + 0.05),
    };
    let far: number = 0;
    let open: string | null = null;
    let slip: number = 0;
    for (const t of HumanSignature.times(
      hold.entryTime + HumanTravelLeaf.TAKE + 0.05,
      hold.end - 0.05,
      4,
    )) {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(reader, t);
      const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
      const handle: IAutoMovieVector3 = door
        .articulate({ hinge: swung(30)(t) })
        .placed("pull", placement).translation;
      far = Math.max(far, span(wrist, handle));
      if (
        span(bones.get("rightMiddleDistal")!.worldPosition, wrist) >=
        span(bones.get("rightMiddleProximal")!.worldPosition, wrist)
      )
        open = `${(span(bones.get("rightMiddleDistal")!.worldPosition, wrist) * 1000).toFixed(1)} mm from the wrist to the middle finger's last joint and ${(span(bones.get("rightMiddleProximal")!.worldPosition, wrist) * 1000).toFixed(1)} mm to its knuckle at ${t.toFixed(2)} s`;
      for (const side of ["left", "right"] as const)
        slip = Math.max(slip, span(ball(side, t), first[side]));
    }
    if (far > 0.7 * body.measure.hand)
      complaints.push(
        `${name}: the wrist is up to ${(far * 1000).toFixed(1)} mm from the handle as the door swings, within ${(700 * body.measure.hand).toFixed(1)} mm expected`,
      );
    if (open !== null)
      complaints.push(`${name}: the hand holding the door is open: ${open}`);
    if (slip > 0.005)
      complaints.push(
        `${name}: a sole moves ${(slip * 1000).toFixed(1)} mm while the door is held, within 5 mm expected`,
      );

    // 4. A swing beyond the arm.
    let thrown: unknown = null;
    try {
      perform(body, 85);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "handle"
      )
    )
      complaints.push(
        `${name}: a door swung 85 degrees, expected a reach refusal on handle, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("a door is opened and held", complaints, []);
}
