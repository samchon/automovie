/**
 * Exhaustive self-crossing census of the shipped body basis, one state at a
 * time, against the rest pose baseline.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/census-crossings.ts -- <set> [shard/of] [output-dir]
 *
 * `set` is one of:
 *
 * - `rest`: the neutral body, whose crossing pairs are the baseline every
 *   other state is read against (a layered or folded rest already crosses).
 * - `channels`: every channel at each of its endpoints, alone (264 states).
 * - `joints`: every mobile joint axis at the four fractions -1, -1/2, 1/2, 1 of
 *   its clinical range, alone (one axis at a time; the list ends when every
 *   joint's every mobile axis has been visited).
 *
 * The census refuses to summarize: each state records the segment pairs that
 * cross and how many triangles, and the finding is the pairs that the rest
 * does not cross (new pairs) or crosses less (grown pairs). Segments are the
 * dominant-bone partition of `segmentHumanBody`. A shard `i/n` takes every
 * n-th state starting at i, so the sets can run in parallel processes; the
 * merge script reads every shard file back.
 *
 * Output: `<dir>/<set>[-<i>].json` with one record per state and the rest
 * baseline it was compared to. Nothing here writes into `test/studies`.
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { segmentHumanBody } from "./segmentHumanBody";

const ROOT = path.resolve(__dirname, "../../..");
const BASIS = path.join(
  ROOT,
  "test/studies/human-body/connected-basis/basis.json.gz",
);

interface IPair {
  part: string;
  other: string;
  triangles: number;
  otherTriangles: number;
}
interface IState {
  name: string;
  document: { shape?: Record<string, number>; pose?: IAutoMovieJointPose[] };
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const set = args[0];
  if (set !== "rest" && set !== "channels" && set !== "joints")
    throw new Error("name a census set: rest, channels or joints");
  const shard = /^(\d+)\/(\d+)$/.exec(args[1] ?? "0/1");
  if (shard === null) throw new Error("shard must read i/n");
  const [index, count] = [Number(shard[1]), Number(shard[2])];
  const output = path.resolve(
    args[2] ?? path.join(ROOT, ".shots/body-review/census"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(BASIS)).toString("utf8"),
  );
  const build = createHumanBodyBasisBuilder(basis);
  const measure = (document: IState["document"]): IPair[] =>
    measureAutoMovieModelCrossings(
      segmentHumanBody(
        basis,
        build({
          id: "census",
          name: "census",
          basis: basis.id,
          shape: {},
          ...document,
        }),
      ).model,
    ).map(({ part, other, triangles, otherTriangles }) => ({
      part,
      other,
      triangles,
      otherTriangles,
    }));
  const restPath = path.join(output, "rest.json");
  if (set === "rest") {
    const started = Date.now();
    const pairs = measure({});
    fs.writeFileSync(
      restPath,
      JSON.stringify({ basis: basis.id, pairs }, null, 2) + "\n",
    );
    console.log("rest pairs", pairs.length, "in", Date.now() - started, "ms");
    for (const pair of pairs)
      console.log(
        "  ",
        pair.part,
        "x",
        pair.other,
        pair.triangles,
        pair.otherTriangles,
      );
    return;
  }
  if (!fs.existsSync(restPath))
    throw new Error("run the rest set first; the baseline is " + restPath);
  const rest: IPair[] = JSON.parse(fs.readFileSync(restPath, "utf8")).pairs;
  const baseline = new Map(
    rest.map((pair) => [pair.part + "|" + pair.other, pair]),
  );
  const states = (
    set === "channels" ? channelStates(basis) : jointStates(basis)
  ).filter((_state, at) => at % count === index);
  const records: object[] = [];
  const file = path.join(
    output,
    count === 1 ? set + ".json" : `${set}-${index}.json`,
  );
  for (const [at, state] of states.entries()) {
    const started = Date.now();
    const pairs = measure(state.document);
    const fresh = pairs.filter(
      (pair) => !baseline.has(pair.part + "|" + pair.other),
    );
    const grown = pairs.filter((pair) => {
      const before = baseline.get(pair.part + "|" + pair.other);
      return (
        before !== undefined &&
        pair.triangles + pair.otherTriangles >
          before.triangles + before.otherTriangles
      );
    });
    records.push({ ...state, pairs, fresh, grown });
    console.log(
      `${at + 1}/${states.length}`,
      state.name.padEnd(40),
      "pairs",
      pairs.length,
      "new",
      fresh.length,
      "grown",
      grown.length,
      fresh.map((pair) => pair.part + "x" + pair.other).join(","),
      Date.now() - started,
      "ms",
    );
    fs.writeFileSync(
      file,
      JSON.stringify({
        basis: basis.id,
        set,
        shard: [index, count],
        rest,
        states: records,
      }),
    );
  }
}

/** Every channel at each endpoint, alone. */
function channelStates(basis: IAutoMovieHumanBodyBasis): IState[] {
  return basis.channels.flatMap((channel) => {
    const states: IState[] = [
      {
        name: channel.id + "@" + channel.maximum,
        document: { shape: { [channel.id]: channel.maximum } },
      },
    ];
    if (channel.negative !== null)
      states.push({
        name: channel.id + "@" + channel.minimum,
        document: { shape: { [channel.id]: channel.minimum } },
      });
    return states;
  });
}

/** Every mobile joint axis at -1, -1/2, 1/2 and 1 of its range, alone. */
function jointStates(basis: IAutoMovieHumanBodyBasis): IState[] {
  const states: IState[] = [];
  for (const joint of basis.joints) {
    if (joint.constraint === null) continue;
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const range = joint.constraint[axis];
      if (range === null) continue;
      for (const fraction of [-1, -0.5, 0.5, 1]) {
        const angle =
          fraction < 0 ? -fraction * range.min : fraction * range.max;
        if (angle === 0) continue;
        states.push({
          name: `${joint.bone}.${axis}@${angle}`,
          document: {
            pose: [
              {
                bone: joint.bone,
                flexion: null,
                abduction: null,
                twist: null,
                [axis]: angle,
              },
            ],
          },
        });
      }
    }
  }
  return states;
}

main();
