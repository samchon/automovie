import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  HumanRefusal,
  poseBones,
  resolveHumanPosture,
  stand,
  supportTransfer,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * A real sole transfers from one prop frame to another across a dock gap.
 *
 * Scenarios:
 * 1. The average man leads left and the small woman leads right. Both start
 *    with two platform plants, pass through split support and end with two
 *    deck plants. The rear sole stays on the platform during split support,
 *    and the pelvis moves less than 2 mm across each contact boundary.
 * 2. The deck translates and yaws after boarding. Both displayed sets of
 *    sole sockets stay within 10 mm of their deck-local landed positions.
 * 3. A missing surface, premature deck motion, a gap over 0.13 m and an
 *    off-deck landing station each cause a refusal naming the failed axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the differing bodies, independently authored prop tracks and measurable acceptance bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planned contacts and resolves the displayed limb pose, checking actual sole positions against scene frames.
 * @evidence contracts/development/testing.md#independent-expectations The synthetic platform and deck rectangles, the late deck twist and the 10 mm sole bound are specified independently of the transfer planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Varies the lead foot and body, tests an intermediate split frame and a moving final frame, and supplies distinct inadmissible requests.
 * @evidence contracts/development/testing.md#execution-ownership Plans both motions in memory and resolves sampled frames without capture or external state.
 */
export function test_human_motion_support_transfer(): void {
  const start: number = 5;
  const seconds: number = 2;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const lead: "left" | "right" = name === "m-average" ? "left" : "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const initial: IAutoMovieMotionHumanPosture = stand.posture(body, zero, 0);
    const pose: IAutoMovieMotionHumanEntryState["pose"] = resolveHumanPosture(
      body,
      initial,
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const foot = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanEntryState.IFoot => {
      const bone: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      return {
        ankle: bone.worldPosition,
        rotation: bone.worldRotation,
        planted: true,
        velocity: zero,
        acceleration: zero,
        spin: zero,
      };
    };
    const entry: IAutoMovieMotionHumanEntryState = {
      seconds: start,
      pose,
      posture: initial,
      velocity: {
        joints: new Map(),
        spins: new Map(),
        linear: zero,
        angular: zero,
      },
      acceleration: zero,
      feet: { left: foot("left"), right: foot("right") },
      supports: [
        {
          part: "leftFoot",
          kind: "plant",
          support: { kind: "prop", subject: "platform" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          support: { kind: "prop", subject: "platform" },
        },
      ],
      base: { kind: "standing" },
      holds: {},
    };
    const soles: IAutoMovieMotionHumanFoot.ISocket[] = [
      ...HumanFoot.sockets(body, bones, "left"),
      ...HumanFoot.sockets(body, bones, "right"),
    ];
    const oldEdge: number =
      Math.max(
        ...soles.map(
          (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.z,
        ),
      ) + 0.01;
    const newEdge: number = oldEdge + 0.055;
    const station: number =
      newEdge -
      Math.min(
        0,
        ...soles.map(
          (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.z,
        ),
      ) +
      0.024;

    const platform: IAutoMovieMotionHumanPropReader = surface(
      "platform",
      oldEdge - 0.5,
      0,
      () => 0,
    );
    const deck: IAutoMovieMotionHumanPropReader = surface(
      "car",
      newEdge + 0.5,
      0,
      (t: number): number => 9 * Math.max(0, t - (start + 1.7)) ** 2,
    );
    const context: Parameters<typeof supportTransfer>[0] = {
      body,
      entry,
      start,
      prop: (id: string): IAutoMovieMotionHumanPropReader =>
        id === "platform" ? platform : deck,
      params: {
        from: { prop: "platform", surface: "floor" },
        to: { prop: "car", surface: "floor" },
        landing: { x: 0, z: station - (newEdge + 0.5) },
        lead,
        seconds,
      },
    };
    const plan: ReturnType<typeof supportTransfer> = supportTransfer(context);
    const support = (
      side: "left" | "right",
      share: number,
    ): string | undefined => {
      const bearing: IAutoMovieMotionHumanContactWindow.Support | undefined =
        plan.contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.kind === "plant" &&
            c.part === `${side}Foot` &&
            c.from <= share &&
            share <= c.to,
        )?.support;
      return bearing?.kind === "prop" ? bearing.subject : undefined;
    };
    const displayed = (
      side: "left" | "right",
      time: number,
    ): IAutoMovieMotionHumanFoot.ISocket[] =>
      HumanFoot.sockets(
        body,
        poseBones(body, resolveHumanPosture(body, plan.posture(time))),
        side,
      );
    TestValidator.predicate(
      `${name} transfers one bearing foot at a time`,
      plan.duration === seconds &&
        support(lead, 0.1) === "platform" &&
        support(trail, 0.1) === "platform" &&
        support(lead, 0.3) === undefined &&
        support(trail, 0.3) === "platform" &&
        support(lead, 0.5) === "car" &&
        support(trail, 0.5) === "platform" &&
        support(lead, 0.7) === "car" &&
        support(trail, 0.7) === undefined &&
        support(lead, 0.9) === "car" &&
        support(trail, 0.9) === "car",
    );
    for (const event of plan.events) {
      const boundary: number = seconds * event.share;
      const before: IAutoMovieVector3 = plan.posture(boundary - 0.0001).root;
      const after: IAutoMovieVector3 = plan.posture(boundary + 0.0001).root;
      TestValidator.predicate(
        `${name} pelvis stays continuous at ${event.name}`,
        vclose(before, after, 0.002),
      );
    }
    const byTime: IAutoMovieMotionHumanFoot.ISocket[] = displayed(trail, 0);
    const split: IAutoMovieMotionHumanFoot.ISocket[] = displayed(trail, 1);
    TestValidator.predicate(
      `${name} rear sole stays on the platform at split support`,
      split.every(
        (socket: IAutoMovieMotionHumanFoot.ISocket, index: number): boolean =>
          vclose(socket.point, byTime[index]!.point, 0.01),
      ),
    );
    const front: IAutoMovieMotionHumanFoot.ISocket[] = displayed(lead, 1);
    TestValidator.predicate(
      `${name} leading sole is already beyond the deck's near edge`,
      front.every(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.point.z > newEdge - 0.01,
      ) &&
        Math.abs(
          Math.min(
            ...front.map(
              (socket: IAutoMovieMotionHumanFoot.ISocket): number =>
                socket.point.y,
            ),
          ),
        ) < 0.01,
    );
    for (const side of [lead, trail]) {
      const docked: IAutoMovieRigidTransform = deck.frame(start + 1.69);
      const moving: IAutoMovieRigidTransform = deck.frame(start + 1.98);
      const local = (
        p: IAutoMovieVector3,
        frame: IAutoMovieRigidTransform,
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.inverse(frame.rotation),
          Vector3.subtract(p, frame.position),
        );
      const landed: IAutoMovieMotionHumanFoot.ISocket[] = displayed(side, 1.69);
      const carried: IAutoMovieMotionHumanFoot.ISocket[] = displayed(
        side,
        1.98,
      );
      TestValidator.predicate(
        `${name} ${side} sole follows deck translation and yaw`,
        carried.every(
          (socket: IAutoMovieMotionHumanFoot.ISocket, index: number): boolean =>
            vclose(
              local(socket.point, moving),
              local(landed[index]!.point, docked),
              0.01,
            ),
        ),
      );
    }

    const reject = (
      changes: Partial<Parameters<typeof supportTransfer>[0]>,
      axis: string,
    ): void => {
      try {
        supportTransfer({ ...context, ...changes });
      } catch (error) {
        TestValidator.predicate(
          `${name} refuses ${axis}`,
          error instanceof HumanRefusal && error.axis === axis,
        );
        return;
      }
      TestValidator.predicate(`${name} refuses ${axis}`, false);
    };
    reject(
      {
        params: {
          ...context.params,
          from: { prop: "platform", surface: "missing" },
        },
      },
      "from",
    );
    reject(
      { params: { ...context.params, landing: { x: 2, z: 0 } } },
      "landing",
    );
    reject(
      {
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? platform
            : surface("car", newEdge + 0.7, 0, () => 0),
      },
      "to",
    );
    reject(
      {
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? platform
            : surface("car", newEdge + 0.5, 0, (t: number): number =>
                Math.max(0, t - start),
              ),
      },
      "to",
    );
  }
}

/** Create a horizontal metre-deep fixture whose yaw and X travel share the same authored clock. */
function surface(
  subject: string,
  z: number,
  y: number,
  travel: (time: number) => number,
): IAutoMovieMotionHumanPropReader {
  const frame = (time: number): IAutoMovieRigidTransform => ({
    position: { x: travel(time), y, z },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 10 * travel(time)),
  });
  return {
    frame,
    prop: {
      subject,
      frame: frame(0),
      points: {},
      affordances: [
        {
          id: "floor",
          kind: "surface",
          width: 2,
          depth: 1,
          extent: null,
          frame: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: Quaternion.identity(),
            scale: { x: 1, y: 1, z: 1 },
          },
        },
      ],
    },
  };
}
