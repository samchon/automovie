import { createCar } from "@automovie/archetypes";
import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanObstacle,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanTravelCarExit,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seated passenger exits a stationary sedan through its rear side aperture.
 * Shippen (2012) asked subjects to use the door nearest the seating place.
 * Sample both sides of the real car. The crown stays below the header
 * around the plane of the door, and both planted ankles end exterior.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two mirrored cases, the real opening and the crossing checks.
 * @evidence contracts/development/testing.md#behavioral-verification Drives a public chain with behavior and geometry read from the archetype and reads one displayed bone set at each of two endpoints and three phase markers.
 * @evidence contracts/development/testing.md#independent-expectations Door plane, headroom and inside/outside come from the car's published opening. Shippen establishes the use of the adjacent rear door.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises both sides and checks the opening width refusal independently of entry bake.
 * @evidence contracts/development/testing.md#execution-ownership Builds one human and one car in memory, and creates fresh performances for each opening and the narrow refusal.
 */
export function test_human_motion_car_rear_exit(): void {
  const car: IAutoMovieMotionHumanObject.IModel = createCar({ kind: "sedan" });
  const placement: IAutoMovieMotionHumanObject.Placement = {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(car, placement, "rearSeat");
  const raw: IAutoMovieAffordance = car.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "rearSeat",
  )!;
  const bench: IAutoMovieMotionHumanSeated.ISeat & { depth: number } = {
    ...seat,
    depth: seat.depth!,
  };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const problems: string[] = [];
  const doors: IAutoMovieMotionObstacleAperture[] = HumanObstacle.apertures(car, placement);
  for (const side of ["rearLeftAperture", "rearRightAperture"] as const) {
    const door: IAutoMovieMotionObstacleAperture = doors.find(
      (a: IAutoMovieMotionObstacleAperture): boolean => a.id === side,
    )!;
    const sign: number = Math.sign(door.at.x);
    const at: IAutoMovieVector3 = {
      x: bench.at.x + sign * raw.width! / 4,
      y: door.at.y,
      z: bench.at.z + 0.12,
    };
    const perform = (through: IAutoMovieMotionObstacleAperture): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "rear-seat-egress",
        laws: [HumanTravelCarExit.getOut],
        performers: [
          { subject: "a", body, at, yaw: bench.yaw, proficiency: { level: "trained" } },
        ],
        composition: HumanChain.subject("a")
          .sit({ seat: { ...bench, at: { ...bench.at, x: at.x } } })
          .registered("getOut", {
            bench,
            width: raw.width!,
            through,
            floor: 0,
            turnSeconds: 1.3,
            clearance: 0.03,
            landingDistance: 0.18,
            duckDegrees: 35,
            stagger: 0.18,
            liftShare: 0.22,
          })
          .node,
      });

    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform(door);
    } catch (error) {
      problems.push(`${side}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const exit: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(performance, "a", body, 0);
    const outward = (p: IAutoMovieVector3): number => (p.x - door.at.x) * sign;
    const names: readonly ["leftFoot", "rightFoot"] = ["leftFoot", "rightFoot"];
    const first: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(reader, exit.entryTime);
    const last: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(reader, exit.end);
    for (const name of names)
      if (!(outward(first.get(name)!.worldPosition) < 0 && outward(last.get(name)!.worldPosition) > 0))
        problems.push(`${side}: ${name} must finish outside after starting inside`);

    const lead: "leftFoot" | "rightFoot" = sign > 0 ? "leftFoot" : "rightFoot";
    const trail: "leftFoot" | "rightFoot" = lead === "leftFoot" ? "rightFoot" : "leftFoot";
    const crownFrame: typeof body.surfaces.regions.crown = body.surfaces.regions.crown;
    for (const event of exit.plan.events) {
      if (event.name !== "leadSill" && event.name !== "trailSill" && event.name !== "seatOff")
        continue;
      const t: number = exit.start + event.share * exit.plan.duration;
      const bones: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(reader, t);
      const crown: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        crownFrame,
        bones.get(crownFrame.bone)!,
      ).point;
      if (Math.abs(outward(crown)) < 0.1 && crown.y > door.at.y + door.height)
        problems.push(`${side}: crown exceeds the header at ${event.name}`);
      if (event.name === "seatOff") continue;
      const foot: "leftFoot" | "rightFoot" = event.name === "leadSill" ? lead : trail;
      const ankle: IAutoMovieVector3 = bones.get(foot)!.worldPosition;
      if (Math.abs(outward(ankle)) > 0.05 || ankle.y < door.at.y + body.measure.ankleHeight - 0.01)
        problems.push(`${side}: ${foot} must cross above the sill at ${event.name}`);
    }
    for (const name of ["leadSill", "trailSill", "seatOff"] as const)
      if (!exit.plan.events.some((event: IAutoMovieMotionEvent): boolean => event.name === name))
        problems.push(`${side}: missing ${name} marker`);
    if (exit.plan.base?.kind !== "standing")
      problems.push(`${side}: the exit must finish standing`);
    let refusal: unknown;
    try {
      perform({ ...door, width: 0.2 });
    } catch (error) {
      refusal = error;
    }
    if (!(refusal instanceof HumanRefusal && refusal.kind === "reach" && refusal.axis === "aperture"))
      problems.push(`${side}: a 0.2 m opening must refuse aperture clearance`);
  }
  TestValidator.equals("rear egress through the sedan's open door", problems, []);
}
