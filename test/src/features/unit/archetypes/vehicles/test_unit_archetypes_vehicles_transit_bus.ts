import {
  AutoMovieArchetypeFrame,
  createTransitBus,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * A city bus gives passengers separate curbside routes and a cabin support
 * system that stays in place while the doors move.
 *
 * Scenarios:
 *
 * 1. Admit the closed bus and each independently posed pair. Read physical leaf
 *    edges at shut, half-open and fully open.
 * 2. Measure both thresholds against the deck and doorway geometry. Check aisle
 *    clearance, the seat surface and the position of each handhold.
 * 3. Check the sourced bus dimensions and the fixed axle positions in both closed
 *    and open poses.
 * 4. Replay numeric and string seeds, measure the space between the opposing
 *    seats, and open both doors across different seating fits.
 */
export function test_unit_archetypes_vehicles_transit_bus(): void {
  const bus: ReturnType<typeof createTransitBus> = createTransitBus("city-bus");
  const length: number = 482 * 0.0254;
  const width: number = 102 * 0.0254;
  const floor: number = 14 * 0.0254;
  const deck: ReturnType<typeof box> = box(bus, "deck");
  const aisle: IAutoMovieAffordance = bus.affordance("aisle");
  const seat: IAutoMovieAffordance = bus.affordance("seat");
  TestValidator.predicate(
    "documented city bus envelope and cabin floor",
    () =>
      bus.id === "city-bus" &&
      nclose(box(bus, "roof").width, width) &&
      nclose(deck.depth, length) &&
      nclose(deck.y + deck.height / 2, floor),
  );
  TestValidator.predicate(
    "continuous center aisle and forward-facing seat",
    () =>
      aisle.kind === "surface" &&
      aisle.width! >= 0.559 &&
      aisle.width! <= 0.61 &&
      aisle.depth! >= 12 &&
      aisle.width! < deck.width &&
      vclose(aisle.frame.translation, { x: 0, y: floor, z: 0 }) &&
      seat.kind === "seat" &&
      seat.frame.translation.x - seat.width! / 2 >= aisle.width! / 2 - 1e-6 &&
      nclose(seat.frame.translation.y, floor + 0.46) &&
      vclose(AutoMovieArchetypeFrame.axis(seat.frame, "z"), {
        x: 0,
        y: 0,
        z: 1,
      }),
  );

  const front: IAutoMovieAffordance = bus.affordance("frontDoorway");
  const rear: IAutoMovieAffordance = bus.affordance("rearDoorway");
  const frontTyre: IAutoMovieModelPart = part(bus, "tyre-front-1");
  const rearTyre: IAutoMovieModelPart = part(bus, "tyre-rear-1");
  TestValidator.predicate(
    "front entrance is ahead of the front axle and rear exit lies between axles",
    () =>
      front.frame.translation.z > frontTyre.transform!.translation.z &&
      rear.frame.translation.z < frontTyre.transform!.translation.z &&
      rear.frame.translation.z > rearTyre.transform!.translation.z &&
      nclose(
        frontTyre.transform!.translation.z - rearTyre.transform!.translation.z,
        283.75 * 0.0254,
      ),
  );

  for (const name of ["front", "rear"] as const) {
    const other: "front" | "rear" = name === "front" ? "rear" : "front";
    const doorway: IAutoMovieAffordance = bus.affordance(`${name}Doorway`);
    const threshold: IAutoMovieAffordance = bus.affordance(`${name}Threshold`);
    const rail: IAutoMovieAffordance = bus.affordance(`${name}GrabRail`);
    const z: number = doorway.frame.translation.z;
    const sideDeck: ReturnType<typeof box> = box(
      bus,
      name === "front" ? "deck-edge-fore--1" : "deck-edge-mid--1",
    );
    const otherZ: number = bus.affordance(`${other}Doorway`).frame.translation
      .z;
    TestValidator.predicate(
      name + " opening and threshold meet at the curb-side deck edge",
      () =>
        doorway.kind === "aperture" &&
        vclose(doorway.frame.translation, { x: -width / 2, y: floor, z }) &&
        vclose(AutoMovieArchetypeFrame.axis(doorway.frame, "z"), {
          x: -1,
          y: 0,
          z: 0,
        }) &&
        nclose(doorway.width!, 0.9) &&
        doorway.height! >= 2 &&
        threshold.kind === "surface" &&
        threshold.width! >= 0.32 &&
        nclose(threshold.depth!, 0.9) &&
        nclose(
          threshold.frame.translation.x - threshold.width! / 2,
          sideDeck.x - sideDeck.width / 2,
        ) &&
        nclose(sideDeck.x + sideDeck.width / 2, -deck.width / 2) &&
        nclose(sideDeck.y + sideDeck.height / 2, floor) &&
        Math.abs(sideDeck.z - z) + 0.45 < sideDeck.depth / 2 &&
        nclose(threshold.frame.translation.y, floor) &&
        nclose(threshold.frame.translation.z, z),
    );
    TestValidator.predicate(
      name + " handhold clears the transverse passenger route",
      () =>
        rail.kind === "bar" &&
        rail.aperture! >= 1.25 * 0.0254 &&
        rail.aperture! <= 1.5 * 0.0254 &&
        -rail.frame.translation.x - rail.aperture! / 2 > aisle.width! / 2 &&
        Math.abs(rail.frame.translation.z - z) - rail.aperture! / 2 > 0.45 &&
        vclose(AutoMovieArchetypeFrame.axis(rail.frame, "x"), {
          x: 0,
          y: 1,
          z: 0,
        }),
    );

    for (const travel of [0, 0.225, 0.45]) {
      const pose: typeof bus =
        name === "front"
          ? bus.articulate({ frontDoor: travel })
          : bus.articulate({ rearDoor: travel });
      const leader: ReturnType<typeof box> = box(pose, name + "Door-panel");
      const follower: ReturnType<typeof box> = box(
        pose,
        name + "DoorFollower-panel",
      );
      const parkedLeader: ReturnType<typeof box> = box(
        pose,
        other + "Door-panel",
      );
      const parkedFollower: ReturnType<typeof box> = box(
        pose,
        other + "DoorFollower-panel",
      );
      TestValidator.predicate(
        name + " opens symmetrically at " + travel,
        () =>
          validateModel({ model: pose }).success &&
          nclose(leader.z - leader.depth / 2, z + travel) &&
          nclose(follower.z + follower.depth / 2, z - travel) &&
          nclose(parkedLeader.z - parkedLeader.depth / 2, otherZ) &&
          nclose(parkedFollower.z + parkedFollower.depth / 2, otherZ),
      );
      TestValidator.predicate(
        name + " pose retains rigid contacts and axles at " + travel,
        () =>
          vclose(
            pose.affordance("seat").frame.translation,
            seat.frame.translation,
          ) &&
          vclose(
            pose.affordance(`${name}Threshold`).frame.translation,
            threshold.frame.translation,
          ) &&
          vclose(
            part(pose, frontTyre.id).transform!.translation,
            frontTyre.transform!.translation,
          ) &&
          vclose(
            part(pose, rearTyre.id).transform!.translation,
            rearTyre.transform!.translation,
          ),
      );
    }
  }

  checkSeatingFits(bus);
}

/** Measures the seat-bank clearance and the boarding contacts at different fits. */
function checkSeatingFits(neutral: ReturnType<typeof createTransitBus>): void {
  const seeded: typeof neutral = createTransitBus("city-bus", 0);
  const replay: typeof neutral = createTransitBus("city-bus", 0);
  const textSeed: typeof neutral = createTransitBus("city-bus", 0);
  const other: typeof neutral = createTransitBus("city-bus", 1014);
  const neutralClearance: number = aisleClearance(neutral);
  const seededClearance: number = aisleClearance(seeded);
  const otherClearance: number = aisleClearance(other);
  TestValidator.predicate(
    "the neutral width is preserved and equivalent seeds replay physical clearance",
    () =>
      nclose(neutralClearance, 0.59) &&
      seededClearance === aisleClearance(replay) &&
      seededClearance === aisleClearance(textSeed) &&
      !nclose(seededClearance, otherClearance),
  );
  for (const [bus, width] of [
    [neutral, neutralClearance],
    [seeded, seededClearance],
    [other, otherClearance],
  ] as const) {
    const band: (typeof bus.provenance.bands)["aisleWidth"] =
      bus.provenance.bands.aisleWidth;
    const opened: typeof bus = bus.articulate({
      frontDoor: 0.45,
      rearDoor: 0.45,
    });
    TestValidator.predicate(
      "physical clearance agrees with the sourced dimension and seat contact",
      () =>
        band?.minimum === 0.559 &&
        band.maximum === 0.61 &&
        bus.provenance.units.aisleWidth === "m" &&
        width >= 0.559 - 1e-6 &&
        width <= 0.61 + 1e-6 &&
        nclose(width, bus.dimensions.aisleWidth!) &&
        nclose(width, bus.affordance("aisle").width!) &&
        nclose(width, aisleClearance(opened)) &&
        nclose(
          bus.affordance("seat").frame.translation.x,
          box(bus, "street-0.98-cushion--1").x,
        ),
    );
    TestValidator.predicate(
      "the configured bus admits both open doors",
      () => validateModel({ model: opened }).success,
    );
    for (const name of ["front", "rear"] as const) {
      const z: number = neutral.affordance(`${name}Doorway`).frame.translation
        .z;
      const leader: ReturnType<typeof box> = box(opened, name + "Door-panel");
      const follower: ReturnType<typeof box> = box(
        opened,
        name + "DoorFollower-panel",
      );
      TestValidator.predicate(
        name + " door and boarding contacts stay fixed across seating fits",
        () =>
          nclose(leader.z - leader.depth / 2, z + 0.45) &&
          nclose(follower.z + follower.depth / 2, z - 0.45) &&
          (["Doorway", "Threshold", "GrabRail"] as const).every(
            (contact): boolean =>
              vclose(
                opened.affordance(`${name}${contact}`).frame.translation,
                neutral.affordance(`${name}${contact}`).frame.translation,
              ),
          ),
      );
    }
  }
}

/** Reads opposing cushion edges at a station with seats on both sides. */
function aisleClearance(bus: ReturnType<typeof createTransitBus>): number {
  const street: ReturnType<typeof box> = box(bus, "street-0.98-cushion--1");
  const curb: ReturnType<typeof box> = box(bus, "curb-0.98-cushion-1");
  return street.x - street.width / 2 - (curb.x + curb.width / 2);
}

/** Finds actual geometry so an omitted part fails the specification. */
function part(
  bus: ReturnType<typeof createTransitBus>,
  id: string,
): IAutoMovieModelPart {
  const found: IAutoMovieModelPart | undefined = bus.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (
    found === undefined ||
    found.transform === undefined ||
    found.transform === null
  )
    throw new Error("Missing placed bus geometry " + id);
  return found;
}

/** Reads physical box dimensions and the tested center coordinates. */
function box(
  bus: ReturnType<typeof createTransitBus>,
  id: string,
): {
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
} {
  const modelPart: IAutoMovieModelPart = part(bus, id);
  if (
    modelPart.geometry.type !== "primitive" ||
    modelPart.geometry.shape.type !== "box"
  )
    throw new Error("Missing box geometry " + id);
  return {
    width: modelPart.geometry.shape.width,
    height: modelPart.geometry.shape.height,
    depth: modelPart.geometry.shape.depth,
    x: modelPart.transform!.translation.x,
    y: modelPart.transform!.translation.y,
    z: modelPart.transform!.translation.z,
  };
}
