import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  createBow,
  createClub,
  createHandgun,
  createHolster,
  createLongGun,
  createPolearm,
  createProjectile,
  createShield,
  createSword,
  createWeaponLoop,
  createWeaponRack,
} from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A dimension the archetype reports, metres, newtons or kilograms. */
const dim: (made: AutoMovieArchetype, name: string) => number = (
  made: AutoMovieArchetype,
  name: string,
): number =>
  (made.dimensions as Readonly<Record<string, number | undefined>>)[name] ??
  Number.NaN;

/** An inch, metres. */
const IN: number = AutoMovieArchetypeUnits.INCH;

/** A pound, kilograms. */
const LB: number = AutoMovieArchetypeUnits.POUND;

/** An ounce, kilograms. */
const OZ: number = AutoMovieArchetypeUnits.OUNCE;

/** A pound-force, newtons. */
const LBF: number = AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD;

/**
 * Every weapon whose source lists discrete models is one of them whole: over 200 seeds each draw's figures equal one read model's exactly, never a blend of two, and every model is drawn; a figure a model gives cannot be fixed over it.
 *
 * Scenarios, each over 200 seeds:
 * 1. A longbow is the S1, S2 or S3 approximation, its mass and draw at 30 in together; a horse bow the Warrior or the Zenith, drawn at one of the makers' ten draw weights from 15 to 60 lb.
 * 2. A bat is one of the four measured maple bats; a baton the 24 or 26 in Monadnock.
 * 3. A full-size pistol is the G17 Gen5 or the P320-M17, a compact the G19 Gen5 or the P320-M18; a G17's sight radius is its polymer, steel or GNS sights'.
 * 4. A carbine is one of Colt's three, all 30.5 in retracted; a buckler A315 or A316; a belt loop's ring Safariland's, Rothco's or High Speed Gear's; a rack Medieval Extreme's or Gladney's stand.
 * 5. An arrow is the Westminster Abbey arrow or AZ472/19; a bolt NMM 11461, its mass its ash shaft and its steel head as a square pyramid on the shaft's width, or Met 33754; a round shot the 6-pdr.'s or the 12-pdr.'s.
 * 6. A longsword is the Crecy or the Regent and an arming sword the Knight or the Poitiers, all five figures together; a sabre the officer's or the trooper's weight.
 * 7. A holster rides mid, low or high; a scabbard made to a read sword is that blade's length and width with Wulflund's 1.5 and 2 cm, and 200 seeds draw each of the four read swords' scabbards.
 * 8. A spear's head is Met 1989.220 or Museum Wales' medieval iron head, the two catalogued heads that state their weight, each whole.
 * 9. A fixed figure the model gives is refused on that dimension: a G17's slide width, a holster's ride, a lance's shaft, a bow's draw weight on a longbow.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and reads its dimensions and mass; a draw between two models, a model never drawn, a figure from another object's record, or a fixed value laid over a model's figure is caught with the kind and the seed.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is restated here from the makers' and museums' records the producers cite, and the derived ones from their stated laws, not read from the producers.
 * @evidence contracts/development/testing.md#distinguishing-cases One-axis kinds, a kind with two axes (a horse bow's model and draw weight, a GLOCK's sights), models that leave a figure to a band, a scabbard made to a picked blade, and the refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the nine scenarios and what each pins.
 */
export function test_archetype_weapons_models(): void {
  const rows: readonly archetypeModelSweep.IRow[] = [
    {
      name: "longbow",
      source: "Aston and Spencer, the S1, S2 and S3 approximations",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createBow({ kind: "longbow" }, seed);
        return [a.body.mass, dim(a, "draw")];
      },
      models: [
        [0.905, 108 * LBF],
        [0.868, 101 * LBF],
        [0.785, 141 * LBF],
      ],
    },
    {
      name: "horse bow",
      source: "Bogentandler, Freddie Warrior and Zenith KTB",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createBow({ kind: "horseBow" }, seed);
        return [dim(a, "length"), a.body.mass];
      },
      models: [
        [53 * IN, 0.33],
        [48 * IN, 0.315],
      ],
    },
    {
      name: "horse bow draw",
      source: "Bogentandler, 15 to 60 lb in 5 lb steps at 31 in",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createBow({ kind: "horseBow" }, seed);
        return [dim(a, "draw")];
      },
      models: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(
        (lb: number): readonly number[] => [lb * LBF],
      ),
    },
    {
      name: "bat",
      source: "Nathan, Smith and Russell 2026, Table 1",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createClub({ kind: "bat" }, seed);
        return [dim(a, "length"), a.body.mass];
      },
      models: [
        [35.2 * IN, 33.9 * OZ],
        [35.1 * IN, 34 * OZ],
        [35.2 * IN, 34 * OZ],
        [35.1 * IN, 34.5 * OZ],
      ],
    },
    {
      name: "baton",
      source: "Monadnock MP24 and MP26",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createClub({ kind: "baton" }, seed);
        return [dim(a, "length")];
      },
      models: [[24 * IN], [26 * IN]],
    },
    {
      name: "full-size pistol",
      source: "GLOCK G17 Gen5 and SIG SAUER P320-M17",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createHandgun(
          { frame: "fullSize" },
          seed,
        );
        return [dim(a, "length"), dim(a, "height"), a.body.mass];
      },
      models: [
        [0.202, 0.139, 0.708],
        [0.216, 0.139, 0.8391],
      ],
    },
    {
      name: "compact pistol",
      source: "GLOCK G19 Gen5 and SIG SAUER P320-M18",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createHandgun({ frame: "compact" }, seed);
        return [dim(a, "length"), dim(a, "height"), a.body.mass];
      },
      models: [
        [0.185, 0.128, 0.67],
        [0.183, 0.14, 0.797],
      ],
    },
    {
      name: "G17 sights",
      source: "GLOCK G17 Gen5 sight radius by sights",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createHandgun(
          { frame: "fullSize", model: "g17" },
          seed,
        );
        return [dim(a, "sightRadius")];
      },
      models: [[0.165], [0.164], [0.163]],
    },
    {
      name: "carbine",
      source: "Colt M4 2020 sheet",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createLongGun({ kind: "carbine" }, seed);
        return [dim(a, "length"), a.body.mass];
      },
      models: [
        [30.5 * IN, 3.13],
        [30.5 * IN, 2.95],
        [30.5 * IN, 2.9],
      ],
    },
    {
      name: "buckler",
      source: "Wallace Collection A315 and A316",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createShield({ kind: "buckler" }, seed);
        return [dim(a, "diameter"), a.body.mass];
      },
      models: [
        [17.5 * IN, 3 * LB + 7 * OZ],
        [20.75 * IN, 3 * LB + 13 * OZ],
      ],
    },
    {
      name: "belt loop",
      source: "Safariland 692S, Rothco and High Speed Gear",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createWeaponLoop({ kind: "belt" }, seed);
        return [dim(a, "aperture")];
      },
      models: [[0.035], [1.5 * IN]],
    },
    {
      name: "rack",
      source: "Medieval Extreme and Gladney stands",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createWeaponRack({}, seed);
        return [dim(a, "width"), dim(a, "depth"), dim(a, "height")];
      },
      models: [
        [0.66, 0.23, 0.84],
        [0.695, 0.22, 0.66],
      ],
    },
    {
      name: "arrow",
      source: "Westminster Abbey arrow and Mary Rose AZ472/19",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createProjectile({ kind: "arrow" }, seed);
        return [a.body.mass];
      },
      models: [[0.05], [0.0625]],
    },
    {
      name: "bolt",
      source: "NMM 11461 and Met 33754",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createProjectile({ kind: "bolt" }, seed);
        return [dim(a, "length"), dim(a, "head"), a.body.mass];
      },
      models: [
        [
          0.36,
          0.077,
          Math.PI * 0.0068 * 0.0068 * (0.36 - 0.077) * 680 +
            ((0.0136 * 0.0136 * 0.077) / 3) * 7850,
        ],
        [0.437, 0.066, 0.074],
      ],
    },
    {
      name: "round shot",
      source: "Roberts 1863, 6-pdr. and 12-pdr. shot",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createProjectile(
          { kind: "roundShot" },
          seed,
        );
        return [dim(a, "diameter"), a.body.mass];
      },
      models: [
        [3.58 * IN, 6.1 * LB],
        [4.52 * IN, 12.3 * LB],
      ],
    },
    {
      name: "longsword",
      source: "Albion Crecy and Regent",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createSword({ kind: "longsword" }, seed);
        return [
          dim(a, "bladeLength"),
          dim(a, "bladeWidth"),
          dim(a, "hiltLength"),
          dim(a, "balance"),
          a.body.mass,
        ];
      },
      models: [
        [0.9, 0.05, 1.137 - 0.9, 0.1016, 1.39],
        [0.94, 0.05, 1.22 - 0.94, 0.13, 1.59],
      ],
    },
    {
      name: "arming sword",
      source: "Albion Knight and Poitiers",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createSword(
          { kind: "armingSword" },
          seed,
        );
        return [
          dim(a, "bladeLength"),
          dim(a, "bladeWidth"),
          dim(a, "hiltLength"),
          dim(a, "balance"),
          a.body.mass,
        ];
      },
      models: [
        [0.8, 0.0524, 0.968 - 0.8, 0.1143, 1.2],
        [0.7779, 0.0556, 0.9477 - 0.7779, 0.0857, 1.19],
      ],
    },
    {
      name: "sabre",
      source: "Pattern 1796 officer's and trooper's",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createSword({ kind: "sabre" }, seed);
        return [a.body.mass];
      },
      models: [[0.83], [0.96]],
    },
    {
      name: "holster",
      source: "Safariland ride heights",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createHolster({ kind: "holster" }, seed);
        return [dim(a, "ride")];
      },
      models: [[0], [-1.5 * IN], [1.5 * IN]],
    },
    {
      name: "spear",
      source: "Met 1989.220 and Museum Wales spearheads",
      measure: (seed: number): readonly number[] => {
        const a: AutoMovieArchetype = createPolearm({ kind: "spear" }, seed);
        return [dim(a, "headLength"), dim(a, "headWidth"), dim(a, "headMass")];
      },
      models: [
        [0.54, 0.048, 0.444],
        [0.362, 0.0333, 0.1417],
      ],
    },
  ];
  const findings: string[] = archetypeModelSweep(rows);
  const same = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));

  // A scabbard made to a read sword is that blade with the maker's fit; 200 seeds draw every read sword's scabbard.
  const swords: readonly (readonly [string, number, number])[] = [
    ["crecy", 0.9, 0.05],
    ["regent", 0.94, 0.05],
    ["knight", 0.8, 0.0524],
    ["poitiers", 0.7779, 0.0556],
  ];
  for (const [blade, length, width] of swords) {
    const scabbard: AutoMovieArchetype = createHolster(
      { kind: "scabbard", blade: blade as "crecy" },
      3,
    );
    if (
      !same(dim(scabbard, "length"), length + 0.015) ||
      !same(dim(scabbard, "width"), width + 0.02)
    )
      findings.push(
        `a scabbard made to the ${blade} is not its blade with the fit`,
      );
  }
  const lengths: number[] = [];
  for (let seed: number = 0; seed < 200; seed++)
    lengths.push(dim(createHolster({ kind: "scabbard" }, seed), "length"));
  for (const [blade, length] of swords)
    if (!lengths.some((value: number): boolean => same(value, length + 0.015)))
      findings.push(`200 seeds never made a scabbard to the ${blade}`);

  // 9. A model's own figure cannot be fixed.
  for (const [label, make, dimension] of [
    [
      "a G17's slide width",
      (): AutoMovieArchetype =>
        createHandgun({ frame: "fullSize", model: "g17", width: 0.0255 }, 1),
      "width",
    ],
    [
      "a holster's ride",
      (): AutoMovieArchetype => createHolster({ kind: "holster", ride: 0 }, 1),
      "ride",
    ],
    [
      "a lance's shaft",
      (): AutoMovieArchetype =>
        createPolearm({ kind: "lance", length: 2.5 }, 1),
      "length",
    ],
    [
      "a longbow's draw weight",
      (): AutoMovieArchetype =>
        createBow({ kind: "longbow", weight: "lb40" }, 1),
      "weight",
    ],
  ] as const)
    try {
      make();
      findings.push(`${label} was accepted`);
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.axis !== dimension
      )
        findings.push(`${label} was not refused on ${dimension}`);
    }

  TestValidator.equals(
    "every weapon with read models is one of them whole",
    findings,
    [],
  );
}
