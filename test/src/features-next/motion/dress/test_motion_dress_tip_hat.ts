import { createWearable } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { throws } from "node:assert/strict";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * Pin the staged hat's actual movement and custody through the public performance.
 *
 * Scenarios, on the average man and the small woman, each take clean:
 * 1. Lift the initially worn hat above the crown, then return its brim and
 *    wear socket within 15 mm of their starting places. After a walk, the
 *    wear socket follows the head within 15 mm in the head's frame.
 * 2. A loose hat, one attached off the crown and one seated upside down are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the two staged cases, points measured and tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Observes both prop points and the moving head through the public performed scene. A mimed greeting, a hat left in the hand and a hat stranded in world space each fail.
 * @evidence contracts/development/testing.md#independent-expectations Emily Post's 1922 greeting lifts and returns the hat. The 15 mm seating bound comes from the motion campaign, while 12 mm separates a visibly lifted crown from a pose within normal placement error.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses the real wearable on the crown, then tests a loose hat and a wrong head attachment.
 * @evidence contracts/development/testing.md#execution-ownership One played sequence and three admission probes reuse the same polygon body and archetype.
 */
export function test_motion_dress_tip_hat(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
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
    const crownRegion = body.surfaces.regions.crown;
    const attach = (
      rotation: IAutoMovieQuaternion,
    ): IAutoMovieMotionHumanProp => ({
      ...hat,
      worn: {
        subject: "a",
        bone: "head",
        offset: {
          position: Vector3.subtract(
            crownRegion.point,
            Quaternion.rotateVector(rotation, crown),
          ),
          rotation,
        },
      },
    });
    const upright: IAutoMovieQuaternion = rotationBetween(
      { x: 0, y: 1, z: 0 },
      crownRegion.normal,
    );
    const staged: IAutoMovieMotionHumanProp = attach(upright);
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
        laws: [AutoMovieMotionHumanDress.tipHat],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .registered("tipHat", { prop: "hat" })
          .walk({ to: { x: 0, y: 0, z: 1 } }).node,
      });
    const performance: HumanPerformance = perform(staged);
    assertTakeClean(`${fit} tips the hat`, performance);
    const placed: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const at = (event: string): number =>
      placed.start +
      placed.plan.duration *
        placed.plan.events.find((e): boolean => e.name === event)!.share;
    const point = (
      local: IAutoMovieVector3,
      time: number,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = performance.prop("hat", time);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    };
    const crownOf = (
      time: number,
    ): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> => {
      const head: IAutoMovieResolvedBone = performance
        .bones("a", time)
        .get("head")!;
      return resolveAutoMovieHumanoidSurfaces.place(crownRegion, head);
    };
    const apex: number = at("stroke");
    const crownAtApex = crownOf(apex);
    TestValidator.predicate(
      `${fit}: hat rises above the head`,
      () =>
        Vector3.dot(
          Vector3.subtract(point(crown, apex), crownAtApex.point),
          crownAtApex.normal,
        ) >= 0.012,
    );
    TestValidator.predicate(
      `${fit}: both sockets return to the seated frame`,
      () =>
        [brim, crown].every((socket: IAutoMovieVector3): boolean =>
          vclose(
            point(socket, at("relax")),
            point(socket, placed.start),
            0.015,
          ),
        ),
    );
    const end: number = performance.duration;
    TestValidator.predicate(
      `${fit}: the reseated hat follows the walking head`,
      () => vclose(point(crown, end), crownOf(end).point, 0.015),
    );
    throws((): HumanPerformance => perform(hat), /no seated hat frame/);
    const worn: IAutoMovieMotionHumanProp.IWorn = staged.worn!;
    throws(
      (): HumanPerformance =>
        perform({
          ...staged,
          worn: {
            ...worn,
            offset: {
              ...worn.offset,
              position: Vector3.add(worn.offset.position, {
                x: body.measure.headRadius,
                y: 0,
                z: 0,
              }),
            },
          },
        }),
      /no seated hat frame/,
    );
    const upsideDown: IAutoMovieQuaternion = Quaternion.multiply(
      upright,
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 180),
    );
    throws(
      (): HumanPerformance => perform(attach(upsideDown)),
      /no seated hat frame/,
    );
  }
}
