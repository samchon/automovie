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
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSupport,
} from "@automovie/motions";
import {
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { qclose } from "../../../features/internal/qclose";
import { supportTransferFixture } from "../../../features/internal/supportTransferFixture";
import { vclose } from "../../../features/internal/vclose";

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
 * 4. With shared travel and yaw, the pelvis follows the prop frame within 1 mm and each sole stays within 10 mm of its authored station. Both soles ride the departing deck.
 * 5. Pelvis velocity stays continuous at touchdown with bounded relative motion.
 * 6. Docking refuses invalid modes and frames, and relative drift including yaw with a fixed deck centre.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the differing bodies, independently authored prop tracks and measurable acceptance bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planned contacts and resolves the displayed limb pose, checking actual sole positions against scene frames.
 * @evidence contracts/development/testing.md#independent-expectations The fixture prescribes tracks and landed sole centres from the authored station and entry ankle spacing. The stationary result serves as a covariance reference for the pelvis and sole shapes under those tracks.
 * @evidence contracts/development/testing.md#distinguishing-cases Both bodies and lead sides pass through split and moving support. The average body exercises velocity continuity and docking refusals.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this in-memory unit using public planning and pose resolution with authored prop readers.
 */
export function test_motion_support_transfer(): void {
  const start: number = 5;
  const seconds: number = 2;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const lead: "left" | "right" = name === "m-average" ? "left" : "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const initial: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, zero, 0);
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
      uses: {},
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
    const stanceCenter: IAutoMovieVector3 = Vector3.lerp(
      entry.feet.left.ankle,
      entry.feet.right.ankle,
      0.5,
    );

    // The station is the centre of the landing sole sockets. Measure the
    // flat landing feet's rear extent from that centre in the deck frame.
    const rearmost: number = Math.min(
      ...(["left", "right"] as const).flatMap((side) => {
        const foot = entry.feet[side];
        const flat: IAutoMovieRigidTransform["rotation"] = HumanFoot.rotation(
          HumanFoot.heading(foot.rotation),
          0,
        );
        const sole: IAutoMovieVector3 = HumanFoot.offset(body, side, "sole");
        return HumanFoot.SOCKETS.map(
          (socket): number =>
            foot.ankle.z -
            stanceCenter.z +
            Quaternion.rotateVector(
              flat,
              Vector3.subtract(HumanFoot.offset(body, side, socket), sole),
            ).z,
        );
      }),
    );
    const station: number = newEdge - rearmost + 0.024;

    const platform: IAutoMovieMotionHumanPropReader =
      supportTransferFixture.surface("platform", oldEdge - 0.5, 0, () => 0);
    const deck: IAutoMovieMotionHumanPropReader =
      supportTransferFixture.surface(
        "car",
        newEdge + 0.5,
        0,
        (t: number): number => 9 * Math.max(0, t - (start + 1.7)) ** 2,
      );
    const context: Parameters<
      typeof AutoMovieMotionHumanSupport.supportTransfer
    >[0] = {
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
    const plan: ReturnType<typeof AutoMovieMotionHumanSupport.supportTransfer> =
      AutoMovieMotionHumanSupport.supportTransfer(context);
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

    /** Shared travel in metres and the deck's independent post-transfer departure. */
    const translate = (t: number): number => 0.4 * (t - start);
    const depart = (t: number): number => Math.max(0, t - (start + 1.7));
    const gangway: IAutoMovieMotionHumanPropReader =
      supportTransferFixture.surface(
        "platform",
        oldEdge - 0.5,
        0,
        translate,
        () => 0,
      );
    const movingDeck: IAutoMovieMotionHumanPropReader =
      supportTransferFixture.surface(
        "car",
        newEdge + 0.5,
        0,
        (t: number): number => translate(t) + depart(t),
        depart,
      );
    const movingProps = (id: string): IAutoMovieMotionHumanPropReader =>
      id === "platform" ? gangway : movingDeck;
    const movingParams: Parameters<
      typeof AutoMovieMotionHumanSupport.supportTransfer
    >[0]["params"] = {
      ...context.params,
      docking: "co-moving",
    };
    for (const yawRate of [0, 15]) {
      const prop = (id: string): IAutoMovieMotionHumanPropReader => {
        const reader: IAutoMovieMotionHumanPropReader = movingProps(id);
        return {
          ...reader,
          frame: (t: number): IAutoMovieRigidTransform => {
            const at: IAutoMovieRigidTransform = reader.frame(t);
            const turn: IAutoMovieRigidTransform["rotation"] =
              Quaternion.fromAxisAngle(
                { x: 0, y: 1, z: 0 },
                yawRate * (t - start),
              );
            return {
              position: Quaternion.rotateVector(turn, at.position),
              rotation: Quaternion.multiply(turn, at.rotation),
            };
          },
        };
      };
      const crossing: ReturnType<
        typeof AutoMovieMotionHumanSupport.supportTransfer
      > = AutoMovieMotionHumanSupport.supportTransfer({
        ...context,
        prop,
        params: movingParams,
      });
      TestValidator.predicate(
        name + " moving split declares one bearing foot on each support",
        support(lead, 0.5, crossing.contacts) === "car" &&
          support(trail, 0.5, crossing.contacts) === "platform",
      );
      for (const time of [1, 1.69, 1.98]) {
        const actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(body, resolveHumanPosture(body, crossing.posture(time)));
        const reference: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          time === 1 ? split : landed;
        const frame: IAutoMovieRigidTransform = prop("car").frame(start + time);
        const baseFrame: IAutoMovieRigidTransform = deck.frame(start);
        TestValidator.predicate(
          name +
            " pelvis follows deck-relative position and yaw at " +
            time +
            " s",
          vclose(
            local(actual.get("hips")!.worldPosition, frame),
            local(reference.get("hips")!.worldPosition, baseFrame),
            0.001,
          ) &&
            qclose(
              Quaternion.multiply(
                Quaternion.inverse(frame.rotation),
                actual.get("hips")!.worldRotation,
              ),
              reference.get("hips")!.worldRotation,
            ),
        );
        for (const side of [lead, trail]) {
          if (side === trail && time === 1) {
            TestValidator.predicate(
              name + " rear sole keeps its platform-local entry position",
              HumanFoot.sockets(body, actual, side).every(
                (socket, index): boolean =>
                  vclose(
                    local(socket.point, prop("platform").frame(start + time)),
                    local(
                      HumanFoot.sockets(body, bones, side)[index]!.point,
                      platform.frame(start),
                    ),
                    0.01,
                  ),
              ),
            );
            continue;
          }
          const footBone: IAutoMovieResolvedBone = actual.get(
            (side + "Foot") as AutoMovieHumanoidBone,
          )!;
          const sole: IAutoMovieVector3 = Vector3.add(
            footBone.worldPosition,
            Quaternion.rotateVector(
              footBone.worldRotation,
              HumanFoot.offset(body, side, "sole", 0),
            ),
          );
          const ankle: IAutoMovieVector3 = entry.feet[side].ankle;
          TestValidator.predicate(
            name +
              " " +
              side +
              " sole lands at the authored deck station at " +
              time +
              " s",
            vclose(
              local(sole, frame),
              {
                x: ankle.x - stanceCenter.x,
                y: 0,
                z: station - baseFrame.position.z + ankle.z - stanceCenter.z,
              },
              0.01,
            ),
          );
          const referenceSockets: IAutoMovieMotionHumanFoot.ISocket[] =
            HumanFoot.sockets(body, reference, side);
          TestValidator.predicate(
            `${name} ${side} foot keeps its deck-local sole shape at ${time} s`,
            HumanFoot.sockets(body, actual, side).every(
              (socket, index): boolean =>
                vclose(
                  local(socket.point, frame),
                  local(referenceSockets[index]!.point, baseFrame),
                  0.01,
                ),
            ),
          );
        }
      }
    }

    if (name !== "m-average") continue;
    supportTransferFixture.checkRefusals(context, movingProps, newEdge);

    // This smooth relative shift stays inside the 1 mm docking tolerance.
    const almostDocked: ReturnType<
      typeof AutoMovieMotionHumanSupport.supportTransfer
    > = AutoMovieMotionHumanSupport.supportTransfer({
      ...context,
      params: movingParams,
      prop: (id: string): IAutoMovieMotionHumanPropReader =>
        id === "platform"
          ? gangway
          : {
              ...movingDeck,
              frame: (t: number): IAutoMovieRigidTransform => {
                const frame: IAutoMovieRigidTransform = movingDeck.frame(t);
                return {
                  ...frame,
                  position: {
                    ...frame.position,
                    x:
                      frame.position.x +
                      0.0009 * Math.sin(80 * Math.PI * (t - start)),
                  },
                };
              },
            },
    });
    const touchdown: number =
      seconds *
      almostDocked.events.find((event) => event.name === "trailContact")!.share;
    const step: number = 0.00001;
    const pelvisX = (t: number): number =>
      poseBones(body, resolveHumanPosture(body, almostDocked.posture(t))).get(
        "hips",
      )!.worldPosition.x;
    TestValidator.predicate(
      "Pelvis forward differences agree within 0.02 m/s across touchdown",
      Math.abs(
        pelvisX(touchdown + step) -
          2 * pelvisX(touchdown) +
          pelvisX(touchdown - step),
      ) /
        step <=
        0.02,
    );
  }
}
