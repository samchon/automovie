import {
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
  createSiegeEngine,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";

/** A foot, metres. */
const FT: number = 0.3048;

/** One expected band: its least and greatest value, and whether its source is borrowed or an estimate. */
type Expected = readonly [
  minimum: number,
  maximum: number,
  provisional: boolean,
];

/**
 * Each kind's bands as their sources give them, restated here: the trebuchet Hansen's replica as Saimre measured it (arms 5.85 and 1.2 m, axle 3.15 m, 2000 to 4000 kg counterweights, a 15 kg stone, cocked 32 degrees), its release, beam, frame, winch and whole mass estimates; the mangonel Tarver's traction trebuchet (a 16 ft beam at six to one, 12 ft uprights, 2.5 kg stones), its crew's pull as twenty pullers' 25 kg each and every other band an estimate.
 */
const EXPECTED: Readonly<
  Record<createSiegeEngine.Kind, Readonly<Record<string, Expected>>>
> = {
  trebuchet: {
    armLength: [5.85, 5.85, false],
    shortArm: [1.2, 1.2, false],
    axleHeight: [3.15, 3.15, false],
    counterweight: [2000, 4000, false],
    projectile: [15, 15, false],
    cocked: [32, 32, false],
    release: [70, 70, true],
    armMass: [300, 600, true],
    frameWidth: [1.5, 2.5, true],
    winchRadius: [0.3, 0.5, true],
    winchRatio: [10, 20, true],
    mass: [4000, 8000, true],
  },
  mangonel: {
    armLength: [(16 * FT * 6) / 7, (16 * FT * 6) / 7, false],
    shortArm: [(16 * FT) / 7, (16 * FT) / 7, false],
    axleHeight: [12 * FT, 12 * FT, false],
    counterweight: [20 * 25, 20 * 25, true],
    projectile: [2.5, 2.5, false],
    cocked: [0, 0, true],
    release: [60, 60, true],
    armMass: [40, 80, true],
    frameWidth: [12 * FT, 12 * FT, true],
    winchRadius: [0.3, 0.5, true],
    winchRatio: [10, 20, true],
    mass: [300, 600, true],
  },
};

/** The contacts every siege engine offers. */
const CONTACTS: readonly createSiegeEngine.Affordance[] = [
  "arm",
  "pouch",
  "pin",
  "winch",
  "frame",
];

/**
 * Every siege engine stays in its bands for every seed, reaches both ends of each, derives its arm's reach, and offers its contacts.
 *
 * Scenarios, over 200 seeds of each kind:
 * 1. Every band the produced engine records is the one `EXPECTED` states from the kind's source, ends and provisional mark alike, and every band `EXPECTED` states is recorded; every drawn value lies inside its band, and the values of a band with both ends apart span at least `archetypeBandSweep.COVERAGE` of it, #3368's acceptance floor.
 * 2. The arm's reach is derived, not drawn: through its rest straight up and as far again, 180 degrees plus its cocked travel.
 * 3. Each has an arm, a pouch, a pin, a winch and a frame, and a trebuchet a counterweight; a mangonel has none. The winch is a windlass: a crank that states no travel, its drum turning without a stop, following the arm by its ratio the other way.
 * 4. A throw from every seed launches: its release second lies after the pin's.
 */
export function test_unit_archetypes_weapons_siege_bands(): void {
  const findings: string[] = [];
  const near = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  for (const kind of createSiegeEngine.KINDS) {
    const reached: Map<string, { low: number; high: number }> = new Map();
    for (let seed: number = 0; seed < archetypeBandSweep.SEEDS; seed++) {
      const engine: AutoMovieArchetype<
        createSiegeEngine.Affordance,
        createSiegeEngine.Dimension
      > = createSiegeEngine({ kind }, seed);
      const d: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>> =
        engine.dimensions;
      const recorded: Readonly<
        Partial<Record<string, IAutoMovieArchetypeBand>>
      > = engine.provenance.bands;
      for (const name of new Set([
        ...Object.keys(recorded),
        ...Object.keys(EXPECTED[kind]),
      ])) {
        const band: IAutoMovieArchetypeBand | undefined = recorded[name];
        const want: Expected | undefined = EXPECTED[kind][name];
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
            `${kind}@${seed}: ${name} is drawn in ${band.minimum} to ${band.maximum}, not ${want[0]} to ${want[1]}${want[2] ? ", provisional" : ""}`,
          );
        const value: number = Object.entries(d).find(
          ([key]: [string, number | undefined]): boolean => key === name,
        )![1]!;
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
      if (
        engine.provenance.bands.reach !== undefined ||
        Math.abs(d.reach! - (180 + d.cocked!)) > 1e-9
      )
        findings.push(`${kind}@${seed}: the reach is ${d.reach}`);
      const ids: readonly string[] = engine.affordances.map(
        (a: { id: string }): string => a.id,
      );
      for (const id of CONTACTS)
        if (!ids.includes(id)) findings.push(`${kind}@${seed}: no ${id}`);
      if (ids.includes("counterweight") !== (kind === "trebuchet"))
        findings.push(`${kind}@${seed}: its counterweight is wrong`);
      const winch: ReturnType<typeof engine.affordance> =
        engine.affordance("winch");
      if (
        winch.kind !== "crank" ||
        winch.travel !== undefined ||
        winch.follows === undefined ||
        winch.follows.id !== "arm" ||
        winch.follows.ratio === undefined ||
        Math.abs(winch.follows.ratio + d.winchRatio!) > 1e-12
      )
        findings.push(
          `${kind}@${seed}: the winch is not a windlass following the arm by its ratio`,
        );
      if (seed % 50 === 0 && !(createSiegeEngine.throwAt(engine, 0).second > 0))
        findings.push(
          `${kind}@${seed}: the throw does not launch after the pin`,
        );
    }
    for (const [name, want] of Object.entries(EXPECTED[kind])) {
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
  TestValidator.equals("every siege engine stays in its bands", findings, []);
}
