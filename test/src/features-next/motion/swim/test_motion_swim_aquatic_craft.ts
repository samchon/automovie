import { createBoat, rowBoat } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { vclose } from "../../../features/internal/vclose";

/**
 * Stroke and cross-deck motions have geometry in a time-varying hull frame.
 *
 * Scenarios:
 * 1. A sculler rides a visible boat on a seeded swell. The pelvis slides
 *    between catch and extraction while the ankles remain in the craft's frame.
 * 2. The same performer crosses the centerline of another moving hull during
 *    a tack and stays on the original side when the maneuver is aborted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rower and sailor, the authored hulls, and the motion and contact observations.
 * @evidence contracts/development/testing.md#behavioral-verification Uses canonical bodies, real boat archetypes and their performance frame readers. Preserving a world-oriented seat or ignoring the difference between tack and abort fails.
 * @evidence contracts/development/testing.md#independent-expectations Inverts the actual prop frame around independently displayed bone markers. The initial brace is the invariant for the ankle tolerance of one centimetre and the geometric centerline separates the two sailing outcomes. These checks do not use the law's internal root or foot targets.
 * @evidence contracts/development/testing.md#distinguishing-cases The sculler must move inside the frame, and tacking and aborting differ under rotatable support. Sliding hardware, oar locks and sail geometry have no oracle in the proxy hulls.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-memory course and body pose reads through the public composition path.
 */
export function test_motion_swim_aquatic_craft(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const boat: ReturnType<typeof createBoat> = createBoat({
    kind: "rowboat",
    model: "thamesSkiff",
  });
  const carrier: ReturnType<typeof rowBoat> = rowBoat(
    boat,
    {
      start: { x: 1.6, z: -2, heading: 35 },
      legs: [{ kind: "straight", length: 18 }],
      cruise: 1.5,
      acceleration: 0.5,
      deceleration: 0.5,
    },
    { sea: { height: 0.7, seed: 7 } },
  );
  const track: ReturnType<typeof rowBoat.bind> = rowBoat.bind(carrier, 1.4);
  const initial: IAutoMovieRigidTransform = track.motion(0);
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    boat,
    initial,
    "thwart0",
  );
  const floor: IAutoMovieVector3 = track.point("floor", 0).translation;
  const at: IAutoMovieVector3 = HumanFrame.point(
    { origin: { ...seat.at, y: floor.y }, yaw: seat.yaw },
    { x: 0, y: 0, z: 0.4 },
  );
  const sculler: HumanPerformance = new HumanPerformance({
    seed: "aquatic-craft-scull",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: [
      {
        subject: "crew",
        body,
        at,
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    props: [HumanObject.prop("hull", boat, initial, track.motion, track.point)],
    composition: HumanChain.subject("crew")
      .stand({ hold: 0.3, on: { prop: "hull" } })
      .sit({ seat, hold: 0.5 })
      .registered("aquatic", { kind: "doubleScull", support: "hull" }).node,
  });
  const scull: motionHumanLaw.IFilm = motionHumanLaw.film(sculler);
  const local = (
    performance: HumanPerformance,
    seconds: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => {
    const hull: IAutoMovieRigidTransform = performance.prop("hull", seconds);
    const displayed: IAutoMovieVector3 = performance
      .bones("crew", seconds)
      .get(bone)!.worldPosition;
    return Quaternion.rotateVector(
      Quaternion.inverse(hull.rotation),
      Vector3.subtract(displayed, hull.position),
    );
  };
  const catchTime: number = motionHumanLaw.event(scull, "catch2", "crew");
  const finish: number = motionHumanLaw.event(scull, "extract2", "crew");
  const catchAgain: number = motionHumanLaw.event(scull, "catch3", "crew");
  TestValidator.predicate(
    "the hull moves appreciably over a stroke",
    Vector3.length(
      Vector3.subtract(
        sculler.prop("hull", finish).position,
        sculler.prop("hull", catchTime).position,
      ),
    ) > 0.25,
  );
  const pelvis: IAutoMovieVector3 = local(sculler, catchTime, "hips");
  const extension: IAutoMovieVector3 = local(sculler, finish, "hips");
  TestValidator.predicate(
    "the pelvis travels along its hull between comparable catch poses",
    Math.abs(extension.z - pelvis.z) > 0.05 &&
      vclose(local(sculler, catchAgain, "hips"), pelvis, 0.01),
  );
  for (const foot of ["leftFoot", "rightFoot"] as const) {
    const brace: IAutoMovieVector3 = local(sculler, catchTime, foot);
    const ankleReads: IAutoMovieVector3[] = [finish, catchAgain].map(
      (t: number): IAutoMovieVector3 => local(sculler, t, foot),
    );
    const drift: number[] = ankleReads.map((ankle: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(ankle, brace)),
    );
    TestValidator.predicate(
      `${foot} remains at the brace through extension and recovery (measured ${drift.map((value: number): string => value.toFixed(4)).join(", ")} m)`,
      ankleReads.every((ankle: IAutoMovieVector3): boolean =>
        vclose(ankle, brace, 0.01),
      ),
    );
  }

  // The skiff is a geometry proxy for a dinghy deck. These actual prop tracks
  // prescribe the heel and course, while the sailor must compose against them.
  for (const kind of ["sailTack", "sailAbort"] as const) {
    const complete: boolean = kind === "sailTack";
    const motion = (seconds: number): IAutoMovieRigidTransform => {
      const u: number = Math.min(1, Math.max(0, seconds / 3.5));
      const heading: number = complete
        ? 32 - 64 * u
        : 32 - 15 * Math.sin(Math.PI * u);
      const heel: number = 6 * Math.sin(Math.PI * u);
      return {
        position: { x: 1 + 0.4 * u, y: 0.1 * Math.sin(Math.PI * u), z: 2 * u },
        rotation: Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, heel),
        ),
      };
    };
    const origin: IAutoMovieRigidTransform = motion(0);
    const deck: IAutoMovieVector3 = boat.affordance("floor").frame.translation;
    const placement: IAutoMovieVector3 = Vector3.add(
      origin.position,
      Quaternion.rotateVector(origin.rotation, { ...deck, x: 0.33 }),
    );
    const params: IAutoMovieMotionHumanAquatic.IParams = {
      kind,
      support: "hull",
      role: "helm",
    };
    const sailor: HumanPerformance = new HumanPerformance({
      seed: "aquatic-craft-sail",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      performers: [
        {
          subject: "crew",
          body,
          at: placement,
          yaw: 32,
          proficiency: { level: "trained" },
        },
      ],
      props: [HumanObject.prop("hull", boat, origin, motion)],
      composition: HumanChain.subject("crew").registered("aquatic", params)
        .node,
    });
    const film: motionHumanLaw.IFilm = motionHumanLaw.film(sailor);
    const lift: number = motionHumanLaw.event(film, "leadLift", "crew");
    const plant: number = motionHumanLaw.event(film, "leadPlant", "crew");
    const settled: number = motionHumanLaw.event(film, "settle", "crew");
    const mid: number = (lift + plant) / 2;
    TestValidator.predicate(
      `${kind} raises the moving ankle clear of its hull-relative start`,
      local(sailor, mid, "leftFoot").y > local(sailor, lift, "leftFoot").y,
    );
    const entry: IAutoMovieVector3 = local(sailor, 0, "hips");
    const end: IAutoMovieVector3 = local(sailor, settled, "hips");
    const relaxed: IAutoMovieVector3 = local(
      sailor,
      motionHumanLaw.event(film, "relax", "crew"),
      "hips",
    );
    const side: number = complete ? -1 : 1;
    TestValidator.predicate(
      `${kind} settles on the authored side of the centerline (entry ${entry.x.toFixed(4)} m, settled ${end.x.toFixed(4)} m, relaxed ${relaxed.x.toFixed(4)} m)`,
      entry.x > 0 && side * end.x > 0 && side * relaxed.x > 0,
    );
  }
}
