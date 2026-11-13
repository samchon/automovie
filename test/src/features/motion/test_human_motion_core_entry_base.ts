import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBase,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every action is entered knowing what carries the body and what the hands
 * hold: the base declared by the last action that changed it is passed on
 * through every action that keeps it, with the seat that was sat on, and a
 * held prop is named for its hand until it is put down.
 *
 * The reading is a registered law that keeps the posture it is entered in
 * and records the entry state it was given. A second registered law stands
 * for an action that changes the base: it declares a seated base with its
 * seat and the seat's contact, as a mount onto a saddle does, without
 * moving the body.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Entered first, an action is on a standing base with both hands empty.
 * 2. After sitting down on a chair, an action is on a seated base.
 * 3. After an action that declares a seated base with an astride seat, the
 *    next action is given that seat: its place within a nanometre, its
 *    heading and `astride`.
 * 4. The seat passes through an action that declares no base: the action
 *    after it is still given the same seat.
 * 5. After an action that declares a standing base, the next action is on a
 *    standing base and is given no seat.
 * 6. After picking a glass up with the right hand, the next action is told
 *    the right hand holds the glass and the left holds nothing; after
 *    putting it down, neither hand holds anything.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each chain and reads the entry state a registered law was planned from; a base lost at an action that keeps it, a seat not passed on, a seat on a standing base or a hold not reported fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expected base is what the chain's own actions say they do (sit, declare a seat, declare standing), and the seat compared is the one the test declared; none is read back from the performance.
 * @evidence contracts/development/testing.md#distinguishing-cases A first action, a shipped base transition, a declared base, a base kept through an action that declares none, a base replaced, and a hold taken and released; the supports of a seated act are `test_human_motion_base_supports`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how it is read and the 6 scenarios.
 */
export function test_human_motion_core_entry_base(): void {
  const complaints: string[] = [];

  // Keeps the entry posture on the entry's supports for half a second.
  const held = (
    context: IHumanActionContext<object>,
    base?: HumanBase,
  ): IHumanActionPlan => ({
    duration: 0.5,
    events: [],
    contacts: [
      // The supports of the entry, kept unless the action stands the body.
      ...context.entry.supports
        .filter(
          (support: IHumanEntryState.ISupport): boolean =>
            base?.kind !== "standing" || support.kind !== "seat",
        )
        .map(
          (
            support: IHumanEntryState.ISupport,
          ): IHumanActionPlan["contacts"][number] => ({
            ...support,
            from: 0,
            to: 1,
          }),
        ),

      // An action that seats the body declares the seat's contact, as a
      // sitting action does: it is what later actions keep.
      ...(base?.kind === "seated"
        ? [
            {
              part: "seat" as const,
              kind: "seat" as const,
              from: 0,
              to: 1,
              support: { kind: "ground" as const },
            },
          ]
        : []),
    ],
    ...(base === undefined ? {} : { base }),
    posture: (): ReturnType<IHumanActionPlan["posture"]> =>
      context.entry.posture,
  });
  const saddle: HumanBase.ISeat = {
    at: { x: 0.4, y: 1.1, z: -0.2 },
    yaw: 35,
    astride: true,
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const seen: IHumanEntryState[] = [];

    // Where the glass stands: at waist height, a sixth of the stature
    // ahead, well within the arm's reach of both bodies.
    const table: IAutoMovieVector3 = {
      x: 0.15,
      y: 0.58 * body.measure.stature,
      z: 0.17 * body.measure.stature,
    };
    const laws: IHumanActionLaw<never>[] = [
      {
        name: "witness",
        interrupts: {},
        plan: (context: IHumanActionContext<never>): IHumanActionPlan => {
          seen.push(context.entry);
          return held(context);
        },
      },
      {
        name: "mounted",
        interrupts: {},
        plan: (context: IHumanActionContext<never>): IHumanActionPlan =>
          held(context, { kind: "seated", seat: saddle }),
      },
      {
        name: "dismounted",
        interrupts: {},
        plan: (context: IHumanActionContext<never>): IHumanActionPlan =>
          held(context, { kind: "standing" }),
      },
    ];
    const entries = (chain: HumanChain): IHumanEntryState[] => {
      seen.length = 0;
      new HumanPerformance({
        seed: "base",
        laws,
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
            at: table,
            yaw: 0,
          }),
        ],
        composition: chain.node,
      });
      return [...seen];
    };
    const start = (): HumanChain => HumanChain.subject("a");

    // 1 and 2. Standing first, seated after sitting down.
    const chair: seated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    const sat: IHumanEntryState[] = entries(
      start().registered("witness").sit({ seat: chair }).registered("witness"),
    );
    if (
      sat[0]?.base.kind !== "standing" ||
      Object.keys(sat[0]?.holds ?? { none: 1 }).length !== 0
    )
      complaints.push(
        `${name}: the first action is entered on a ${sat[0]?.base.kind} base holding ${JSON.stringify(sat[0]?.holds)}, standing with empty hands expected`,
      );
    if (sat[1]?.base.kind !== "seated")
      complaints.push(
        `${name}: after sitting down the next action is entered on a ${sat[1]?.base.kind} base, seated expected`,
      );

    // 3 to 5. A declared seat, passed on and then replaced.
    const ridden: IHumanEntryState[] = entries(
      start()
        .registered("mounted")
        .registered("witness")
        .registered("witness")
        .registered("dismounted")
        .registered("witness"),
    );
    for (const [index, label] of [
      [0, "after the action that declares the seat"],
      [1, "after an action that declares no base"],
    ] as const) {
      const base: HumanBase | undefined = ridden[index]?.base;
      const seat: HumanBase.ISeat | undefined =
        base?.kind === "seated" ? base.seat : undefined;
      if (
        seat === undefined ||
        Math.hypot(
          seat.at.x - saddle.at.x,
          seat.at.y - saddle.at.y,
          seat.at.z - saddle.at.z,
        ) > 1e-9 ||
        Math.abs(seat.yaw - saddle.yaw) > 1e-9 ||
        seat.astride !== true
      )
        complaints.push(
          `${name}: ${label} the entry's base is ${JSON.stringify(base)}, seated astride on the declared seat expected`,
        );
    }
    if (ridden[2]?.base.kind !== "standing" || "seat" in (ridden[2]?.base ?? {}))
      complaints.push(
        `${name}: after an action that declares a standing base the entry's base is ${JSON.stringify(ridden[2]?.base)}, standing with no seat expected`,
      );

    // 6. What the hands hold.
    let carried: IHumanEntryState[] = [];
    try {
      carried = entries(
        start()
          .pickUp({ prop: "glass", handle: "body", hand: "right" })
          .registered("witness")
          .putDown({ prop: "glass", at: table })
          .registered("witness"),
      );
    } catch (error) {
      complaints.push(
        `${name}: a glass picked up and put down: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    if (
      carried[0]?.holds.right !== "glass" ||
      carried[0]?.holds.left !== undefined
    )
      complaints.push(
        `${name}: after picking the glass up with the right hand the entry's holds are ${JSON.stringify(carried[0]?.holds)}, the glass in the right hand alone expected`,
      );
    if (Object.keys(carried[1]?.holds ?? { none: 1 }).length !== 0)
      complaints.push(
        `${name}: after putting the glass down the entry's holds are ${JSON.stringify(carried[1]?.holds)}, none expected`,
      );
  }
  TestValidator.equals(
    "an action is entered knowing its base and its holds",
    complaints,
    [],
  );
}
