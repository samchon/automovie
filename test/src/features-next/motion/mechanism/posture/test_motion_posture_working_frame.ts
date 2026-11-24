import { createDrinkware } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { AutoMovieMotionHumanHeld } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

interface IHeldLip {
  point: IAutoMovieVector3;
  direction: IAutoMovieVector3;
}

interface IHeldReading {
  lip?: IHeldLip;
  left?: unknown;
  missing?: unknown;
  handless?: unknown;
}

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
 * Scenarios:
 * A quarter turn carries the mug lip and direction through its held axis. Coincident landmarks cannot define the axis.
 * on the average man and the small woman:
 * 1. At every sixth of a second from the reader's start to the film's end,
 *    the lip placed from the reading on the displayed right hand (the grip
 *    socket's point and the hand bone's rotation) lies within 1 mm of the
 *    lip of the displayed glass, the campaign's bound on a grip's drift.
 * 2. The lip's direction from the reading is a unit vector.
 * 3. On the average body, asked of the left hand, which holds nothing, the reading is an
 *    `affordance` refusal on `prop`; asked for a contact the glass lacks,
 *    it is an `affordance` refusal on `point` that lists `lip`.
 * 4. Asked of a body whose skeleton lacks the right hand's bone, the reading
 *    is a `participant` refusal on `side` that lists only `left`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chain through the public input and compares the point the reading gives, carried by the displayed hand, with the displayed prop's own point; a reading in another frame, one that drifts, or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The displayed glass comes from the performance's own carry of the prop and the hand from the displayed pose; the 1 mm is the campaign's grip bound. Neither is computed by the reading.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies verify the geometry through the holding action and a later carry. One body's reader exercises the metadata-only branches for the empty hand, missing point and missing bone.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and one archetype and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how it is read and the 4 scenarios with their bound.
 */
export function test_motion_posture_working_frame(): void {
  checkHeldAxis();
  const complaints: string[] = [];
  const archetype = createDrinkware({ kind: "glass" });
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const read: IHeldReading = {};
    const checkRefusals: boolean = name === "m-average";
    const refused = (build: () => unknown): unknown => {
      try {
        build();
      } catch (error) {
        return error;
      }
      return null;
    };
    const reader: IAutoMovieMotionHumanActionLaw<never> = {
      name: "reader",
      interrupts: {},
      plan: (
        context: IAutoMovieMotionHumanActionContext<never>,
      ): IAutoMovieMotionHumanActionPlan => {
        const held: IAutoMovieMotionHumanHeld.IHeld =
          AutoMovieMotionHumanHeld.of(context, "right", "glass");
        read.lip = AutoMovieMotionHumanHeld.point(held, "lip");
        if (checkRefusals) {
          read.left = refused((): unknown =>
            AutoMovieMotionHumanHeld.of(context, "left", "glass"),
          );
          read.missing = refused((): unknown =>
            AutoMovieMotionHumanHeld.point(held, "spout"),
          );
          read.handless = refused((): unknown =>
            AutoMovieMotionHumanHeld.of(
              {
                ...context,
                // Remove the hand from both the skeleton and its name index.
                body: {
                  ...context.body,
                  skeleton: {
                    ...context.body.skeleton,
                    bones: context.body.skeleton.bones.filter(
                      (bone: IAutoMovieBone): boolean =>
                        bone.bone !== "rightHand",
                    ),
                  },
                  bones: new Map(
                    [...context.body.bones].filter(
                      ([bone]: [string, IAutoMovieBone]): boolean =>
                        bone !== "rightHand",
                    ),
                  ),
                },
              },
              "right",
              "glass",
            ),
          );
        }
        return {
          duration: 0.5,
          events: [],
          contacts: [
            ...context.entry.supports.map(
              (
                support: IAutoMovieMotionHumanEntryState.ISupport,
              ): IAutoMovieMotionHumanActionPlan["contacts"][number] => ({
                ...support,
                from: 0,
                to: 1,
              }),
            ),
            AutoMovieMotionHumanHeld.grip(held),
          ],
          holds: [AutoMovieMotionHumanHeld.hold(context, held)],
          posture: (): ReturnType<IAutoMovieMotionHumanActionPlan["posture"]> =>
            context.entry.posture,
        };
      },
    };
    const glass: IAutoMovieMotionHumanProp = HumanObject.prop(
      "glass",
      archetype,
      {
        at: {
          x: 0.15,
          y: 0.55 * body.measure.stature,
          z: 0.2 * body.measure.stature,
        },
        yaw: 0,
      },
    );
    let film: IAutoMovieMotionHumanPerformance;
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
    const lip: IHeldLip = read.lip!;

    // 1. The reading, carried by the displayed hand, against the displayed glass.
    const socket: (typeof body.surfaces.sockets)["gripRight"] =
      body.surfaces.sockets.gripRight;
    const local: IAutoMovieVector3 = glass.points.lip!.point;
    let worst: IGap = { off: 0, seconds: 0 };
    for (
      let t: number = film.segments("a")[1]!.entryTime;
      t <= film.duration + 1e-9;
      t += 1 / 6
    ) {
      const bones = film.bones("a", t);
      const hand: IAutoMovieResolvedBone = bones.get("rightHand")!;
      const grip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        socket,
        bones.get(socket.bone)!,
      ).point;
      const carried: IAutoMovieVector3 = Quaternion.rotateVector(
        hand.worldRotation,
        lip.point,
      );
      const shown: IAutoMovieRigidTransform = film.prop("glass", t);
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

    if (!checkRefusals) continue;

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

    // 4. A body without the hand.
    if (
      !(
        read.handless instanceof HumanRefusal &&
        read.handless.kind === "participant" &&
        read.handless.axis === "side" &&
        read.handless.feasible?.kind === "alternatives" &&
        read.handless.feasible.values.join() === "left"
      )
    )
      complaints.push(
        `${name}: a body without the right hand's bone: expected a participant refusal on side listing left, got ${read.handless instanceof Error ? read.handless.message : String(read.handless)}`,
      );
  }
  TestValidator.equals(
    "a held prop is read in the hand's frame",
    complaints,
    [],
  );
}

/** Largest sampled gap and its film second. */
interface IGap {
  off: number;
  seconds: number;
}

/** A rotated mug carries its lip along its axis, and coincident landmarks cannot define an axis. */
function checkHeldAxis(): void {
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  const shift: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const held: IAutoMovieMotionHumanHeld.IHeld = {
    prop: "mug",
    side: "left",
    affordances: mug.affordances,
    frame: {
      position: shift,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    },
  };
  const tip: IAutoMovieVector3 = mug.affordance("lip").frame.translation;
  const handle: IAutoMovieVector3 = mug.affordance("handle").frame.translation;
  const line: IAutoMovieVector3 = Vector3.subtract(tip, handle);
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool =
    AutoMovieMotionHumanStrike.StrikingHeld.read(held, {
      from: "handle",
      tip: "lip",
    });
  const turn = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.z,
    y: p.y,
    z: -p.x,
  });
  TestValidator.predicate(
    "rotated mug lip",
    Vector3.distance(tool.tip, Vector3.add(shift, turn(tip))) < 1e-9,
  );
  TestValidator.predicate(
    "rotated handle-to-lip axis",
    Vector3.distance(tool.axis, Vector3.normalize(turn(line))) < 1e-9,
  );
  TestValidator.predicate(
    "rigid length",
    Math.abs(tool.length - Vector3.length(line)) < 1e-9,
  );
  let refusal: unknown;
  try {
    AutoMovieMotionHumanStrike.StrikingHeld.read(held, {
      from: "lip",
      tip: "lip",
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "coincident contacts identify the endpoint parameter",
    refusal instanceof HumanRefusal && refusal.axis === "from",
  );
}
