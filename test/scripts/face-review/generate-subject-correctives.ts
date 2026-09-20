/** Solve each subject's own correctives, on the face that subject actually has.
 *
 * The basis correctives are fields on the shared neutral, and a population
 * verification showed what that is worth on a subject: about half of the
 * crossings they clear on the neutral head remain on the eighteen, with or
 * without the per-vertex identity, because a subject's shape channels have
 * moved its lip and its arch by different amounts and the neutral's answer
 * lands beside the crossing rather than on it. MetaHuman never meets this
 * because a character's DNA carries that character's own correctives. So does
 * this: a document may carry correctives, and this solves them.
 *
 * The procedure is the neutral generator's, run on the subject: its own pair
 * enumeration names the combinations that invent a crossing on this face with
 * the basis correctives already present; each is solved at full weight into a
 * document corrective, then at half weight on either channel with that
 * corrective present into an in-between. The rest direction and the agent
 * rule are the subject's own rest pose and the same standing orders.
 *
 * One subject per run, into its own file, so eighteen can run at once;
 * `--publish` folds every file back into the published documents and writes
 * the receipt. Nothing here changes the basis or its identity.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/generate-subject-correctives.ts <subject> [--limit mm]
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/generate-subject-correctives.ts --publish
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { LIMIT } from "./push-out";
import {
  type ISolvedCombination,
  type Parts,
  solveCombination,
  wornFrom,
} from "./solve-combination";

/** The in-between's peak, and the weight the second tier is solved at. */
const HALF = 0.5;
/** The part a channel makes the agent of its pose, which the lips then part around. */
const AGENTS: Record<string, string> = {
  tongueOut: "Human.tongue01/Human.tongue01",
};

const published = "studies/human-face/connected-basis/global-face";
const investigation = "../.shots/human-2469/investigation-2498";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
type Own = NonNullable<IAutoMovieHumanFaceBasisDocument["correctives"]>[number];
type Solved = {
  subject: string;
  basis: string;
  correctives: Own[];
  receipts: unknown[];
};
const fileOf = (subject: string) =>
  `${investigation}/subject-correctives-${subject}.json`;

if (process.argv.includes("--publish")) {
  const receipt: Record<string, unknown> = {};
  for (const document of documents) {
    const name = document.id.replace("-connected", "");
    if (!fs.existsSync(fileOf(name)))
      throw new Error(`not yet solved: ${name}`);
    const solved = JSON.parse(fs.readFileSync(fileOf(name), "utf8")) as Solved;
    if (solved.basis !== basis.id)
      throw new Error(
        `${name} was solved on ${solved.basis}, the basis reads ${basis.id}`,
      );
    document.correctives =
      solved.correctives.length > 0 ? solved.correctives : undefined;
    receipt[name] = {
      correctives: solved.correctives.map((one) => one.id),
      combinations: solved.receipts,
    };
  }
  fs.writeFileSync(
    `${published}/subjects.json`,
    `${JSON.stringify(documents, null, 2)}\n`,
  );
  fs.writeFileSync(
    `${published}/subject-corrective-receipt.json`,
    `${JSON.stringify(
      {
        basis: basis.id,
        budgetMillimetres: LIMIT * 1000,
        inBetweenPeak: HALF,
        subjects: receipt,
        limits: [
          "A document corrective is solved for the shape and identity the document was published with; editing the shape afterwards leaves it as authored.",
          "A combination beyond the budget on a subject is reported here and not published for that subject.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `published document correctives for ${documents.length} subjects`,
  );
  process.exit(0);
}

const positional = process.argv.slice(2).filter((one) => !one.startsWith("--"));
const subject = positional[0];
const document = documents.find((one) => one.id === `${subject}-connected`);
if (document === undefined) throw new Error(`no subject named ${subject}`);
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt < 0 ? LIMIT : Number(process.argv[limitAt + 1]) / 1000;
if (!Number.isFinite(limit) || limit <= 0)
  throw new Error(
    `--limit wants millimetres, not ${process.argv[limitAt + 1]}`,
  );

type Found = { pair: string; interaction: number; appeared: string[] };
const enumeration = JSON.parse(
  fs.readFileSync(`${investigation}/expression-pairs-${subject}.json`, "utf8"),
)[subject] as { all: Found[]; visited: number; pairs: number };
if (enumeration.visited !== enumeration.pairs)
  throw new Error(
    `${subject}: the enumeration visited ${enumeration.visited} of ${enumeration.pairs} pairs`,
  );
const offending = enumeration.all
  .filter((one) => one.appeared.length > 0)
  .sort(
    (a, b) => b.interaction - a.interaction || a.pair.localeCompare(b.pair),
  );
console.log(
  `${subject}: ${offending.length} of ${enumeration.pairs} combinations invent a crossing`,
);

const parts: Parts = new Map();
for (const surface of basis.surfaces)
  for (const region of surface.regions)
    parts.set(region.id, { surface: surface.id, indices: region.indices });
const build = createHumanFaceBasisBuilder(basis);
const own: Own[] = [];
/** This subject worn at one expression, with the correctives solved so far. */
const wearing = (expression: Record<string, number>) =>
  wornFrom(
    basis,
    new Map(
      build({
        ...document,
        expression,
        hair: undefined,
        correctives: own.length > 0 ? own : undefined,
      }).parts.map((part) => [
        part.id,
        (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
      ]),
    ),
  );
const atRest = wearing({});
const capital = (id: string) => id[0].toUpperCase() + id.slice(1);
const agentsOf = (channels: string[]): ReadonlySet<string> =>
  new Set(
    channels.flatMap((one) => (AGENTS[one] === undefined ? [] : [AGENTS[one]])),
  );

const receipts: unknown[] = [];
const keep = (
  id: string,
  inputs: Own["inputs"],
  solved: ISolvedCombination,
): boolean => {
  if (!solved.publishable) return false;
  own.push({ id, inputs, weight: 1, targets: Object.fromEntries(solved.rows) });
  return true;
};
const record = (
  pair: string,
  weights: string,
  id: string,
  kept: boolean,
  solved: ISolvedCombination,
) => {
  if (
    solved.outcomes.some(
      (o) => o.outcome === "repaired" || o.outcome === "beyond the budget",
    )
  )
    console.log(
      `${"".padEnd(40)} ${(kept ? `-> ${id}` : "-> not published").padEnd(46)}` +
        ` crease ${(solved.creaseMetres * 1000).toFixed(2)} mm`,
    );
  receipts.push({
    combination: pair,
    weights,
    corrective: kept ? id : null,
    movedVertices: solved.movedVertices,
    creaseMillimetres: solved.creaseMetres * 1000,
    crossings: solved.outcomes,
  });
};

const firstTier = new Map<string, string>();
for (const one of offending) {
  const [first, second] = one.pair.split(" + ");
  const solved = solveCombination(
    wearing({ [first]: 1, [second]: 1 }),
    one.appeared,
    parts,
    atRest,
    limit,
    agentsOf([first, second]),
    (line) => console.log(`${one.pair.padEnd(40)} ${line}`),
  );
  const id = `${first}${capital(second)}Own`;
  const kept = keep(
    id,
    [
      { channel: first, side: "positive" },
      { channel: second, side: "positive" },
    ],
    solved,
  );
  if (kept) firstTier.set(one.pair, id);
  record(one.pair, "1,1", id, kept, solved);
}
console.log(`\n${subject}: second tier at half weight on one channel`);
for (const one of offending) {
  const full = firstTier.get(one.pair);
  if (full === undefined) continue;
  const [first, second] = one.pair.split(" + ");
  for (const halved of [first, second]) {
    const other = halved === first ? second : first;
    const solved = solveCombination(
      wearing({ [halved]: HALF, [other]: 1 }),
      one.appeared,
      parts,
      atRest,
      limit,
      agentsOf([first, second]),
      (line) =>
        console.log(`${`${one.pair} @${halved}=${HALF}`.padEnd(40)} ${line}`),
    );
    const id = `${full}${halved === first ? "First" : "Second"}Half`;
    const kept = keep(
      id,
      [
        {
          channel: first,
          side: "positive",
          ...(halved === first ? { peak: HALF } : {}),
        },
        {
          channel: second,
          side: "positive",
          ...(halved === second ? { peak: HALF } : {}),
        },
      ],
      solved,
    );
    record(
      one.pair,
      halved === first ? `${HALF},1` : `1,${HALF}`,
      id,
      kept,
      solved,
    );
  }
}
const solved: Solved = { subject, basis: basis.id, correctives: own, receipts };
fs.writeFileSync(fileOf(subject), `${JSON.stringify(solved)}\n`);
console.log(
  `${subject}: ${firstTier.size} correctives at full weight, ${own.length - firstTier.size} in-betweens, ` +
    `${offending.length - firstTier.size} combinations not published`,
);
