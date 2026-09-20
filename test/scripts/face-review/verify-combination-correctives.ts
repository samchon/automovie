/** Ask every subject whether the published pair correctives hold on them.
 *
 * A corrective is solved on the neutral head at full weight on both channels,
 * and that is the only pose it has been seen to clear. The same field lands on
 * eighteen identities whose lips and teeth are not where the neutral's are,
 * and at half weights it lands at a quarter of its strength on a pose that may
 * still cross. Neither is an assumption worth publishing on, so both are
 * measured: each subject wears each corrected combination at (1,1), (1,½),
 * (½,1) and (½,½), with the pair correctives present and with them removed,
 * and the surface pairs that cross under the combination and under neither
 * single are counted both ways.
 *
 * Two things are checked, and they are different. That the combination no
 * longer invents a surface pair is the repair. That the corrective invents no
 * surface pair of its own -- that every pair crossing after was crossing
 * before -- is the guarantee a repair must give, because a lip pushed clear of
 * the teeth can be pushed into the skin, and a count of teeth-through-lip alone
 * would call that a success.
 *
 * `--summarize` reads every per-subject file back and folds the population
 * into the published receipt, so the receipt carries what was verified rather
 * than what was intended. One subject is about ten minutes; run several at
 * once by naming them.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/verify-combination-correctives.ts [subject,...] [--without-identity]
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/verify-combination-correctives.ts --summarize
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

/** The weights a combination is worn at; the solver only ever saw the first. */
const WEIGHTS: [number, number][] = [
  [1, 1],
  [1, 0.5],
  [0.5, 1],
  [0.5, 0.5],
];

const published = "studies/human-face/connected-basis/global-face";
const investigation = "../.shots/human-2469/investigation-2498";
const receiptFile = `${published}/pair-corrective-receipt.json`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const receipt = JSON.parse(fs.readFileSync(receiptFile, "utf8")) as {
  basis: string;
  published: string[];
  combinations: { combination: string; corrective: string | null }[];
  verification?: unknown;
};
if (receipt.basis !== basis.id)
  throw new Error(
    `the receipt is for ${receipt.basis}, the basis reads ${basis.id}`,
  );

type Verified = {
  subject: string;
  combinations: Record<
    string,
    Record<
      string,
      {
        before: { appeared: string[]; crossing: string[] };
        after: { appeared: string[]; crossing: string[] };
        introduced: string[];
      }
    >
  >;
};

/**
 * `--without-identity` drops each subject's per-vertex identity, leaving the
 * shape channels: the experiment that separates a crossing the shape channels
 * made, which move the teeth with the skin, from one the identity layer made,
 * which moves the skin alone.
 */
const withoutIdentity = process.argv.includes("--without-identity");

/** One file per subject, so a run that dies keeps what the others finished. */
const fileOf = (subject: string) =>
  `${investigation}/combination-verification-${subject}${withoutIdentity ? "-without-identity" : ""}.json`;

if (process.argv.includes("--summarize")) {
  const names = [
    "neutral",
    ...documents.map((one) => one.id.replace("-connected", "")),
  ];
  const missing = names.filter((name) => !fs.existsSync(fileOf(name)));
  if (missing.length > 0)
    throw new Error(`not yet verified: ${missing.join(", ")}`);
  const summary: Record<string, unknown> = {};
  let held = 0;
  let broke = 0;
  let introduced = 0;
  const failures: string[] = [];
  for (const name of names) {
    const verified = JSON.parse(
      fs.readFileSync(fileOf(name), "utf8"),
    ) as Verified;
    for (const [combination, byWeight] of Object.entries(verified.combinations))
      for (const [weight, result] of Object.entries(byWeight)) {
        const repaired =
          result.before.appeared.length > 0 &&
          result.after.appeared.length === 0;
        const clean = result.after.appeared.length === 0;
        if (clean) held++;
        else broke++;
        if (result.introduced.length > 0) {
          introduced++;
          failures.push(
            `${name} ${combination} @${weight} introduces ${result.introduced.join(", ")}`,
          );
        }
        if (!clean && result.before.appeared.length === 0)
          failures.push(
            `${name} ${combination} @${weight} crossed only after: ${result.after.appeared.join(", ")}`,
          );
        void repaired;
      }
    summary[name] = Object.fromEntries(
      Object.entries(verified.combinations).map(([combination, byWeight]) => [
        combination,
        Object.fromEntries(
          Object.entries(byWeight).map(([weight, result]) => [
            weight,
            `${result.before.appeared.length} -> ${result.after.appeared.length}` +
              (result.introduced.length > 0
                ? ` +${result.introduced.length} introduced`
                : ""),
          ]),
        ),
      ]),
    );
  }
  receipt.verification = {
    weights: WEIGHTS.map((one) => one.join(",")),
    poses: held + broke,
    posesWithNoInventedCrossing: held,
    posesStillInventingACrossing: broke,
    posesWhereTheCorrectiveIntroducedACrossing: introduced,
    failures,
    bySubject: summary,
  };
  fs.writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    `${held + broke} poses over ${names.length} heads: ${held} invent no crossing, ` +
      `${broke} still do, ${introduced} where the corrective introduced one`,
  );
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(0);
}

/**
 * The same basis with the pair correctives removed: the before of the A/B.
 * Their endpoints go too, because the basis refuses a target nothing names.
 */
const removed = (basis.correctives ?? []).filter((one) =>
  receipt.published.includes(one.id),
);
const stripped: IAutoMovieHumanFaceBasis = {
  ...basis,
  correctives: (basis.correctives ?? []).filter(
    (one) => !removed.includes(one),
  ),
  surfaces: basis.surfaces.map((surface) => ({
    ...surface,
    targets: Object.fromEntries(
      Object.entries(surface.targets).filter(
        ([name]) => !removed.some((one) => one.target === name),
      ),
    ),
  })),
};
const after = createHumanFaceBasisBuilder(basis);
const before = createHumanFaceBasisBuilder(stripped);

/** Surface pairs crossing, keyed both ways round the same. */
const crossed = (
  build: typeof after,
  document: IAutoMovieHumanFaceBasisDocument,
  expression: Record<string, number>,
): Set<string> => {
  const found = new Set<string>();
  for (const crossing of measureAutoMovieModelCrossings(
    build({
      ...document,
      expression,
      hair: undefined,
      identity: withoutIdentity ? undefined : document.identity,
    }),
  ))
    found.add(
      [crossing.part, crossing.other]
        .sort((a, b) => a.localeCompare(b))
        .join(" x "),
    );
  return found;
};

const positional = process.argv.slice(2).filter((one) => !one.startsWith("--"));
const wanted = positional[0]?.split(",") ?? ["neutral"];
const neutral: IAutoMovieHumanFaceBasisDocument = {
  id: "neutral",
  name: "neutral",
  basis: basis.id,
  shape: {},
  expression: {},
};
const chosen = [
  ...(wanted.includes("neutral") ? [neutral] : []),
  ...documents.filter((one) =>
    wanted.includes(one.id.replace("-connected", "")),
  ),
];
if (chosen.length === 0)
  throw new Error(`no subject named ${wanted.join(", ")}`);

// Every combination the generator saw, published or not: a pair beyond the
// budget is reported on every subject too, so the receipt says what it costs.
const combinations = [
  ...new Set(receipt.combinations.map((one) => one.combination)),
];
for (const document of chosen) {
  const name = document.id.replace("-connected", "");
  const started = Date.now();
  // Singles do not depend on the pair correctives (a product with one factor
  // at zero is zero), so one builder serves both sides of the A/B.
  const single = new Map<string, Set<string>>();
  const alone = (channel: string, weight: number) => {
    const key = `${channel}@${weight}`;
    let found = single.get(key);
    if (found === undefined) {
      found = crossed(after, document, { [channel]: weight });
      single.set(key, found);
    }
    return found;
  };
  const verified: Verified = { subject: name, combinations: {} };
  for (const combination of combinations) {
    const [first, second] = combination.split(" + ");
    verified.combinations[combination] = {};
    for (const [wa, wb] of WEIGHTS) {
      const expression = { [first]: wa, [second]: wb };
      const singles = new Set([...alone(first, wa), ...alone(second, wb)]);
      const was = crossed(before, document, expression);
      const now = crossed(after, document, expression);
      const appearedIn = (set: Set<string>) =>
        [...set]
          .filter((pair) => !singles.has(pair))
          .sort((a, b) => a.localeCompare(b));
      verified.combinations[combination][`${wa},${wb}`] = {
        before: {
          appeared: appearedIn(was),
          crossing: [...was].sort((a, b) => a.localeCompare(b)),
        },
        after: {
          appeared: appearedIn(now),
          crossing: [...now].sort((a, b) => a.localeCompare(b)),
        },
        introduced: [...now]
          .filter((pair) => !was.has(pair))
          .sort((a, b) => a.localeCompare(b)),
      };
    }
    const line = WEIGHTS.map(([wa, wb]) => {
      const result = verified.combinations[combination][`${wa},${wb}`];
      return (
        `${result.before.appeared.length}>${result.after.appeared.length}` +
        (result.introduced.length > 0 ? "!" : "")
      );
    });
    console.log(
      `${name.padEnd(24)} ${combination.padEnd(40)} ${line.join("  ")}`,
    );
  }
  fs.writeFileSync(fileOf(name), `${JSON.stringify(verified, null, 2)}\n`);
  console.log(
    `${name}: ${combinations.length} combinations x ${WEIGHTS.length} weights in ${Math.round((Date.now() - started) / 1000)}s`,
  );
}
