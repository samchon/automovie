import { createDrinkware } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanHeld,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * What a hand holds is read once, in that hand's frame, and stays there: a
 * point of the held prop found from that reading is where the film shows
 * the prop's point for as long as the hand holds it.
 *
 * The reading is a registered law entered after a glass is picked up with
 * the right hand. While it plans it reads the held glass
 * (`AutoMovieMotionHumanHeld.of`) and the glass's `lip` in the hand's grip
 * frame, declares the grip and the hold the reading gives, and keeps its
 * posture; a short walk follows, carrying the glass.
 *
 * Scenarios, on the average man and the small woman:
 * 1. At every sixth of a second from the reader's start to the film's end,
 *    the lip placed from the reading on the displayed right hand (the grip
 *    socket's point and the hand bone's rotation) lies within 1 mm of the
 *    lip of the displayed glass, the campaign's bound on a grip's drift.
 * 2. The lip's direction from the reading is a unit vector.
 * 3. Asked of the left hand, which holds nothing, the reading is an
 *    `affordance` refusal on `prop`; asked for a contact the glass lacks,
 *    it is an `affordance` refusal on `point` that lists `lip`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chain through the public input and compares the point the reading gives, carried by the displayed hand, with the displayed prop's own point; a reading in another frame, one that drifts, or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The displayed glass comes from the performance's own carry of the prop and the hand from the displayed pose; the 1 mm is the campaign's grip bound. Neither is computed by the reading.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the holding action itself and a later action that only carries; the holding hand, the empty hand and a contact the prop lacks.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and one archetype and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how it is read and the 3 scenarios with their bound.
 */
export function test_human_motion_core_held_frame(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const read: {
      lip?: { point: IAutoMovieVector3; direction: IAutoMovieVector3 };
      left?: unknown;
      missing?: unknown;
    } = {};
    const refused = (build: () => unknown): unknown => {
      try {
        build();
      } catch (error) {
        return error;
      }
      return null;
    };
    const reader: IHumanActionLaw<never> = {
      name: "reader",
      interrupts: {},
      plan: (context: IHumanActionContext<never>): IHumanActionPlan => {
        const held: AutoMovieMotionHumanHeld.IHeld =
          AutoMovieMotionHumanHeld.of(context, "right", "glass");
        read.lip = AutoMovieMotionHumanHeld.point(held, "lip");
        read.left = refused((): unknown =>
          AutoMovieMotionHumanHeld.of(context, "left", "glass"),
        );
        read.missing = refused((): unknown =>
          AutoMovieMotionHumanHeld.point(held, "spout"),
        );
        return {
          duration: 0.5,
          events: [],
          contacts: [
            ...context.entry.supports.map(
              (
                support: IHumanEntryState.ISupport,
              ): IHumanActionPlan["contacts"][number] => ({
                ...support,
                from: 0,
                to: 1,
              }),
            ),
            AutoMovieMotionHumanHeld.grip(held),
          ],
          holds: [AutoMovieMotionHumanHeld.hold(context, held)],
          posture: (): ReturnType<IHumanActionPlan["posture"]> =>
            context.entry.posture,
        };
      },
    };
    const glass: IHumanProp = HumanObject.prop(
      "glass",
      createDrinkware({ kind: "glass" }),
      {
        at: {
          x: 0.15,
          y: 0.55 * body.measure.stature,
          z: 0.2 * body.measure.stature,
        },
        yaw: 0,
      },
    );
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "held",
        laws: [reader],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [glass],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "glass", handle: "body", hand: "right" })
          .registered("reader")
          .walk({ to: { x: 0, y: 0, z: 1 } }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: a held glass read and carried: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const lip: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } =
      read.lip!;

    // 1. The reading, carried by the displayed hand, against the displayed glass.
    const socket: (typeof body.surfaces.sockets)["gripRight"] =
      body.surfaces.sockets.gripRight;
    const local: IAutoMovieVector3 = glass.points.lip!.point;
    let worst: { off: number; seconds: number } = { off: 0, seconds: 0 };
    for (
      let t: number = film.segments("a")[1]!.entryTime;
      t <= film.duration + 1e-9;
      t += 1 / 6
    ) {
      const hand: IAutoMovieResolvedBone = film.bones("a", t).get("rightHand")!;
      const grip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        socket,
        film.bones("a", t).get(socket.bone)!,
      ).point;
      const carried: IAutoMovieVector3 = Quaternion.rotateVector(
        hand.worldRotation,
        lip.point,
      );
      const shown: IHumanProp.IFrame = film.prop("glass", t);
      const there: IAutoMovieVector3 = Quaternion.rotateVector(
        shown.rotation,
        local,
      );
      const off: number = Math.hypot(
        grip.x + carried.x - shown.position.x - there.x,
        grip.y + carried.y - shown.position.y - there.y,
        grip.z + carried.z - shown.position.z - there.z,
      );
      if (off > worst.off) worst = { off, seconds: t };
    }
    if (worst.off > 0.001)
      complaints.push(
        `${name}: the lip read in the hand's frame lies ${(worst.off * 1000).toFixed(2)} mm from the displayed glass's lip (at ${worst.seconds.toFixed(2)} s), within 1 mm expected`,
      );

    // 2. A direction is a unit vector.
    const length: number = Math.hypot(
      lip.direction.x,
      lip.direction.y,
      lip.direction.z,
    );
    if (Math.abs(length - 1) > 1e-9)
      complaints.push(
        `${name}: the lip's direction has length ${length.toFixed(6)}, 1 expected`,
      );

    // 3. What is not held, and what the prop lacks.
    if (
      !(
        read.left instanceof HumanRefusal &&
        read.left.kind === "affordance" &&
        read.left.axis === "prop"
      )
    )
      complaints.push(
        `${name}: the glass asked of the empty left hand: expected an affordance refusal on prop, got ${read.left instanceof Error ? read.left.message : String(read.left)}`,
      );
    if (
      !(
        read.missing instanceof HumanRefusal &&
        read.missing.kind === "affordance" &&
        read.missing.axis === "point" &&
        read.missing.feasible?.kind === "alternatives" &&
        read.missing.feasible.values.includes("lip")
      )
    )
      complaints.push(
        `${name}: a contact the glass lacks: expected an affordance refusal on point listing lip, got ${read.missing instanceof Error ? read.missing.message : String(read.missing)}`,
      );
  }
  TestValidator.equals(
    "a held prop is read in the hand's frame",
    complaints,
    [],
  );
}
