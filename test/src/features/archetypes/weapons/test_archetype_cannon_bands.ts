import {
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
  createCannon,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";

/** The contacts every kind of cannon offers: a muzzle and a vent, both sockets. */
const SOCKETS: readonly createCannon.Affordance[] = ["muzzle", "vent"];

/** An inch, a foot and a pound, in metres and kilograms. */
const IN: number = 0.0254;
const FT: number = 12 * IN;
const LB: number = 0.45359237;

/** A hundredweight, 112 pounds. */
const CWT: number = 112 * LB;

/** One expected band: its least and greatest value, and whether its source is borrowed or an estimate. */
type Expected = readonly [
  minimum: number,
  maximum: number,
  provisional: boolean,
];

/**
 * Each kind's bands as their sources give them, restated here:
 *
 * - the 6-pdr field gun, the 1862 Ordnance Manual and Gibbon: 65.6 in long, its trunnions 43.1 in up, 57 in wheels on a 60 in track, the 884 lb piece, the 540 lb carriage and two 180 lb wheels, 1439 ft/s, its 3.58 in shot and 3.67 in bore, and Gibbon's 1 1/2 to 2 yards of recoil, his observation, provisional;
 * - the naval 32-pounder of 56 cwt, Griffiths: 9 ft 6 in long, a 6.41 in bore with distinct 6.14 to 6.20 in shot gauges (p. 59), its 13 cwt 3 qr carriage on trucks of 1 ft 7 in and 1 ft 4 in (land-service trucks, borrowed, provisional), 1600 ft/s, and Douglas's 9 ft of recoil (borrowed, provisional);
 * - the swivel gun, Royal Museums Greenwich KTP0053: 1000 mm overall (its length to the muzzle, provisional), a 2.25 in calibre, and 30 to 60 kg, an estimate;
 * - the mortar: no band, its figures its read models'.
 */
const EXPECTED: Readonly<
  Record<createCannon.Kind, Readonly<Partial<Record<string, Expected>>>>
> = {
  fieldGun: {
    length: [65.6 * IN, 65.6 * IN, false],
    trunnionHeight: [43.1 * IN, 43.1 * IN, false],
    wheelDiameter: [57 * IN, 57 * IN, false],
    track: [60 * IN, 60 * IN, false],
    mass: [(884 + 540 + 2 * 180) * LB, (884 + 540 + 2 * 180) * LB, false],
    muzzleVelocity: [1439 * FT, 1439 * FT, false],
    recoil: [4.5 * FT, 6 * FT, true],
    ball: [3.58 * IN, 3.58 * IN, false],
    bore: [3.67 * IN, 3.67 * IN, false],
  },
  navalGun: {
    length: [9.5 * FT, 9.5 * FT, false],
    bore: [6.41 * IN, 6.41 * IN, false],
    ball: [6.14 * IN, 6.2 * IN, false],
    frontWheelDiameter: [19 * IN, 19 * IN, true],
    wheelDiameter: [16 * IN, 16 * IN, true],
    mass: [(56 + 13.75) * CWT, (56 + 13.75) * CWT, false],
    muzzleVelocity: [1600 * FT, 1600 * FT, false],
    recoil: [9 * FT, 9 * FT, true],
  },
  mortar: {},
  swivelGun: {
    length: [1, 1, true],
    bore: [2.25 * IN, 2.25 * IN, false],
    mass: [30, 60, true],
  },
};

/**
 * Every kind of cannon draws each dimension in the band its source gives, says which bands are provisional, and offers its muzzle and vent as sockets.
 *
 * Scenarios, over `archetypeBandSweep.SEEDS` seeds of each kind:
 * 1. Every band the produced gun records is the one `EXPECTED` states from the kind's source, ends and provisional mark alike, and every band `EXPECTED` states is recorded; a mortar records none.
 * 2. Every drawn value lies inside its band, and the values of a band with both ends apart span at least `archetypeBandSweep.COVERAGE` of it, #3368's acceptance floor.
 * 3. Each kind's `muzzle` and `vent` are sockets.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and reads its recorded bands, its dimensions and its contacts; a band off its source, a borrowed band left unmarked, a value outside its band, an unreached band end or a muzzle of another kind is caught.
 * @evidence contracts/development/testing.md#independent-expectations The bands are restated here as numbers from the 1862 Ordnance Manual, Gibbon, Griffiths, Douglas and the Greenwich record, converted here from inches, feet, pounds and hundredweights; nothing is read from the producer's tables.
 * @evidence contracts/development/testing.md#distinguishing-cases The four kinds, read and borrowed bands, single-valued and ranged bands, and a kind with none.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_cannon_bands(): void {
  const findings: string[] = [];
  const near: (a: number, b: number) => boolean = (
    a: number,
    b: number,
  ): boolean => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  for (const kind of createCannon.KINDS) {
    const expected: Readonly<Partial<Record<string, Expected>>> =
      EXPECTED[kind];
    const reached: Map<string, { low: number; high: number }> = new Map();
    for (let seed: number = 0; seed < archetypeBandSweep.SEEDS; seed++) {
      const gun: AutoMovieArchetype<
        createCannon.Affordance,
        createCannon.Dimension
      > = createCannon({ kind }, seed);
      const recorded: Readonly<
        Partial<Record<string, IAutoMovieArchetypeBand>>
      > = gun.provenance.bands;
      for (const name of new Set([
        ...Object.keys(recorded),
        ...Object.keys(expected),
      ])) {
        const band: IAutoMovieArchetypeBand | undefined = recorded[name];
        const want: Expected | undefined = expected[name];
        if (band === undefined || want === undefined) {
          findings.push(
            `${kind}@${seed}: ${name} is ${band === undefined ? "not drawn" : "drawn but not expected"}`,
          );
          continue;
        }
        if (
          !near(band.minimum, want[0]) ||
          !near(band.maximum, want[1]) ||
          (band.provisional === true) !== want[2]
        )
          findings.push(
            `${kind}@${seed}: ${name} is drawn in ${band.minimum} to ${band.maximum}${band.provisional === true ? ", provisional" : ""}, not ${want[0]} to ${want[1]}${want[2] ? ", provisional" : ""}`,
          );
        const value: number = (gun.dimensions as Record<string, number>)[name]!;
        if (!(value >= want[0] - 1e-12 && value <= want[1] + 1e-12))
          findings.push(`${kind}@${seed}: ${name} ${value} outside its band`);
        const seen: { low: number; high: number } = reached.get(name) ?? {
          low: Infinity,
          high: -Infinity,
        };
        reached.set(name, {
          low: Math.min(seen.low, value),
          high: Math.max(seen.high, value),
        });
      }
      for (const id of SOCKETS)
        if (gun.affordance(id).kind !== "socket")
          findings.push(`${kind}@${seed}: ${id} is not a socket`);
    }
    for (const [name, want] of Object.entries(expected) as [
      string,
      Expected,
    ][]) {
      const seen: { low: number; high: number } | undefined = reached.get(name);
      const span: number = want[1] - want[0];
      if (
        seen !== undefined &&
        span > 0 &&
        !(seen.high - seen.low >= archetypeBandSweep.COVERAGE * span)
      )
        findings.push(
          `${kind}: ${name} reached only ${seen.low} to ${seen.high}`,
        );
    }
  }
  TestValidator.equals("every cannon stays in its bands", findings, []);
}
