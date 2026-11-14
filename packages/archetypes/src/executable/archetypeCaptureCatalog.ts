import type { IAutoMovieTransform } from "@automovie/interface";

import { HorseGait, createHorse, rideHorse } from "../animals";
import {
  createAppliance,
  createBar,
  createDoor,
  createLadder,
  createObstacle,
  createRamp,
  createSanitary,
  createStairs,
  createSwitch,
  createWall,
  createWindow,
} from "../architecture";
import { type Archetype, type ArchetypeCourse, ArchetypeRide } from "../core";
import {
  createBed,
  createLoad,
  createSeat,
  createStorage,
  createTable,
} from "../furniture";
import { createBoxingGlove, createHeavyBag } from "../gym";
import {
  createBag,
  createBox,
  createCareItem,
  createDevice,
  createDrinkware,
  createFood,
  createLight,
  createLongTool,
  createSmoking,
  createStationery,
  createTableware,
  createMobilityAid,
  createTool,
  createUmbrella,
  createVessel,
} from "../props";
import { createHighJump, createPoolEdge } from "../sport";
import {
  createBicycle,
  createCar,
  createCart,
  createMotorcycle,
  driveCar,
  rideBicycle,
  rideMotorcycle,
} from "../vehicles";
import {
  createClub,
  createHandgun,
  createHolster,
  createLongGun,
  createMagazine,
  createPell,
  createPolearm,
  createShield,
  createSword,
} from "../weapons";

/** A course for the moving subjects: a short straight, a quarter turn to the left, a short straight. */
const COURSE: ArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 8 },
    { kind: "turn", radius: 8, angle: 90 },
    { kind: "straight", length: 6 },
  ],
  cruise: 4,
  acceleration: 2,
  deceleration: 2,
};

/**
 * The archetypes the capture subjects module draws, by subject name: subjects that each hold every kind of a few related producers at the middle of their bands (a family's props take three), one holding the articulated states a visual check has to see, and one per ride.
 *
 * This is an inspection list, not a registry: nothing in the package reads it but `subjects.ts`, and a production calls the producers themselves.
 *
 * @returns The subjects by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the list is for and that nothing else reads it.
 * @evidence contracts/development/implementation.md#principled-implementation Every producer and kind through its own public call at the middle of its bands, each vehicle's ride over one shared course and each gait down one 40 m straight.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three helpers (a still subject, a producer's kinds, a ride) and one literal of subjects.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No archetype is built here by hand; an inspection list, never a registry a production reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds about a hundred small models once per page load.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once by the subjects module.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds plain data only.
 */
export function archetypeCaptureCatalog(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const still = (
    members: Record<string, Archetype>,
  ): archetypeCaptureCatalog.ISubject => ({
    members: Object.entries(members).map(
      ([name, archetype]: [
        string,
        Archetype,
      ]): archetypeCaptureCatalog.IMember => ({
        name,
        at: (): { archetype: Archetype } => ({ archetype }),
      }),
    ),
  });
  const kinds = <Kind extends string>(
    prefix: string,
    list: readonly Kind[],
    create: (kind: Kind) => Archetype,
  ): Record<string, Archetype> =>
    Object.fromEntries(
      list.map((kind: Kind): [string, Archetype] => [
        `${prefix}-${kind}`,
        create(kind),
      ]),
    );
  const moving = <Id extends string, Dimension extends string>(
    name: string,
    ride: ArchetypeRide.IRide<Id, Dimension>,
  ): archetypeCaptureCatalog.ISubject => ({
    members: [
      {
        name,
        at: (
          seconds: number,
        ): {
          archetype: Archetype;
          placement: IAutoMovieTransform;
        } => ride.at(seconds),
      },
    ],
    duration: ride.duration,
    instants: ride.instants,
  });

  const door: ReturnType<typeof createDoor> = createDoor({ hardware: "lever" });
  const chest: ReturnType<typeof createStorage> = createStorage({
    kind: "chest",
  });
  const wardrobe: ReturnType<typeof createStorage> = createStorage({
    kind: "wardrobe",
  });
  const suitcase: ReturnType<typeof createBag> = createBag({
    kind: "suitcase",
  });
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" });
  const bicycle: ReturnType<typeof createBicycle> = createBicycle();
  const horse: ReturnType<typeof createHorse> = createHorse();
  const carbine: ReturnType<typeof createLongGun> = createLongGun({
    kind: "carbine",
  });

  // Each gait goes down one long straight, so a fixed side camera sees whole strides at the cruising speed.
  const gaits: Record<string, archetypeCaptureCatalog.ISubject> = {};
  for (const gait of HorseGait.GAITS)
    gaits[`ride-horse-${gait}`] = moving(
      "horse",
      rideHorse(
        horse,
        {
          ...COURSE,
          legs: [{ kind: "straight", length: 40 }],
          cruise: gait === "walk" ? 1.5 : gait === "trot" ? 4 : 6,
        },
        gait,
      ),
    );
  return {
    drinkware: still(
      kinds(
        "drinkware",
        createDrinkware.KINDS,
        (kind: createDrinkware.Kind): Archetype => createDrinkware({ kind }),
      ),
    ),
    "small-props": still({
      ...kinds(
        "device",
        createDevice.KINDS,
        (kind: createDevice.Kind): Archetype => createDevice({ kind }),
      ),
      ...kinds(
        "smoking",
        createSmoking.KINDS,
        (kind: createSmoking.Kind): Archetype => createSmoking({ kind }),
      ),
      ...kinds(
        "stationery",
        createStationery.KINDS,
        (kind: createStationery.Kind): Archetype => createStationery({ kind }),
      ),
      ...kinds(
        "care",
        createCareItem.KINDS,
        (kind: createCareItem.Kind): Archetype => createCareItem({ kind }),
      ),
    }),
    "carried-props": still({
      ...kinds(
        "bag",
        createBag.KINDS,
        (kind: createBag.Kind): Archetype => createBag({ kind }),
      ),
      box: createBox(),
      ...kinds(
        "tool",
        createTool.KINDS,
        (kind: createTool.Kind): Archetype => createTool({ kind }),
      ),
      ...kinds(
        "longTool",
        createLongTool.KINDS,
        (kind: createLongTool.Kind): Archetype => createLongTool({ kind }),
      ),
    }),
    tableware: still({
      ...kinds(
        "tableware",
        createTableware.KINDS,
        (kind: createTableware.Kind): Archetype => createTableware({ kind }),
      ),
      ...kinds(
        "food",
        createFood.KINDS,
        (kind: createFood.Kind): Archetype => createFood({ kind }),
      ),
      ...kinds(
        "light",
        createLight.KINDS,
        (kind: createLight.Kind): Archetype => createLight({ kind }),
      ),
      umbrella: createUmbrella(),
      "umbrella-open": createUmbrella({ open: true }),
      ...kinds(
        "mobilityAid",
        createMobilityAid.KINDS,
        (kind: createMobilityAid.Kind): Archetype =>
          createMobilityAid({ kind }),
      ),
      ...kinds(
        "vessel",
        createVessel.KINDS,
        (kind: createVessel.Kind): Archetype => createVessel({ kind }),
      ),
    }),
    seats: still(
      kinds(
        "seat",
        createSeat.KINDS,
        (kind: createSeat.Kind): Archetype => createSeat({ kind }),
      ),
    ),
    furniture: still({
      ...kinds(
        "bed",
        createBed.KINDS,
        (kind: createBed.Kind): Archetype => createBed({ kind }),
      ),
      ...kinds(
        "table",
        createTable.KINDS,
        (kind: createTable.Kind): Archetype => createTable({ kind }),
      ),
      ...kinds(
        "storage",
        createStorage.KINDS,
        (kind: createStorage.Kind): Archetype => createStorage({ kind }),
      ),
      ...kinds(
        "load",
        createLoad.KINDS,
        (kind: createLoad.Kind): Archetype => createLoad({ kind }),
      ),
    }),
    doors: still({
      "door-lever-right": door,
      "door-knob-left": createDoor({ hinge: "left", hardware: "knob" }),
      "door-plate-right": createDoor({ hardware: "plate" }),
      "door-sliding-left": createDoor({ kind: "sliding", hinge: "left" }),
      ...kinds(
        "window",
        createWindow.KINDS,
        (kind: createWindow.Kind): Archetype => createWindow({ kind }),
      ),
      ...kinds(
        "switch",
        createSwitch.KINDS,
        (kind: createSwitch.Kind): Archetype => createSwitch({ kind }),
      ),
    }),
    climbing: still({
      stairs: createStairs({ steps: 8 }),
      ramp: createRamp(),
      ...kinds(
        "ladder",
        createLadder.KINDS,
        (kind: createLadder.Kind): Archetype =>
          createLadder({ kind, rungs: 8 }),
      ),
      ...kinds(
        "bar",
        createBar.KINDS,
        (kind: createBar.Kind): Archetype => createBar({ kind }),
      ),
      ...kinds(
        "wall",
        createWall.KINDS,
        (kind: createWall.Kind): Archetype => createWall({ kind }),
      ),
    }),
    fixtures: still({
      ...kinds(
        "sanitary",
        createSanitary.KINDS,
        (kind: createSanitary.Kind): Archetype => createSanitary({ kind }),
      ),
      ...kinds(
        "appliance",
        createAppliance.KINDS,
        (kind: createAppliance.Kind): Archetype => createAppliance({ kind }),
      ),
    }),
    obstacles: still(
      kinds(
        "obstacle",
        createObstacle.KINDS,
        (kind: createObstacle.Kind): Archetype => createObstacle({ kind }),
      ),
    ),
    vehicles: still({
      ...kinds(
        "car",
        createCar.KINDS,
        (kind: createCar.Kind): Archetype => createCar({ kind }),
      ),
      bicycle,
      ...kinds(
        "motorcycle",
        createMotorcycle.KINDS,
        (kind: createMotorcycle.Kind): Archetype => createMotorcycle({ kind }),
      ),
      ...kinds(
        "cart",
        createCart.KINDS,
        (kind: createCart.Kind): Archetype => createCart({ kind }),
      ),
    }),
    horse: still({ horse }),
    weapons: still({
      ...kinds(
        "handgun",
        createHandgun.FRAMES,
        (frame: createHandgun.Frame): Archetype => createHandgun({ frame }),
      ),
      ...kinds(
        "holster",
        createHolster.KINDS,
        (kind: createHolster.Kind): Archetype => createHolster({ kind }),
      ),
      ...kinds(
        "magazine",
        createMagazine.KINDS,
        (kind: createMagazine.Kind): Archetype => createMagazine({ kind }),
      ),
      ...kinds(
        "longGun",
        createLongGun.KINDS,
        (kind: createLongGun.Kind): Archetype => createLongGun({ kind }),
      ),
      ...kinds(
        "club",
        createClub.KINDS,
        (kind: createClub.Kind): Archetype => createClub({ kind }),
      ),
    }),
    blades: still({
      ...kinds(
        "sword",
        createSword.KINDS,
        (kind: createSword.Kind): Archetype => createSword({ kind }),
      ),
      ...kinds(
        "shield",
        createShield.KINDS,
        (kind: createShield.Kind): Archetype => createShield({ kind }),
      ),
      ...kinds(
        "polearm",
        createPolearm.KINDS,
        (kind: createPolearm.Kind): Archetype => createPolearm({ kind }),
      ),
      pell: createPell(),
    }),
    articulated: still({
      "door-open": door.articulate({ hinge: 70, latch: 45 }),
      "door-sliding-open": createDoor({ kind: "sliding" }).articulate({
        slide: 0.6,
      }),
      "chest-drawn": chest.articulate({ drawer2: 0.3, drawer3: 0.15 }),
      "wardrobe-open": wardrobe.articulate({ leftDoor: 95, rightDoor: 45 }),
      "suitcase-drawn": suitcase.articulate({
        telescope: suitcase.affordance("telescope").travel!,
      }),
      "window-open": createWindow({ kind: "casement" }).articulate({
        sash: 60,
      }),
      "book-open": createStationery({ kind: "book" }).articulate({
        hinge: 150,
      }),
      "bread-torn": createFood({ kind: "bread" }).articulate({
        tear: createFood.TEAR,
      }),
      "pouch-open": createHolster({ kind: "pouch" }).articulate({ lid: 120 }),
      "car-doors-open": car.articulate({
        driverDoor: 65,
        passengerDoor: 30,
        wheel: 90,
      }),
      "bicycle-quarter": bicycle.articulate({ crank: 90 }),
      "toilet-lid-down": createSanitary({ kind: "toilet" }).articulate({
        lid: createSanitary.ESTIMATES.lift,
      }),
      "fridge-open": createAppliance({ kind: "refrigerator" }).articulate({
        fridgeDoor: 90,
      }),
      "oven-open": createAppliance({ kind: "cooker" }).articulate({
        ovenDoor: 90,
      }),
      "carbine-extended": carbine.articulate({
        stock: carbine.affordance("stock").travel!,
      }),
    }),
    "sport-venues": still({
      "pole-vault": createHighJump({ kind: "poleVault" }),
      ...kinds(
        "poolEdge",
        createPoolEdge.KINDS,
        (kind: createPoolEdge.Kind): Archetype => createPoolEdge({ kind }),
      ),
      boxingGlove: createBoxingGlove(),
      heavyBag: createHeavyBag(),
    }),
    "ride-car": moving("car", driveCar(car, COURSE)),
    "ride-bicycle": moving("bicycle", rideBicycle(bicycle, COURSE)),
    "ride-motorcycle": moving(
      "motorcycle",
      rideMotorcycle(createMotorcycle({ kind: "motorcycle" }), COURSE),
    ),
    "ride-trolley": moving(
      "trolley",
      ArchetypeRide.along(createCart({ kind: "trolley" }), {
        ...COURSE,
        cruise: 1.3,
      }),
    ),
    ...gaits,
  };
}

/**
 * Companion types of {@link archetypeCaptureCatalog}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names.
 * @evidence contracts/development/design.md#principled-representation A subject as members sampled by film second, the form the draw page seeks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `subjects.ts` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A still member and a moving one share one sampler, so the page has one path.
 */
export namespace archetypeCaptureCatalog {
  /** One archetype drawn in a subject, under its own object name. */
  export interface IMember {
    /** The object's name in the scene, the first segment of its parts' and marks' paths. */
    name: string;

    /** The archetype at a second of the subject's clock, and its root's placement in the world when it moves. */
    at(seconds: number): {
      archetype: Archetype;
      placement?: IAutoMovieTransform;
    };
  }

  /** One drawn subject: its members, which the subjects module sets apart along a diagonal when there are several. */
  export interface ISubject {
    /** The archetypes drawn. */
    members: readonly IMember[];

    /** Running time in seconds of a moving subject; absent for a still one. */
    duration?: number;

    /** Named instants of a moving subject. */
    instants?: readonly { seconds: number; label: string }[];
  }
}
