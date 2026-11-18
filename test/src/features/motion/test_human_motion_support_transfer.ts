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
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * A real sole transfers from one prop frame to another across a dock gap.
 *
 * Scenarios:
 * 1. The average man leads left and the small woman leads right. Both start
 *    with two platform plants, pass through split support and end with two
 *    deck plants. The rear sole stays on the platform during split support,
 *    and the pelvis moves less than 2 mm across each contact boundary.
 * 2. The deck translates and yaws after boarding. Both soles stay within 10 mm
 *    of their deck-local landed positions.
 * 3. The missing surface, moving deck, wide gap and off-deck station each identify their failed axis.
 * 4. Through shared translation and yaw, split soles stay within 10 mm of their local stations and the pelvis within 1 mm of its moved position. Both soles ride the departing deck.
 * 5. The default refuses shared motion. Co-moving docking refuses independent drift, including yaw about a distant prop origin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the differing bodies, independently authored prop tracks and measurable acceptance bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planned contacts and resolves the displayed limb pose, checking actual sole positions against scene frames.
 * @evidence contracts/development/testing.md#independent-expectations The fixtures independently prescribe frame motion. Stationary docking supplies the reference pose for translating the same crossing by the known frame motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Both bodies and lead sides pass through split and moving support. One body checks invalid surface, gap, landing, and the distinction between absolute and relative docking.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this in-memory unit using public planning and pose resolution with authored prop readers.
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
      contacts: IAutoMovieMotionHumanContactWindow[] = plan.contacts,
    ): string | undefined => {
      const bearing: IAutoMovieMotionHumanContactWindow.Support | undefined =
        contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.kind === "plant" &&
            c.part === `${side}Foot` &&
            c.from <= share &&
            share <= c.to,
        )?.support;
      return bearing?.kind === "prop" ? bearing.subject : undefined;
    };
    /** Resolve the shared posture before reading individual sole sockets. */
    const displayed = (
      time: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, resolveHumanPosture(body, plan.posture(time)));
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
    const split: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      displayed(1);
    const initialTrail: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      displayed(0),
      trail,
    );
    TestValidator.predicate(
      `${name} rear sole stays on the platform at split support`,
      HumanFoot.sockets(body, split, trail).every(
        (socket: IAutoMovieMotionHumanFoot.ISocket, index: number): boolean =>
          vclose(socket.point, initialTrail[index]!.point, 0.01),
      ),
    );
    const front: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      split,
      lead,
    );
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
    const docked: IAutoMovieRigidTransform = deck.frame(start + 1.69);
    const moving: IAutoMovieRigidTransform = deck.frame(start + 1.98);
    const landed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      displayed(1.69);
    const carried: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      displayed(1.98);
    /** Compare points in the deck frame, which translates and yaws. */
    const local = (
      p: IAutoMovieVector3,
      frame: IAutoMovieRigidTransform,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(p, frame.position),
      );
    for (const side of [lead, trail]) {
      const dockedSole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        landed,
        side,
      );
      TestValidator.predicate(
        `${name} ${side} sole follows deck translation and yaw`,
        HumanFoot.sockets(body, carried, side).every(
          (socket: IAutoMovieMotionHumanFoot.ISocket, index: number): boolean =>
            vclose(
              local(socket.point, moving),
              local(dockedSole[index]!.point, docked),
              0.01,
            ),
        ),
      );
    }

    if (name !== "m-average") continue;

    /** Check the failed admission axis using the admitted dock fixture. */
    const reject = (
      changes: Partial<Parameters<typeof supportTransfer>[0]>,
      axis: string,
      scenario: string = axis,
    ): void => {
      try {
        supportTransfer({ ...context, ...changes });
      } catch (error) {
        TestValidator.predicate(
          `${name} refuses ${scenario} on ${axis}`,
          error instanceof HumanRefusal && error.axis === axis,
        );
        return;
      }
      TestValidator.predicate(`${name} refuses ${scenario} on ${axis}`, false);
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

    /** Shared X travel in metres at 0.4 m/s from the start of the crossing. */
    const translate = (t: number): number => 0.4 * (t - start);
    /** An independent departure that begins after both soles are aboard. */
    const depart = (t: number): number => Math.max(0, t - (start + 1.7));
    const gangway: IAutoMovieMotionHumanPropReader = surface(
      "platform",
      oldEdge - 0.5,
      0,
      translate,
      () => 0,
    );
    const movingDeck: IAutoMovieMotionHumanPropReader = surface(
      "car",
      newEdge + 0.5,
      0,
      (t: number): number => translate(t) + depart(t),
      depart,
    );
    const movingProps = (id: string): IAutoMovieMotionHumanPropReader =>
      id === "platform" ? gangway : movingDeck;
    reject({ prop: movingProps }, "from", "shared motion in stationary mode");

    const movingParams: Parameters<typeof supportTransfer>[0]["params"] = {
      ...context.params,
      docking: "co-moving",
    };
    const crossing: ReturnType<typeof supportTransfer> = supportTransfer({
      ...context,
      prop: movingProps,
      params: movingParams,
    });
    const movingSplitBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture(body, crossing.posture(1)));
    TestValidator.predicate(
      "The moving split declares each foot on its own support",
      support(lead, 0.5, crossing.contacts) === "car" &&
        support(trail, 0.5, crossing.contacts) === "platform",
    );
    TestValidator.predicate(
      "The pelvis follows the shared 0.4 m translation during split support",
      vclose(
        movingSplitBones.get("hips")!.worldPosition,
        Vector3.add(split.get("hips")!.worldPosition, { x: 0.4, y: 0, z: 0 }),
        0.001,
      ),
    );
    /** Read both moving support plants in their own frames. */
    const checkSole = (
      side: "left" | "right",
      bearing: IAutoMovieMotionHumanPropReader,
      time: number,
      actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      reference: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): void => {
      const expected: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        reference,
        side,
      );
      TestValidator.predicate(
        `${side} sole rides ${bearing.prop.subject} at ${time} seconds`,
        HumanFoot.sockets(body, actual, side).every(
          (socket: IAutoMovieMotionHumanFoot.ISocket, index: number): boolean =>
            vclose(
              local(socket.point, bearing.frame(start + time)),
              local(expected[index]!.point, bearing.frame(start)),
              0.01,
            ),
        ),
      );
    };
    const movingLandedBones: Map<
      AutoMovieHumanoidBone,
      IAutoMovieResolvedBone
    > = poseBones(body, resolveHumanPosture(body, crossing.posture(1.98)));
    checkSole(lead, movingDeck, 1, movingSplitBones, split);
    checkSole(trail, gangway, 1, movingSplitBones, split);
    checkSole(lead, movingDeck, 1.98, movingLandedBones, landed);
    checkSole(trail, movingDeck, 1.98, movingLandedBones, landed);

    /** Rotate the moving props together by 15 degrees per second. */
    const turningProp = (id: string): IAutoMovieMotionHumanPropReader => {
      const reader: IAutoMovieMotionHumanPropReader = movingProps(id);
      return {
        ...reader,
        frame: (t: number): IAutoMovieRigidTransform => {
          const at: IAutoMovieRigidTransform = reader.frame(t);
          const turn: IAutoMovieRigidTransform["rotation"] =
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 15 * (t - start));
          return {
            position: Quaternion.rotateVector(turn, at.position),
            rotation: Quaternion.multiply(turn, at.rotation),
          };
        },
      };
    };
    const turning: ReturnType<typeof supportTransfer> = supportTransfer({
      ...context,
      params: movingParams,
      prop: turningProp,
    });
    const turningSplit: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture(body, turning.posture(1)));
    TestValidator.predicate(
      "The displayed pelvis follows the shared 15 degree yaw",
      qclose(
        turningSplit.get("hips")!.worldRotation,
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 15),
          split.get("hips")!.worldRotation,
        ),
      ),
    );
    checkSole(lead, turningProp("car"), 1, turningSplit, split);
    checkSole(trail, turningProp("platform"), 1, turningSplit, split);
    reject(
      {
        params: movingParams,
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? gangway
            : surface(
                "car",
                newEdge + 0.5,
                0,
                (t: number): number => 1.1 * translate(t),
                () => 0,
              ),
      },
      "to",
      "independent deck drift in co-moving mode",
    );
    // The prop origin stays fixed and the yaw stays below 0.1 degrees,
    // but the 100 m offset moves the rectangle by centimetres.
    reject(
      {
        params: movingParams,
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? platform
            : surface(
                "car",
                newEdge + 0.5,
                0,
                () => -100,
                (t: number): number => (0.05 * (t - start)) / seconds,
                100,
              ),
      },
      "to",
      "deck yaw about a distant prop origin",
    );
    const movingDeckOnly = (id: string): IAutoMovieMotionHumanPropReader =>
      id === "platform" ? platform : movingDeck;
    reject({ prop: movingDeckOnly }, "to");
  }
}

/** Create a horizontal metre-deep fixture with X travel and offset in metres and yaw in degrees. */
function surface(
  subject: string,
  z: number,
  y: number,
  travel: (time: number) => number,
  yaw: (time: number) => number = (time: number): number => 10 * travel(time),
  offsetX: number = 0,
): IAutoMovieMotionHumanPropReader {
  const frame = (time: number): IAutoMovieRigidTransform => ({
    position: { x: travel(time), y, z },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw(time)),
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
            translation: { x: offsetX, y: 0, z: 0 },
            rotation: Quaternion.identity(),
            scale: { x: 1, y: 1, z: 1 },
          },
        },
      ],
    },
  };
}
