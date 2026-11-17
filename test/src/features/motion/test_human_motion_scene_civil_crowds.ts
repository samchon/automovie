import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanCrowd,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCrowd,
  HumanEnsemble,
  HumanFormation,
  HumanPerformance,
  HumanResponse,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Crowds that keep no drill, composed from the crowd primitives: bystanders
 * turning to a gunshot one by one, a mob running ragged from a threat, and
 * pedestrians walking in groups; nobody passes through anybody, and the
 * same seed replays.
 *
 * Scenarios, on three bodies:
 * 1. Shot: 30 civilians in a scatter each look at the shot, heard (a
 *    `signal` cue) from off their attended field, synced on it with
 *    a reaction latency; no look starts before the shot plus the reaction
 *    floor, and their onsets spread (a crowd does not turn as one).
 * 2. Mob: 30 rabble and 30 civilians flee 30 m from the same places; no two
 *    members' courses come within their summed half breadths; every member
 *    arrives. The presets imply the rabble's arrivals vary more: over
 *    `PILOT` seeds, the arrivals their drawn desires alone imply (latency
 *    plus the course over the desired speed) have a variance ratio above 1.
 *    The steered arrivals resolve it: over as many seeded scenes as a
 *    one-sided test of that ratio at alpha 0.05 with power 0.8 needs (n = 1
 *    + 4 (z_0.95 + z_0.8)^2 / (ln ratio)^2 per preset, from the log variance
 *    ratio's large-sample variance 4 / (n - 1)), Levene's test in its
 *    Brown-Forsythe form finds the rabble's spread wider (t > z_0.95).
 * 3. Street: 24 pedestrians, about two thirds in groups of two and three
 *    (Moussaid et al. 2010), each group steered as one agent: every grouped
 *    member shares its group's course, groups and singles keep apart, and
 *    everybody arrives.
 * 4. Anti-clone: over the street's members, every two members' courses
 *    differ by more than 0.1 m at some second (provisional floor, #3359).
 * 5. Determinism: the mob replays bit for bit; another seed moves the
 *    courses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs and steers crowds and reads look onsets and courses: a look before the shot, a crowd turning as one, members passing through each other, a member left behind, a rabble as orderly as civilians, groups split apart, clones, or a scene that does not replay is caught.
 * @evidence contracts/development/testing.md#independent-expectations The floor is the false-start rule; rabble wider than civilians is the requirement's relation, read by Levene's test at alpha 0.05 over a sample sized by power for the ratio the presets imply; group shares are Moussaid et al.'s; non-penetration and arrival are the scene's requirement; the clone floor is provisional and named.
 * @evidence contracts/development/testing.md#distinguishing-cases A shot, a mob of two presets, a street with groups, an anti-clone pass and a replay with another seed; the carriage parting is `test_human_motion_crowd_parting`'s.
 * @evidence contracts/development/testing.md#execution-ownership A scene test of the motions package on prepared polygon-man bodies, discovered by its exported name; events and courses, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_human_motion_scene_civil_crowds(): void {
  const findings: string[] = [];
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];
  const scatter = (
    id: string,
    preset: IAutoMovieMotionHumanEnsemble["preset"],
    count: number,
    seed: string = "crowds",
  ): IAutoMovieMotionHumanEnsemble.IEnsemble =>
    HumanEnsemble.of({
      id,
      seed,
      count,
      bodies: pool,
      ...(preset === undefined ? {} : { preset }),
      places: (i: number): { at: IAutoMovieVector3; yaw: number } => ({
        at: { x: 1.2 * (i % 6) - 3, y: 0, z: 1.2 * Math.floor(i / 6) },
        yaw: 0,
      }),
    });

  // 1. A shot.
  const bystanders: IAutoMovieMotionHumanEnsemble.IEnsemble = scatter(
    "s",
    "civilians",
    30,
  );
  const shot: number = 2;
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "crowds",
    performers: HumanEnsemble.performers(bystanders),
    cues: { shot: [{ name: "report", seconds: shot }] },
    composition: HumanEnsemble.chains(
      bystanders,
      (
        _: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ) =>
        chain
          .look({
            target: {
              kind: "point",
              at: { x: 10, y: 1.6, z: 3 },
              frame: "world",
            },
            seconds: 1.5,
            // A shot is heard, so it draws the look from outside the attended field.
            cue: "signal",
          })
          .sync({ of: "shot", event: "report", latency: "reaction" }),
    ),
  });
  const onsets: number[] = bystanders.members.map(
    (m: IAutoMovieMotionHumanEnsemble.IMember): number => {
      const s: IAutoMovieMotionHumanSegment = performance.segments(
        m.subject,
      )[0]!;
      return s.entryTime - shot;
    },
  );
  for (const [i, o] of onsets.entries())
    if (o < HumanResponse.FLOOR - 1e-9)
      findings.push(`s.${i} turns ${o.toFixed(3)} s after the shot`);
  if (new Set(onsets).size < onsets.length / 2)
    findings.push("the bystanders turn nearly as one");

  // 2. A mob.
  const flee = (
    e: IAutoMovieMotionHumanEnsemble.IEnsemble,
  ): IAutoMovieMotionHumanCrowd.IResult =>
    HumanCrowd.steer(e, {
      goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 => ({
        x: m.place.at.x,
        y: 0,
        z: m.place.at.z + 30,
      }),
      gait: "run",
      start: 0,
      until: 30,
      latency: "reaction",
      flight: true,
    });
  const rabble: IAutoMovieMotionHumanEnsemble.IEnsemble = scatter(
    "r",
    "rabble",
    30,
  );
  const civilians: IAutoMovieMotionHumanEnsemble.IEnsemble = scatter(
    "c",
    "civilians",
    30,
  );
  const mob: IAutoMovieMotionHumanCrowd.IResult = flee(rabble);
  const calm: IAutoMovieMotionHumanCrowd.IResult = flee(civilians);
  const apart = (
    label: string,
    e: IAutoMovieMotionHumanEnsemble.IEnsemble,
    r: IAutoMovieMotionHumanCrowd.IResult,
    until: number,
  ): void => {
    for (let t: number = 0; t <= until; t += 1 / 24) {
      const at: IAutoMovieVector3[] = r.frames.map(
        (f: IAutoMovieMotionHumanFormation.ICourse): IAutoMovieVector3 =>
          HumanFormation.frame({ blocks: [], frame: f }, t).at,
      );
      for (let i: number = 0; i < at.length; ++i)
        for (let j: number = i + 1; j < at.length; ++j) {
          if (r.frames[i] === r.frames[j]) continue;
          const d: number = Math.hypot(
            at[i]!.x - at[j]!.x,
            at[i]!.z - at[j]!.z,
          );
          const sum: number =
            HumanCrowd.half(e.members[i]!) + HumanCrowd.half(e.members[j]!);
          if (d < sum - 1e-6) {
            findings.push(
              `${label}: ${e.members[i]!.subject} and ${e.members[j]!.subject} ${d.toFixed(3)} m apart at ${t.toFixed(2)} s`,
            );
            return;
          }
        }
    }
  };
  apart("mob", rabble, mob, 30);
  apart("calm", civilians, calm, 30);
  const arrived = (
    r: IAutoMovieMotionHumanCrowd.IResult,
    label: string,
  ): number[] =>
    r.arrivals.map((x: number | null, i: number): number => {
      if (x === null) findings.push(`${label}: member ${i} never arrives`);
      return x ?? 30;
    });
  const mean = (a: readonly number[]): number =>
    a.reduce((p: number, q: number): number => p + q, 0) / a.length;
  const variance = (a: readonly number[]): number => {
    const m: number = mean(a);
    return (
      a.reduce((p: number, q: number): number => p + (q - m) ** 2, 0) /
      (a.length - 1)
    );
  };

  // The presets' own claim, deterministic: the arrivals the drawn desires alone imply (delay plus the course over the desired speed) vary more for the rabble, over `PILOT` seeds.
  const implied = (preset: IAutoMovieMotionHumanEnsemble["preset"]): number[] =>
    Array.from({ length: PILOT }, (_: unknown, k: number): number[] => {
      const e: IAutoMovieMotionHumanEnsemble.IEnsemble = scatter(
        "x",
        preset,
        30,
        `pilot:${k}`,
      );
      return e.members.map(
        (m: IAutoMovieMotionHumanEnsemble.IMember): number => {
          const d: IAutoMovieMotionHumanCrowd.IDesired = HumanCrowd.desired(
            e,
            m,
            {
              gait: "run",
              latency: "reaction",
              flight: true,
            },
          );
          return d.delay + 30 / d.speed;
        },
      );
    }).flat();
  const ratio: number =
    variance(implied("rabble")) / variance(implied("civilians"));
  if (!(ratio > 1))
    findings.push(
      `the presets imply the rabble's arrivals vary ${ratio.toFixed(3)} times the civilians'`,
    );

  // The behaviour: the steered arrivals over enough seeds to resolve that ratio. A one-sided test of the variance ratio at alpha 0.05 with power 0.8 needs, by the large-sample normality of the log variance ratio (variance 2 / (n - 1) per sample), n = 1 + 4 (z_0.95 + z_0.8)^2 / (ln ratio)^2 arrivals per preset; the seeds are that many scenes of 30.
  const needed: number =
    1 +
    (4 * (Z_ALPHA + Z_POWER) ** 2) / Math.log(Math.max(ratio, 1 + 1e-9)) ** 2;
  const seeds: number = Math.max(1, Math.ceil(needed / 30));
  if (seeds > MOST_SEEDS)
    findings.push(
      `resolving the implied ratio ${ratio.toFixed(3)} needs ${seeds} seeds of 30, beyond ${MOST_SEEDS}`,
    );
  const rabbleArrivals: number[] = arrived(mob, "mob");
  const calmArrivals: number[] = arrived(calm, "calm");
  for (let k: number = 1; k < Math.min(seeds, MOST_SEEDS); ++k) {
    rabbleArrivals.push(
      ...arrived(flee(scatter("r", "rabble", 30, `mob:${k}`)), "mob"),
    );
    calmArrivals.push(
      ...arrived(flee(scatter("c", "civilians", 30, `mob:${k}`)), "calm"),
    );
  }
  // Levene's test in its Brown-Forsythe form (absolute deviations from each group's median, robust to skewed arrivals), one-sided: for two groups it is the pooled t-test on those deviations, read against z_0.95 at these sizes.
  const deviations = (a: readonly number[]): number[] => {
    const sorted: number[] = [...a].sort(
      (p: number, q: number): number => p - q,
    );
    const median: number =
      sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]!
        : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
    return a.map((x: number): number => Math.abs(x - median));
  };
  const dr: number[] = deviations(rabbleArrivals);
  const dc: number[] = deviations(calmArrivals);
  const pooled: number =
    ((dr.length - 1) * variance(dr) + (dc.length - 1) * variance(dc)) /
    (dr.length + dc.length - 2);
  const t: number =
    (mean(dr) - mean(dc)) / Math.sqrt(pooled * (1 / dr.length + 1 / dc.length));
  if (!(t > Z_ALPHA))
    findings.push(
      `over ${rabbleArrivals.length} arrivals each, the rabble's spread is not resolved wider than the civilians' (Levene t ${t.toFixed(3)}, ${Z_ALPHA} needed)`,
    );

  // 3. A street with groups.
  const street: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "p",
    seed: "crowds",
    count: 24,
    bodies: pool,
    preset: "civilians",
    places: (i: number): { at: IAutoMovieVector3; yaw: number } => ({
      at: { x: 2 * (i % 4) - 3, y: 0, z: 2.5 * Math.floor(i / 4) },
      yaw: 0,
    }),
  });
  const groups: IAutoMovieMotionHumanEnsemble.IGroup[] = HumanEnsemble.groups(
    street,
    {
      share: 2 / 3,
      sizes: [2, 3],
    },
  );
  const walked: IAutoMovieMotionHumanCrowd.IResult = HumanCrowd.steer(street, {
    goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 => ({
      x: m.place.at.x,
      y: 0,
      z: m.place.at.z + 25,
    }),
    gait: "walk",
    start: 0,
    until: 40,
    groups,
  });
  for (const g of groups)
    for (const i of g.members)
      if (walked.frames[i] !== walked.frames[g.members[0]!])
        findings.push(`member ${i} leaves its group's course`);
  walked.arrivals.forEach((a: number | null, i: number): void => {
    if (a === null) findings.push(`street member ${i} never arrives`);
  });

  // 4. Anti-clone across the lone walkers.
  const lone: number[] = street.members
    .map((m: IAutoMovieMotionHumanEnsemble.IMember): number => m.index)
    .filter(
      (i: number): boolean =>
        !groups.some((g: IAutoMovieMotionHumanEnsemble.IGroup): boolean =>
          g.members.includes(i),
        ),
    );
  for (let a: number = 0; a < lone.length; ++a)
    for (let b: number = a + 1; b < lone.length; ++b) {
      let most: number = 0;
      for (let t: number = 0; t <= 40; t += 1) {
        const p: IAutoMovieVector3 = HumanFormation.frame(
          { blocks: [], frame: walked.frames[lone[a]!]! },
          t,
        ).at;
        const q: IAutoMovieVector3 = HumanFormation.frame(
          { blocks: [], frame: walked.frames[lone[b]!]! },
          t,
        ).at;
        most = Math.max(most, Math.hypot(p.x - q.x, p.z - q.z));
      }
      if (!(most > 0.1))
        findings.push(
          `street members ${lone[a]} and ${lone[b]} walk as clones`,
        );
    }

  // 5. Determinism.
  const again: IAutoMovieMotionHumanCrowd.IResult = flee(rabble);
  const other: IAutoMovieMotionHumanCrowd.IResult = flee(
    scatter("r", "rabble", 30, "another"),
  );
  let moved: boolean = false;
  for (let i: number = 0; i < 30; ++i)
    for (let t: number = 0; t <= 30; t += 3) {
      const a: IAutoMovieVector3 = HumanFormation.frame(
        { blocks: [], frame: mob.frames[i]! },
        t,
      ).at;
      const b: IAutoMovieVector3 = HumanFormation.frame(
        { blocks: [], frame: again.frames[i]! },
        t,
      ).at;
      const c: IAutoMovieVector3 = HumanFormation.frame(
        { blocks: [], frame: other.frames[i]! },
        t,
      ).at;
      if (a.x !== b.x || a.z !== b.z)
        findings.push(`mob member ${i} does not replay at ${t} s`);
      if (a.x !== c.x || a.z !== c.z) moved = true;
    }
  if (!moved) findings.push("another seed steers the mob the same way");
  TestValidator.equals("civil crowds", findings, []);
}

/** Seeds of 30 members per preset the implied variance ratio is read over: 600 drawn desires each, no steering. */
const PILOT: number = 20;

/** The standard normal's 0.95 quantile: the one-sided test at alpha 0.05. */
const Z_ALPHA: number = 1.6448536269514722;

/** The standard normal's 0.8 quantile: power 0.8. */
const Z_POWER: number = 0.8416212335729143;

/** The most mob scenes per preset the spec steers; a ratio needing more is reported, for the spec to be split into parts. */
const MOST_SEEDS: number = 24;
