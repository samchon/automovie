/**
 * Exhaustive self-crossing census of the shipped body basis, one state at a
 * time, against the rest pose baseline.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/census-crossings.ts -- <set> [shard/of] [output-dir] [--basis path]
 *
 * `set` is one of:
 *
 * - `rest`: the neutral body, whose crossing pairs are the baseline every
 *   other state is read against (a layered or folded rest already crosses).
 * - `channels`: every channel at each of its endpoints, alone (264 states).
 * - `joints`: every mobile joint axis at the four fractions -1, -1/2, 1/2, 1 of
 *   its clinical range, alone (one axis at a time; the list ends when every
 *   joint's every mobile axis has been visited).
 * - `combos`: every parent-child joint pair with both flexion axes at their
 *   extremes, four combinations per pair, plus the shoulder and hip abduction
 *   extremes against the elbow and knee flexion extremes. Single-axis
 *   correctives are solved alone; this is where two of them meet.
 * - `shapes`: every published pose corrective's full angle again on the macro
 *   extremes (female, male, child, old, heavy, thin, muscular), since a
 *   corrective is solved on the neutral body and worn by every shape.
 * - `traits`: every individuality channel at each extreme on each macro
 *   extreme, and the trait review combinations, at rest; a trait is a
 *   displacement field on the neutral tissue and must not fold it on the
 *   bodies that tissue grows or shrinks on.
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

import { traitChannelIds } from "./individualityParameters";
import { REVIEW } from "./individualityStates";
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
  const basisPath = args.includes("--basis")
    ? path.resolve(args[args.indexOf("--basis") + 1])
    : BASIS;
  const positional = args.filter(
    (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--basis",
  );
  const set = positional[0];
  if (
    !["rest", "channels", "joints", "combos", "shapes", "traits"].includes(set)
  )
    throw new Error(
      "name a census set: rest, channels, joints, combos, shapes or traits",
    );
  const shard = /^(\d+)\/(\d+)$/.exec(positional[1] ?? "0/1");
  if (shard === null) throw new Error("shard must read i/n");
  const [index, count] = [Number(shard[1]), Number(shard[2])];
  const output = path.resolve(
    positional[2] ?? path.join(ROOT, ".shots/body-review/census"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
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
    set === "channels"
      ? channelStates(basis)
      : set === "joints"
        ? jointStates(basis)
        : set === "traits"
          ? traitStates(basis)
          : set === "combos"
            ? comboStates(basis)
            : shapeStates(basis)
  ).filter((_state, at) => at % count === index);
  const records: object[] = [];
  const file = path.join(
    output,
    count === 1 ? set + ".json" : `${set}-${index}.json`,
  );
  const total = states.length;
  for (const [at, state] of states.entries()) {
    const started = Date.now();
    let pairs: IPair[];
    try {
      pairs = measure(state.document);
    } catch (error) {
      // a pose the builder refuses is a census record, not a crash that loses
      // the rest of the shard: the receipt must say which states were never
      // measured and why
      const refused = error instanceof Error ? error.message : String(error);
      records.push({ ...state, refused, pairs: [], fresh: [], grown: [] });
      console.log(
        `${at + 1}/${states.length}`,
        state.name.padEnd(40),
        "REFUSED",
        refused.slice(0, 120),
      );
      continue;
    }
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
        expected: total,
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
      // A sample equal to the rest angle is the rest and is skipped; a sample
      // of 0 is not necessarily the rest (the elbow rests bent, and 0 is the
      // straight arm), so the rest angle is the test, and the two fractions of
      // a zero range end are one state.
      for (const angle of new Set(
        [-1, -0.5, 0.5, 1].map((fraction) =>
          fraction < 0 ? -fraction * range.min : fraction * range.max,
        ),
      )) {
        if (angle === joint.neutral[axis]) continue;
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

/** Both extremes of the flexion of each parent-child pair, and the shoulder and hip abduction against the elbow and knee. */
function comboStates(basis: IAutoMovieHumanBodyBasis): IState[] {
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  const extremes = (
    bone: IAutoMovieJointPose["bone"],
    axis: "flexion" | "abduction",
  ): number[] => {
    const range = joints.get(bone)?.constraint?.[axis] ?? null;
    return range === null ? [] : [range.min, range.max].filter((a) => a !== 0);
  };
  const pairs: [
    IAutoMovieJointPose["bone"],
    "flexion" | "abduction",
    IAutoMovieJointPose["bone"],
    "flexion" | "abduction",
  ][] = [];
  for (const joint of basis.joints)
    if (joint.parent !== null)
      pairs.push([joint.parent, "flexion", joint.bone, "flexion"]);
  for (const side of ["left", "right"] as const) {
    pairs.push([`${side}UpperArm`, "abduction", `${side}LowerArm`, "flexion"]);
    pairs.push([`${side}UpperLeg`, "abduction", `${side}LowerLeg`, "flexion"]);
  }
  const states: IState[] = [];
  for (const [parent, parentAxis, child, childAxis] of pairs)
    for (const a of extremes(parent, parentAxis))
      for (const b of extremes(child, childAxis))
        states.push({
          name: `${parent}.${parentAxis}@${a}+${child}.${childAxis}@${b}`,
          document: {
            pose: [
              {
                bone: parent,
                flexion: null,
                abduction: null,
                twist: null,
                [parentAxis]: a,
              },
              {
                bone: child,
                flexion: null,
                abduction: null,
                twist: null,
                [childAxis]: b,
              },
            ],
          },
        });
  return states;
}

/** Every published pose corrective's full angle, on each macro extreme. */
/**
 * Every individuality trait at each extreme on each macro extreme (the
 * tissue a trait moves is the tissue a macro already grew or shrank), and
 * the review combinations, at rest.
 */
function traitStates(basis: IAutoMovieHumanBodyBasis): IState[] {
  const macros: Record<string, Record<string, number>> = {
    rest: {},
    female: { macroGender: -1 },
    male: { macroGender: 1 },
    old: { macroAge: 1 },
    heavy: { macroWeight: 1 },
    thin: { macroWeight: -1 },
    muscular: { macroMuscle: 1 },
  };
  const ids = traitChannelIds();
  const traits = basis.channels.filter((channel) => ids.includes(channel.id));
  const states: IState[] = [];
  for (const [label, macro] of Object.entries(macros))
    for (const channel of traits)
      for (const weight of [channel.maximum, channel.minimum])
        if (weight !== 0)
          states.push({
            name: `${label}:${channel.id}@${weight}`,
            document: { shape: { ...macro, [channel.id]: weight } },
          });
  for (const [name, shape] of Object.entries(REVIEW))
    states.push({ name: `review:${name}`, document: { shape } });
  return states;
}

function shapeStates(basis: IAutoMovieHumanBodyBasis): IState[] {
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  const states = new Map<string, IAutoMovieJointPose[]>();
  for (const corrective of basis.correctives ?? [])
    for (const input of corrective.inputs) {
      if (!("bone" in input)) continue;
      const angle =
        joints.get(input.bone)!.neutral[input.axis] +
        (input.side === "positive" ? 1 : -1) * input.full;
      states.set(`${input.bone}.${input.axis}@${angle}`, [
        {
          bone: input.bone,
          flexion: null,
          abduction: null,
          twist: null,
          [input.axis]: angle,
        },
      ]);
    }
  const shapes: Record<string, Record<string, number>> = {
    female: { macroGender: -1 },
    male: { macroGender: 1 },
    child: { macroAge: -1 },
    old: { macroAge: 1 },
    heavy: { macroWeight: 1 },
    thin: { macroWeight: -1 },
    muscular: { macroMuscle: 1 },
  };
  return Object.entries(shapes).flatMap(([label, shape]) =>
    [...states.entries()].map(([name, pose]) => ({
      name: `${label}:${name}`,
      document: { shape, pose },
    })),
  );
}

main();
