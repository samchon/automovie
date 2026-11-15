import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanEnsemble,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEnsemble,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A group written once resolves into members whose drawn attributes follow
 * the group's distributions, whose draws are each member's own, whose roles
 * are honoured, and whose attributes reach the laws they perform.
 *
 * Scenarios, on a pool of three bodies:
 * 1. Over 1,000 members, each attribute's sample mean lies within three
 *    standard errors of its distribution's mean and its sample standard
 *    deviation within 10 % of the declared spread (distributions chosen far
 *    from the [0, 1] clip, so the clip does not move them).
 * 2. Adding a member, removing the last, and adding an attribute leave every
 *    other member's body, role and attribute values bit-identical; another
 *    seed changes them.
 * 3. A role with a `front` pick takes members of the front rank, a `rear`
 *    pick members of the rear rank; a role asking more members than exist is
 *    a located refusal naming the ensemble and the role, with the feasible
 *    count.
 * 4. Two members with discipline 0 and 1 performing a registered law read
 *    `context.attributes.discipline` as 0 and 1 (a metamorphic pair).
 * 5. The performance built from `performers` and `chains` names every member
 *    `${id}.${index}` and places each where its slot or place stands.
 * 6. `pick` returns exactly the count asked, never a member outside `among`,
 *    the same members for the same seed, and, weighted by discipline, the
 *    less disciplined half more often than the more disciplined over 200
 *    seeds; a count above the admitted is refused.
 * 7. `seed` is the same for the same member and name and differs for another
 *    name or member, and is unchanged by adding members; `groups` puts every
 *    grouped member in exactly one group, every size one of those allowed,
 *    and the grouped share of 1,000 members within four standard errors of
 *    the asked share, its binomial variance inflated by the mean group size
 *    since members are grouped whole.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves ensembles and performs two of them: drifting draws, a draw that moves when another member is added, a misplaced role, attributes that never reach a law, a wrong subject, an unweighted pick or overlapping groups fail.
 * @evidence contracts/development/testing.md#independent-expectations Sampling bands from the distributions' own moments (standard error sigma over the square root of n); invariance under adding members and attributes is the issue's keyed-draw requirement; the grouped share is the binomial band of the asked share.
 * @evidence contracts/development/testing.md#distinguishing-cases A large sample, the add, remove and new-attribute variants with another seed as the negative, the three role picks and the over-count, the two ends of discipline, weighted and unweighted picks with their refusal, and seeds and groups; formations belong to `test_human_motion_ensemble_formation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; two short performances, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios and what each pins.
 */
export function test_human_motion_ensemble_members(): void {
  const findings: string[] = [];
  const pool: IHumanBody[] = [motionHumanBody("m-average"), motionHumanBody("f-small"), motionHumanBody("m-tall")];
  const line = (count: number, extra?: Partial<IHumanEnsemble>): IHumanEnsemble => ({
    id: "b1",
    seed: "ensemble",
    count,
    bodies: pool,
    attributes: { discipline: { mean: 0.5, spread: 0.1 }, morale: { mean: 0.6, spread: 0.08, shape: "uniform" } },
    proficiency: { mean: 0.5, spread: 0.1 },
    formation: {
      blocks: [{ layout: { kind: "line", ranks: 3, files: Math.ceil(count / 3), spacing: { lateral: 0.56, depth: 0.6 } }, count }],
      frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
    },
    ...extra,
  });

  // 1. Sampling bands.
  const big: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(1000));
  for (const [name, mean, spread] of [["discipline", 0.5, 0.1], ["morale", 0.6, 0.08]] as const) {
    const values: number[] = big.members.map((m: HumanEnsemble.IMember): number => m.attributes[name]!);
    const m: number = values.reduce((a: number, b: number): number => a + b, 0) / values.length;
    const sd: number = Math.sqrt(values.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) / (values.length - 1));
    if (Math.abs(m - mean) > (3 * spread) / Math.sqrt(values.length)) findings.push(`${name}: sample mean ${m.toFixed(4)} outside three standard errors of ${mean}`);
    if (Math.abs(sd - spread) > 0.1 * spread) findings.push(`${name}: sample deviation ${sd.toFixed(4)}, ${spread} within 10 % expected`);
  }

  // 2. Each member's draws are its own.
  const base: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(30));
  const same = (a: HumanEnsemble.IMember, b: HumanEnsemble.IMember): boolean =>
    a.pool === b.pool && a.role === b.role && a.attributes.discipline === b.attributes.discipline && a.attributes.morale === b.attributes.morale;
  const more: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(31));
  const fewer: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(29));
  const richer: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(30, { attributes: { discipline: { mean: 0.5, spread: 0.1 }, morale: { mean: 0.6, spread: 0.08, shape: "uniform" }, fatigue: { mean: 0.3, spread: 0.1 } } }));
  const other: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(30, { seed: "another" }));
  for (const [label, variant, n] of [["an added member", more, 30], ["a removed member", fewer, 29], ["an added attribute", richer, 30]] as const)
    for (let i: number = 0; i < n; ++i)
      if (!same(base.members[i]!, variant.members[i]!)) {
        findings.push(`${label} changed member ${i}'s draws`);
        break;
      }
  if (base.members.every((m: HumanEnsemble.IMember, i: number): boolean => same(m, other.members[i]!)))
    findings.push("another seed changed no member's draws");

  // 3. Roles.
  const roled: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(30, { roles: { officer: { count: 1, pick: "front" }, drummer: { count: 2, pick: "rear" } } }));
  for (const m of roled.members) {
    if (m.role === "officer" && m.slot?.rank !== 0) findings.push(`the officer ${m.subject} stands in rank ${m.slot?.rank}`);
    if (m.role === "drummer" && m.slot?.rank !== 2) findings.push(`the drummer ${m.subject} stands in rank ${m.slot?.rank}`);
  }
  if (roled.members.filter((m: HumanEnsemble.IMember): boolean => m.role === "drummer").length !== 2) findings.push("two drummers expected");
  try {
    HumanEnsemble.of(line(6, { roles: { officer: { count: 7 } } }));
    findings.push("a role of 7 among 6 members was not refused");
  } catch (error) {
    if (!(error instanceof HumanRefusal) || !error.axis.includes("b1") || !error.axis.includes("officer") || error.feasible?.kind !== "range" || error.feasible.maximum !== 6)
      findings.push(`the over-count refusal does not name the ensemble, the role and 6: ${String(error)}`);
  }

  // 4 and 5. Attributes reach a law; the performance names every member.
  const read: Map<string, number | undefined> = new Map();
  const probe: IHumanActionLaw<{ seconds: number }> = {
    name: "probe",
    interrupts: stand.interrupts,
    plan: (context: IHumanActionContext<{ seconds: number }>): IHumanActionPlan => {
      read.set(context.subject, context.attributes?.discipline);
      return stand.plan(context);
    },
  };
  const pair: HumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "p",
    seed: "ensemble",
    count: 2,
    bodies: [pool[0]!],
    attributes: { discipline: { mean: 0, spread: 0 } },
    places: (index: number): IHumanEnsemble.IPlace => ({ at: { x: 2 * index, y: 0, z: 0 }, yaw: 0 }),
  });
  const given: HumanEnsemble.IEnsemble = {
    ...pair,
    members: pair.members.map((m: HumanEnsemble.IMember, i: number): HumanEnsemble.IMember => ({ ...m, attributes: { discipline: i } })),
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "ensemble",
    laws: [probe as IHumanActionLaw<never>],
    performers: HumanEnsemble.performers(given),
    composition: HumanEnsemble.chains(given, (_: HumanEnsemble.IMember, chain: HumanChain) => chain.registered("probe", { seconds: 0.5 })),
  });
  if (read.get("p.0") !== 0 || read.get("p.1") !== 1) findings.push(`the law read discipline ${read.get("p.0")} and ${read.get("p.1")}, 0 and 1 expected`);
  for (const m of given.members) {
    const root: IAutoMovieVector3 = performance.posture(m.subject, 0.25).root;
    if (Math.hypot(root.x - m.place.at.x, root.z - m.place.at.z) > 0.05) findings.push(`${m.subject} stands ${root.x.toFixed(3)}, ${root.z.toFixed(3)}, not at its place`);
  }

  // 6. Picks.
  const picked: number[] = HumanEnsemble.pick(base, 5, "misfire", (m: HumanEnsemble.IMember): boolean => m.index % 2 === 0);
  if (picked.length !== 5 || picked.some((i: number): boolean => i % 2 !== 0)) findings.push(`pick gave ${picked.join(", ")}`);
  if (HumanEnsemble.pick(base, 5, "misfire", (m: HumanEnsemble.IMember): boolean => m.index % 2 === 0).join() !== picked.join()) findings.push("pick is not repeatable");
  const median: number = [...base.members.map((m: HumanEnsemble.IMember): number => m.attributes.discipline!)].sort((a: number, b: number): number => a - b)[15]!;
  let low: number = 0;
  let high: number = 0;
  for (let s: number = 0; s < 200; ++s) {
    const e: HumanEnsemble.IEnsemble = HumanEnsemble.of(line(30, { seed: `pick${s}` }));
    const cut: number = [...e.members.map((m: HumanEnsemble.IMember): number => m.attributes.discipline!)].sort((a: number, b: number): number => a - b)[15]!;
    for (const i of HumanEnsemble.pick(e, 3, "break", undefined, "discipline"))
      if (e.members[i]!.attributes.discipline! < cut) ++low;
      else ++high;
  }
  if (!(low > high)) findings.push(`weighted picks fell ${low} times on the less and ${high} on the more disciplined half (median ${median.toFixed(3)})`);
  try {
    HumanEnsemble.pick(base, 31, "all");
    findings.push("a pick of 31 among 30 was not refused");
  } catch (error) {
    if (!(error instanceof HumanRefusal)) findings.push(`the pick refusal is not a HumanRefusal: ${String(error)}`);
  }

  // 7. Seeds and groups.
  if (HumanEnsemble.seed(base, 3, "horse") !== HumanEnsemble.seed(more, 3, "horse")) findings.push("adding a member changed a member's seed");
  if (HumanEnsemble.seed(base, 3, "horse") === HumanEnsemble.seed(base, 3, "musket")) findings.push("two names gave one seed");
  if (HumanEnsemble.seed(base, 3, "horse") === HumanEnsemble.seed(base, 4, "horse")) findings.push("two members gave one seed");
  const groups: HumanEnsemble.IGroup[] = HumanEnsemble.groups(big, { share: 0.6, sizes: [2, 3] });
  const seen: Set<number> = new Set();
  for (const g of groups) {
    if (![2, 3].includes(g.members.length)) findings.push(`a group of ${g.members.length}`);
    for (const i of g.members) {
      if (seen.has(i)) findings.push(`member ${i} is in two groups`);
      seen.add(i);
    }
  }
  const share: number = seen.size / big.members.length;
  // Members are grouped in clusters of 2.5 on average, which inflates the binomial variance by the cluster size (the design effect of whole clusters).
  if (Math.abs(share - 0.6) > 4 * Math.sqrt((2.5 * 0.6 * 0.4) / big.members.length))
    findings.push(`grouped share ${share.toFixed(3)}, 0.6 expected`);
  TestValidator.equals("an ensemble's members", findings, []);
}
