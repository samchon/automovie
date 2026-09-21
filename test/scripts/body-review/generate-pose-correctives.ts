/**
 * Solve the joint census into pose correctives: the volume each joint loses
 * and the folds it crosses, one ramp per sample angle per axis side.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/generate-pose-correctives.ts -- [shard/of] [--only regex] [--incremental] [output-dir]
 *
 * Every mobile joint axis is visited on each side of its rest at the census's
 * two sample angles, in ascending travel, on a working basis that already
 * wears the correctives accepted before. At each angle:
 *
 * 1. **Volume.** The rigid (dual quaternion) blend of the same skin is
 *    compared with the linear blend the builder uses; where the linear blend
 *    has lost a millimetre or more (the candy wrapper of a twist, the pinch
 *    of a fold), the difference is a corrective `vol/<bone>.<axis><side>@<angle>`
 *    ramping from the previous sample to this one. The girth measurement is
 *    what justified it: a forearm pronation loses 16% of the elbow's girth
 *    under linear blend skinning, a knee at 140 degrees 7%.
 * 2. **Crossing.** With the volume worn, the census instrument is read. If
 *    two segments cross, `onset` is bisected between the last clean angle and
 *    this one to 2.5 degrees, both segments are pushed apart inside a
 *    per-pair tissue budget (`pushApart`), and the posed displacement is
 *    carried into the rest frame through the inverse of each vertex's blended
 *    bone rotation, exact under linear blend skinning: the corrective
 *    `pose/<bone>.<axis><side>@<angle>`. A vertex whose blend is near
 *    singular (its weight split across a joint bent toward 180 degrees) gets
 *    no row and is counted as inexpressible; the verification decides
 *    whether the rows that remain still clear the crossing.
 * 3. **Verification.** Each candidate is verified through the public builder
 *    and the census instrument at its angle and at the midpoint of its ramp;
 *    the target pairs must be gone. A midpoint that still crosses is queued as
 *    its own angle, solved with the accepted ramp half active, and the angle
 *    is revisited. A candidate the budget cannot clear is recorded and not
 *    published; a corrective is a repair inside what tissue gives, and a pose
 *    that needs more is reported as such.
 *
 * Axes are independent (a single-axis state activates no other axis's
 * ramps), so a shard `i/n` takes every n-th axis group and the merge script
 * assembles the shards into one published revision. With `--incremental` the
 * shipped basis, which already wears its correctives, is the working basis
 * and only the states the shipped receipt lists as unpublished are visited,
 * each starting from the largest angle its axis side already has a
 * corrective at and without a second volume corrective; the merge appends
 * what is repaired as the next revision. Nothing here writes into
 * `test/studies`.
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
  type IDocument,
  type IGroup,
  type IPair,
  axisGroups,
  budgetOf,
  foldOf,
  poseState,
  solve,
  volumeDisplacement,
  withCorrective,
} from "./poseCorrectiveSolver";
import { neighboursOf } from "./pushApart";
import { segmentHumanBody } from "./segmentHumanBody";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
/** Bisection stops when the clean and crossing angles are this close, degrees. */
const RESOLUTION = 2.5;
/** Outer passes of solve-then-verify per angle before it is given up. */
const PASSES = 2;
/** A volume displacement below this, in metres, is not worth a row. */
const VOLUME_THRESHOLD = 0.001;
/** Visits per axis group, counting queued midpoints and revisits. */
const VISITS = 12;

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const only = args.includes("--only")
    ? new RegExp(args[args.indexOf("--only") + 1])
    : null;
  const incremental = args.includes("--incremental");
  const positional = args.filter(
    (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--only",
  );
  const shard = /^(\d+)\/(\d+)$/.exec(positional[0] ?? "0/1");
  if (shard === null) throw new Error("shard must read i/n");
  const [index, count] = [Number(shard[1]), Number(shard[2])];
  const output = path.resolve(
    positional[1] ?? path.join(ROOT, ".shots/body-review/pose"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(fs.readFileSync(path.join(STUDY, "basis.json.gz")))
      .toString("utf8"),
  );
  const census = JSON.parse(
    fs.readFileSync(path.join(STUDY, "census-receipt.json"), "utf8"),
  );
  if (census.basis !== basis.id)
    throw new Error("the census was taken on another revision");
  const label = (group: IGroup): string =>
    `${group.bone}.${group.axis}${group.side === "positive" ? "+" : "-"}`;
  // the shipped receipt's unpublished states, by axis group, and the
  // largest angle each group already reaches with a published corrective
  const shipped: {
    unpublished: { state: string }[];
    correctives: { id: string; full: number }[];
  } = incremental
    ? JSON.parse(
        fs.readFileSync(
          path.join(STUDY, "pose-correctives-receipt.json"),
          "utf8",
        ),
      )
    : { unpublished: [], correctives: [] };
  const owed = new Map<string, number[]>();
  for (const one of shipped.unpublished) {
    const [bone, rest] = one.state.split(".");
    const [axis, angle] = rest.split("@");
    const joint = basis.joints.find((joint) => joint.bone === bone)!;
    const neutral = joint.neutral[axis as "flexion" | "abduction" | "twist"];
    const key = `${bone}.${axis}${Number(angle) > neutral ? "+" : "-"}`;
    owed.set(key, [...(owed.get(key) ?? []), Number(angle)]);
  }
  const groups = axisGroups(basis)
    .filter((group) => only === null || only.test(label(group)))
    .filter((group) => !incremental || owed.has(label(group)))
    .map((group) =>
      incremental
        ? {
            ...group,
            samples: [...owed.get(label(group))!].sort(
              (x, y) =>
                Math.abs(x - group.neutral) - Math.abs(y - group.neutral),
            ),
          }
        : group,
    )
    .filter((_group, at) => at % count === index);
  console.log(groups.length, "axis groups in this shard");

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
        only: only === null ? null : only.source,
        incremental,
        groups: groups.map(label),
        correctives: published,
        rows,
        records,
      }),
    );
  const summarize = (pairs: IPair[]): string =>
    pairs.map((pair) => `${pair.part}x${pair.other}`).join(",");
  for (const group of groups) {
    let working = basis;
    let build = createHumanBodyBasisBuilder(working);
    const document = (angle: number): IDocument => ({
      id: "pose",
      name: "pose",
      basis: working.id,
      shape: {},
      pose: [
        {
          bone: group.bone,
          flexion: null,
          abduction: null,
          twist: null,
          [group.axis]: angle,
        } as IAutoMovieJointPose,
      ],
    });
    const travel = (angle: number): number =>
      (group.side === "positive" ? 1 : -1) * (angle - group.neutral);
    const pairsOn = (
      candidate: IAutoMovieHumanBodyBasis,
      candidateBuild: ReturnType<typeof createHumanBodyBasisBuilder>,
      angle: number,
    ): IPair[] =>
      measureAutoMovieModelCrossings(
        segmentHumanBody(
          candidate,
          candidateBuild({ ...document(angle), basis: candidate.id }),
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
    const tag = (kind: string, angle: number, suffix: number): string =>
      `${kind}/${label(group)}@${angle}` + (suffix > 0 ? `#${suffix + 1}` : "");
    // an incremental run resumes where the shipped correctives stop: the
    // largest published angle on this side is clean, and its volume is
    // already worn
    const reached = shipped.correctives
      .filter((one) =>
        one.id.slice(one.id.indexOf("/") + 1).startsWith(label(group) + "@"),
      )
      .map(
        (one) =>
          group.neutral + (group.side === "positive" ? 1 : -1) * one.full,
      );
    let clean =
      reached.length === 0
        ? group.neutral
        : reached.reduce((far, angle) =>
            Math.abs(angle - group.neutral) > Math.abs(far - group.neutral)
              ? angle
              : far,
          );
    let previous = clean;
    const queue = group.samples.map((angle) => ({
      angle,
      sample: !incremental,
    }));
    let visits = 0;
    while (queue.length > 0 && visits++ < VISITS) {
      const { angle, sample } = queue.shift()!;
      const started = Date.now();
      const state = `${group.bone}.${group.axis}@${angle}`;
      const suffix = records.filter(
        (record: { state?: string }) => record.state === state,
      ).length;
      // 1. volume: the rigid blend's surplus over the linear blend, outside
      // the fold, at a census sample on its first visit only (a queued
      // midpoint or a revisit would give the volume back twice)
      const before = pairsOn(working, build, angle);
      const posed = poseState(working, build, document(angle));
      const volume =
        !sample || suffix > 0
          ? new Map<number, number[]>()
          : volumeDisplacement(
              posed,
              VOLUME_THRESHOLD,
              foldOf(posed, group.bone, parents.get(group.bone) ?? null),
            );
      let volumeRecord: { mostPosed: number } | null = null;
      let after = before;
      const volumeRest = posed.toRest(volume);
      if (volumeRest.size > 0) {
        const id = tag("vol", angle, suffix);
        accept(
          withCorrective(
            working,
            id,
            {
              bone: group.bone,
              axis: group.axis,
              side: group.side,
              onset: travel(previous),
              full: travel(angle),
            },
            volumeRest,
          ),
        );
        after = pairsOn(working, build, angle);
        volumeRecord = {
          ...{
            id,
            vertices: volumeRest.size,
            inexpressible: volume.size - volumeRest.size,
            onset: travel(previous),
            full: travel(angle),
            pairsBefore: before,
            pairsAfter: after,
          },
          mostPosed: Math.max(
            ...[...volume.values()].map((d) => Math.hypot(d[0], d[1], d[2])),
          ),
        };
      }
      // 2. crossing, with the volume worn
      let crossing: object | null = null;
      let outcome = "clear";
      if (after.length > 0) {
        let lo = clean;
        let hi = angle;
        const probes: { angle: number; pairs: number }[] = [];
        while (Math.abs(hi - lo) > RESOLUTION) {
          const mid = (lo + hi) / 2;
          const pairs = pairsOn(working, build, mid);
          probes.push({ angle: mid, pairs: pairs.length });
          if (pairs.length === 0) lo = mid;
          else hi = mid;
        }
        const onset = travel(lo);
        const full = travel(angle);
        const midpoint = (lo + angle) / 2;
        const id = tag("pose", angle, suffix);
        outcome = "beyond the budget";
        let attempt: ReturnType<typeof solve> | null = null;
        let verification: object[] = [];
        const passes: object[] = [];
        let pairs = after;
        for (let pass = 0; pass < PASSES && pairs.length > 0; pass++) {
          const current = poseState(working, build, document(angle));
          attempt = solve(
            current,
            pairs,
            segments,
            near,
            parents,
            attempt?.rest ?? null,
          );
          passes.push(attempt.rounds);
          const candidate = withCorrective(
            working,
            id,
            {
              bone: group.bone,
              axis: group.axis,
              side: group.side,
              onset,
              full,
            },
            attempt.rest,
          );
          const candidateBuild = createHumanBodyBasisBuilder(candidate);
          const atFull = pairsOn(candidate, candidateBuild, angle);
          const atMid = pairsOn(candidate, candidateBuild, midpoint);
          verification = [
            { angle, pairs: atFull },
            { angle: midpoint, pairs: atMid },
          ];
          if (atFull.length > 0) {
            // another pass builds on these rows only if they helped
            const count = (list: IPair[]): number =>
              list.reduce(
                (sum, pair) => sum + pair.triangles + pair.otherTriangles,
                0,
              );
            if (count(atFull) >= count(pairs)) break;
            pairs = atFull;
            continue;
          }
          outcome =
            atMid.length === 0
              ? "repaired"
              : "repaired; the midpoint of the ramp still crosses and is queued";
          accept(candidate);
          // a ramp whose midpoint still crosses gets an in-between, unless
          // the ramp is already within the bisection band of its onset: a
          // contact that starts at the onset needs its displacement at once,
          // and halving toward the onset forever would publish a chain of
          // ever-shorter ramps (the left knee did, ten deep) and exhaust the
          // visits before the full angle was seen again
          if (atMid.length > 0 && Math.abs(angle - lo) > 4 * RESOLUTION)
            queue.unshift(
              { angle: midpoint, sample: false },
              { angle, sample: false },
            );
          pairs = [];
        }
        crossing = {
          id,
          onset,
          full,
          probes,
          pairs: after,
          budgets: after.map((pair) => ({
            pair: pair.part + " x " + pair.other,
            budget: budgetOf(pair.part, pair.other),
          })),
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
          passes,
          verification,
        };
        if (outcome === "repaired") clean = angle;
        else if (outcome.startsWith("repaired")) clean = lo;
        // A full angle the tissue cannot clear (the thigh six centimetres
        // into the belly at 125 degrees of hip flexion) still leaves the
        // ramp below it owed: the midpoint between the last clean angle and
        // this one is queued as its own state, so the corrective reaches as
        // far as the tissue gives and the receipt says where it stopped.
        else if (
          Math.abs(angle - lo) > 4 * RESOLUTION &&
          !records.some(
            (record: { state?: string }) =>
              record.state === `${group.bone}.${group.axis}@${midpoint}`,
          )
        )
          queue.unshift({ angle: midpoint, sample: false });
      } else if (Math.abs(travel(angle)) > Math.abs(travel(clean)))
        clean = angle;
      if (sample) previous = angle;
      records.push({
        group: label(group),
        state,
        angle,
        travel: travel(angle),
        volume: volumeRecord,
        crossing,
        outcome,
        ms: Date.now() - started,
      });
      console.log(
        label(group).padEnd(28),
        String(angle).padStart(8),
        "vol",
        String(volumeRest.size).padStart(5),
        volumeRecord === null
          ? "       "
          : (volumeRecord.mostPosed * 1000).toFixed(1).padStart(5) + "mm",
        "cross",
        before.length === 0 ? "-" : summarize(before),
        "->",
        after.length === 0 ? "-" : summarize(after),
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
