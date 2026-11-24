import { createHandgun, createHolster } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanOperateInsert,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

const { operateInsert } = AutoMovieMotionHumanOperate;

/**
 * `operate`'s `insert` mechanism (#3476): a held prop's working point goes
 * along a socket's axis by a depth and, withdrawn, comes back out on it.
 *
 * Scenarios:
 * the average man and the small woman, each holding a full-size
 * handgun taken from a table and inserting its muzzle 0.1 m into a holster
 * standing on a stand before them, withdrawn:
 * 1. The insertion plans, gripping the gun through the stroke.
 * 2. At eleven instants of the stroke the muzzle lies within 5 mm of the
 *    socket's axis (#3476's bound).
 * 3. At the stroke's middle the muzzle is the depth in along the axis,
 *    within 5 mm; at its start and end it is at the mouth, within 5 mm.
 * 4. `operateInsert.depth` is 0 at both ends and the depth at the middle of a
 *    withdrawn stroke, and runs to the depth on a stroke that stays in.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Inserts a real handgun into a real holster through the public chain and reads the displayed gun; a muzzle off the axis, one that never goes in or one left inside fails.
 * @evidence contracts/development/testing.md#independent-expectations The axis and mouth are the holster archetype's own socket, the depth the scene's ask, the 5 mm #3476's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the stroke's ends and middle; a withdrawn and a kept stroke.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory and reads about a dozen instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_motion_posture_simple_prop_interaction(): void {
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const holster: ReturnType<typeof createHolster> = createHolster({
    kind: "holster",
  });
  const DEPTH: number = 0.1;
  const BOUND: number = 5e-3;
  const tip: IAutoMovieVector3 = gun.affordance("muzzle").frame.translation;
  const socket = holster.affordance("socket");
  const stand = { at: { x: 0.2, y: 0.9, z: 0.45 }, yaw: 0, fixed: true };
  const frame = HumanObject.frame(stand);
  const mouth: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, socket.frame.translation),
  );
  const inward: IAutoMovieVector3 = Vector3.scale(
    Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, socket.frame.rotation),
      { x: 0, y: 1, z: 0 },
    ),
    -1,
  );
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "insert",
        props: [
          HumanObject.prop("gun", gun, {
            at: { x: -0.2, y: 0.9, z: 0.4 },
            yaw: 0,
          }),
          HumanObject.prop("holster", holster, stand),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "gun", handle: "grip" })
          .operate({
            kind: {
              kind: "insert",
              prop: "gun",
              tip: "muzzle",
              into: { kind: "prop", subject: "holster", point: "socket" },
              depth: DEPTH,
              withdraw: true,
            },
          }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the insertion plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[1]!;
    const { strokeStart, strokeEnd } = Object.fromEntries(
      segment.plan.events.map((e) => [
        e.name,
        segment.start + e.share * segment.plan.duration,
      ]),
    ) as Record<string, number>;
    let off: number = 0;
    const depths: number[] = [];
    const intervals: number = 10;
    for (let k: number = 0; k <= intervals; k++) {
      const t: number =
        strokeStart! + ((strokeEnd! - strokeStart!) * k) / intervals;
      const at = performance.prop("gun", t);
      const muzzle: IAutoMovieVector3 = Vector3.add(
        at.position,
        Quaternion.rotateVector(at.rotation, tip),
      );
      const d: IAutoMovieVector3 = Vector3.subtract(muzzle, mouth);
      const along: number = Vector3.dot(d, inward);
      depths.push(along);
      off = Math.max(
        off,
        Vector3.length(Vector3.subtract(d, Vector3.scale(inward, along))),
      );
    }
    TestValidator.predicate(
      `${name}: the muzzle keeps to the socket's axis (${(1000 * off).toFixed(1)} mm)`,
      off <= BOUND,
    );
    const middle: number = depths[intervals / 2]!;
    TestValidator.predicate(
      `${name}: the muzzle goes the depth in at the middle (${middle.toFixed(3)} m)`,
      Math.abs(middle - DEPTH) <= BOUND,
    );
    TestValidator.predicate(
      `${name}: the muzzle is at the mouth at the stroke's ends`,
      Math.abs(depths[0]!) <= BOUND && Math.abs(depths[intervals]!) <= BOUND,
    );
  }

  // 4. The depth by progress.
  const withdrawn: IAutoMovieMotionHumanOperateInsert.IMechanism = {
    kind: "insert",
    prop: "p",
    into: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 0 } },
    depth: DEPTH,
    withdraw: true,
  };
  TestValidator.predicate(
    "a withdrawn stroke is home at both ends and the depth in at its middle",
    operateInsert.depth(withdrawn, 0) === 0 &&
      Math.abs(operateInsert.depth(withdrawn, 1)) <= 1e-12 &&
      Math.abs(operateInsert.depth(withdrawn, 0.5) - DEPTH) <= 1e-12,
  );
  TestValidator.predicate(
    "a kept stroke runs to the depth",
    operateInsert.depth({ ...withdrawn, withdraw: false }, 1) === DEPTH,
  );
}
