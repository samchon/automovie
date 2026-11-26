import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetypeEquineGait,
  createHorse,
  rideHorse,
} from "../animals";
import type { AutoMovieArchetypeQuadrupedBody } from "../animals/AutoMovieArchetypeQuadrupedBody";
import {
  createAppliance,
  createDoor,
  createSanitary,
  createWindow,
} from "../architecture";
import { type AutoMovieArchetype, AutoMovieArchetypeRide } from "../core";
import {
  createBarrel,
  createBed,
  createConsole,
  createHighChair,
  createLectern,
  createLoad,
  createSafe,
  createSeat,
  createShowcase,
  createStorage,
  createTable,
} from "../furniture";
import {
  createBalanceBeam,
  createBoxingGlove,
  createHeavyBag,
  createRhythmicBall,
  createStillRings,
  createUnevenBars,
  createWoodenDummy,
} from "../gym";
import { createInstrument, createMicrophone } from "../music";
import { createFireRing, createRock, createTent, createTree } from "../nature";
import {
  createBag,
  createBox,
  createCareItem,
  createDevice,
  createDrinkware,
  createFood,
  createLight,
  createLongTool,
  createMobilityAid,
  createSmoking,
  createStationery,
  createTableware,
  createTool,
  createUmbrella,
  createVessel,
} from "../props";
import {
  createCue,
  createCueTable,
  createGoal,
  createHighJump,
  createPoolEdge,
  createSkateboard,
  createSki,
  createStick,
  createSurfboard,
} from "../sport";
import {
  AutoMovieArchetypeBicycle,
  AutoMovieArchetypeCar,
  AutoMovieArchetypeMotorcycle,
  createBoat,
  createCart,
  createDeck,
  createWheelchair,
  driveCar,
  rideBicycle,
  rideMotorcycle,
} from "../vehicles";
import { createLongGun } from "../weapons";
import { archetypeCaptureAnimals } from "./archetypeCaptureAnimals";
import { archetypeCaptureArmoury } from "./archetypeCaptureArmoury";
import { archetypeCaptureBreakage } from "./archetypeCaptureBreakage";
import { archetypeCaptureCarOpenings } from "./archetypeCaptureCarOpenings";
import { archetypeCaptureCourse } from "./archetypeCaptureCourse";
import { archetypeCaptureDogGaits } from "./archetypeCaptureDogGaits";
import { archetypeCaptureExtendedArmoury } from "./archetypeCaptureExtendedArmoury";
import { archetypeCaptureFixtures } from "./archetypeCaptureFixtures";
import { archetypeCaptureQuadrupeds } from "./archetypeCaptureQuadrupeds";
import { archetypeCaptureReferenceAnimals } from "./archetypeCaptureReferenceAnimals";
import { archetypeCaptureRest } from "./archetypeCaptureRest";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";
import { archetypeCaptureSupportProps } from "./archetypeCaptureSupportProps";

/**
 * The archetypes the capture subjects module draws, by subject name: subjects
 * that each hold every kind of a few related producers at the middle of their
 * bands (a family's props take three), one holding the articulated states a
 * visual check has to see, and one per ride.
 *
 * This is an inspection list, not a registry: nothing in the package reads it
 * but `subjects.ts`, and a production calls the producers themselves.
 *
 * @returns The subjects by name.
 */
export function archetypeCaptureCatalog(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const still: typeof archetypeCaptureSubject.still =
    archetypeCaptureSubject.still;
  const kinds: typeof archetypeCaptureSubject.kinds =
    archetypeCaptureSubject.kinds;
  const moving: typeof archetypeCaptureSubject.moving =
    archetypeCaptureSubject.moving;

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
  const car: ReturnType<typeof AutoMovieArchetypeCar.create> =
    AutoMovieArchetypeCar.create({
      kind: "sedan",
    });
  const bicycle: ReturnType<typeof AutoMovieArchetypeBicycle.create> =
    AutoMovieArchetypeBicycle.create();
  const horse: ReturnType<typeof createHorse> = createHorse();
  const rings: ReturnType<typeof createStillRings> = createStillRings();
  const carbine: ReturnType<typeof createLongGun> = createLongGun({
    kind: "carbine",
  });

  // Each gait goes down one long straight, so a fixed side camera sees whole strides at the cruising speed.
  const gaits: Record<string, archetypeCaptureCatalog.ISubject> = {};
  for (const gait of AutoMovieArchetypeEquineGait.GAITS)
    gaits[`ride-horse-${gait}`] = moving(
      "horse",
      rideHorse(
        horse,
        {
          ...archetypeCaptureCourse,
          legs: [{ kind: "straight", length: 40 }],
          cruise: gait === "walk" ? 1.5 : gait === "trot" ? 4 : 6,
        },
        gait,
      ),
      horse,
    );
  return {
    drinkware: still(
      kinds(
        "drinkware",
        createDrinkware.KINDS,
        (kind: createDrinkware.Kind): AutoMovieArchetype =>
          createDrinkware({ kind }),
      ),
    ),
    "small-props": still({
      ...kinds(
        "device",
        createDevice.KINDS,
        (kind: createDevice.Kind): AutoMovieArchetype => createDevice({ kind }),
      ),
      ...kinds(
        "smoking",
        createSmoking.KINDS,
        (kind: createSmoking.Kind): AutoMovieArchetype =>
          createSmoking({ kind }),
      ),
      ...kinds(
        "stationery",
        createStationery.KINDS,
        (kind: createStationery.Kind): AutoMovieArchetype =>
          createStationery({ kind }),
      ),
      ...kinds(
        "care",
        createCareItem.KINDS,
        (kind: createCareItem.Kind): AutoMovieArchetype =>
          createCareItem({ kind }),
      ),
    }),
    "carried-props": still({
      ...kinds(
        "bag",
        createBag.KINDS,
        (kind: createBag.Kind): AutoMovieArchetype => createBag({ kind }),
      ),
      box: createBox(),
      ...kinds(
        "tool",
        createTool.KINDS,
        (kind: createTool.Kind): AutoMovieArchetype => createTool({ kind }),
      ),
      ...kinds(
        "longTool",
        createLongTool.KINDS,
        (kind: createLongTool.Kind): AutoMovieArchetype =>
          createLongTool({ kind }),
      ),
    }),
    tableware: still({
      ...kinds(
        "tableware",
        createTableware.KINDS,
        (kind: createTableware.Kind): AutoMovieArchetype =>
          createTableware({ kind }),
      ),
      ...kinds(
        "food",
        createFood.KINDS,
        (kind: createFood.Kind): AutoMovieArchetype => createFood({ kind }),
      ),
      ...kinds(
        "light",
        createLight.KINDS,
        (kind: createLight.Kind): AutoMovieArchetype => createLight({ kind }),
      ),
      umbrella: createUmbrella(),
      "umbrella-open": createUmbrella({ open: true }),
      ...kinds(
        "mobilityAid",
        createMobilityAid.KINDS,
        (kind: createMobilityAid.Kind): AutoMovieArchetype =>
          createMobilityAid({ kind }),
      ),
      ...kinds(
        "vessel",
        createVessel.KINDS,
        (kind: createVessel.Kind): AutoMovieArchetype => createVessel({ kind }),
      ),
    }),
    seats: still(
      kinds(
        "seat",
        createSeat.KINDS,
        (kind: createSeat.Kind): AutoMovieArchetype => createSeat({ kind }),
      ),
    ),
    furniture: still({
      ...kinds(
        "bed",
        createBed.KINDS,
        (kind: createBed.Kind): AutoMovieArchetype => createBed({ kind }),
      ),
      ...kinds(
        "table",
        createTable.KINDS,
        (kind: createTable.Kind): AutoMovieArchetype => createTable({ kind }),
      ),
      ...kinds(
        "storage",
        createStorage.KINDS,
        (kind: createStorage.Kind): AutoMovieArchetype =>
          createStorage({ kind }),
      ),
      ...kinds(
        "load",
        createLoad.KINDS,
        (kind: createLoad.Kind): AutoMovieArchetype => createLoad({ kind }),
      ),
      ...kinds(
        "barrel",
        createBarrel.KINDS,
        (kind: createBarrel.Kind): AutoMovieArchetype => createBarrel({ kind }),
      ),
      highChair: createHighChair(),
      lectern: createLectern(),
      console: createConsole(),
      safe: createSafe(),
      showcase: createShowcase(),
    }),
    ...archetypeCaptureFixtures(door),
    vehicles: still({
      ...kinds(
        "car",
        AutoMovieArchetypeCar.KINDS,
        (kind: AutoMovieArchetypeCar.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeCar.create({ kind }),
      ),
      bicycle,
      ...kinds(
        "motorcycle",
        AutoMovieArchetypeMotorcycle.KINDS,
        (kind: AutoMovieArchetypeMotorcycle.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeMotorcycle.create({ kind }),
      ),
      ...kinds(
        "cart",
        createCart.KINDS,
        (kind: createCart.Kind): AutoMovieArchetype => createCart({ kind }),
      ),
      ...kinds(
        "wheelchair",
        createWheelchair.KINDS,
        (kind: createWheelchair.Kind): AutoMovieArchetype =>
          createWheelchair({ kind }),
      ),
      ...kinds(
        "boat",
        createBoat.KINDS,
        (kind: createBoat.Kind): AutoMovieArchetype => createBoat({ kind }),
      ),
      deck: createDeck(createDeck.REFERENCE),
    }),
    horse: still({ horse }),
    "balance-beam": still({ beam: createBalanceBeam() }),
    "still-rings": still({ rings }),
    "still-rings-posed": still({
      rings: rings.articulate({ leftPivot: -15, rightPivot: 30 }),
    }),
    "uneven-bars": still({ bars: createUnevenBars() }),
    "wooden-dummy": still({ dummy: createWoodenDummy() }),
    "rhythmic-ball": still({ ball: createRhythmicBall() }),
    nature: still({
      ...kinds(
        "rock",
        createRock.KINDS,
        (kind: createRock.Kind): AutoMovieArchetype => createRock({ kind }),
      ),
      ...kinds(
        "fireRing",
        createFireRing.KINDS,
        (kind: createFireRing.Kind): AutoMovieArchetype =>
          createFireRing({ kind }),
      ),
      ...kinds(
        "tent",
        createTent.KINDS,
        (kind: createTent.Kind): AutoMovieArchetype => createTent({ kind }),
      ),
      ...kinds(
        "tree",
        createTree.KINDS,
        (kind: createTree.Kind): AutoMovieArchetype => createTree({ kind }),
      ),
    }),
    ...archetypeCaptureArmoury(),
    ...archetypeCaptureSupportProps(),
    ...archetypeCaptureBreakage(),
    ...archetypeCaptureExtendedArmoury(),
    ...archetypeCaptureCarOpenings(),
    ...archetypeCaptureAnimals(),
    ...archetypeCaptureDogGaits(),
    ...archetypeCaptureReferenceAnimals(),
    ...archetypeCaptureQuadrupeds(),
    ...archetypeCaptureRest(),
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
      "car-doors-open": car.articulate({
        driverDoor: 65,
        passengerDoor: 30,
        wheel: 90,
      }),
      "bicycle-quarter": bicycle.articulate({ crank: 90 }),
      "toilet-lid-down": createSanitary({ kind: "toilet" }).articulate({
        lid: createSanitary.LIFT,
      }),
      "fridge-open": createAppliance({ kind: "refrigerator" }).articulate({
        fridgeDoor: 90,
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
        (kind: createPoolEdge.Kind): AutoMovieArchetype =>
          createPoolEdge({ kind }),
      ),
      boxingGlove: createBoxingGlove(),
      heavyBag: createHeavyBag(),
      ...kinds(
        "goal",
        createGoal.KINDS,
        (kind: createGoal.Kind): AutoMovieArchetype => createGoal({ kind }),
      ),
      ...kinds(
        "stick",
        createStick.KINDS,
        (kind: createStick.Kind): AutoMovieArchetype => createStick({ kind }),
      ),
      cue: createCue(),
      cueTable: createCueTable(),
      skateboard: createSkateboard(),
      ski: createSki(),
      surfboard: createSurfboard(),
    }),
    music: still({
      ...kinds(
        "instrument",
        createInstrument.KINDS,
        (kind: createInstrument.Kind): AutoMovieArchetype =>
          createInstrument({ kind }),
      ),
      ...kinds(
        "microphone",
        createMicrophone.KINDS,
        (kind: createMicrophone.Kind): AutoMovieArchetype =>
          createMicrophone({ kind }),
      ),
    }),
    "ride-car": moving("car", driveCar(car, archetypeCaptureCourse)),
    "ride-bicycle": moving(
      "bicycle",
      rideBicycle(bicycle, archetypeCaptureCourse),
    ),
    "ride-motorcycle": moving(
      "motorcycle",
      rideMotorcycle(
        AutoMovieArchetypeMotorcycle.create({ kind: "motorcycle" }),
        archetypeCaptureCourse,
      ),
    ),
    "ride-trolley": moving(
      "trolley",
      AutoMovieArchetypeRide.along(createCart({ kind: "trolley" }), {
        ...archetypeCaptureCourse,
        cruise: 1.3,
      }),
    ),
    ...gaits,
  };
}

/** Companion types of {@link archetypeCaptureCatalog}. */
export namespace archetypeCaptureCatalog {
  /** One archetype drawn in a subject, under its own object name. */
  export interface IMember {
    /**
     * The object's name in the scene, the first segment of its parts' and
     * marks' paths.
     */
    name: string;

    /**
     * Immutable neutral model; quadruped sources enable independent rig
     * observations.
     */
    reference?: AutoMovieArchetype;

    /**
     * The archetype at a second of the subject's clock, and its root's
     * placement in the world when it moves.
     */
    at(seconds: number): {
      archetype: AutoMovieArchetype;
      placement?: IAutoMovieTransform;
      /**
       * Authored/solved terminal axis goals from this same sample, model
       * metres; absent when the consumer exposes none.
       */
      goals?: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieVector3
      >;
    };
  }

  /**
   * One drawn subject: its members, which the subjects module sets apart along
   * a diagonal when there are several.
   */
  export interface ISubject {
    /** The archetypes drawn. */
    members: readonly IMember[];

    /** Running time in seconds of a moving subject; absent for a still one. */
    duration?: number;

    /** Named instants of a moving subject. */
    instants?: readonly { seconds: number; label: string }[];
  }
}
