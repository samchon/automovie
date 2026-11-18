import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditMotion,
  AutoMovieMotionHumanAuditTangle,
  HumanChain,
  HumanColliders,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The self-penetration audit's certified scan, which leaves a pair unread at
 * the grid instants its margin certifies, reports what reading every pair at
 * every grid instant reports: the same pairs, depths, instants and order, and
 * so the same worst pair at the same second.
 *
 * The full scan is written here from the audit's definition: at each instant
 * of the audit's grid, the pose reading (`AutoMovieMotionHumanAuditTangle.pose`)
 * with the instant's declared exemptions, each unordered pair keeping its
 * deepest reading and the first instant of it on a tie, the pairs deepest
 * first. A hand declared on the person's own body exempts the hand and its
 * fingers from the touched bone over the window, as the audit documents.
 *
 * Scenarios:
 * 1. A real film of the average man standing 1 s, walking 2 m and standing
 *    on, at 24 and at 60 samples a second: the certified scan's result is
 *    the full scan's.
 * 2. A film of 2 s of the quiet stance in which the right forearm is held
 *    150 mm outside the chest for 1 s, then passes in to 30 mm and out
 *    again (`d = 0.03 - 0.12 |t - 1.5|`): the result is the full scan's, and
 *    the pair of the forearm and the bone it passes into is deepest at
 *    1.5 s (the hand carried with it may be deepest elsewhere, a straight
 *    course through a convex part not being deepest at its middle).
 * 3. The right hand set 20 mm inside the chest throughout 1 s, with a
 *    contact of that hand on the person's own body at a region of the
 *    touched bone declared over 0.25 to 0.75 s: the hand's pairs are read
 *    only outside the window, by both scans alike.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public measure and a scan of every instant through the public pose reading on real and hand-made films; a certificate that skips an instant where a pair deepens, records a different instant or reorders the pairs fails.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the audit's documented definition applied instant by instant; the films' depths and instants are written by the test, the exemption rule is the documented one.
 * @evidence contracts/development/testing.md#distinguishing-cases A real clean film at two rates, a limb passing in and out after a still second, and a declared contact over part of the film.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body and one real performance; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the oracle, the films and the 3 scenarios.
 */
export function test_human_motion_audit_tangle_certified(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const key = AutoMovieMotionHumanAuditTangle.unordered;

  /** Every pair at every instant, each keeping its deepest, deepest first. */
  const full = (
    motion: IAutoMovieMotionHumanAuditMotion,
    rate: number,
    skipped: (t: number) => Set<string> = (): Set<string> => new Set(),
  ): IAutoMovieMotionHumanAuditTangle.IPair[] => {
    const deepest: Map<string, IAutoMovieMotionHumanAuditTangle.IPair> =
      new Map();
    for (const t of AutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    ))
      for (const pair of AutoMovieMotionHumanAuditTangle.pose(
        body,
        motion.bones("a", t),
        skipped(t),
      )) {
        const k: string = key(pair.a, pair.b);
        const known: IAutoMovieMotionHumanAuditTangle.IPair | undefined =
          deepest.get(k);
        if (known === undefined || pair.depth > known.depth)
          deepest.set(k, { ...pair, seconds: t });
      }
    return [...deepest.values()].sort(
      (
        x: IAutoMovieMotionHumanAuditTangle.IPair,
        y: IAutoMovieMotionHumanAuditTangle.IPair,
      ): number => y.depth - x.depth,
    );
  };
  const same = (
    label: string,
    motion: IAutoMovieMotionHumanAuditMotion,
    rate: number,
    skipped?: (t: number) => Set<string>,
  ): IAutoMovieMotionHumanAuditTangle.IResult => {
    const expected: IAutoMovieMotionHumanAuditTangle.IPair[] = full(
      motion,
      rate,
      skipped,
    );
    const got: IAutoMovieMotionHumanAuditTangle.IResult =
      AutoMovieMotionHumanAuditTangle.measure(motion, "a", body, rate);
    const text = (
      p: IAutoMovieMotionHumanAuditTangle.IPair | undefined,
    ): string =>
      p === undefined
        ? "none"
        : `${p.a} in ${p.b} ${p.depth} m at ${p.seconds} s`;
    const differs: number = got.pairs.findIndex(
      (p: IAutoMovieMotionHumanAuditTangle.IPair, i: number): boolean =>
        text(p) !== text(expected[i]),
    );
    TestValidator.predicate(
      `${label}: the certified scan reads ${got.pairs.length} pairs as the full scan's ${expected.length}, worst ${(got.worst.value * 1000).toFixed(3)} mm at ${got.worst.seconds.toFixed(3)} s${differs < 0 ? "" : `; pair ${differs} reads ${text(got.pairs[differs])} against ${text(expected[differs])}`}`,
      got.pairs.length === expected.length &&
        got.pairs.every(
          (p: IAutoMovieMotionHumanAuditTangle.IPair, i: number): boolean =>
            p.a === expected[i]!.a &&
            p.b === expected[i]!.b &&
            p.depth === expected[i]!.depth &&
            p.seconds === expected[i]!.seconds,
        ) &&
        (expected.length === 0
          ? got.worst.value === 0 && got.worst.where === "none"
          : got.worst.value === expected[0]!.depth &&
            got.worst.seconds === expected[0]!.seconds &&
            got.worst.where === `${expected[0]!.a} in ${expected[0]!.b}`),
    );
    return got;
  };

  // 1. A real film.
  const walked: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "certified",
    [{ subject: "a", body }],
    HumanChain.subject("a")
      .stand({ seconds: 1 })
      .walk({ to: { x: 0, y: 0, z: 2 } })
      .stand({ seconds: 1 }),
  );
  same("stand, walk and stand at 24 Hz", walked, 24);
  same("stand, walk and stand at 60 Hz", walked, 60);

  // The trunk's front surface, and a limb carried so that the middle of its
  // bone lies `inside` metres below it.
  const stance: Bones = motionHumanStance(body);
  const height: number = stance.get("chest")!.worldPosition.y;
  const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
    HumanColliders.cast(
      body,
      new Map(
        [...stance].filter(
          ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
            bone === "chest" || bone === "spine",
        ),
      ),
      { x: -0.05, y: height, z: 1 },
      { x: 0, y: 0, z: -1 },
      2,
    );
  if (hit === undefined) throw new Error("The ray missed the trunk");
  const middle = (
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = stance.get(a)!.worldPosition;
    const q: IAutoMovieVector3 = stance.get(b)!.worldPosition;
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 };
  };
  const into = (
    point: IAutoMovieVector3,
    inside: number,
  ): IAutoMovieVector3 => ({
    x: hit.point.x - hit.normal.x * inside - point.x,
    y: hit.point.y - hit.normal.y * inside - point.y,
    z: hit.point.z - hit.normal.z * inside - point.z,
  });
  const hand = (bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith("right") &&
    /(Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const arm = (bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith("right") &&
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);

  // 2. A forearm held out, then passing in and out.
  const anchor: IAutoMovieVector3 = middle("rightLowerArm", "rightHand");
  const passing: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
    stance,
    2,
    (bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 =>
      arm(bone)
        ? into(anchor, t < 1 ? -0.15 : 0.03 - 0.12 * Math.abs(t - 1.5))
        : { x: 0, y: 0, z: 0 },
  );
  const through: IAutoMovieMotionHumanAuditTangle.IResult = same(
    "a forearm passing through the chest",
    passing,
    24,
  );
  const forearm: IAutoMovieMotionHumanAuditTangle.IPair | undefined =
    through.pairs.find(
      (p: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
        key(p.a, p.b) === key("rightLowerArm", hit.bone),
    );
  TestValidator.predicate(
    `the forearm's pass through ${hit.bone} is found deepest at 1.5 s (${forearm?.seconds})`,
    forearm !== undefined && Math.abs(forearm.seconds - 1.5) <= 1e-9,
  );

  // 3. A hand inside the chest, declared there for part of the film.
  const regions = body.surfaces.regions;
  const region: keyof typeof regions | undefined = (
    Object.keys(regions) as (keyof typeof regions)[]
  ).find(
    (name: keyof typeof regions): boolean => regions[name].bone === hit.bone,
  );
  if (region === undefined)
    throw new Error(`No region of the body lies on ${hit.bone}`);
  const palm: IAutoMovieVector3 = into(
    middle("rightHand", "rightMiddleProximal"),
    0.02,
  );
  const declared: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
    stance,
    1,
    (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      hand(bone) ? palm : { x: 0, y: 0, z: 0 },
    [
      {
        name: "touch",
        start: 0,
        entryTime: 0,
        end: 1,
        plan: {
          duration: 1,
          contacts: [
            {
              part: "rightHand",
              kind: "grip",
              from: 0.25,
              to: 0.75,
              support: { kind: "person", subject: "a", region },
            },
          ],
        },
      },
    ],
  );
  const exempt: Set<string> = new Set(
    [...stance.keys()]
      .filter(hand)
      .map((bone: AutoMovieHumanoidBone): string => key(bone, hit.bone)),
  );
  const touched: IAutoMovieMotionHumanAuditTangle.IResult = same(
    "a hand declared on the chest for half the film",
    declared,
    24,
    (t: number): Set<string> => (t >= 0.25 && t <= 0.75 ? exempt : new Set()),
  );
  TestValidator.predicate(
    "the declared hand is read only outside its window",
    touched.pairs.some((p: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
      exempt.has(key(p.a, p.b)),
    ) &&
      touched.pairs
        .filter((p: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
          exempt.has(key(p.a, p.b)),
        )
        .every(
          (p: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
            p.seconds < 0.25 || p.seconds > 0.75,
        ),
  );
}
