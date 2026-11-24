import {
  AutoMovieArchetypeAssembly,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  createRailCarriage,
  createRailPlatform,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/**
 * A level-boarding rapid-transit car has a real door opening and usable
 * supports with a stationary platform and the option to move the car alone.
 *
 * Scenarios:
 * 1. Measure both platform-side leaf edges at rest, halfway open and fully
 * open. The opposite side stays shut and the open model admits.
 * 2. At rest, assemble the open car beside the platform. Read the geometry of
 * the adjoining supports, independent gap and height bounds, an unobstructed
 * center aisle, a transverse seat and a vertical, grippable rail.
 * 3. Move the car 8 m on a straight ride and observe the seat, aisle and
 * threshold travel by 8 m while the standalone platform stays at the origin's
 * longitudinal station.
 * 4. Measure the legacy seat height and both accepted bounds on the cushion
 * and contact. Check boarding contacts and paired leaf travel at both bounds.
 * 5. Refuse values below and above the band and nonfinite heights.
 */
export function test_unit_archetypes_vehicles_rail_carriage(): void {
  const car: ReturnType<typeof createRailCarriage> = createRailCarriage();
  const platform: ReturnType<typeof createRailPlatform> = createRailPlatform();
  const leafWidth: number = 27 * 0.0254;
  const bodyHalfWidth: number = 63 * 0.0254;
  const floorHeight: number = 40 * 0.0254;
  const open: typeof car = car.articulate({ door: leafWidth });
  type Members = {
    car: AutoMovieArchetypeAssembly.IMember<
      createRailCarriage.Affordance,
      createRailCarriage.Dimension
    >;
    station: AutoMovieArchetypeAssembly.IMember<
      "platform" | "platformEdge",
      never
    >;
  };
  const assembled: AutoMovieArchetypeAssembly<Members> =
    AutoMovieArchetypeAssembly.of<Members>("parked", "parked metro car", {
      car: {
        archetype: open,
        placement: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      },
      station: {
        archetype: platform,
        placement: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      },
    });
  TestValidator.predicate(
    "car, platform and parked assembly are admitted",
    () =>
      [car, open, platform, assembled].every(
        (model: IAutoMovieModel): boolean => validateModel({ model }).success,
      ),
  );

  // The free interval is between the physical inner edges of the two leaves.
  for (const [travel, pose] of [
    [0, car.articulate({ door: 0 })],
    [leafWidth / 2, car.articulate({ door: leafWidth / 2 })],
    [leafWidth, open],
  ] as const) {
    const positive: number = leafEdge(pose, "door-lower", -1);
    const negative: number = leafEdge(pose, "doorFollower-lower", 1);
    TestValidator.predicate(
      "paired leaves split the opening evenly",
      () => nclose(positive, travel) && nclose(negative, -travel),
    );
    TestValidator.predicate(
      "opposite-side pair stays closed",
      () =>
        nclose(leafEdge(pose, "farDoor1-lower", -1), 0) &&
        nclose(leafEdge(pose, "farDoor1Follower-lower", 1), 0),
    );
  }

  const sill: IAutoMovieAffordance = assembled.affordance("car/threshold");
  const doorway: IAutoMovieAffordance = assembled.affordance("car/doorway");
  const aisle: IAutoMovieAffordance = assembled.affordance("car/aisle");
  const seat: IAutoMovieAffordance = assembled.affordance("car/seat");
  const rail: IAutoMovieAffordance = assembled.affordance("car/grabRail");
  const edge: IAutoMovieAffordance = assembled.affordance(
    "station/platformEdge",
  );
  const top: IAutoMovieAffordance = assembled.affordance("station/platform");
  const gap: number = edge.frame.translation.x - bodyHalfWidth;
  TestValidator.predicate(
    "door is 54 inches wide and sill ends at the car side",
    () =>
      doorway.kind === "aperture" &&
      nclose(doorway.width!, 54 * 0.0254) &&
      nclose(sill.depth!, 54 * 0.0254) &&
      sill.width! >= 0.32 &&
      nclose(sill.frame.translation.x + sill.width! / 2, bodyHalfWidth),
  );
  TestValidator.predicate(
    "platform aligns with the sill and leaves a level boarding gap",
    () =>
      gap > 0 &&
      gap <= 3 * 0.0254 &&
      nclose(sill.frame.translation.y, floorHeight) &&
      nclose(top.frame.translation.y, floorHeight) &&
      nclose(
        top.frame.translation.x - top.width! / 2,
        edge.frame.translation.x,
      ) &&
      nclose(top.frame.translation.z, 0),
  );
  TestValidator.predicate(
    "clear aisle between transverse seats and usable vertical grab rail",
    () =>
      aisle.kind === "surface" &&
      aisle.width! >= 32 * 0.0254 &&
      vclose(aisle.frame.translation, { x: 0, y: floorHeight, z: 0 }) &&
      seat.kind === "seat" &&
      nclose(seat.width!, 22 * 0.0254) &&
      seat.frame.translation.x + seat.width! / 2 <= -aisle.width! / 2 + 1e-6 &&
      vclose(AutoMovieArchetypeFrame.axis(seat.frame, "z"), {
        x: 0,
        y: 0,
        z: 1,
      }) &&
      rail.kind === "bar" &&
      rail.aperture! >= 1.25 * 0.0254 &&
      rail.aperture! <= 1.5 * 0.0254 &&
      rail.frame.translation.z - rail.aperture! / 2 > leafWidth &&
      rail.frame.translation.x - rail.aperture! / 2 > aisle.width! / 2 &&
      vclose(AutoMovieArchetypeFrame.axis(rail.frame, "x"), {
        x: 0,
        y: 1,
        z: 0,
      }),
  );

  const ride: AutoMovieArchetypeRide.IRide<
    createRailCarriage.Affordance,
    createRailCarriage.Dimension
  > = AutoMovieArchetypeRide.along(car, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 8 }],
    cruise: 2,
    startSpeed: 2,
    endSpeed: 2,
  });
  for (const contact of ["seat", "aisle", "threshold"] as const) {
    const local: IAutoMovieAffordance["frame"] = car.affordance(contact).frame;
    TestValidator.predicate(`${contact} travels with the carriage`, () =>
      vclose(ride.frame(contact, ride.duration).translation, {
        ...local.translation,
        z: local.translation.z + 8,
      }),
    );
  }
  TestValidator.predicate("standalone platform stays at the parked bay", () =>
    nclose(platform.affordance("platformEdge").frame.translation.z, 0),
  );

  const minimum: number = 17 * 0.0254;
  const maximum: number = 19 * 0.0254;
  const legacy: typeof car = createRailCarriage("legacy-carriage");
  for (const [variant, height] of [
    [legacy, 0.45],
    [createRailCarriage("low-seat", { seatHeight: minimum }), minimum],
    [createRailCarriage("high-seat", { seatHeight: maximum }), maximum],
  ] as const) {
    const floor: number = boxTop(variant, "cabin-floor");
    const cushion: number = boxTop(variant, "seat-pad-front-0--1");
    const contact: IAutoMovieAffordance = variant.affordance("seat");
    TestValidator.predicate(
      "record, cushion top and seat contact use the requested floor-relative height",
      () =>
        variant.dimensions.seatHeight !== undefined &&
        nclose(variant.dimensions.seatHeight, height) &&
        variant.provenance.units.seatHeight === "m" &&
        nclose(floor, floorHeight) &&
        nclose(cushion - floor, height) &&
        nclose(contact.frame.translation.y, cushion),
    );

    if (variant === legacy) continue;
    const posed: typeof car = variant.articulate({ door: leafWidth });
    TestValidator.predicate(
      "seat height preserves the paired door opening",
      () =>
        nclose(leafEdge(posed, "door-lower", -1), leafWidth) &&
        nclose(leafEdge(posed, "doorFollower-lower", 1), -leafWidth) &&
        validateModel({ model: posed }).success,
    );
    for (const [id, expected] of [
      ["threshold", sill],
      ["doorway", doorway],
      ["aisle", aisle],
      ["grabRail", rail],
    ] as const) {
      const actual: IAutoMovieAffordance = posed.affordance(id);
      TestValidator.predicate(
        "seat height preserves the boarding contact frame",
        () =>
          vclose(actual.frame.translation, expected.frame.translation) &&
          qclose(actual.frame.rotation, expected.frame.rotation),
      );
    }
  }
  TestValidator.predicate(
    "string-only and default carriage ids",
    () => legacy.id === "legacy-carriage" && car.id === "railCarriage",
  );

  for (const height of [minimum - 0.01, maximum + 0.01]) {
    TestValidator.predicate(
      "invalid seat height reports the feasible metre band",
      () => {
        try {
          createRailCarriage(undefined, { seatHeight: height });
        } catch (error) {
          return (
            error instanceof AutoMovieArchetypeRefusal &&
            error.kind === "parameter" &&
            error.axis === "seatHeight" &&
            Object.is(error.value, height) &&
            error.feasible?.kind === "range" &&
            error.feasible.unit === "m" &&
            error.feasible.minimum !== null &&
            error.feasible.maximum !== null &&
            nclose(error.feasible.minimum, minimum) &&
            nclose(error.feasible.maximum, maximum)
          );
        }
        return false;
      },
    );
  }
}

/** The upper surface of a named box, in carriage-local vertical metres. */
function boxTop(
  car: ReturnType<typeof createRailCarriage>,
  id: string,
): number {
  const part: IAutoMovieModelPart | undefined = car.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (
    part?.transform === undefined ||
    part.transform === null ||
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "box"
  )
    throw new Error("Missing box " + id);
  return part.transform.translation.y + part.geometry.shape.height / 2;
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
    part?.transform === undefined ||
    part.transform === null ||
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "box"
  )
    throw new Error("Missing leaf panel " + id);
  return (
    part.transform.translation.z + (direction * part.geometry.shape.depth) / 2
  );
}
