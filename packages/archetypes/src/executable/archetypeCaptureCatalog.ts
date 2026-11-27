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
import { createAppliance, AutoMovieArchetypeDoor, createSanitary, AutoMovieArchetypeWindow } from "../architecture";
import { type AutoMovieArchetype, AutoMovieArchetypeRide } from "../core";
import { createBed, createSeat, createStorage, createTable, AutoMovieArchetypeShowcase, AutoMovieArchetypeBarrel, AutoMovieArchetypeConsole, AutoMovieArchetypeHighChair, AutoMovieArchetypeLectern, AutoMovieArchetypeLoad, AutoMovieArchetypeSafe } from "../furniture";
import { AutoMovieArchetypeBalanceBeam, AutoMovieArchetypeBoxingGlove, AutoMovieArchetypeHeavyBag, AutoMovieArchetypeRhythmicBall, AutoMovieArchetypeStillRings, AutoMovieArchetypeUnevenBars, AutoMovieArchetypeWoodenDummy } from "../gym";
import { createInstrument, AutoMovieArchetypeMicrophone } from "../music";
import { AutoMovieArchetypeFireRing, AutoMovieArchetypeRock, AutoMovieArchetypeTent, AutoMovieArchetypeTree } from "../nature";
import { createBag, createCareItem, createDrinkware, createLight, createLongTool, createMobilityAid, createTool, createVessel, AutoMovieArchetypeDevice, AutoMovieArchetypeSmoking, AutoMovieArchetypeStationery, AutoMovieArchetypeBox, AutoMovieArchetypeFood, AutoMovieArchetypeTableware, AutoMovieArchetypeUmbrella } from "../props";
import { AutoMovieArchetypeCue, AutoMovieArchetypeCueTable, createGoal, createStick, AutoMovieArchetypeSurfboard, AutoMovieArchetypeHighJump, AutoMovieArchetypePoolEdge, AutoMovieArchetypeSkateboard, AutoMovieArchetypeSki } from "../sport";
import { AutoMovieArchetypeBicycle, AutoMovieArchetypeCar, AutoMovieArchetypeMotorcycle, AutoMovieArchetypeBoat, createCart, createWheelchair, driveCar, rideBicycle, rideMotorcycle, AutoMovieArchetypeDeck } from "../vehicles";
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

  const door: ReturnType<typeof AutoMovieArchetypeDoor.create> = AutoMovieArchetypeDoor.create({ hardware: "lever" });
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
  const rings: ReturnType<typeof AutoMovieArchetypeStillRings.create> = AutoMovieArchetypeStillRings.create();
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
        AutoMovieArchetypeDevice.KINDS,
        (kind: AutoMovieArchetypeDevice.Kind): AutoMovieArchetype => AutoMovieArchetypeDevice.create({ kind }),
      ),
      ...kinds(
        "smoking",
        AutoMovieArchetypeSmoking.KINDS,
        (kind: AutoMovieArchetypeSmoking.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeSmoking.create({ kind }),
      ),
      ...kinds(
        "stationery",
        AutoMovieArchetypeStationery.KINDS,
        (kind: AutoMovieArchetypeStationery.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeStationery.create({ kind }),
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
      box: AutoMovieArchetypeBox.create(),
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
        AutoMovieArchetypeTableware.KINDS,
        (kind: AutoMovieArchetypeTableware.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeTableware.create({ kind }),
      ),
      ...kinds(
        "food",
        AutoMovieArchetypeFood.KINDS,
        (kind: AutoMovieArchetypeFood.Kind): AutoMovieArchetype => AutoMovieArchetypeFood.create({ kind }),
      ),
      ...kinds(
        "light",
        createLight.KINDS,
        (kind: createLight.Kind): AutoMovieArchetype => createLight({ kind }),
      ),
      umbrella: AutoMovieArchetypeUmbrella.create(),
      "umbrella-open": AutoMovieArchetypeUmbrella.create({ open: true }),
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
        AutoMovieArchetypeLoad.KINDS,
        (kind: AutoMovieArchetypeLoad.Kind): AutoMovieArchetype => AutoMovieArchetypeLoad.create({ kind }),
      ),
      ...kinds(
        "barrel",
        AutoMovieArchetypeBarrel.KINDS,
        (kind: AutoMovieArchetypeBarrel.Kind): AutoMovieArchetype => AutoMovieArchetypeBarrel.create({ kind }),
      ),
      highChair: AutoMovieArchetypeHighChair.create(),
      lectern: AutoMovieArchetypeLectern.create(),
      console: AutoMovieArchetypeConsole.create(),
      safe: AutoMovieArchetypeSafe.create(),
      showcase: AutoMovieArchetypeShowcase.create(),
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
        AutoMovieArchetypeBoat.KINDS,
        (kind: AutoMovieArchetypeBoat.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeBoat.create({ kind }),
      ),
      deck: AutoMovieArchetypeDeck.create(AutoMovieArchetypeDeck.REFERENCE),
    }),
    horse: still({ horse }),
    "balance-beam": still({ beam: AutoMovieArchetypeBalanceBeam.create() }),
    "still-rings": still({ rings }),
    "still-rings-posed": still({
      rings: rings.articulate({ leftPivot: -15, rightPivot: 30 }),
    }),
    "uneven-bars": still({ bars: AutoMovieArchetypeUnevenBars.create() }),
    "wooden-dummy": still({ dummy: AutoMovieArchetypeWoodenDummy.create() }),
    "rhythmic-ball": still({ ball: AutoMovieArchetypeRhythmicBall.create() }),
    nature: still({
      ...kinds(
        "rock",
        AutoMovieArchetypeRock.KINDS,
        (kind: AutoMovieArchetypeRock.Kind): AutoMovieArchetype => AutoMovieArchetypeRock.create({ kind }),
      ),
      ...kinds(
        "fireRing",
        AutoMovieArchetypeFireRing.KINDS,
        (kind: AutoMovieArchetypeFireRing.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeFireRing.create({ kind }),
      ),
      ...kinds(
        "tent",
        AutoMovieArchetypeTent.KINDS,
        (kind: AutoMovieArchetypeTent.Kind): AutoMovieArchetype => AutoMovieArchetypeTent.create({ kind }),
      ),
      ...kinds(
        "tree",
        AutoMovieArchetypeTree.KINDS,
        (kind: AutoMovieArchetypeTree.Kind): AutoMovieArchetype => AutoMovieArchetypeTree.create({ kind }),
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
      "door-sliding-open": AutoMovieArchetypeDoor.create({ kind: "sliding" }).articulate({
        slide: 0.6,
      }),
      "chest-drawn": chest.articulate({ drawer2: 0.3, drawer3: 0.15 }),
      "wardrobe-open": wardrobe.articulate({ leftDoor: 95, rightDoor: 45 }),
      "suitcase-drawn": suitcase.articulate({
        telescope: suitcase.affordance("telescope").travel!,
      }),
      "window-open": AutoMovieArchetypeWindow.create({ kind: "casement" }).articulate({
        sash: 60,
      }),
      "book-open": AutoMovieArchetypeStationery.create({ kind: "book" }).articulate({
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
      "pole-vault": AutoMovieArchetypeHighJump.create({ kind: "poleVault" }),
      ...kinds(
        "poolEdge",
        AutoMovieArchetypePoolEdge.KINDS,
        (kind: AutoMovieArchetypePoolEdge.Kind): AutoMovieArchetype =>
          AutoMovieArchetypePoolEdge.create({ kind }),
      ),
      boxingGlove: AutoMovieArchetypeBoxingGlove.create(),
      heavyBag: AutoMovieArchetypeHeavyBag.create(),
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
      cue: AutoMovieArchetypeCue.create(),
      cueTable: AutoMovieArchetypeCueTable.create(),
      skateboard: AutoMovieArchetypeSkateboard.create(),
      ski: AutoMovieArchetypeSki.create(),
      surfboard: AutoMovieArchetypeSurfboard.create(),
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
        AutoMovieArchetypeMicrophone.KINDS,
        (kind: AutoMovieArchetypeMicrophone.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeMicrophone.create({ kind }),
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
