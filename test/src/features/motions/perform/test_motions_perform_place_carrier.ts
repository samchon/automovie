import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanPerformancePlaceCarrier
} from "../../../../../packages/motions/src/perform/internal/HumanPerformancePlaceCarrier";
import { TestValidator } from "@nestia/e2e";

/** One call the carrier passed to the carrying plan. */
interface ICall {
  seconds: number;
  args: readonly unknown[];
}

/**
 * `HumanPerformancePlaceCarrier` is the carrier an overlay rides: the action
 * carrying the body at the overlay's start, read at the carrier's own second
 * for an overlay second, `start + s − previous.start` held within the plan's
 * duration, every call passed straight to the plan with the caller's channels,
 * resolution and projection, nothing kept between calls; its support is the
 * carrier's first plant on something other than the ground.
 *
 * A carrying action from 2 s lasting 3 s, planted on the floor and on a box; an
 * overlay starting at 3.5 s.
 *
 * Scenarios:
 *
 * 1. The carrier is named for the carrying action and rides the box.
 * 2. Overlay seconds 0.5, −5 and 5 read the plan at 2, 0 and 3 s.
 * 3. Two reads of the same second each reach the plan with their own arguments:
 *    the channels the caller passed, or none.
 * 4. A carrying action planted on the ground alone gives no support.
 */
export function test_motions_perform_place_carrier(): void {
  const calls: ICall[] = [];
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
    ...args: readonly unknown[]
  ): IAutoMovieMotionHumanPosture => {
    calls.push({ seconds, args });
    return {
      root: { x: seconds, y: 0.9, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
  };
  const previous: HumanPerformancePlaceCarrier.IPrevious = {
    name: "walk",
    start: 2,
    plan: {
      duration: 3,
      posture,
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "box" },
        },
      ],
    },
  };
  const carrier: ReturnType<typeof HumanPerformancePlaceCarrier> =
    HumanPerformancePlaceCarrier(previous, 3.5);

  // 1. Name and support.
  TestValidator.equals(
    "the carrying action and its support",
    [carrier.name, carrier.support],
    ["walk", { kind: "prop", subject: "box" }],
  );

  // 2. The carrier's own second.
  TestValidator.equals(
    "the overlay's second on the carrier's clock, held within it",
    [0.5, -5, 5].map((s: number): number => carrier.posture(s).root.x),
    [2, 0, 3],
  );

  // 3. Every call passed on.
  calls.splice(0);
  const channels: ["head"] = ["head"];
  carrier.posture(0.5, channels);
  carrier.posture(0.5);
  TestValidator.predicate(
    "each read reaches the plan with its own arguments",
    calls.length === 2 &&
      calls[0]!.args[0] === channels &&
      calls[1]!.args[0] === undefined,
  );

  // 4. The ground alone.
  TestValidator.predicate(
    "no support on the ground alone",
    HumanPerformancePlaceCarrier(
      {
        ...previous,
        plan: { ...previous.plan, contacts: [previous.plan.contacts[0]!] },
      },
      3.5,
    ).support === undefined,
  );
}
