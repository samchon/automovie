import { createWearable } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  tipHat,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { throws } from "node:assert/strict";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * Pin the staged hat's actual movement and custody through the public performance.
 *
 * Scenarios:
 * 1. Lift the initially worn hat above the crown, then return its brim and
 *    wear socket within 15 mm of their starting places. After a walk, the
 *    wear socket follows the head within 15 mm in the head's frame.
 * 2. A hat resting in the scene without a declared wearer is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the two staged cases, points measured and tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Observes both prop points and the moving head through the public performed scene. A mimed greeting, a hat left in the hand and a hat stranded in world space each fail.
 * @evidence contracts/development/testing.md#independent-expectations Emily Post's 1922 greeting lifts and returns the hat. The 15 mm seating bound comes from the motion campaign, while 12 mm separates a visibly lifted crown from a pose within normal placement error.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses the real wearable archetype first as a staged head attachment and then as an unattached prop.
 * @evidence contracts/development/testing.md#execution-ownership Two calls to the performance builder use one polygon body and one archetype in memory, with no visual host or fixtures.
 */
export function test_human_motion_tip_hat(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const hat: IAutoMovieMotionHumanProp = HumanObject.prop(
    "hat",
    createWearable({ kind: "hat" }),
    { at: zero, yaw: 0 },
  );
  const brim: IAutoMovieVector3 = hat.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "hold",
  )!.frame.translation;
  const crown: IAutoMovieVector3 = hat.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear",
  )!.frame.translation;
  const staged: IAutoMovieMotionHumanProp = {
    ...hat,
    worn: {
      subject: "a",
      bone: "head",
      offset: {
        position: Vector3.subtract(body.surfaces.regions.crown.point, crown),
        rotation: Quaternion.identity(),
      },
    },
  };
  const perform = (prop: IAutoMovieMotionHumanProp): HumanPerformance =>
    new HumanPerformance({
      seed: "hat greeting",
      performers: [
        {
          subject: "a",
          body,
          at: zero,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [prop],
      laws: [tipHat],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("tipHat", { prop: "hat" })
        .walk({ to: { x: 0, y: 0, z: 1 } }).node,
    });
  const performance: HumanPerformance = perform(staged);
  const placed: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
  const at = (event: string): number =>
    placed.start +
    placed.plan.duration *
      placed.plan.events.find((e): boolean => e.name === event)!.share;
  const point = (local: IAutoMovieVector3, time: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = performance.prop("hat", time);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  };
  const crownOf = (time: number): IAutoMovieVector3 => {
    const head: IAutoMovieResolvedBone = performance
      .bones("a", time)
      .get("head")!;
    return Vector3.add(
      head.worldPosition,
      Quaternion.rotateVector(
        head.worldRotation,
        body.surfaces.regions.crown.point,
      ),
    );
  };
  const apex: number = at("stroke");
  TestValidator.predicate(
    "hat rises above the head",
    () => point(crown, apex).y - crownOf(apex).y >= 0.012,
  );
  TestValidator.predicate("both sockets return to the seated frame", () =>
    [brim, crown].every((socket: IAutoMovieVector3): boolean =>
      vclose(point(socket, at("relax")), point(socket, placed.start), 0.015),
    ),
  );
  const end: number = performance.duration;
  TestValidator.predicate("the reseated hat follows the walking head", () =>
    vclose(point(crown, end), crownOf(end), 0.015),
  );
  throws((): HumanPerformance => perform(hat), /no seated hat frame/);
}
