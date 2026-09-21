/**
 * Merge the pose corrective shards into one published basis revision.
 *
 * Usage, from the repository root, after every shard of
 * `generate-pose-correctives.ts` has finished:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/merge-pose-correctives.ts -- [pose-dir] [--patch dir]... [--write]
 *
 * A `--patch` directory holds a later `--only` run over some axis groups;
 * its records and correctives replace the main shards' for exactly those
 * groups, so a solver fix can be re-run on the groups it concerns without
 * repeating the whole census.
 *
 * The shards carry the repaired correctives with their rest-space rows and a
 * record per visited state. The merge appends every repaired corrective to
 * the shipped basis, gives the result the next revision id, admits it through
 * the public builder once, and writes the receipt: which findings were
 * repaired, at what onset, moving how many vertices how far, and which were
 * left unpublished and why. With `--write` the new `basis.json.gz` and its
 * receipt go to `test/studies/human-body/connected-basis/`; the extraction
 * receipt keeps describing the extraction it recorded, and the pose receipt
 * carries the hashes of the revision that is now shipped.
 * The merge refuses a shard set with a gap, an axis group no shard or patch
 * visited, shards solved against another revision, and a corrective set that
 * does not admit.
 */
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
const REVISION = "mpfb-connected-body-2026-09-21-pose-correctives";

interface IShard {
  basis: string;
  shard: [number, number];
  /** The axis groups this shard visited, `bone.axis+|-`. */
  groups: string[];
  /** The `--only` filter of a patch run, null for a full shard. */
  only?: string | null;
  correctives: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>;
  rows: Record<string, number[]>;
  records: {
    group: string;
    state: string;
    angle: number;
    travel: number;
    volume: {
      id: string;
      vertices: number;
      mostPosed: number;
      onset: number;
      full: number;
    } | null;
    crossing: {
      id: string;
      onset: number;
      full: number;
      vertices: number;
      mostPosed: number;
      pairs: { part: string; other: string }[];
      verification: { angle: number; pairs: unknown[] }[];
    } | null;
    outcome: string;
    ms: number;
  }[];
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const write = args.includes("--write");
  const patches = args
    .map((arg, at) => (arg === "--patch" ? path.resolve(args[at + 1]) : null))
    .filter((one): one is string => one !== null);
  const dir = path.resolve(
    args.find(
      (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--patch",
    ) ?? path.join(ROOT, ".shots/body-review/pose"),
  );
  const read = (from: string): IShard[] =>
    fs
      .readdirSync(from)
      .filter((name) => /^pose(-\d+)?\.json$/.test(name))
      .sort((x, y) => x.localeCompare(y))
      .map((name) =>
        JSON.parse(fs.readFileSync(path.join(from, name), "utf8")),
      );
  let shards = read(dir);
  if (shards.length === 0) throw new Error("no pose shards in " + dir);
  // a patch replaces the groups it visited, wholesale
  for (const from of patches)
    for (const patch of read(from)) {
      const replaced = new Set(patch.groups);
      const belongs = (id: string): boolean =>
        replaced.has(id.slice(id.indexOf("/") + 1, id.lastIndexOf("@")));
      shards = shards.map((shard) => ({
        ...shard,
        correctives: shard.correctives.filter((c) => !belongs(c.id)),
        rows: Object.fromEntries(
          Object.entries(shard.rows).filter(([id]) => !belongs(id)),
        ),
        records: shard.records.filter((r) => !replaced.has(r.group)),
      }));
      shards.push({ ...patch, shard: [shards.length, shards.length + 1] });
      console.log("patched groups", [...replaced].join(", "), "from", from);
    }
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(fs.readFileSync(path.join(STUDY, "basis.json.gz")))
      .toString("utf8"),
  );
  const main = shards.filter(
    (shard) => !("only" in shard) || shard.only === null,
  );
  const count = main[0].shard[1];
  const seen = new Set(main.map((shard) => shard.shard[0]));
  if (
    shards.some((shard) => shard.basis !== basis.id) ||
    main.some((shard) => shard.shard[1] !== count) ||
    seen.size !== count
  )
    throw new Error("the shards do not form one census of the shipped basis");

  // every axis group the main shards took on has been visited, by the shard
  // itself or by a patch that replaced it; a shard stopped short of a group
  // would otherwise ship that group silently uncorrected
  const visited = new Set(
    shards.flatMap((shard) => shard.records.map((record) => record.group)),
  );
  const missing = main
    .flatMap((shard) => shard.groups)
    .filter((group) => !visited.has(group));
  if (missing.length > 0)
    throw new Error("axis groups without a record: " + missing.join(", "));
  const correctives = shards.flatMap((shard) => shard.correctives);
  const rows = Object.assign(
    {},
    ...shards.map((shard) => shard.rows),
  ) as Record<string, number[]>;
  const records = shards.flatMap((shard) => shard.records);
  if (correctives.some((corrective) => rows[corrective.id] === undefined))
    throw new Error("a repaired corrective has no rows");
  const surface = basis.surfaces[0];
  const next: IAutoMovieHumanBodyBasis = {
    ...basis,
    id: REVISION,
    correctives: [...(basis.correctives ?? []), ...correctives],
    surfaces: [
      { ...surface, targets: { ...surface.targets, ...rows } },
      ...basis.surfaces.slice(1),
    ],
  };
  // the admission is the gate: a merged set the builder refuses is not published
  createHumanBodyBasisBuilder(next);

  const volumes = records.filter((record) => record.volume !== null);
  const crossings = records.filter((record) => record.crossing !== null);
  const repaired = crossings.filter((record) =>
    record.outcome.startsWith("repaired"),
  );
  const unpublished = crossings.filter(
    (record) => !record.outcome.startsWith("repaired"),
  );
  const mostRest = (id: string): number => {
    let most = 0;
    const list = rows[id] ?? [];
    for (let i = 0; i < list.length; i += 4)
      most = Math.max(most, Math.hypot(list[i + 1], list[i + 2], list[i + 3]));
    return most;
  };
  const millimetres = (metres: number): number => Math.round(metres * 1e4) / 10;
  const receipt = {
    basis: REVISION,
    supersedes: basis.id,
    recorded: new Date().toISOString().slice(0, 10),
    method: {
      volume:
        "rigid (dual quaternion) blend minus the linear blend at each census sample angle, where a millimetre or more is lost, ramped from the previous sample",
      onset:
        "largest angle without a crossing, bisected to 2.5 degrees from the last clean angle",
      solve:
        "both segments pushed apart in the posed frame with the volume worn, half way out along the entered surface's normal or retreating along the carried rest normal (the rule switching when a window of rounds stalls), displacement diffused over three rings, per-pair tissue budget, carried to the rest frame through the inverse blended bone rotation",
      verification:
        "public builder and census instrument at the angle and at the ramp midpoint; a crossing midpoint is queued as its own angle",
    },
    states: records.length,
    volumeCorrectives: volumes.length,
    crossingStates: crossings.length,
    repaired: repaired.length,
    unpublished: unpublished.map((record) => ({
      state: record.state,
      outcome: record.outcome,
      pairs: record.crossing!.pairs.map(
        (pair) => pair.part + " x " + pair.other,
      ),
      mostPosedMillimetres: millimetres(record.crossing!.mostPosed),
    })),
    correctives: correctives.map((corrective) => {
      const record = records.find(
        (one) =>
          one.volume?.id === corrective.id ||
          one.crossing?.id === corrective.id,
      )!;
      const crossing =
        record.crossing?.id === corrective.id ? record.crossing : null;
      const part = crossing ?? record.volume;
      if (part === null) throw new Error("a corrective without its record");
      return {
        id: corrective.id,
        state: record.state,
        onset: part.onset,
        full: part.full,
        vertices: (rows[corrective.id]?.length ?? 0) / 4,
        mostPosedMillimetres: millimetres(part.mostPosed),
        mostRestMillimetres: millimetres(mostRest(corrective.id)),
        pairs: crossing?.pairs.map((pair) => pair.part + " x " + pair.other),
        verification: crossing?.verification.map((step) => ({
          angle: step.angle,
          pairs: step.pairs.length,
        })),
      };
    }),
    records,
  };
  console.log(
    "states",
    receipt.states,
    "volume correctives",
    receipt.volumeCorrectives,
    "crossing states",
    receipt.crossingStates,
    "repaired",
    receipt.repaired,
    "unpublished",
    unpublished.length,
  );
  for (const one of receipt.correctives)
    console.log(
      "  ",
      one.id.padEnd(44),
      "onset",
      one.onset.toFixed(2).padStart(7),
      "full",
      one.full.toFixed(2).padStart(7),
      "vertices",
      String(one.vertices).padStart(5),
      "posed",
      String(one.mostPosedMillimetres).padStart(5),
      "rest",
      String(one.mostRestMillimetres).padStart(5),
      "mm",
    );
  for (const one of unpublished)
    console.log(
      "   UNPUBLISHED",
      one.state,
      one.outcome,
      one.crossing!.pairs.map((pair) => pair.part + "x" + pair.other).join(","),
    );
  const uncompressed = Buffer.from(JSON.stringify(next), "utf8");
  const compressed = zlib.gzipSync(uncompressed, { level: 9 });
  const sha = (buffer: Buffer): string =>
    crypto.createHash("sha256").update(buffer).digest("hex");
  const hashes = {
    uncompressedSha256: sha(uncompressed),
    uncompressedBytes: uncompressed.length,
    compressedSha256: sha(compressed),
    compressedBytes: compressed.length,
  };
  console.log(hashes);
  const target = write ? STUDY : dir;
  fs.writeFileSync(
    path.join(target, "pose-correctives-receipt.json"),
    JSON.stringify({ ...receipt, ...hashes }, null, 2) + "\n",
  );
  fs.writeFileSync(path.join(target, "basis.json.gz"), compressed);
  if (!write) {
    console.log("dry run; basis and receipt written beside the shards");
    return;
  }
  console.log("wrote", REVISION);
}

main();
