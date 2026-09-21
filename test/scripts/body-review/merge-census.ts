/**
 * Merge the crossing census shards into one receipt.
 *
 * Usage, from the repository root, after every shard of `census-crossings.ts`
 * has finished:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/merge-census.ts -- [census-dir] [--write]
 *
 * The receipt lists, per set, every state whose crossings differ from the
 * rest baseline: the new segment pairs with their triangle counts, and the
 * grown pairs. States that match the rest are counted, not listed, so the
 * receipt stays readable; the shard files keep every record. With `--write`
 * the receipt is copied to `test/studies/human-body/connected-basis/
 * census-receipt.json`, which is what the study README cites. The merge
 * refuses a shard set with a gap (a missing `i/n`) or shards read against a
 * different basis or baseline, because a census with a hole is not a census.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../..");

interface IPair {
  part: string;
  other: string;
  triangles: number;
  otherTriangles: number;
}
interface IRecord {
  name: string;
  document: unknown;
  pairs: IPair[];
  fresh: IPair[];
  grown: IPair[];
  refused?: string;
}
interface IShard {
  basis: string;
  set: string;
  shard: [number, number];
  /** States the shard was asked to measure; the record count must reach it. */
  expected: number;
  rest: IPair[];
  states: IRecord[];
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const write = args.includes("--write");
  const dir = path.resolve(
    args.find((arg) => !arg.startsWith("--")) ??
      path.join(ROOT, ".shots/body-review/census"),
  );
  const rest = JSON.parse(
    fs.readFileSync(path.join(dir, "rest.json"), "utf8"),
  ) as { basis: string; pairs: IPair[] };
  const sets: Record<string, object> = {};
  for (const set of ["channels", "joints", "combos", "shapes", "traits"]) {
    const files = fs
      .readdirSync(dir)
      .filter(
        (file) =>
          file === set + ".json" ||
          new RegExp(`^${set}-\\d+\\.json$`).test(file),
      );
    if (files.length === 0) continue;
    const shards = files.map(
      (file) =>
        JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as IShard,
    );
    const count = shards[0].shard[1];
    const seen = new Set(shards.map((shard) => shard.shard[0]));
    if (shards.some((shard) => shard.shard[1] !== count) || seen.size !== count)
      throw new Error(
        `${set}: expected ${count} shards, found ${[...seen].sort((a, b) => a - b).join(",")}`,
      );
    for (const shard of shards)
      if (
        shard.basis !== rest.basis ||
        JSON.stringify(shard.rest) !== JSON.stringify(rest.pairs)
      )
        throw new Error(
          `${set}: a shard was read against another basis or baseline`,
        );
    // a shard that stopped early is a census with a hole; the first census
    // lost 51 joint states this way and read as complete
    for (const shard of shards)
      if (shard.states.length !== shard.expected)
        throw new Error(
          `${set}: shard ${shard.shard[0]}/${shard.shard[1]} recorded ${shard.states.length} of ${shard.expected} states`,
        );
    const states = shards.flatMap((shard) => shard.states);
    const refused = states.filter((state) => state.refused !== undefined);
    const findings = states
      .filter((state) => state.fresh.length > 0 || state.grown.length > 0)
      .map((state) => ({
        name: state.name,
        document: state.document,
        fresh: state.fresh,
        grown: state.grown,
      }));
    const pairs = new Map<string, number>();
    for (const state of findings)
      for (const pair of state.fresh) {
        const key = pair.part + " x " + pair.other;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    sets[set] = {
      states: states.length,
      clean: states.length - findings.length - refused.length,
      withFindings: findings.length,
      refused: refused.map((state) => ({
        name: state.name,
        reason: state.refused,
      })),
      pairsByFrequency: [...pairs.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([pair, count]) => ({ pair, states: count })),
      findings,
    };
    console.log(
      set,
      "states",
      states.length,
      "clean",
      states.length - findings.length - refused.length,
      "with findings",
      findings.length,
      "refused",
      refused.length,
    );
    for (const [pair, n] of [...pairs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15))
      console.log("  ", pair, n);
  }
  const receipt = { basis: rest.basis, restPairs: rest.pairs, sets };
  const out = path.join(dir, "census-receipt.json");
  fs.writeFileSync(out, JSON.stringify(receipt, null, 2) + "\n");
  if (write)
    fs.copyFileSync(
      out,
      path.join(
        ROOT,
        "test/studies/human-body/connected-basis/census-receipt.json",
      ),
    );
}

main();
