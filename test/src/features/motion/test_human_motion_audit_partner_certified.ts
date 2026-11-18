import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditMotion,
  AutoMovieMotionHumanAuditPartner,
  AutoMovieMotionHumanAuditTangle,
  HumanChain,
  HumanColliders,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The partner-penetration audit's certified scan, which leaves a directed
 * pair unread at the grid instants its margin certifies, reports what
 * reading both directions at every grid instant reports: the same pairs,
 * depths, instants and order, and so the same worst pair at the same second.
 *
 * The full scan is written here from the audit's definition: at each instant
 * of the audit's grid, the pose reading of the first person in the second
 * (`AutoMovieMotionHumanAuditTangle.across`) and then of the second in the
 * first, each directed pair keeping its deepest reading and the first
 * instant of it on a tie, the pairs deepest first.
 *
 * Scenarios:
 * 1. A real film of the average man standing and walking 2 m past the small
 *    woman, who stands 0.45 m to the side of his path, at 24 and 60 samples
 *    a second: the certified scan's result is the full scan's.
 * 2. The two standing on one floor point for 1 s: every instant reads the
 *    same deep pairs, and the result is the full scan's.
 * 3. A film of 2 s in which he stands and her right forearm is held 150 mm
 *    outside his chest for 1 s, then passes in to 30 mm and out again
 *    (`d = 0.03 - 0.12 |t - 1.5|`): pairs are found, the result is the full
 *    scan's, and her forearm's pair in the bone it passes into is deepest at
 *    1.5 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public measure and a scan of every instant through the public pose reading on real and hand-made films; a certificate that skips an instant where a pair deepens, records a different instant or reorders the pairs fails.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the audit's documented definition applied instant by instant; the hand-made film's depths and instants are written by the test.
 * @evidence contracts/development/testing.md#distinguishing-cases Two people passing near at two rates, two merged still bodies, and a limb passing in and out after a still second.
 * @evidence contracts/development/testing.md#execution-ownership In memory on two prepared bodies and real performances; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the oracle, the films and the 3 scenarios.
 */
export function test_human_motion_audit_partner_certified(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const man: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const woman: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const a: IAutoMovieMotionHumanAuditPartner.IPerson = {
    subject: "a",
    body: man,
  };
  const b: IAutoMovieMotionHumanAuditPartner.IPerson = {
    subject: "b",
    body: woman,
  };

  /** Both directions at every instant, each directed pair keeping its deepest, deepest first. */
  const full = (
    motion: IAutoMovieMotionHumanAuditMotion,
    rate: number,
  ): IAutoMovieMotionHumanAuditPartner.IPair[] => {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    for (const t of AutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    )) {
      const his: Bones = motion.bones("a", t);
      const hers: Bones = motion.bones("b", t);
      for (const [from, to, mine, theirs] of [
        [a, b, his, hers],
        [b, a, hers, his],
      ] as const)
        for (const pair of AutoMovieMotionHumanAuditTangle.across(
          from.body,
          mine,
          to.body,
          theirs,
        )) {
          const k: string = `${from.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(k);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(k, {
              subject: from.subject,
              part: pair.a,
              other: to.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: t,
            });
        }
    }
    return [...deepest.values()].sort(
      (
        x: IAutoMovieMotionHumanAuditPartner.IPair,
        y: IAutoMovieMotionHumanAuditPartner.IPair,
      ): number => y.depth - x.depth,
    );
  };
  const same = (
    label: string,
    motion: IAutoMovieMotionHumanAuditMotion,
    rate: number,
  ): IAutoMovieMotionHumanAuditPartner.IResult => {
    const expected: IAutoMovieMotionHumanAuditPartner.IPair[] = full(
      motion,
      rate,
    );
    const got: IAutoMovieMotionHumanAuditPartner.IResult =
      AutoMovieMotionHumanAuditPartner.measure(motion, a, b, rate);
    const text = (
      p: IAutoMovieMotionHumanAuditPartner.IPair | undefined,
    ): string =>
      p === undefined
        ? "none"
        : `${p.subject} ${p.part} in ${p.other} ${p.into} ${p.depth} m at ${p.seconds} s`;
    const differs: number = got.pairs.findIndex(
      (p: IAutoMovieMotionHumanAuditPartner.IPair, i: number): boolean =>
        text(p) !== text(expected[i]),
    );
    TestValidator.predicate(
      `${label}: the certified scan reads ${got.pairs.length} pairs as the full scan's ${expected.length}, worst ${(got.worst.value * 1000).toFixed(3)} mm at ${got.worst.seconds.toFixed(3)} s${differs < 0 ? "" : `; pair ${differs} reads ${text(got.pairs[differs])} against ${text(expected[differs])}`}`,
      got.pairs.length === expected.length &&
        got.pairs.every(
          (p: IAutoMovieMotionHumanAuditPartner.IPair, i: number): boolean =>
            p.subject === expected[i]!.subject &&
            p.part === expected[i]!.part &&
            p.other === expected[i]!.other &&
            p.into === expected[i]!.into &&
            p.depth === expected[i]!.depth &&
            p.seconds === expected[i]!.seconds,
        ) &&
        (expected.length === 0
          ? got.worst.value === 0 && got.worst.where === "none"
          : got.worst.value === expected[0]!.depth &&
            got.worst.seconds === expected[0]!.seconds),
    );
    return got;
  };
  const perform = (
    gap: IAutoMovieVector3,
    walks: boolean,
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.film(
      new HumanPerformance({
        seed: "certified",
        performers: [
          {
            subject: "a",
            body: man,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: woman,
            at: gap,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: (walks
          ? HumanChain.subject("a")
              .stand({ seconds: 0.5 })
              .walk({ to: { x: 0, y: 0, z: 2 } })
          : HumanChain.subject("a").stand({ seconds: 1 })
        ).with(HumanChain.subject("b").stand({ seconds: 1 })).node,
      }),
    );

  // 1. Two people passing near.
  const passed: motionHumanLaw.IFilm = perform({ x: 0.45, y: 0, z: 1 }, true);
  same("a man walking past a woman at 24 Hz", passed, 24);
  same("a man walking past a woman at 60 Hz", passed, 60);

  // 2. Two people on one point.
  const merged: IAutoMovieMotionHumanAuditPartner.IResult = same(
    "two people on one point",
    perform({ x: 0, y: 0, z: 0 }, false),
    24,
  );
  TestValidator.predicate(
    "two people on one point pass into each other",
    merged.pairs.length > 0,
  );

  // 3. Her forearm passing into his chest and out.
  const his: Bones = motionHumanStance(man);
  const hers: Bones = motionHumanStance(woman, { x: 0, y: 0, z: 2 }, 180);
  const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
    HumanColliders.cast(
      man,
      new Map(
        [...his].filter(
          ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
            bone === "chest" || bone === "spine",
        ),
      ),
      { x: -0.05, y: his.get("chest")!.worldPosition.y, z: 1 },
      { x: 0, y: 0, z: -1 },
      2,
    );
  if (hit === undefined) throw new Error("The ray missed the trunk");
  const p: IAutoMovieVector3 = hers.get("rightLowerArm")!.worldPosition;
  const q: IAutoMovieVector3 = hers.get("rightHand")!.worldPosition;
  const anchor: IAutoMovieVector3 = {
    x: (p.x + q.x) / 2,
    y: (p.y + q.y) / 2,
    z: (p.z + q.z) / 2,
  };
  const arm = (bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith("right") &&
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const she: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
    hers,
    2,
    (bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => {
      if (!arm(bone)) return { x: 0, y: 0, z: 0 };
      const inside: number = t < 1 ? -0.15 : 0.03 - 0.12 * Math.abs(t - 1.5);
      return {
        x: hit.point.x - hit.normal.x * inside - anchor.x,
        y: hit.point.y - hit.normal.y * inside - anchor.y,
        z: hit.point.z - hit.normal.z * inside - anchor.z,
      };
    },
  );
  const crossing: IAutoMovieMotionHumanAuditPartner.IResult = same(
    "her forearm passing through his chest",
    {
      duration: 2,
      segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [],
      bones: (subject: string, seconds: number): Bones =>
        subject === "a" ? his : she.bones("b", seconds),
    },
    24,
  );
  const forearm: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
    crossing.pairs.find(
      (pair: IAutoMovieMotionHumanAuditPartner.IPair): boolean =>
        pair.subject === "b" &&
        pair.part === "rightLowerArm" &&
        pair.into === hit.bone,
    );
  TestValidator.predicate(
    `her forearm's pass through his ${hit.bone} is found deepest at 1.5 s (${forearm?.seconds})`,
    forearm !== undefined && Math.abs(forearm.seconds - 1.5) <= 1e-9,
  );
}
