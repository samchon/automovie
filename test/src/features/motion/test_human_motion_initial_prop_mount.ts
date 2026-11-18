import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStand,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose, vclose } from "../internal/predicates";

/**
 * An initial mount carries a tray on a display cart until an authored hand grip.
 *
 * Scenarios:
 * 1. A tray and nested tag read their explicit socket offsets on a translating and turning cart.
 * 2. A grip preserves the transfer pose and subsequent cart travel leaves the tray and tag in the hand.
 * 3. Missing props and sockets, cycles, competing authorities and invalid offsets refuse construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the moving support, nested child, grip and admission cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public performance constructor and prop reader, sampling before, at and after the grip, plus malformed mount inputs.
 * @evidence contracts/development/testing.md#independent-expectations The sockets add one metre in local X each, with an authored two-metre tray offset and one-metre tag offset. A half-turn changes the sign of each X displacement. The resulting Y half-turn and X quarter-turn have quaternion components (0, √½, -√½, 0). A zero-sway standing hand and the parked support keep the transfer's pose constant while the cart later translates away.
 * @evidence contracts/development/testing.md#distinguishing-cases The nested tag and final cart move discriminate a moving mount from a fixed frame and from an attachment that persists after the hand takes over. Refusals cover missing references, invalid numeric values, authority and both self and indirect cycles.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous spec uses an authored stand hold and pure world-frame queries.
 */
export function test_human_motion_initial_prop_mount(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const halfTurn: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };
  const quarterTurn: IAutoMovieQuaternion = {
    x: Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const turnedTray: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: -Math.SQRT1_2,
    w: 0,
  };
  const socket: IAutoMovieAffordance = {
    id: "dock",
    kind: "socket",
    frame: {
      translation: { x: 1, y: 0, z: 0 },
      rotation: identity,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  };
  const travel = (t: number): IAutoMovieRigidTransform => ({
    position: { x: t < 0.5 ? 3 : t <= 1 ? 4 : 8, y: 1, z: 0 },
    rotation: t < 0.5 ? identity : halfTurn,
  });
  const cart: IAutoMovieMotionHumanProp = {
    subject: "cart",
    frame: { position: zero, rotation: identity },
    points: {},
    affordances: [socket],
    motion: travel,
  };
  const mounted: IAutoMovieMotionHumanProp.IMounted = {
    prop: "cart",
    point: "dock",
    offset: { position: { x: 2, y: 1, z: 0 }, rotation: quarterTurn },
  };
  const tray: IAutoMovieMotionHumanProp = {
    subject: "tray",
    frame: { position: zero, rotation: identity },
    points: {},
    affordances: [socket],
    mounted,
  };
  const tag: IAutoMovieMotionHumanProp = {
    subject: "tag",
    frame: tray.frame,
    points: {},
    mounted: {
      ...mounted,
      prop: "tray",
      offset: { position: { x: 1, y: 0, z: 0 }, rotation: identity },
    },
  };
  const take: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...stand,
      name: "takeTray",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...stand.plan(context),
        holds: [{ side: "right", prop: "tray", from: 0.5 }],
      }),
    };
  const create = (props: IAutoMovieMotionHumanProp[]): HumanPerformance =>
    new HumanPerformance({
      seed: "initial-mount",
      props,
      laws: [take],
      performers: [
        {
          subject: "stagehand",
          body: motionHumanBody("m-average"),
          at: zero,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("stagehand").registered("takeTray", {
        seconds: 1.5,
        sway: 0,
      }).node,
    });

  const performance: HumanPerformance = create([tag, tray, cart]);
  for (const [subject, seconds, x, rotation] of [
    ["tray", 0, 6, quarterTurn],
    ["tag", 0, 8, quarterTurn],
    ["tray", 0.6, 1, turnedTray],
    ["tag", 0.6, -1, turnedTray],
    ["tray", 0.75, 1, turnedTray],
    ["tray", 0.7501, 1, turnedTray],
    ["tray", 1.25, 1, turnedTray],
    ["tag", 1.25, -1, turnedTray],
  ] as const) {
    const frame: IAutoMovieRigidTransform = performance.prop(subject, seconds);
    TestValidator.predicate(
      `${subject} reads its authored world frame at ${seconds} seconds`,
      vclose(frame.position, { x, y: 2, z: 0 }, 1e-6) &&
        qclose(frame.rotation, rotation),
    );
  }
  TestValidator.predicate(
    "the cart moved after the hand closed",
    vclose(performance.prop("cart", 1.25).position, { x: 8, y: 1, z: 0 }),
  );

  const restCart: IAutoMovieMotionHumanProp = {
    subject: "cart",
    frame: cart.frame,
    points: {},
    affordances: [socket],
  };
  const refuses = (
    props: IAutoMovieMotionHumanProp[],
    axis: string,
  ): boolean => {
    try {
      create(props);
      return false;
    } catch (error) {
      return error instanceof HumanRefusal && error.axis.endsWith(axis);
    }
  };
  TestValidator.predicate(
    "unknown carrier refuses",
    refuses([tray], ".mounted.prop"),
  );
  TestValidator.predicate(
    "unknown socket refuses",
    refuses(
      [{ ...tray, mounted: { ...mounted, point: "missing" } }, cart],
      ".mounted.point",
    ),
  );
  TestValidator.predicate(
    "a self mount refuses",
    refuses([{ ...tray, mounted: { ...mounted, prop: "tray" } }], ".mounted"),
  );
  TestValidator.predicate(
    "a cycle refuses",
    refuses(
      [tray, { ...restCart, mounted: { ...mounted, prop: "tray" } }],
      ".mounted",
    ),
  );
  for (const conflict of [
    { ...tray, fixed: true },
    { ...tray, motion: travel },
    {
      ...tray,
      worn: { subject: "stagehand", bone: "hips" as const, offset: tray.frame },
    },
  ])
    TestValidator.predicate(
      "competing placement refuses",
      refuses([conflict, cart], ".mounted"),
    );
  TestValidator.predicate(
    "a nonunit mount rotation refuses",
    refuses(
      [
        {
          ...tray,
          mounted: {
            ...mounted,
            offset: { position: zero, rotation: { ...identity, w: 2 } },
          },
        },
        cart,
      ],
      ".mounted.offset",
    ),
  );
}
