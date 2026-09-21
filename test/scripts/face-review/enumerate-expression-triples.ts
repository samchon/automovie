/** A sample of expression triples, asked whether any invents a crossing.
 *
 * Fifty-two channels make 22,100 triples, which is twelve hours a head, so
 * the triples are sampled where a third channel could matter: the pairs that
 * interact most on the neutral head, each joined by every channel that
 * interacts with either member. A triple counts only when it makes a part
 * pair cross that none of its three pairs and none of its three singles makes
 * cross, with the published pair correctives present, so what it reports is
 * what the pair correctives leave to a third channel and nothing the pairs
 * already answer.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/enumerate-expression-triples.ts [subject|neutral] [--pairs N]
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { crossingPairs } from "./solve-combination";

const published = "studies/human-face/connected-basis/global-face";
const investigation = "../.shots/human-2469/investigation-2498";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const positional = process.argv.slice(2).filter((one) => !one.startsWith("--"));
const name = positional[0] ?? "neutral";
const document: IAutoMovieHumanFaceBasisDocument =
  name === "neutral"
    ? {
        id: "neutral",
        name: "neutral",
        basis: basis.id,
        shape: {},
        expression: {},
      }
    : documents.find((one) => one.id === `${name}-connected`)!;
if (document === undefined) throw new Error(`no subject named ${name}`);
const asked = process.argv.indexOf("--pairs");
const top = asked < 0 ? 30 : Number(process.argv[asked + 1]);
if (!Number.isFinite(top) || top <= 0)
  throw new Error(`--pairs wants a count, not ${process.argv[asked + 1]}`);

// The interaction graph from the head's own pair enumeration.
type Found = { pair: string; interaction: number; appeared: string[] };
const shards = fs
  .readdirSync(investigation)
  .filter((file) =>
    name === "neutral"
      ? /^expression-pairs-neutral(\.\d+of\d+)?\.json$/.test(file)
      : file === `expression-pairs-${name}.json`,
  );
const found: Found[] = shards.flatMap(
  (file) =>
    (
      JSON.parse(fs.readFileSync(`${investigation}/${file}`, "utf8"))[name] as {
        all: Found[];
      }
    ).all,
);
const interacting = found
  .filter((one) => one.interaction > 0)
  .sort((a, b) => b.interaction - a.interaction);
const partners = new Map<string, Set<string>>();
const partnersOf = (channel: string): Set<string> => {
  let found = partners.get(channel);
  if (found === undefined) {
    found = new Set();
    partners.set(channel, found);
  }
  return found;
};
for (const one of interacting) {
  const [a, b] = one.pair.split(" + ");
  partnersOf(a).add(b);
  partnersOf(b).add(a);
}
const triples = new Set<string>();
for (const one of interacting.slice(0, top)) {
  const [a, b] = one.pair.split(" + ");
  for (const c of new Set([
    ...(partners.get(a) ?? []),
    ...(partners.get(b) ?? []),
  ]))
    if (c !== a && c !== b)
      triples.add([a, b, c].sort((x, y) => x.localeCompare(y)).join(" + "));
}
console.log(
  `${name}: ${triples.size} triples from the top ${top} interacting pairs`,
);

const build = createHumanFaceBasisBuilder(basis);
const cache = new Map<string, Set<string>>();
const crossed = (channels: string[]): Set<string> => {
  const key = [...channels].sort((a, b) => a.localeCompare(b)).join("+");
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = crossingPairs(
      build({
        ...document,
        expression: Object.fromEntries(channels.map((one) => [one, 1])),
        hair: undefined,
      }),
    );
    cache.set(key, hit);
  }
  return hit;
};

const started = Date.now();
const report: { triple: string; appeared: string[] }[] = [];
let done = 0;
for (const triple of [...triples].sort((a, b) => a.localeCompare(b))) {
  const [a, b, c] = triple.split(" + ");
  const below = new Set<string>();
  for (const subset of [[a], [b], [c], [a, b], [a, c], [b, c]])
    for (const pair of crossed(subset)) below.add(pair);
  const appeared = [...crossed([a, b, c])]
    .filter((pair) => !below.has(pair))
    .sort((x, y) => x.localeCompare(y));
  if (appeared.length > 0) {
    report.push({ triple, appeared });
    console.log(`  ${triple.padEnd(60)} new: ${appeared.join(", ")}`);
  }
  if (++done % 50 === 0)
    console.log(
      `  ${done}/${triples.size} triples, ${report.length} inventing, ${Math.round((Date.now() - started) / 1000)}s`,
    );
}
console.log(
  `${name}: ${report.length} of ${triples.size} sampled triples invent a surface pair in ${Math.round((Date.now() - started) / 1000)}s`,
);
fs.writeFileSync(
  `${investigation}/expression-triples-${name}.json`,
  `${JSON.stringify({ subject: name, basis: basis.id, sampledFromTopPairs: top, triples: triples.size, inventing: report }, null, 2)}\n`,
);
