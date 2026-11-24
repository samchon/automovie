import {
  AutoMovieArchetypeUnits,
  createBicycle,
  createCar,
  createCart,
  createClub,
  createHandgun,
  createHolster,
  createHorse,
  createLongGun,
  createMotorcycle,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/** The interior packaging standard. */
const J1100: string = "SAE J1100 (2001)";

/** Measured warmbloods. */
const JENSEN: string = "Jensen et al. 2019, Table 2";

/** Segment lengths of thoroughbreds of about 1.62 m. */
const KUBO: string = "Kubo et al. 1992, Table 4";

/**
 * Vehicles, the horse and the prop weapons stay inside their cited dimensions for every seed, measured on the produced thing.
 *
 * Scenarios, each over 200 seeds, inside the band, and spanning at least 80 % of it unless the source gives only a limit or one value:
 * 1. A car: the driver's seating reference point (the seat's surface plus the 97.5 mm of the H-point machine) 127 to 405 mm above the cabin floor, the floor being the door opening's sill (SAE J1100 class A, H30); a steering wheel under 450 mm across turning 2.2 to 2.63 turns lock to lock; front doors opening 60 to 70 degrees; a hatchback's wheelbase and kerb mass inside two Honda models'.
 * 2. A bicycle: the saddle's top 0.62 to 0.80 m from the crank axle, 0.883 of an inseam of 0.70 to 0.90 m by LeMond's rule; a scooter's and a motorcycle's seat at their makers' heights, the PCX125's 763 mm and the CB500 Hornet's 785 and the MT-07's 805.
 * 3. A wheelbarrow's handgrips 38 mm across, measured on the grip's collider.
 * 4. A horse: the top of its withers 1.58 to 1.80 m high, the warmbloods of Jensen et al., its barrel's round over that height their mean girth over their mean height (204 over 172 cm), and its mass over the cube of that height their mean mass over the cube of their mean height (640 kg at 1.72 m), the girth-squared-times-length law with its girth in their proportion; its forearm, fore cannon and hind cannon, the bones that stand upright, the fractions of its height that Kubo's thoroughbreds have, to a twentieth of a percent of the height; its saddle 16 to 18 in long and its reins 5/8 to 3/4 in wide.
 * 5. A handgun: the trigger's face 70 to 74 mm ahead of the backstrap and its part drawn back 12.5 mm at full travel, the slide as long as the makers' overall lengths, the sights their sight radius apart, the mass between the makers' two.
 * 6. A carbine: Colt's 774.7 mm from butt to muzzle with its stock in and 857.25 mm with it drawn out; a shotgun's trigger 352.3 mm from its butt.
 * 7. A bat 35.1 to 35.2 in long, at most 66.3 mm across and 33.9 to 34.5 oz; a baton 0.61 to 0.66 m long; a holster's mouth within 38 mm of the belt line.
 */
export function test_unit_archetypes_core_ride_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
    ...(limit === true ? { limit } : {}),
  });
  const horse = (seed: number): ReturnType<typeof createHorse> =>
    createHorse({}, seed);

  /** The length of a horse bone that stands upright, over the height of the withers. */
  const bone = (seed: number, part: string): number => {
    const made: ReturnType<typeof createHorse> = horse(seed);
    return (
      archetypeExtent(made, "y", [part]).size /
      archetypeExtent(made, "y", ["withers"]).high
    );
  };
  TestValidator.equals(
    "vehicles, the horse and prop weapons stay in their cited bands",
    archetypeBandSweep([
      row(
        "car seating reference height",
        0.127,
        0.405,
        `${J1100} H30`,
        (seed: number): number => {
          const car: ReturnType<typeof createCar> = createCar(
            { kind: "sedan" },
            seed,
          );
          return (
            car.affordance("driverSeat").frame.translation.y +
            0.0975 -
            car.affordance("driverAperture").frame.translation.y
          );
        },
      ),
      row(
        "steering wheel diameter",
        0,
        0.45,
        J1100,
        (seed: number): number =>
          2 *
          createCar({ kind: "hatchback" }, seed).affordance("wheel").radius!,
        true,
      ),
      row(
        "steering lock",
        2.2 * 180,
        2.63 * 180,
        "Honda UK specifications",
        (seed: number): number =>
          createCar({ kind: "sedan" }, seed).affordance("wheel").travel!,
      ),
      row(
        "car door swing",
        60,
        70,
        "US patent 6817062 B2",
        (seed: number): number =>
          createCar({ kind: "sedan" }, seed).affordance("driverDoor").travel!,
      ),
      row(
        "hatchback wheelbase",
        2.517,
        2.734,
        "Honda UK specifications",
        (seed: number): number => {
          const car: ReturnType<typeof createCar> = createCar(
            { kind: "hatchback" },
            seed,
          );
          return (
            (archetypeExtent(car, "z", ["wheel-front-left"]).low +
              archetypeExtent(car, "z", ["wheel-front-left"]).high -
              archetypeExtent(car, "z", ["wheel-rear-left"]).low -
              archetypeExtent(car, "z", ["wheel-rear-left"]).high) /
            2
          );
        },
      ),
      row(
        "hatchback mass",
        1230,
        1503,
        "Honda UK specifications",
        (seed: number): number =>
          createCar({ kind: "hatchback" }, seed).body.mass,
      ),
      row(
        "saddle height from the crank axle",
        0.62,
        0.8,
        "Bini, Hume and Croft 2011",
        (seed: number): number => {
          const bicycle: ReturnType<typeof createBicycle> = createBicycle(
            {},
            seed,
          );
          const saddle: ReturnType<typeof archetypeExtent> = archetypeExtent(
            bicycle,
            "z",
            ["saddle"],
          );
          return Vector3.length(
            Vector3.subtract(
              {
                x: 0,
                y: archetypeExtent(bicycle, "y", ["saddle"]).high,
                z: (saddle.low + saddle.high) / 2,
              },
              { ...bicycle.affordance("crank").frame.translation, x: 0 },
            ),
          );
        },
      ),
      row(
        "scooter seat height",
        0.763,
        0.763,
        "Honda PCX125, 2025",
        (seed: number): number =>
          createMotorcycle({ kind: "scooter" }, seed).affordance("seat").frame
            .translation.y,
      ),
      row(
        "motorcycle seat height",
        0.785,
        0.805,
        "Honda CB500 Hornet and Yamaha MT-07",
        (seed: number): number =>
          createMotorcycle({ kind: "motorcycle" }, seed).affordance("seat")
            .frame.translation.y,
      ),
      row(
        "wheelbarrow handgrip",
        0.038,
        0.038,
        "Matador M-130-L4",
        (seed: number): number =>
          archetypeExtent(createCart({ kind: "wheelbarrow" }, seed), "x", [
            "grip-left",
          ]).size,
      ),
      row(
        "withers height",
        1.58,
        1.8,
        JENSEN,
        (seed: number): number =>
          archetypeExtent(horse(seed), "y", ["withers"]).high,
      ),
      row(
        "heart girth over withers height",
        204 / 172,
        204 / 172,
        JENSEN,
        (seed: number): number =>
          (Math.PI * archetypeExtent(horse(seed), "x", ["trunk"]).size) /
          archetypeExtent(horse(seed), "y", ["withers"]).high,
        true,
      ),
      row(
        "horse mass over the cube of its withers height",
        640 / 1.72 ** 3,
        640 / 1.72 ** 3,
        `${JENSEN}, by Carroll and Huntington's girth-squared-times-length form`,
        // The horse alone: its whole less the riding saddle's 5.4 kg, Wintec's stated weight for its 500 All Purpose.
        (seed: number): number =>
          (horse(seed).body.mass - 5.4) /
          archetypeExtent(horse(seed), "y", ["withers"]).high ** 3,
        true,
      ),
      row(
        "forearm over withers height",
        0.382 / 1.62 - 0.0005,
        0.382 / 1.62 + 0.0005,
        KUBO,
        (seed: number): number => bone(seed, "leftForeRadius"),
        true,
      ),
      row(
        "fore cannon over withers height",
        0.28 / 1.62 - 0.0005,
        0.28 / 1.62 + 0.0005,
        KUBO,
        (seed: number): number => bone(seed, "rightForeCannon"),
        true,
      ),
      row(
        "hind cannon over withers height",
        0.368 / 1.62 - 0.0005,
        0.368 / 1.62 + 0.0005,
        KUBO,
        (seed: number): number => bone(seed, "leftHindCannon"),
        true,
      ),
      row(
        "saddle seat size",
        16 * AutoMovieArchetypeUnits.INCH,
        18 * AutoMovieArchetypeUnits.INCH,
        "Wintec",
        (seed: number): number => horse(seed).affordance("seat").depth!,
      ),
      row(
        "rein width",
        (5 / 8) * AutoMovieArchetypeUnits.INCH,
        (3 / 4) * AutoMovieArchetypeUnits.INCH,
        "Dover Saddlery",
        (seed: number): number => horse(seed).affordance("leftRein").aperture!,
      ),
      row(
        "trigger reach",
        0.07,
        0.074,
        "GLOCK Gen4 guide",
        (seed: number): number => {
          const pistol: ReturnType<typeof createHandgun> = createHandgun(
            { frame: "fullSize" },
            seed,
          );
          return (
            pistol.affordance("trigger").frame.translation.z -
            archetypeExtent(pistol, "z", ["grip"]).low
          );
        },
      ),
      row(
        "trigger travel",
        0.0125,
        0.0125,
        "GLOCK Gen4 guide",
        (seed: number): number => {
          const pistol: ReturnType<typeof createHandgun> = createHandgun(
            { frame: "compact" },
            seed,
          );
          return (
            archetypeExtent(pistol, "z", ["trigger"]).low -
            archetypeExtent(
              pistol.articulate({
                trigger: pistol.affordance("trigger").travel!,
              }),
              "z",
              ["trigger"],
            ).low
          );
        },
      ),
      row(
        "full-size pistol length",
        0.202,
        0.216,
        "GLOCK G17 and SIG P320-M17",
        (seed: number): number =>
          archetypeExtent(createHandgun({ frame: "fullSize" }, seed), "z").size,
      ),
      row(
        "compact pistol length",
        0.183,
        0.185,
        "GLOCK G19 and SIG P320-M18",
        (seed: number): number =>
          archetypeExtent(createHandgun({ frame: "compact" }, seed), "z").size,
      ),
      row(
        "full-size sight radius",
        0.163,
        0.168,
        "GLOCK G17 and SIG P320-M17",
        (seed: number): number => {
          const pistol: ReturnType<typeof createHandgun> = createHandgun(
            { frame: "fullSize" },
            seed,
          );
          return (
            pistol.affordance("frontSight").frame.translation.z -
            pistol.affordance("sight").frame.translation.z
          );
        },
      ),
      row(
        "full-size pistol mass",
        0.708,
        0.8391,
        "GLOCK G17 and SIG P320-M17",
        (seed: number): number =>
          createHandgun({ frame: "fullSize" }, seed).body.mass,
      ),
      row(
        "carbine length, stock in",
        30.5 * AutoMovieArchetypeUnits.INCH,
        30.5 * AutoMovieArchetypeUnits.INCH,
        "Colt",
        (seed: number): number =>
          archetypeExtent(createLongGun({ kind: "carbine" }, seed), "z", [
            "stock",
            "barrel",
          ]).size,
      ),
      row(
        "carbine length, stock out",
        33.75 * AutoMovieArchetypeUnits.INCH,
        33.75 * AutoMovieArchetypeUnits.INCH,
        "Colt",
        (seed: number): number => {
          const carbine: ReturnType<typeof createLongGun> = createLongGun(
            { kind: "carbine" },
            seed,
          );
          return archetypeExtent(
            carbine.articulate({ stock: carbine.affordance("stock").travel! }),
            "z",
            ["stock", "barrel"],
          ).size;
        },
      ),
      row(
        "shotgun length of pull",
        13.87 * AutoMovieArchetypeUnits.INCH,
        13.87 * AutoMovieArchetypeUnits.INCH,
        "Mossberg 590A1",
        (seed: number): number => {
          const shotgun: ReturnType<typeof createLongGun> = createLongGun(
            { kind: "shotgun" },
            seed,
          );
          return (
            shotgun.affordance("trigger").frame.translation.z -
            shotgun.affordance("butt").frame.translation.z
          );
        },
      ),
      row(
        "bat length",
        35.1 * AutoMovieArchetypeUnits.INCH,
        35.2 * AutoMovieArchetypeUnits.INCH,
        "Nathan, Smith and Russell 2026",
        (seed: number): number =>
          archetypeExtent(createClub({ kind: "bat" }, seed), "y").size,
      ),
      row(
        "bat barrel",
        0,
        2.61 * AutoMovieArchetypeUnits.INCH,
        "Official Baseball Rules 3.02(a)",
        (seed: number): number =>
          archetypeExtent(createClub({ kind: "bat" }, seed), "x").size,
        true,
      ),
      row(
        "bat mass",
        33.9 * AutoMovieArchetypeUnits.OUNCE,
        34.5 * AutoMovieArchetypeUnits.OUNCE,
        "Nathan, Smith and Russell 2026",
        (seed: number): number => createClub({ kind: "bat" }, seed).body.mass,
      ),
      row(
        "baton length",
        24 * AutoMovieArchetypeUnits.INCH,
        26 * AutoMovieArchetypeUnits.INCH,
        "Monadnock MP24 and MP26",
        (seed: number): number =>
          archetypeExtent(createClub({ kind: "baton" }, seed), "y").size,
      ),
      row(
        "holster ride",
        -1.5 * AutoMovieArchetypeUnits.INCH,
        1.5 * AutoMovieArchetypeUnits.INCH,
        "Safariland",
        (seed: number): number => {
          const holster: ReturnType<typeof createHolster> = createHolster(
            {},
            seed,
          );
          return (
            holster.affordance("socket").frame.translation.y -
            holster.affordance("belt").frame.translation.y
          );
        },
      ),
    ]),
    [],
  );
}
