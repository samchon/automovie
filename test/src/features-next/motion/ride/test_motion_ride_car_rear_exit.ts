import { createCar } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanObstacle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { qclose } from "../../../features/internal/predicates";

/**
 * A seated passenger exits a stationary sedan through its rear side aperture.
 * Shippen (2012) asked subjects to use the door nearest the seating place.
 * @see https://pureportal.coventry.ac.uk/en/publications/biomechanical-analysis-of-entry-egress-and-loading-of-a-passenger-2/
 *
 * Scenarios:
 * 1. From a held three-contact entry on the cushion and cabin floor with
 *    each rear leaf open, the ankles change sides in the authored order,
 *    clear the sill and jambs, and stay outside through the transfer to rise.
 * 2. The trailing foot keeps its car support until lift. Both feet keep
 *    their landing orientation at the transfer to the rise.
 * 3. The crown clears the header at the sampled phases near the opening.
 * 4. A 0.2 m left opening refuses passage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two mirrored cases, the real opening and the crossing checks.
 * @evidence contracts/development/testing.md#behavioral-verification Stages the occupied seat with native planted-leg fitting and the car's seat and floor contacts, then drives the public exit chain and reads displayed bones at the endpoints, phase markers and either side of the rise handoff.
 * @evidence contracts/development/testing.md#independent-expectations Door plane, headroom and jambs come from the articulated car's opening. Shippen establishes the adjacent rear door. The test fixture supplies the turn duration and stagger.
 * @evidence contracts/development/testing.md#distinguishing-cases The two doors reverse the leading foot and exercise the clearance on each side. One narrow opening exercises the shared width check.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this in-memory test. One human and car fixture serve two open-door passages and one narrow-door refusal.
 */
export function test_motion_ride_car_rear_exit(): void {
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" });
  const placement: IAutoMovieMotionHumanObject.Placement = {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    car,
    placement,
    "rearSeat",
  );
  const raw: IAutoMovieAffordance = car.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "rearSeat",
  )!;
  const bench: IAutoMovieMotionHumanSeated.ISeat & { depth: number } = {
    ...seat,
    depth: seat.depth!,
  };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const problems: string[] = [];
  const turnSeconds: number = 1.3;
  const stagger: number = 0.18;
  const clearance: number = 0.03;
  const tolerance: number = 0.01;
  for (const opening of ["rearLeft", "rearRight"] as const) {
    const side: "rearLeftAperture" | "rearRightAperture" = `${opening}Aperture`;
    const hinge: "rearLeftDoor" | "rearRightDoor" = `${opening}Door`;
    const opened: ReturnType<typeof createCar> = car.articulate({
      [hinge]: car.affordance(hinge).travel!,
    });
    const door: IAutoMovieMotionObstacleAperture = HumanObstacle.apertures(
      opened,
      placement,
    ).find((a: IAutoMovieMotionObstacleAperture): boolean => a.id === side)!;
    const sign: number = Math.sign(door.at.x);
    const at: IAutoMovieVector3 = {
      x: bench.at.x + (sign * raw.width!) / 4,
      y: createCar.FLOOR,
      z: bench.at.z + 0.12,
    };
    // The clip begins after the passenger has taken the seat.
    const occupied: IAutoMovieMotionHumanSeated.ISeat = {
      ...bench,
      at: { ...bench.at, x: at.x },
    };
    const socket: IAutoMovieVector3 = AutoMovieMotionHumanSeat.seated.point(
      body,
      occupied,
    );
    const neutral: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, at, occupied.yaw);
    const root: IAutoMovieVector3 = AutoMovieMotionHumanSeat.seated.root(
      body,
      socket,
      neutral,
    );
    const feet: Record<"left" | "right", IAutoMovieVector3> = {
      left: neutral.limbs.leftLeg!.point,
      right: neutral.limbs.rightLeg!.point,
    };
    const posed: IAutoMovieMotionHumanPosture = {
      ...neutral,
      root,
      limbs: AutoMovieMotionHumanStance.stand.legs(
        body,
        root,
        occupied.yaw,
        feet,
      ),
    };
    const support: IAutoMovieMotionHumanContactWindow.Support = {
      kind: "prop",
      subject: "car",
    };
    const stage: IAutoMovieMotionHumanActionLaw<Record<string, never>> = {
      name: "occupyRearSeat",
      interrupts: {},
      plan: (): IAutoMovieMotionHumanActionPlan => ({
        duration: 0.3,
        base: { kind: "seated" },
        still: [0, 0.3],
        events: [],
        contacts: [
          { part: "seat", kind: "seat", from: 0, to: 1, support },
          { part: "leftFoot", kind: "plant", from: 0, to: 1, support },
          { part: "rightFoot", kind: "plant", from: 0, to: 1, support },
        ],
        posture: (): IAutoMovieMotionHumanPosture => posed,
      }),
    };
    const perform = (
      through: IAutoMovieMotionObstacleAperture,
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "rear-seat-egress",
        laws: [stage, AutoMovieMotionHumanRide.travelCarExit.getOut],
        props: [HumanObject.prop("car", opened, placement)],
        performers: [
          {
            subject: "a",
            body,
            at,
            yaw: bench.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .registered("occupyRearSeat", {})
          .registered("getOut", {
            bench,
            width: raw.width!,
            through,
            floor: 0,
            turnSeconds,
            clearance,
            landingDistance: 0.18,
            duckDegrees: 35,
            stagger,
            liftShare: 0.22,
          }).node,
      });

    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform(door);
    } catch (error) {
      problems.push(
        `${side}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const exit: IAutoMovieMotionHumanSegment = performance
      .segments("a")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "getOut",
      )!;
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const outward = (p: IAutoMovieVector3): number => (p.x - door.at.x) * sign;
    const along = (p: IAutoMovieVector3): number =>
      Vector3.dot(Vector3.subtract(p, door.at), door.across);
    const names: readonly ["leftFoot", "rightFoot"] = ["leftFoot", "rightFoot"];
    const first: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      reader,
      exit.entryTime,
    );
    const last: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      reader,
      exit.end,
    );
    const seatFrame: typeof body.surfaces.sockets.seat =
      body.surfaces.sockets.seat;
    const seatedAt: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(
      seatFrame,
      first.get(seatFrame.bone)!,
    );
    if (Vector3.distance(seatedAt, socket) > tolerance)
      problems.push(
        side + ": the displayed seat socket misses the occupied cushion",
      );
    for (const foot of ["left", "right"] as const) {
      const sole: number = Math.min(
        ...HumanFoot.sockets(body, first, foot).map(
          (sample: IAutoMovieMotionHumanFoot.ISocket): number => sample.point.y,
        ),
      );
      if (Math.abs(sole - at.y) > tolerance)
        problems.push(
          side +
            ": " +
            foot +
            " sole does not bear on the cabin floor at entry (" +
            sole +
            " m)",
        );
    }
    for (const name of names)
      if (
        !(
          outward(first.get(name)!.worldPosition) < 0 &&
          outward(last.get(name)!.worldPosition) > 0
        )
      )
        problems.push(
          `${side}: ${name} must finish outside after starting inside`,
        );

    const lead: "leftFoot" | "rightFoot" = sign > 0 ? "leftFoot" : "rightFoot";
    const trail: "leftFoot" | "rightFoot" =
      lead === "leftFoot" ? "rightFoot" : "leftFoot";
    const inside: IAutoMovieMotionHumanContactWindow | undefined =
      exit.plan.contacts.find(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === trail &&
          contact.kind === "plant" &&
          contact.from === 0,
      );
    if (
      inside?.support.kind !== "prop" ||
      inside.support.subject !== "car" ||
      Math.abs(inside.to * exit.plan.duration - turnSeconds * stagger) > 1e-6
    )
      problems.push(`${side}: ${trail} must keep its car support until lift`);

    const crownFrame: typeof body.surfaces.regions.crown =
      body.surfaces.regions.crown;
    const leadSill: number = (turnSeconds * (1 - stagger)) / 2;
    const trailSill: number = turnSeconds - leadSill;
    const markers: readonly [string, number | undefined][] = [
      ["leadSill", leadSill],
      ["trailSill", trailSill],
      ["feetOutside", turnSeconds],
      ["seatOff", undefined],
    ];
    for (const [name, expected] of markers) {
      const event: IAutoMovieMotionEvent | undefined = exit.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      if (event === undefined) {
        problems.push(`${side}: missing ${name} marker`);
        continue;
      }
      const elapsed: number = event.share * exit.plan.duration;
      if (
        expected !== undefined
          ? Math.abs(elapsed - expected) > 1e-6
          : !(elapsed > turnSeconds && exit.start + elapsed <= exit.end)
      )
        problems.push(
          `${side}: ${name} occurs at ${elapsed.toFixed(3)} s after the turn begins`,
        );
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(reader, exit.start + (expected ?? elapsed));
      const crown: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        crownFrame,
        bones.get(crownFrame.bone)!,
      ).point;
      if (Math.abs(outward(crown)) < 0.1 && crown.y > door.at.y + door.height)
        problems.push(
          `${side}: crown exceeds the header at ${name}: y=${crown.y.toFixed(3)} limit=${(door.at.y + door.height).toFixed(3)}, plane=${outward(crown).toFixed(3)}`,
        );
      if (name === "feetOutside") {
        for (const foot of names)
          if (!(outward(bones.get(foot)!.worldPosition) > 0))
            problems.push(
              `${side}: ${foot} remains inside at the rise handoff`,
            );
      } else if (name === "leadSill" || name === "trailSill") {
        const foot: "leftFoot" | "rightFoot" =
          name === "leadSill" ? lead : trail;
        const ankle: IAutoMovieVector3 = bones.get(foot)!.worldPosition;
        if (
          Math.abs(outward(ankle)) > 0.05 ||
          Math.abs(along(ankle)) > door.width / 2 - clearance + tolerance ||
          ankle.y < door.at.y + body.measure.ankleHeight + clearance - tolerance
        )
          problems.push(
            `${side}: ${foot} misses the clear opening at ${name}: plane=${outward(ankle).toFixed(3)} across=${along(ankle).toFixed(3)} width=${door.width.toFixed(3)} y=${ankle.y.toFixed(3)} needed=${(door.at.y + body.measure.ankleHeight + clearance - tolerance).toFixed(3)} target=${JSON.stringify(exit.plan.posture(elapsed).limbs[foot === "leftFoot" ? "leftLeg" : "rightLeg"]?.point)}`,
          );
      }
    }

    // Compare both displayed orientations across the authored phase boundary.
    const handoff: number = exit.start + turnSeconds;
    const before: ReturnType<typeof HumanSignature.bones> =
      HumanSignature.bones(reader, handoff - 1e-5);
    const after: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      reader,
      handoff + 1e-5,
    );
    for (const foot of names)
      if (
        !qclose(before.get(foot)!.worldRotation, after.get(foot)!.worldRotation)
      )
        problems.push(`${side}: ${foot} changes attitude at the rise handoff`);
    if (exit.plan.base?.kind !== "standing")
      problems.push(`${side}: the exit must finish standing`);
    if (opening === "rearLeft") {
      let refusal: unknown;
      try {
        perform({ ...door, width: 0.2 });
      } catch (error) {
        refusal = error;
      }
      if (
        !(
          refusal instanceof HumanRefusal &&
          refusal.kind === "reach" &&
          refusal.axis === "aperture"
        )
      )
        problems.push(
          `${side}: a 0.2 m opening must refuse aperture clearance`,
        );
    }
  }
  TestValidator.equals(
    "rear egress through the sedan's open door",
    problems,
    [],
  );
}
