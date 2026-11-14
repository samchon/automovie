import {
  createBall,
  createDiscus,
  createGlove,
  createGolfClub,
  createHammerThrow,
  createHurdle,
  createJavelin,
  createRacket,
  createRelayBaton,
  createShot,
  createStartingBlock,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The balls, the struck and thrown implements and the track's hurdle, block and baton are placed in a scene where they were put, and their act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. Every kind of ball, racket, golf club, glove, javelin, shot, discus, hammer and hurdle, the starting block and the baton, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds: the football 0.2165 to 0.2228 m, the basketball 0.2384 to 0.2483 m, the tennis ball 65.4 to 68.6 mm and the golf ball 42.67 to 43 mm across (each rule's circumference or diameter); the tennis racket 0.686 to 0.737 m long; the driver 1.105 to 1.168 m long; the men's javelin 2.6 to 2.7 m long; the men's shot 110 to 130 mm and the men's discus 219 to 221 mm across; the men's 110 m hurdle's top 1.064 to 1.070 m high; the baton 0.28 to 0.30 m long and 38 to 42 mm across.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the family through the public chain and reads the displayed prop frames, and measures colliders on the produced things; one that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are written here from the rules each producer cites, a circumference divided by pi where the rule gives one.
 * @evidence contracts/development/testing.md#distinguishing-cases Every producer and kind for placement; one act-read size per producer for the bands, four balls of four rules.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_sport_placed(): void {
  const kinds = <Kind extends string>(
    name: string,
    all: readonly Kind[],
    make: (kind: Kind) => archetypePlaced.IRow["archetype"],
    yaw: number,
  ): archetypePlaced.IRow[] =>
    all.map(
      (kind: Kind): archetypePlaced.IRow => ({
        name: `${name}-${kind}`,
        archetype: make(kind),
        yaw,
      }),
    );
  const findings: string[] = archetypePlaced([
    ...kinds(
      "ball",
      createBall.KINDS,
      (kind: createBall.Kind): archetypePlaced.IRow["archetype"] =>
        createBall({ kind }),
      0,
    ),
    ...kinds(
      "racket",
      createRacket.KINDS,
      (kind: createRacket.Kind): archetypePlaced.IRow["archetype"] =>
        createRacket({ kind }),
      30,
    ),
    ...kinds(
      "golfClub",
      createGolfClub.KINDS,
      (kind: createGolfClub.Kind): archetypePlaced.IRow["archetype"] =>
        createGolfClub({ kind }),
      60,
    ),
    ...kinds(
      "glove",
      createGlove.KINDS,
      (kind: createGlove.Kind): archetypePlaced.IRow["archetype"] =>
        createGlove({ kind }),
      90,
    ),
    ...kinds(
      "javelin",
      createJavelin.KINDS,
      (kind: createJavelin.Kind): archetypePlaced.IRow["archetype"] =>
        createJavelin({ kind }),
      120,
    ),
    ...kinds(
      "shot",
      createShot.KINDS,
      (kind: createShot.Kind): archetypePlaced.IRow["archetype"] =>
        createShot({ kind }),
      150,
    ),
    ...kinds(
      "discus",
      createDiscus.KINDS,
      (kind: createDiscus.Kind): archetypePlaced.IRow["archetype"] =>
        createDiscus({ kind }),
      180,
    ),
    ...kinds(
      "hammerThrow",
      createHammerThrow.KINDS,
      (kind: createHammerThrow.Kind): archetypePlaced.IRow["archetype"] =>
        createHammerThrow({ kind }),
      210,
    ),
    ...kinds(
      "hurdle",
      createHurdle.KINDS,
      (kind: createHurdle.Kind): archetypePlaced.IRow["archetype"] =>
        createHurdle({ kind }),
      240,
    ),
    { name: "startingBlock", archetype: createStartingBlock(), yaw: 270 },
    { name: "relayBaton", archetype: createRelayBaton(), yaw: 300 },
  ]);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  const across =
    (make: (seed: number) => archetypePlaced.IRow["archetype"]) =>
    (seed: number): number =>
      archetypeExtent(make(seed), "x").size;
  const tall =
    (make: (seed: number) => archetypePlaced.IRow["archetype"]) =>
    (seed: number): number =>
      archetypeExtent(make(seed), "y").high;
  findings.push(
    ...archetypeBandSweep([
      row(
        "football diameter",
        0.68 / Math.PI,
        0.7 / Math.PI,
        "IFAB Law 2, 68 to 70 cm round",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createBall({ kind: "football" }, seed),
        ),
      ),
      row(
        "basketball diameter",
        0.749 / Math.PI,
        0.78 / Math.PI,
        "FIBA size 7, 749 to 780 mm round",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createBall({ kind: "basketball" }, seed),
        ),
      ),
      row(
        "tennis ball diameter",
        0.0654,
        0.0686,
        "ITF Appendix I, 6.54 to 6.86 cm",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createBall({ kind: "tennis" }, seed),
        ),
      ),
      row(
        "golf ball diameter",
        0.04267,
        0.043,
        "R&A and USGA, at least 42.67 mm",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createBall({ kind: "golf" }, seed),
        ),
      ),
      row(
        "tennis racket length",
        0.686,
        0.737,
        "ITF Appendix II, at most 73.7 cm",
        tall((seed: number): archetypePlaced.IRow["archetype"] =>
          createRacket({ kind: "tennis" }, seed),
        ),
      ),
      row(
        "driver length",
        43.5 * 0.0254,
        46 * 0.0254,
        "R&A and USGA, at most 46 in",
        tall((seed: number): archetypePlaced.IRow["archetype"] =>
          createGolfClub({ kind: "driver" }, seed),
        ),
      ),
      row(
        "men's javelin length",
        2.6,
        2.7,
        "World Athletics, 2.60 to 2.70 m",
        tall((seed: number): archetypePlaced.IRow["archetype"] =>
          createJavelin({ kind: "men" }, seed),
        ),
      ),
      row(
        "men's shot diameter",
        0.11,
        0.13,
        "World Athletics, 110 to 130 mm",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createShot({ kind: "men" }, seed),
        ),
      ),
      row(
        "men's discus diameter",
        0.219,
        0.221,
        "World Athletics, 219 to 221 mm",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createDiscus({ kind: "men" }, seed),
        ),
      ),
      row(
        "men's 110 m hurdle height",
        1.064,
        1.07,
        "World Athletics, 1.067 m to 3 mm",
        tall((seed: number): archetypePlaced.IRow["archetype"] =>
          createHurdle({ kind: "men110" }, seed),
        ),
      ),
      row(
        "baton length",
        0.28,
        0.3,
        "World Athletics, 28 to 30 cm",
        tall((seed: number): archetypePlaced.IRow["archetype"] =>
          createRelayBaton({}, seed),
        ),
      ),
      row(
        "baton diameter",
        0.038,
        0.042,
        "World Athletics, 40 mm to 2 mm",
        across((seed: number): archetypePlaced.IRow["archetype"] =>
          createRelayBaton({}, seed),
        ),
      ),
    ]),
  );
  TestValidator.equals(
    "the balls, implements and track gear are placed and sized",
    findings,
    [],
  );
}
