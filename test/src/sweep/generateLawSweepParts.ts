import * as fs from "node:fs";
import * as path from "node:path";

import { MOTION_HUMAN_LAW_STAGES } from "../features/internal/MOTION_HUMAN_LAW_STAGES";
import { motionHumanLawCovering } from "../features/internal/motionHumanLawCovering";
import { motionSportRows } from "../features/internal/motionSportRows";

/**
 * Writes the part specs of the universal law sweep,
 * `test_human_motion_law_sweep_<family>_<nn>.ts` in `src/features/motion`:
 * each family's covering array (`motionHumanLawCovering`) cut into parts of
 * at most `cells` cells a body (`motionHumanLawCovering.part`), so each part
 * prepares two bodies and stays under a minute alone at the measured cost.
 * A family's earlier part specs are removed first, so a regeneration with
 * another size leaves none behind.
 *
 * Run with `pnpm --filter @automovie/test sweep:parts [cells] [family...]`:
 * `cells` is the most cells a part takes of one body (4 when absent), and
 * the families are those of `MOTION_HUMAN_LAW_STAGES` (all when absent).
 *
 * With `sweep:parts sportRows [checks]` it writes instead the parts of the
 * sport net (`motionSportRows`) on the bodies and proficiencies a row must
 * plan on beyond the trained nets of `test_human_motion_sport_rows_f_small`
 * and `_m_average`: the smallest and the largest body (`f-small`, `m-large`)
 * at `novice` and at `elite`, each cut into parts of at most `checks` checks
 * (`SPORT_CHECKS` when absent), `test_human_motion_sport_rows_<body>_<level>_<nn>.ts`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is written, where, how a part is sized and how to run it.
 * @evidence contracts/development/implementation.md#principled-implementation The part count is read off the covering array itself, the cells each body performs, so the parts together are exactly the whole array.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One family table of descriptions, one sizing and one spec template.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A family missing from the description table, or a size that is not a positive integer, throws rather than writing a spec without its claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms Counts cells without performing any.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The covering design and the cut are `motionHumanLawCovering`'s.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A one-shot script.
 */
const main = (): void => {
  const args: string[] = process.argv.slice(2);
  if (args[0] === "sportRows") return sportRows(args[1]);
  const cells: number = args[0] === undefined ? 4 : Number(args[0]);
  if (!Number.isInteger(cells) || cells < 1)
    throw new Error(
      `the cells a part takes must be a positive integer, not ${args[0]}`,
    );
  const families: string[] =
    args.length > 1 ? args.slice(1) : Object.keys(MOTION_HUMAN_LAW_STAGES);
  // The script runs from the test package (`pnpm --filter`), bundled into bin.
  const folder: string = path.join(process.cwd(), "src", "features", "motion");
  for (const family of families) {
    const claim: string | undefined = CLAIMS[family];
    const table = (
      MOTION_HUMAN_LAW_STAGES as Record<
        string,
        (typeof MOTION_HUMAN_LAW_STAGES)[keyof typeof MOTION_HUMAN_LAW_STAGES]
      >
    )[family];
    if (claim === undefined || table === undefined)
      throw new Error(`no stage table or description for the family ${family}`);
    const counts: Record<string, number> = motionHumanLawCovering.cells(table);
    const bodies: string[] = Object.keys(counts);
    const k: number = Math.max(
      1,
      ...bodies.map((b: string): number => Math.ceil(counts[b]! / cells)),
    );
    const n: number = bodies.length * k;
    for (const file of fs.readdirSync(folder))
      if (
        new RegExp(`^test_human_motion_law_sweep_${family}_\\d+\\.ts$`).test(
          file,
        )
      )
        fs.rmSync(path.join(folder, file));
    const constant: string = `MOTION_HUMAN_LAW_STAGES_${family.toUpperCase()}`;
    const digits: number = String(n).length < 2 ? 2 : String(n).length;
    for (let i: number = 0; i < n; i++) {
      const name: string = `test_human_motion_law_sweep_${family}_${String(i + 1).padStart(digits, "0")}`;
      fs.writeFileSync(
        path.join(folder, `${name}.ts`),
        spec(
          name,
          family,
          claim,
          constant,
          bodies[Math.floor(i / k)]!,
          i,
          n,
          k,
        ),
      );
    }
    console.log(`${family}: ${n} parts of at most ${cells} cells a body`);
  }
};

/**
 * The most checks a sport net part takes: a check (one short performance)
 * measured about 10 s on 2026-11-16 (725 s for 73 performances of the sport
 * rows spec), so five keep a part under a minute alone.
 */
const SPORT_CHECKS: number = 5;

/** The bodies the sport net's parts cover: the smallest and the largest. */
const SPORT_BODIES: readonly ("f-small" | "m-large")[] = ["f-small", "m-large"];

/** The proficiencies the sport net's parts cover: its two ends, beyond the trained nets of `f-small` and `m-average`. */
const SPORT_LEVELS: readonly ("novice" | "elite")[] = ["novice", "elite"];

/** Writes the sport net's parts, at most `size` checks each (`SPORT_CHECKS` when absent). */
const sportRows = (size: string | undefined): void => {
  const checks: number = size === undefined ? SPORT_CHECKS : Number(size);
  if (!Number.isInteger(checks) || checks < 1)
    throw new Error(
      `the checks a part takes must be a positive integer, not ${size}`,
    );
  const folder: string = path.join(process.cwd(), "src", "features", "motion");
  const n: number = Math.ceil(motionSportRows.count() / checks);
  const digits: number = String(n).length < 2 ? 2 : String(n).length;
  for (const body of SPORT_BODIES)
    for (const level of SPORT_LEVELS) {
      const stem: string = `test_human_motion_sport_rows_${body.replace("-", "_")}_${level}`;
      for (const file of fs.readdirSync(folder))
        if (new RegExp(`^${stem}_\\d+\\.ts$`).test(file))
          fs.rmSync(path.join(folder, file));
      for (let i: number = 0; i < n; i++) {
        const name: string = `${stem}_${String(i + 1).padStart(digits, "0")}`;
        fs.writeFileSync(
          path.join(folder, `${name}.ts`),
          sportSpec(name, body, level, i, n),
        );
      }
      console.log(`sport rows ${body} ${level}: ${n} parts of at most ${checks} checks`);
    }
};

/** One sport net part's spec. */
const sportSpec = (
  name: string,
  body: string,
  level: string,
  i: number,
  n: number,
): string =>
  [
    `import { motionSportRows } from "../internal/motionSportRows";`,
    ``,
    `/**`,
    ` * Every kind of the sport, exercise, stretch and dance actions, and every`,
    ` * row of \`HumanSport\`, is something a body can do at every proficiency:`,
    ` * on ${body} at ${level} it is accepted and planned out of quiet standing,`,
    ` * by the action's own method and by the row that names it for a screenplay.`,
    ` * \`motionSportRows\` states the 2 scenarios.`,
    ` *`,
    ` * This is part ${i + 1} of ${n} of the net on ${body} at ${level}: the checks whose position in the net leaves ${i} when divided by ${n}; the ${n} parts together are the whole net. Written by \`pnpm --filter @automovie/test sweep:parts sportRows\`.`,
    ` *`,
    ` * @evidence contracts/development/testing.md#behavioral-verification Builds a performance of every kind and row of the part through the public chain and input on a real body; a kind that is refused, plans no time, or a row placed under another name fails with the kind, the body, the proficiency and the refusal's message.`,
    ` * @evidence contracts/development/testing.md#independent-expectations That each kind is humanly performable out of standing at any proficiency is what the vocabulary claims; nothing is compared with a value read from a law.`,
    ` * @evidence contracts/development/testing.md#distinguishing-cases The smallest and the largest body at the two ends of proficiency, each a spec of parts; the trained nets are \`test_human_motion_sport_rows_f_small\` and \`_m_average\`.`,
    ` * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds this part's short performances, under a minute alone; the test program discovers every \`test_\` function, so \`pnpm test\` and the CI test job run it.`,
    ` * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, the part's share of it and where the scenarios are stated.`,
    ` */`,
    `export function ${name}(): void {`,
    `  motionSportRows.run("${body}", "${level}", [${i}, ${n}]);`,
    `}`,
    ``,
  ].join("\n");

/** What each family's sweep claims, naming its laws. */
const CLAIMS: Record<string, string> = {
  handling:
    "picking up, putting down, handing over, receiving, the handshake, throwing, catching, operating a mechanism, kicking a ball, using a tool, wiping and dressing",
  locomotion:
    "standing, walking, running, jumping, approaching, stepping over, stairs, a ladder, crawling and carrying",
  posture:
    "looking, gesturing, resting the hands, bracing, bending, crouching, kneeling, lying down, moving across supports, getting up from the floor, sitting, shifting, rising and typing",
  sport:
    "exercise repetitions, stretches, dance steps, the sprint start, the gymnast's stand, martial forms, ball handling, baseball postures, racket postures and swimming",
  striking:
    "the guard, the fighting step, the punch, the kick, the knee, the defences, the reactions to a blow and the clinch",
  touch:
    "a touch on a partner, a hand brought to the face, a kiss, a high five and the actions done to oneself",
};

/** One part's spec. */
const spec = (
  name: string,
  family: string,
  claim: string,
  constant: string,
  body: string,
  i: number,
  n: number,
  k: number,
): string =>
  [
    `import { TestValidator } from "@nestia/e2e";`,
    ``,
    `import { ${constant} } from "../internal/${constant}";`,
    `import { motionHumanLawCovering } from "../internal/motionHumanLawCovering";`,
    ``,
    `/**`,
    ` * Every combination of every ${family} law moves a real body as a body can`,
    ` * move: ${claim}.`,
    ` *`,
    ` * Each law is staged over a covering array of its parameters (each value`,
    ` * and the parameter left out), the four extreme bodies and the three seeds:`,
    ` * every pair of values of any two factors meets in some cell, and every`,
    ` * triple for a law with three or more parameters, which covers the`,
    ` * interactions that trigger nearly all faults (Kuhn, Kacker and Lei 2010,`,
    ` * NIST SP 800-142) at a small share of the Cartesian product`,
    ` * (\`motionHumanLawCovering\`). Each cell is performed and read off the`,
    ` * displayed bones; the complaints of every cell are gathered before the one`,
    ` * assertion, so a failing cell does not hide the others, and each names its`,
    ` * law, settings, bodies, seed, person, check, measured value, limit and`,
    ` * instant. The mirror image of a side is checked by the metamorphic mirror`,
    ` * specs.`,
    ` *`,
    ` * This is part ${i + 1} of ${n} of the sweep (\`motionHumanLawCovering.part\`): the cells whose performer is ${body}, those whose position among that body's cells leaves ${i % k} when divided by ${k}, so each part prepares two bodies and stays under a minute; the ${n} parts together are the whole covering array. Written by \`pnpm --filter @automovie/test sweep:parts\`.`,
    ` *`,
    ` * Scenarios, per cell:`,
    ` * 1. The film plans without refusal and every declared window and event is`,
    ` *    well formed.`,
    ` * 2. No segment enters another, or the partner, deeper than 10 mm.`,
    ` * 3. Nothing sinks under the floor; a planted foot neither slips nor lifts;`,
    ` *    a foot shown on the floor does not skate and a declared plant is`,
    ` *    neither loose nor afloat; the mass stays over its support.`,
    ` * 4. No joint centre jumps, reverses or outruns a joint between frames, no`,
    ` *    bone spins through a turn, and every joint stays in its range.`,
    ` * 5. The same seed gives the same film, on each law's first cell.`,
    ` *`,
    ` * @evidence contracts/development/testing.md#behavioral-verification Performs each real law through the chain and reads displayed bones and colliders; a refusal, a penetration, a slipped foot, a jump or a joint out of range fails with its cell and number.`,
    ` * @evidence contracts/development/testing.md#independent-expectations Every bound is the audit's own physical limit or the body's symmetry; none is read from a law's output.`,
    ` * @evidence contracts/development/testing.md#distinguishing-cases A covering array per law of the family: every pair (or triple) of parameter values, extreme bodies and seeds.`,
    ` * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and performs this part's cells in memory, under a minute alone; the test program discovers every \`test_\` function, so \`pnpm test\` and the CI test job run it.`,
    ` * @evidence contracts/development/common.md#meaningful-documentation States the covering design, the part's share of it, how the complaints are gathered and the 5 scenarios with their bounds.`,
    ` */`,
    `export function ${name}(): void {`,
    `  TestValidator.equals(`,
    `    "every ${family} cell of part ${i + 1} of ${n} is clean",`,
    `    motionHumanLawCovering.part(${constant}, [${i}, ${n}]),`,
    `    [],`,
    `  );`,
    `}`,
    ``,
  ].join("\n");

main();
