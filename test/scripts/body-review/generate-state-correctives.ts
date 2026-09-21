/**
 * Solve the census's combination findings into correctives driven by the
 * product of their inputs: a pose corrective solved on the neutral body
 * that no longer clears on a macro extreme (the `shapes` set), or a parent
 * and child joint at their extremes crossing where each alone did not (the
 * `combos` set).
 *
 * Usage, from the repository root, on a shipped basis whose census receipt
 * lists the findings:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/generate-state-correctives.ts -- [shard/of] [--set shapes,combos] [output-dir]
 *
 * Every finding is one state: a shape (channel weights) and a pose (joint
 * angles). Its corrective is driven by one channel driver per nonzero shape
 * channel, on that channel's side, and one clinical ramp per posed joint
 * axis, all multiplied as `createHumanFaceBasisBuilder` fires a corrective;
 * RigLogic's PSD over a pose and a shape. The ramps' onset is measured as
 * the largest fraction `t` of the pose (every angle scaled from its rest)
 * at which nothing crosses on that shape, bisected to 2.5 degrees of the
 * widest travel, and each ramp runs from `t` times its travel to its full
 * travel. The push is the same solve as the single-axis generator, on the
 * shaped and posed skin, carried to the rest frame through the same
 * blended rotations; the candidate is verified through the public builder
 * and the census instrument at the full state and at the midpoint of the
 * ramp, an in-between queued as its own state while the ramp is wider than
 * the bisection band. The output is a shard the pose merge appends in its
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
/** Outer passes of solve-then-verify per state before it is given up. */
const PASSES = 2;
/** Visits per finding, counting queued midpoints and revisits. */
const VISITS = 6;

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
  if (census.basis !== basis.id)
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
    const widest = Math.max(
      ...posed.map((one) => Math.abs(one.angle - one.rest)),
    );
    // the state at fraction t of the pose, shape kept whole
    const document = (t: number): IDocument => ({
      id: "state",
      name: "state",
      basis: working.id,
      shape,
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
    ): IPair[] =>
      measureAutoMovieModelCrossings(
        segmentHumanBody(
          candidate,
          candidateBuild({ ...document(t), basis: candidate.id }),
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
    const drivers = (onset: number, full: number): Driver[] => [
      ...Object.entries(shape)
        .filter(([, weight]) => weight !== 0)
        .map(([channel, weight]) => ({
          channel,
          side: weight < 0 ? ("negative" as const) : ("positive" as const),
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
    let clean = 0;
    const queue = [1];
    let visits = 0;
    while (queue.length > 0 && visits++ < VISITS) {
      const t = queue.shift()!;
      const started = Date.now();
      const state = `${finding.set}:${finding.name}` + (t === 1 ? "" : `@${t}`);
      const suffix = records.filter(
        (record: { state?: string }) => record.state === state,
      ).length;
      const before = pairsOn(working, build, t);
      let outcome = "clear";
      let crossing: object | null = null;
      if (before.length > 0) {
        let lo = clean;
        let hi = t;
        const probes: { t: number; pairs: number }[] = [];
        while ((hi - lo) * widest > RESOLUTION) {
          const mid = (lo + hi) / 2;
          const pairs = pairsOn(working, build, mid);
          probes.push({ t: mid, pairs: pairs.length });
          if (pairs.length === 0) lo = mid;
          else hi = mid;
        }
        const midpoint = (lo + t) / 2;
        const id = `state/${state}` + (suffix > 0 ? `#${suffix + 1}` : "");
        outcome = "beyond the budget";
        let attempt: ReturnType<typeof solve> | null = null;
        let verification: object[] = [];
        let pairs = before;
        for (let pass = 0; pass < PASSES && pairs.length > 0; pass++) {
          const current = poseState(working, build, document(t));
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
            drivers(lo, t),
            attempt.rest,
          );
          const candidateBuild = createHumanBodyBasisBuilder(candidate);
          const atFull = pairsOn(candidate, candidateBuild, t);
          const atMid = pairsOn(candidate, candidateBuild, midpoint);
          verification = [
            { t, pairs: atFull },
            { t: midpoint, pairs: atMid },
          ];
          if (atFull.length > 0) {
            const total = (list: IPair[]): number =>
              list.reduce((sum, p) => sum + p.triangles + p.otherTriangles, 0);
            if (total(atFull) >= total(pairs)) break;
            pairs = atFull;
            continue;
          }
          outcome =
            atMid.length === 0
              ? "repaired"
              : "repaired; the midpoint of the ramp still crosses and is queued";
          accept(candidate);
          if (atMid.length > 0 && (t - lo) * widest > 4 * RESOLUTION)
            queue.unshift(midpoint, t);
          pairs = [];
        }
        crossing = {
          id,
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
        if (outcome === "repaired") clean = t;
        else if (outcome.startsWith("repaired")) clean = lo;
      } else clean = Math.max(clean, t);
      records.push({
        group: `${finding.set}:${finding.name}`,
        state,
        angle: t,
        travel: t,
        volume: null,
        crossing,
        outcome,
        ms: Date.now() - started,
      });
      console.log(
        `${finding.set}:${finding.name}`.padEnd(52),
        String(t).padStart(8),
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
