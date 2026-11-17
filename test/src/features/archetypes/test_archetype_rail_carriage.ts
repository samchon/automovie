import {
  ArchetypeAssembly,
  ArchetypeFrame,
  ArchetypeRide,
  createRailCarriage,
  createRailPlatform,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * A level-boarding rapid-transit car has a real door opening and usable
 * supports with a stationary platform and the option to move the car alone.
 *
 * Scenarios:
 * 1. Open the central platform-side pair halfway and fully and measure both
 * leaves' moving edges. The opposite side stays shut and the open model admits.
 * 2. At rest, assemble the open car beside the platform. Read the geometry of
 * the adjoining supports, independent gap and height bounds, an unobstructed
 * center aisle, a transverse seat and a vertical, grippable rail.
 * 3. Move the car 8 m on a straight ride and observe the seat, aisle and
 * threshold travel by 8 m while the standalone platform stays at the origin's
 * longitudinal station.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the posed doorway, parked relation and moving-frame scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Admits the built models and assembly, measures actual leaf geometry, queries affordance frames and samples a ride.
 * @evidence contracts/development/testing.md#independent-expectations SCRTD 1968 design fixes the 54-inch opening, 40-inch floor, 126-inch body width and 22-inch seat. Access Board §§1192.53(d) and 1192.57 give platform and hardware bounds. A straight 8 m course translates every rigid contact by 8 m.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the difference between shut, half-open and fully open, and between the moving and stationary supports.
 * @evidence contracts/development/testing.md#execution-ownership Local deterministic feature test, owning no host or external resources.
 */
export function test_archetype_rail_carriage(): void {
  const car: ReturnType<typeof createRailCarriage> = createRailCarriage();
  const platform: ReturnType<typeof createRailPlatform> = createRailPlatform();
  const leafWidth: number = 27 * 0.0254;
  const bodyHalfWidth: number = 63 * 0.0254;
  const floorHeight: number = 40 * 0.0254;
  const open: typeof car = car.articulate({ door: leafWidth });
  type Members = {
    car: ArchetypeAssembly.IMember<createRailCarriage.Affordance, never>;
    station: ArchetypeAssembly.IMember<"platform" | "platformEdge", never>;
  };
  const assembled: ArchetypeAssembly<Members> = ArchetypeAssembly.of<Members>("parked", "parked metro car", {
    car: { archetype: open, placement: ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }) },
    station: { archetype: platform, placement: ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }) },
  });
  TestValidator.predicate("car, platform and parked assembly are admitted", () =>
    [car, open, platform, assembled].every((model: IAutoMovieModel): boolean => validateModel({ model }).success),
  );

  // The free interval is between the physical inner edges of the two leaves.
  for (const travel of [0, leafWidth / 2, leafWidth]) {
    const pose: typeof car = car.articulate({ door: travel });
    const positive: number = leafEdge(pose, "door-lower", -1);
    const negative: number = leafEdge(pose, "doorFollower-lower", 1);
    TestValidator.predicate("paired leaves split the opening evenly", () =>
      nclose(positive, travel) && nclose(negative, -travel),
    );
    TestValidator.predicate("opposite-side pair stays closed", () =>
      nclose(leafEdge(pose, "farDoor1-lower", -1), 0) &&
      nclose(leafEdge(pose, "farDoor1Follower-lower", 1), 0),
    );
  }

  const sill: IAutoMovieAffordance = assembled.affordance("car/threshold");
  const doorway: IAutoMovieAffordance = assembled.affordance("car/doorway");
  const aisle: IAutoMovieAffordance = assembled.affordance("car/aisle");
  const seat: IAutoMovieAffordance = assembled.affordance("car/seat");
  const rail: IAutoMovieAffordance = assembled.affordance("car/grabRail");
  const edge: IAutoMovieAffordance = assembled.affordance("station/platformEdge");
  const top: IAutoMovieAffordance = assembled.affordance("station/platform");
  const gap: number = edge.frame.translation.x - bodyHalfWidth;
  TestValidator.predicate("door is 54 inches wide and sill ends at the car side", () =>
    doorway.kind === "aperture" &&
    nclose(doorway.width!, 54 * 0.0254) &&
    nclose(sill.depth!, 54 * 0.0254) &&
    sill.width! >= 0.32 &&
    nclose(sill.frame.translation.x + sill.width! / 2, bodyHalfWidth),
  );
  TestValidator.predicate("platform aligns with the sill and leaves a level boarding gap", () =>
    gap > 0 && gap <= 3 * 0.0254 &&
    nclose(sill.frame.translation.y, floorHeight) &&
    nclose(top.frame.translation.y, floorHeight) &&
    nclose(top.frame.translation.x - top.width! / 2, edge.frame.translation.x) &&
    nclose(top.frame.translation.z, 0),
  );
  TestValidator.predicate("clear aisle between transverse seats and usable vertical grab rail", () =>
    aisle.kind === "surface" && aisle.width! >= 32 * 0.0254 &&
    vclose(aisle.frame.translation, { x: 0, y: floorHeight, z: 0 }) &&
    seat.kind === "seat" && nclose(seat.width!, 22 * 0.0254) &&
    seat.frame.translation.x + seat.width! / 2 <= -aisle.width! / 2 + 1e-6 &&
    vclose(ArchetypeFrame.axis(seat.frame, "z"), { x: 0, y: 0, z: 1 }) &&
    rail.kind === "bar" && rail.aperture! >= 1.25 * 0.0254 &&
    rail.aperture! <= 1.5 * 0.0254 &&
    rail.frame.translation.z - rail.aperture! / 2 > leafWidth &&
    rail.frame.translation.x - rail.aperture! / 2 > aisle.width! / 2 &&
    vclose(ArchetypeFrame.axis(rail.frame, "x"), { x: 0, y: 1, z: 0 }),
  );

  const ride: ArchetypeRide.IRide<createRailCarriage.Affordance, never> =
    ArchetypeRide.along(car, {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 8 }],
      cruise: 2,
      startSpeed: 2,
      endSpeed: 2,
    });
  for (const contact of ["seat", "aisle", "threshold"] as const) {
    const from: IAutoMovieAffordance["frame"] = ride.frame(contact, 0);
    const to: IAutoMovieAffordance["frame"] = ride.frame(contact, ride.duration);
    TestValidator.predicate("rigid contact travels with the car", () =>
      vclose(to.translation, { ...from.translation, z: from.translation.z + 8 }),
    );
  }
  TestValidator.predicate("standalone platform stays at the parked bay", () =>
    nclose(platform.affordance("platformEdge").frame.translation.z, 0),
  );
}

/** The inside edge of a lower door panel, in local longitudinal metres. */
function leafEdge(
  car: ReturnType<typeof createRailCarriage>,
  id: string,
  direction: -1 | 1,
): number {
  const part: IAutoMovieModelPart | undefined = car.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (
    part?.transform === undefined || part.transform === null ||
    part.geometry.type !== "primitive" || part.geometry.shape.type !== "box"
  )
    throw new Error("Missing leaf panel " + id);
  return part.transform.translation.z + direction * part.geometry.shape.depth / 2;
}
