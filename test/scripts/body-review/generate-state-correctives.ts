/**
 * Solve the census's combination findings into correctives driven by the
 * product of their inputs: a pose corrective solved on the neutral body
 * that no longer clears on a macro extreme (the `shapes` set), or a parent
 * and child joint at their extremes crossing where each alone did not (the
 * `combos` set).
 *
 * Usage, from the repository root, on a shipped basis whose census receipt
 * lists the findings (or on a later incremental round of that revision,
 * so the rest findings of the `channels` and `traits` sets can be solved and
 * merged before the posed ones are, which then find them already clear):
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/generate-state-correctives.ts -- [shard/of] [--set shapes,combos] [output-dir]
 *
 * Every finding is one state: a shape (channel weights) and a pose (joint
 * angles). Its corrective is driven by one channel driver per nonzero shape
 * channel, on that channel's side, and one clinical ramp per posed joint
 * axis, all multiplied as `createHumanFaceBasisBuilder` fires a corrective;
 * RigLogic's PSD over a pose and a shape. The channel ramps' onset is the
 * largest fraction `u` of the shape (every weight scaled from zero) at
 * which the whole pose crosses nothing, bisected to 0.05 of the largest
 * weight, so a corrective solved at an envelope extreme stays off on the
 * bodies short of it; each channel ramp runs from `u` times its weight to
 * its weight. The joint ramps' onset is the largest fraction `t` of the pose
 * (every angle scaled from its rest) at which nothing crosses on the whole
 * shape, bisected to 2.5 degrees of the widest travel, and each joint ramp
 * runs from `t` times its travel to its full travel. The push is the same solve as the single-axis generator, on the
 * shaped and posed skin, carried to the rest frame through the same
 * blended rotations; the candidate is verified through the public builder
 * and the census instrument at the full state and at the midpoint of the
 * joint ramp and of the channel ramp, an in-between of either ramp that
 * still crosses queued as its own state (at the midpoint fraction of the
 * pose, or of the shape) while that ramp is wider than four bisection
 * bands. The output is a shard the pose merge appends in its
 * incremental mode. Nothing here writes into `test/studies`.
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

import {
  type Driver,
  type IPair,
  solve,
  withCorrective,
} from "./poseCorrectiveSolver";
import { type IDocument, poseState } from "./poseState";
import { neighboursOf } from "./pushApartGeometry";
import { segmentHumanBody } from "./segmentHumanBody";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
/** Bisection of the pose fraction stops when the widest travel moves less than this, degrees. */
const RESOLUTION = 2.5;
/** Bisection of the shape fraction stops when the largest weight moves less than this. */
const WEIGHT_RESOLUTION = 0.05;
/** Outer passes of solve-then-verify per state before it is given up. */
const PASSES = 2;
/** Visits per finding, counting queued midpoints and revisits. */
const VISITS = 8;

interface IFinding {
  name: string;
  document: { shape?: Record<string, number>; pose?: IAutoMovieJointPose[] };
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const sets = (
    args.includes("--set") ? args[args.indexOf("--set") + 1] : "shapes,combos"
  ).split(",");
  const positional = args.filter(
    (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--set",
  );
  const shard = /^(\d+)\/(\d+)$/.exec(positional[0] ?? "0/1");
  if (shard === null) throw new Error("shard must read i/n");
  const [index, count] = [Number(shard[1]), Number(shard[2])];
  const output = path.resolve(
    positional[1] ?? path.join(ROOT, ".shots/body-review/state"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(fs.readFileSync(path.join(STUDY, "basis.json.gz")))
      .toString("utf8"),
  );
  const census: {
    basis: string;
    sets: Record<string, { findings: IFinding[] }>;
  } = JSON.parse(
    fs.readFileSync(path.join(STUDY, "census-receipt.json"), "utf8"),
  );
  // the census may be a round behind: a basis that only appended corrective
  // rounds to the censused revision still carries every state it listed, and
  // each finding is measured again on the working basis before it is solved
  const round = (id: string): [string, number] => [
    id.replace(/\+correctives-\d+$/, ""),
    Number(/\+correctives-(\d+)$/.exec(id)?.[1] ?? "0"),
  ];
  const [censusRoot, censusRound] = round(census.basis);
  const [basisRoot, basisRound] = round(basis.id);
  if (censusRoot !== basisRoot || basisRound < censusRound)
    throw new Error("the census was taken on another revision");
  const findings = sets
    .flatMap((set) =>
      (census.sets[set]?.findings ?? []).map((finding) => ({
        set,
        ...finding,
      })),
    )
    .filter((_finding, at) => at % count === index);
  console.log(findings.length, "findings in this shard");

  const surface = basis.surfaces[0];
  const vertices = surface.positions.length / 3;
  const near = neighboursOf(surface.indices, vertices);
  const dominant = [...new Array(vertices).keys()].map((v) => {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (surface.skin.weights[v * 4 + k] > surface.skin.weights[v * 4 + best])
        best = k;
    return surface.skin.joints[surface.skin.boneIndices[v * 4 + best]];
  });
  const segments = new Map<string, number[]>();
  for (let t = 0; t < surface.indices.length; t += 3) {
    const corners = [0, 1, 2].map((c) => surface.indices[t + c]);
    const bones = corners.map((v) => dominant[v]);
    const owner =
      bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
    const list = segments.get(owner);
    if (list === undefined) segments.set(owner, corners);
    else list.push(...corners);
  }
  const parents = new Map(
    basis.joints.map((joint) => [joint.bone, joint.parent]),
  );
  const neutral = new Map(
    basis.joints.map((joint) => [joint.bone, joint.neutral]),
  );
  const records: object[] = [];
  const published: NonNullable<IAutoMovieHumanBodyBasis["correctives"]> = [];
  const rows: Record<string, number[]> = {};
  const file = path.join(
    output,
    count === 1 ? "pose.json" : `pose-${index}.json`,
  );
  const save = (): void =>
    fs.writeFileSync(
      file,
      JSON.stringify({
        basis: basis.id,
        shard: [index, count],
        only: null,
        incremental: true,
        groups: findings.map((finding) => finding.name),
        correctives: published,
        rows,
        records,
      }),
    );
  let working = basis;
  let build = createHumanBodyBasisBuilder(working);
  const summarize = (pairs: IPair[]): string =>
    pairs.map((pair) => `${pair.part}x${pair.other}`).join(",");
  for (const finding of findings) {
    const shape = finding.document.shape ?? {};
    const posed = (finding.document.pose ?? []).flatMap((joint) =>
      (["flexion", "abduction", "twist"] as const)
        .filter((axis) => joint[axis] !== null)
        .map((axis) => ({
          bone: joint.bone,
          axis,
          angle: joint[axis]!,
          rest: neutral.get(joint.bone)![axis],
        })),
    );
    // a rest finding (the channels and traits sets) has no travel to bisect
    const widest = Math.max(
      0,
      ...posed.map((one) => Math.abs(one.angle - one.rest)),
    );
    const heaviest = Math.max(
      0,
      ...Object.values(shape).map((weight) => Math.abs(weight)),
    );
    // the state at fraction t of the pose and fraction u of the shape
    const document = (t: number, u = 1): IDocument => ({
      id: "state",
      name: "state",
      basis: working.id,
      shape: Object.fromEntries(
        Object.entries(shape).map(([channel, weight]) => [channel, u * weight]),
      ),
      pose: (finding.document.pose ?? []).map((joint) => ({
        bone: joint.bone,
        flexion: null,
        abduction: null,
        twist: null,
        ...Object.fromEntries(
          (["flexion", "abduction", "twist"] as const)
            .filter((axis) => joint[axis] !== null)
            .map((axis) => {
              const rest = neutral.get(joint.bone)![axis];
              return [axis, rest + t * (joint[axis]! - rest)];
            }),
        ),
      })),
    });
    const pairsOn = (
      candidate: IAutoMovieHumanBodyBasis,
      candidateBuild: ReturnType<typeof createHumanBodyBasisBuilder>,
      t: number,
      u = 1,
    ): IPair[] =>
      measureAutoMovieModelCrossings(
        segmentHumanBody(
          candidate,
          candidateBuild({ ...document(t, u), basis: candidate.id }),
        ).model,
      ).map(({ part, other, triangles, otherTriangles }) => ({
        part,
        other,
        triangles,
        otherTriangles,
      }));
    const accept = (candidate: IAutoMovieHumanBodyBasis): void => {
      working = candidate;
      build = createHumanBodyBasisBuilder(candidate);
      const corrective =
        candidate.correctives![candidate.correctives!.length - 1];
      published.push(corrective);
      rows[corrective.id] = candidate.surfaces[0].targets[corrective.id];
    };
    // the largest fraction of the shape the whole pose wears cleanly, read
    // once on the basis as the finding found it
    let worn = 0;
    if (heaviest > 0 && pairsOn(working, build, 1).length > 0) {
      let high = 1;
      while ((high - worn) * heaviest > WEIGHT_RESOLUTION) {
        const middle = (worn + high) / 2;
        if (pairsOn(working, build, 1, middle).length === 0) worn = middle;
        else high = middle;
      }
    }
    // joint ramps from `onset` to `full` of the pose, channel ramps from
    // `from` to `to` of the shape
    const drivers = (
      onset: number,
      full: number,
      from: number,
      to: number,
    ): Driver[] => [
      ...Object.entries(shape)
        .filter(([, weight]) => weight !== 0)
        .map(([channel, weight]) => ({
          channel,
          side: weight < 0 ? ("negative" as const) : ("positive" as const),
          onset: from * Math.abs(weight),
          full: to * Math.abs(weight),
        })),
      ...posed.map((one) => ({
        bone: one.bone,
        axis: one.axis,
        side:
          one.angle > one.rest ? ("positive" as const) : ("negative" as const),
        onset: onset * Math.abs(one.angle - one.rest),
        full: full * Math.abs(one.angle - one.rest),
      })),
    ];
    // the pose fraction clean on the whole shape and the shape fraction
    // clean on the whole pose, each raised as the in-betweens are repaired
    let clean = 0;
    let cleanWeight = worn;
    const queue: { t: number; u: number }[] = [{ t: 1, u: 1 }];
    let visits = 0;
    while (queue.length > 0 && visits++ < VISITS) {
      const { t, u } = queue.shift()!;
      const started = Date.now();
      const state =
        `${finding.set}:${finding.name}` +
        (t === 1 ? "" : `@${t}`) +
        (u === 1 ? "" : `~${u}`);
      // a state solved in an earlier round keeps its corrective in the
      // shipped basis; a new one for the same state takes the next suffix
      const taken = new Set(
        (working.correctives ?? []).map((corrective) => corrective.id),
      );
      let suffix = 0;
      while (taken.has(`state/${state}` + (suffix > 0 ? `#${suffix + 1}` : "")))
        suffix++;
      const before = pairsOn(working, build, t, u);
      let outcome = "clear";
      let crossing: object | null = null;
      if (before.length > 0) {
        let lo = clean;
        let hi = t;
        const probes: { t: number; pairs: number }[] = [];
        while ((hi - lo) * widest > RESOLUTION) {
          const mid = (lo + hi) / 2;
          const pairs = pairsOn(working, build, mid, u);
          probes.push({ t: mid, pairs: pairs.length });
          if (pairs.length === 0) lo = mid;
          else hi = mid;
        }
        const midpoint = (lo + t) / 2;
        const lighter = (cleanWeight + u) / 2;
        const id = `state/${state}` + (suffix > 0 ? `#${suffix + 1}` : "");
        outcome = "beyond the budget";
        let attempt: ReturnType<typeof solve> | null = null;
        let verification: object[] = [];
        let pairs = before;
        for (let pass = 0; pass < PASSES && pairs.length > 0; pass++) {
          const current = poseState(working, build, document(t, u));
          attempt = solve(
            current,
            pairs,
            segments,
            near,
            parents,
            attempt?.rest ?? null,
          );
          const candidate = withCorrective(
            working,
            id,
            drivers(lo, t, cleanWeight, u),
            attempt.rest,
          );
          const candidateBuild = createHumanBodyBasisBuilder(candidate);
          const atFull = pairsOn(candidate, candidateBuild, t, u);
          const atMid = pairsOn(candidate, candidateBuild, midpoint, u);
          const atLighter =
            heaviest > 0 ? pairsOn(candidate, candidateBuild, t, lighter) : [];
          verification = [
            { t, u, pairs: atFull },
            { t: midpoint, u, pairs: atMid },
            ...(heaviest > 0 ? [{ t, u: lighter, pairs: atLighter }] : []),
          ];
          if (atFull.length > 0) {
            const total = (list: IPair[]): number =>
              list.reduce((sum, p) => sum + p.triangles + p.otherTriangles, 0);
            if (total(atFull) >= total(pairs)) break;
            pairs = atFull;
            continue;
          }
          outcome =
            atMid.length === 0 && atLighter.length === 0
              ? "repaired"
              : atMid.length > 0
                ? "repaired; the midpoint of the joint ramp still crosses and is queued"
                : "repaired; the midpoint of the channel ramp still crosses and is queued";
          accept(candidate);
          if (atMid.length > 0 && (t - lo) * widest > 4 * RESOLUTION)
            queue.unshift({ t: midpoint, u }, { t, u });
          else if (
            atMid.length === 0 &&
            atLighter.length > 0 &&
            (u - cleanWeight) * heaviest > 4 * WEIGHT_RESOLUTION
          )
            queue.unshift({ t, u: lighter }, { t, u });
          pairs = [];
        }
        crossing = {
          id,
          worn: cleanWeight,
          weight: u,
          onset: lo,
          full: t,
          probes,
          pairs: before,
          vertices: attempt?.rest.size ?? 0,
          inexpressible:
            attempt === null ? 0 : attempt.posed.size - attempt.rest.size,
          mostPosed:
            attempt === null
              ? 0
              : Math.max(
                  0,
                  ...[...attempt.posed.values()].map((d) =>
                    Math.hypot(d[0], d[1], d[2]),
                  ),
                ),
          rounds: attempt?.rounds ?? {},
          verification,
        };
        if (outcome === "repaired") {
          if (u === 1) clean = t;
          if (t === 1) cleanWeight = u;
        } else if (outcome.includes("joint ramp") && u === 1) clean = lo;
      } else {
        if (u === 1) clean = Math.max(clean, t);
        if (t === 1) cleanWeight = Math.max(cleanWeight, u);
      }
      records.push({
        group: `${finding.set}:${finding.name}`,
        state,
        angle: t,
        travel: t,
        weight: u,
        volume: null,
        crossing,
        outcome,
        ms: Date.now() - started,
      });
      console.log(
        `${finding.set}:${finding.name}`.padEnd(52),
        String(t).padStart(8),
        String(u).padStart(8),
        "cross",
        before.length === 0 ? "-" : summarize(before),
        outcome,
        Date.now() - started,
        "ms",
      );
      save();
    }
  }
  save();
}

main();
