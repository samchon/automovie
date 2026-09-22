/**
 * Publish the individuality channels into the shipped body basis revision.
 *
 * Usage, from the repository root, after `generate-individuality.ts` wrote
 * its endpoints:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/merge-individuality.ts -- [individuality-dir] [--write]
 *
 * The channels are appended after the source channels with their endpoints
 * as sparse rows, the result takes the next revision id, is admitted through
 * the public builder once, and its receipt lists each channel with its
 * endpoints' row counts and largest displacement and the mirror residual of
 * every left/right pair, which is zero by construction and checked rather
 * than assumed. With `--write` the basis and receipt go to the study
 * directory; without it they land beside the endpoints for a candidate
 * build, census and render. A set the builder refuses is not published.
 */
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { meshOf } from "./individualityFields";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
const REVISION = "mpfb-connected-body-2026-09-21-individuality";

interface IAuthored {
  basis: string;
  channels: IAutoMovieHumanBodyBasis["channels"];
  rows: Record<string, number[]>;
  stats: Record<string, { vertices: number; mostMetres: number }>;
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const write = args.includes("--write");
  const dir = path.resolve(
    args.find((arg) => !arg.startsWith("--")) ??
      path.join(ROOT, ".shots/body-review/individuality"),
  );
  const authored: IAuthored = JSON.parse(
    fs.readFileSync(path.join(dir, "individuality.json"), "utf8"),
  );
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(fs.readFileSync(path.join(STUDY, "basis.json.gz")))
      .toString("utf8"),
  );
  if (authored.basis !== basis.id)
    throw new Error("the channels were authored on another revision");
  const surface = basis.surfaces[0];
  for (const channel of authored.channels)
    for (const endpoint of [channel.positive, channel.negative])
      if (endpoint !== null && authored.rows[endpoint] === undefined)
        throw new Error("a channel without its endpoint rows: " + endpoint);
  const next: IAutoMovieHumanBodyBasis = {
    ...basis,
    id: REVISION,
    channels: [...basis.channels, ...authored.channels],
    surfaces: [
      { ...surface, targets: { ...surface.targets, ...authored.rows } },
      ...basis.surfaces.slice(1),
    ],
  };
  // the admission is the gate: a merged set the builder refuses is not published
  createHumanBodyBasisBuilder(next);

  // the mirror residual: each right row must be the reflection of a left row
  const mesh = meshOf(surface, new Array<number>(surface.positions.length));
  const residual = (left: string, right: string): number => {
    const reflected = new Map<number, number[]>();
    const rows = authored.rows[left];
    for (let at = 0; at < rows.length; at += 4)
      reflected.set(mesh.mirror[rows[at]], [
        -rows[at + 1],
        rows[at + 2],
        rows[at + 3],
      ]);
    const other = authored.rows[right];
    let worst = 0;
    const seen = new Set<number>();
    for (let at = 0; at < other.length; at += 4) {
      const expected = reflected.get(other[at]) ?? [0, 0, 0];
      seen.add(other[at]);
      worst = Math.max(
        worst,
        Math.hypot(
          other[at + 1] - expected[0],
          other[at + 2] - expected[1],
          other[at + 3] - expected[2],
        ),
      );
    }
    for (const [v, d] of reflected)
      if (!seen.has(v)) worst = Math.max(worst, Math.hypot(d[0], d[1], d[2]));
    return worst;
  };
  const millimetres = (metres: number): number => Math.round(metres * 1e4) / 10;
  const channels = authored.channels.map((channel) => ({
    id: channel.id,
    group: channel.group,
    mirror: channel.mirror,
    envelope: [channel.minimum, channel.maximum],
    positive: {
      endpoint: channel.positive,
      vertices: authored.stats[channel.positive].vertices,
      mostMillimetres: millimetres(authored.stats[channel.positive].mostMetres),
    },
    negative:
      channel.negative === null
        ? null
        : {
            endpoint: channel.negative,
            vertices: authored.stats[channel.negative].vertices,
            mostMillimetres: millimetres(
              authored.stats[channel.negative].mostMetres,
            ),
          },
    mirrorResidualMillimetres:
      channel.mirror === null || channel.id > channel.mirror
        ? null
        : Math.max(
            residual(
              channel.positive,
              authored.channels.find((one) => one.id === channel.mirror)!
                .positive,
            ),
            channel.negative === null
              ? 0
              : residual(
                  channel.negative,
                  authored.channels.find((one) => one.id === channel.mirror)!
                    .negative!,
                ),
          ) * 1000,
  }));
  for (const one of channels) {
    console.log(
      one.id.padEnd(24),
      one.group.padEnd(9),
      "+",
      String(one.positive.vertices).padStart(5),
      String(one.positive.mostMillimetres).padStart(5),
      "mm",
      one.negative === null
        ? "".padEnd(19)
        : "-" +
            String(one.negative.vertices).padStart(6) +
            String(one.negative.mostMillimetres).padStart(6) +
            " mm",
      one.mirrorResidualMillimetres === null
        ? ""
        : "mirror " + one.mirrorResidualMillimetres.toFixed(4) + " mm",
    );
    if (
      one.mirrorResidualMillimetres !== null &&
      one.mirrorResidualMillimetres > 1e-3
    )
      throw new Error("a mirror pair disagrees: " + one.id);
  }
  const uncompressed = Buffer.from(JSON.stringify(next), "utf8");
  const compressed = zlib.gzipSync(uncompressed, { level: 9 });
  const sha = (buffer: Buffer): string =>
    crypto.createHash("sha256").update(buffer).digest("hex");
  const receipt = {
    basis: REVISION,
    supersedes: basis.id,
    recorded: new Date().toISOString().slice(0, 10),
    method:
      "procedural displacement fields on the neutral surface: a tissue mask read off the source endpoint over the same anatomy, a polar or geodesic coordinate over it, and a normal or gravity direction; right endpoints reflected from the left",
    research: ".wiki/04-domain-research/anatomy.md",
    channels,
    uncompressedSha256: sha(uncompressed),
    uncompressedBytes: uncompressed.length,
    compressedSha256: sha(compressed),
    compressedBytes: compressed.length,
  };
  const target = write ? STUDY : dir;
  fs.writeFileSync(
    path.join(target, "individuality-receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  fs.writeFileSync(path.join(target, "basis.json.gz"), compressed);
  console.log(
    write ? "wrote" : "dry run; candidate written beside the endpoints:",
    REVISION,
    next.channels.length,
    "channels",
  );
}

main();
