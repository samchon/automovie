/** Every pair of expressions, asked whether it invents a crossing.
 *
 * The basis carries two correctives and both were written backwards: a pose was
 * photographed, a crossing was counted, and an endpoint was authored to take it
 * away. That finds defects in the order somebody happens to look at them and it
 * never says when the list ends. There are 52 expression channels, so there are
 * 1326 pairs, and a pair is either a face somebody can make or it is not. The
 * list ends when the pairs do.
 *
 * What counts as a defect here is narrow on purpose, and the first attempt got
 * it wrong. Measuring a pair against the larger of its two singles reported
 * `eyeBlinkLeft + eyeBlinkRight` as inventing 286 triangles, and shutting both
 * eyes is the most ordinary face there is. Two channels acting on regions that
 * do not meet simply add, so the larger single is the wrong baseline for them
 * and 475 of 1326 pairs was an overcount.
 *
 * Two baselines are reported instead, and they answer different questions.
 *
 * Superposition, `alone(i) + alone(j) - rest`, is what independent channels
 * would give, so the excess over it is interaction. It is summed per surface
 * pair and clipped at zero, because a combination that removes one crossing
 * while adding another has still added one.
 *
 * And the unambiguous one: a pair of surfaces that crosses under the
 * combination and under neither single. No baseline can argue with that -- a
 * jaw that opens and a mouth that closes each describe a reachable face, and
 * their sum describes teeth through a lip that was not through a lip before.
 *
 * Subjects are a sample and the sample is named rather than averaged: the
 * subject whose neutral pose already carries the most crossings and the one
 * that carries the fewest, so a pair that only breaks a crowded mouth and a
 * pair that breaks any mouth are told apart.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/enumerate-expression-pairs.ts [subject,...]
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);
const expressions = basis.channels
  .filter((channel) => channel.kind === "expression")
  .map((channel) => channel.id);

/** Triangles crossing, per pair of surfaces, so two poses can be differenced. */
const crossed = (
  document: IAutoMovieHumanFaceBasisDocument,
  expression: Record<string, number>,
): Map<string, number> => {
  const found = new Map<string, number>();
  for (const crossing of measureAutoMovieModelCrossings(
    build({ ...document, expression, hair: undefined }),
  )) {
    // The two names are sorted so a pair reads the same whichever way round it
    // is reported; otherwise the same two surfaces named the other way between
    // rest and pose would look like a pair the pose invented.
    const pair = [crossing.part, crossing.other]
      .sort((a, b) => a.localeCompare(b))
      .join(" x ");
    found.set(
      pair,
      (found.get(pair) ?? 0) + crossing.triangles + crossing.otherTriangles,
    );
  }
  return found;
};

const at = (rowsOf: Map<string, number>, pair: string) => rowsOf.get(pair) ?? 0;
const sum = (rowsOf: Map<string, number>) =>
  [...rowsOf.values()].reduce((total, one) => total + one, 0);

const wanted = process.argv[2]?.split(",") ?? [
  "miriam-margolyes",
  "park-eun-bin",
];
const chosen = documents.filter((one) =>
  wanted.includes(one.id.replace("-connected", "")),
);
if (chosen.length === 0) throw new Error(`no subject named ${wanted.join(", ")}`);

const report: Record<string, unknown> = {};
for (const document of chosen) {
  const name = document.id.replace("-connected", "");
  const started = Date.now();
  const rest = crossed(document, {});

  // Each channel alone, once, so 1326 pairs cost 1326 builds and not 3978.
  const alone = new Map<string, Map<string, number>>();
  for (const channel of expressions)
    alone.set(channel, crossed(document, { [channel]: 1 }));
  console.log(
    `${name}: rest ${sum(rest)} triangles over ${rest.size} surface pairs, ` +
      `${expressions.length} singles in ` +
      `${Math.round((Date.now() - started) / 1000)}s; ` +
      `${(expressions.length * (expressions.length - 1)) / 2} pairs to go`,
  );

  const found: {
    pair: string;
    interaction: number;
    appeared: string[];
    together: number;
  }[] = [];
  let done = 0;
  for (let i = 0; i < expressions.length; i++)
    for (let j = i + 1; j < expressions.length; j++) {
      const one = expressions[i];
      const other = expressions[j];
      const both = crossed(document, { [one]: 1, [other]: 1 });
      const left = alone.get(one)!;
      const right = alone.get(other)!;
      let interaction = 0;
      const appeared: string[] = [];
      for (const pair of new Set([...both.keys(), ...left.keys(), ...right.keys()])) {
        const expected = at(left, pair) + at(right, pair) - at(rest, pair);
        interaction += Math.max(0, at(both, pair) - Math.max(expected, 0));
        if (at(both, pair) > 0 && at(left, pair) === 0 && at(right, pair) === 0)
          appeared.push(pair);
      }
      if (interaction > 0 || appeared.length > 0)
        found.push({
          pair: `${one} + ${other}`,
          interaction,
          appeared,
          together: sum(both),
        });
      if (++done % 100 === 0)
        console.log(
          `  ${done} pairs, ${found.length} interacting, ` +
            `${Math.round((Date.now() - started) / 1000)}s`,
        );
    }
  found.sort((a, b) => b.interaction - a.interaction);

  const inventing = found.filter((one) => one.appeared.length > 0);
  report[name] = {
    restTriangles: sum(rest),
    restPairs: [...rest.keys()].sort((a, b) => a.localeCompare(b)),
    pairs: (expressions.length * (expressions.length - 1)) / 2,
    interacting: found.length,
    inventingASurfacePair: inventing.length,
    all: found,
    seconds: Math.round((Date.now() - started) / 1000),
  };
  console.log(
    `${name}: ${found.length} of ` +
      `${(expressions.length * (expressions.length - 1)) / 2} pairs interact past ` +
      `superposition, ${inventing.length} make a surface pair cross that neither ` +
      `side makes cross, in ${Math.round((Date.now() - started) / 1000)}s`,
  );
  for (const row of found.slice(0, 20))
    console.log(
      `  ${row.pair.padEnd(44)} ${String(row.interaction).padStart(7)}` +
        (row.appeared.length > 0 ? `   new: ${row.appeared.join(", ")}` : ""),
    );
}

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/expression-pairs.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
