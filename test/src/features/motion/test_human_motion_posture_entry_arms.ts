import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanChain,
  HumanEmblem,
  HumanHabit,
  HumanPerformance,
  HumanStance,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  seated,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * The acts another act starts from leave the arms clear of the body (#3553,
 * #3556): an arm planner reads its entry arm against the body and refuses an
 * entry already inside it, and must not hide it, so the acts upstream end
 * clear, and the acts after them are performed.
 *
 * The reading is the tangle audit's pose reading
 * (`AutoMovieMotionHumanAuditTangle.pose`) with nothing skipped and nothing
 * pressed, a declared rest excused nowhere: each pair one of whose segments is
 * an upper arm, a forearm, a hand or a finger, at its depth beyond the rest
 * pose's own. Bound: half the audit's skin (`BUILT / 2`), the depth beyond
 * rest the arm planner lets a probe lie (`HumanArmTrajectoryTerms.DEPTH`), so
 * an act that passes here is an entry the planner accepts.
 *
 * Scenarios, on the four extreme bodies (`motionHumanBody.EXTREMES`), each
 * with its cell named:
 * 1. Sitting down on the law sweep's chair (the `sit` stage, its seat at the
 *    body's popliteal height, no armrests): every instant from `seated` to
 *    the act's end, read at the signature's rate (`M.HELD` a second), and its
 *    last instant, the palms on the thighs.
 * 2. Shifting on that seat (the `shift` stage, sitting down then sliding
 *    0.12 m): the shift's every instant at the same rate, and its last.
 * 3. Sitting down on a chair with armrests, the office scene's (#3556), laid
 *    out as `test_human_motion_base_armrests` lays its chair out (each
 *    armrest half a chest breadth plus 0.08 m aside and 0.22 m above the
 *    seat): the sit's last instant, the palms on the armrests; then the
 *    watch check after it is performed, not refused, on that chair and on
 *    the chair without armrests.
 * 4. Hands on the hips (`handsOnHips`, 1 s): its last instant, the entry the
 *    victory lap's thumbs-up starts from (#3553).
 * 5. A low five after hands on the hips, both partners alike, 0.7 m apart as
 *    the law sweep stages a high five: the five's last instant, after the
 *    hand has gone back to the hip, for the right hand and, mirrored, the
 *    left; and the right hand with a meeting window from film second 4, well
 *    past the natural meeting about 2 s in, so the hand waits at the hip
 *    before it leaves (the victory lap's five is held so). Its acting hand's
 *    joint centre ends within the rows' return bound (10 mm,
 *    `motionHumanLawSolo`'s expectation 3) of where it was when the five
 *    began, the hand back on the hip it left.
 * 6. The thumbs-up after the right five is performed, not refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real sit, shift, rest, high five, watch check and thumbs-up through the public chain on real bodies and reads the displayed bones with the shipped tangle reading; an arm left inside the body at an act's end, or the next act refused for it, fails with its cell, its pair, its depth and its second.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the arm planner's own allowance of depth beyond rest, half the audit's skin; the return bound is the rows' own; the armrests are the armrest spec's chair; nothing is read from the acts under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Seated on the thighs and on armrests, standing with the hands on the hips, a held seated span and an end, both hands, a five with and without a wait, the hip rest alone as the control that tells the five's end from its entry, and the two consumers the scenes refused.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because each film is of fitted poses on four bodies; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the reading, the bound with its owner and the six scenarios with their numbers.
 */
export function test_human_motion_posture_entry_arms(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const bound: number = AutoMovieMotionHumanAuditTangle.BUILT / 2;
  const ARM: RegExp =
    /^(left|right)(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  type Span = IAutoMovieMotionHumanAuditMotion.ISpan;

  // A performance with the rows the scenes use registered.
  const perform = (
    people: readonly { subject: string; body: IHumanBody; z: number }[],
    composition: HumanChain | HumanChain[],
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.film(
      new HumanPerformance({
        seed: "entry-arms",
        laws: [
          HumanStance.handsOnHips,
          HumanEmblem.thumbsUp,
          HumanHabit.checkWatch,
        ],
        performers: people.map((p) => ({
          subject: p.subject,
          body: p.body,
          at: { x: 0, y: 0, z: p.z },
          yaw: p.z === 0 ? 0 : 180,
          proficiency: { level: "trained" as const },
        })),
        props: [],
        composition: Array.isArray(composition)
          ? {
              kind: "parallel",
              parts: composition.map((c: HumanChain) => c.node),
            }
          : composition.node,
      }),
    );
  const span = (
    film: IAutoMovieMotionHumanAuditMotion,
    name: string,
  ): Span | undefined =>
    film.segments("a").find((s: Span): boolean => s.name === name);

  // The deepest pair with an arm segment in it, at one instant.
  const deepest = (
    body: IHumanBody,
    bones: Bones,
  ): AutoMovieMotionHumanAuditTangle.IPair | undefined =>
    AutoMovieMotionHumanAuditTangle.pose(body, bones)
      .filter(
        (p: AutoMovieMotionHumanAuditTangle.IPair): boolean =>
          ARM.test(p.a) || ARM.test(p.b),
      )
      .sort(
        (
          x: AutoMovieMotionHumanAuditTangle.IPair,
          y: AutoMovieMotionHumanAuditTangle.IPair,
        ): number => y.depth - x.depth,
      )[0];
  const clear = (
    cell: string,
    body: IHumanBody,
    bones: (seconds: number) => Bones,
    seconds: readonly number[],
  ): void => {
    let worst: { depth: number; at: number; what: string } = {
      depth: 0,
      at: seconds[0] ?? 0,
      what: "none",
    };
    for (const t of seconds) {
      const pair: AutoMovieMotionHumanAuditTangle.IPair | undefined = deepest(
        body,
        bones(t),
      );
      if (pair !== undefined && pair.depth > worst.depth)
        worst = { depth: pair.depth, at: t, what: `${pair.a} in ${pair.b}` };
    }
    complaints.check(
      `${cell}: ${worst.what} ${(worst.depth * 1000).toFixed(1)} mm beyond rest at ${worst.at.toFixed(3)} s, at most ${(bound * 1000).toFixed(1)} mm (half the audit's skin, the arm planner's allowance)`,
      worst.depth <= bound,
    );
  };
  // A film, or its refusal as a complaint.
  const attempt = (
    cell: string,
    make: () => motionHumanLaw.IFilm,
  ): motionHumanLaw.IFilm | undefined => {
    try {
      return make();
    } catch (error) {
      complaints.check(`${cell}: refused, ${(error as Error).message}`, false);
      return undefined;
    }
  };

  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);

    // 1. Sitting down: the held seated span and its end.
    const sit: M.IStaged = M.stage("sit", "default", name);
    const sat: number | undefined = M.event(sit, "seated");
    complaints.check(
      `sit ${name}: the act states its seated instant`,
      sat !== undefined,
    );
    if (sat !== undefined)
      clear(
        `sit ${name} seated span`,
        sit.body,
        (t: number): Bones => M.bones(sit, t),
        M.times(sat, sit.film.duration, M.HELD),
      );
    clear(`sit ${name} end`, sit.body, (t: number): Bones => M.bones(sit, t), [
      sit.film.duration,
    ]);

    // 2. Shifting on the seat: the shift's span and its end.
    const shift: M.IStaged = M.stage("shift", "default", name);
    const shifted: Span | undefined = span(shift.film, "shift");
    complaints.check(
      `shift ${name}: the shift is performed`,
      shifted !== undefined,
    );
    if (shifted !== undefined) {
      const end: number = shifted.start + shifted.plan.duration;
      clear(
        `shift ${name} span`,
        shift.body,
        (t: number): Bones => M.bones(shift, t),
        M.times(shifted.start, end, M.HELD),
      );
      clear(
        `shift ${name} end`,
        shift.body,
        (t: number): Bones => M.bones(shift, t),
        [end],
      );
    }

    // 3. A chair with armrests, then the watch check, and the check on the
    // chair without them.
    const height: number = seated.popliteal(body);
    const aside: number = body.measure.chestBreadth / 2 + 0.08;
    const bare: seated.ISeat = {
      at: { x: 0, y: height, z: -0.1 },
      yaw: 0,
      depth: 0.45,
    };
    const armrests: Record<"left" | "right", IAutoMovieVector3> = {
      left: { x: aside, y: height + 0.22, z: -0.3 },
      right: { x: -aside, y: height + 0.22, z: -0.3 },
    };
    for (const [label, seat] of [
      ["armrests", { ...bare, armrests }],
      ["no armrests", bare],
    ] as const) {
      const cell: string = `sit on a chair with ${label} ${name}`;
      const film: motionHumanLaw.IFilm | undefined = attempt(cell, () =>
        perform(
          [{ subject: "a", body, z: 0 }],
          HumanChain.subject("a")
            .sit({ seat, seconds: 0.5 })
            .registered("checkWatch", {}),
        ),
      );
      if (film === undefined) continue;
      const down: Span | undefined = span(film, "sit");
      complaints.check(`${cell}: the sit is performed`, down !== undefined);
      if (down !== undefined)
        clear(`${cell} end`, body, (t: number): Bones => film.bones("a", t), [
          down.start + down.plan.duration,
        ]);
      complaints.check(
        `${cell}: the watch check after it is performed`,
        span(film, "checkWatch") !== undefined,
      );
    }

    // 4. Hands on the hips alone.
    const hips = (subject: string): HumanChain =>
      HumanChain.subject(subject).registered("handsOnHips", { seconds: 1 });
    const alone: motionHumanLaw.IFilm | undefined = attempt(
      `handsOnHips ${name}`,
      () => perform([{ subject: "a", body, z: 0 }], hips("a")),
    );
    if (alone !== undefined)
      clear(
        `handsOnHips ${name} end`,
        body,
        (t: number): Bones => alone.bones("a", t),
        [alone.duration],
      );

    // 5 and 6. A low five after hands on the hips, then a thumbs-up.
    const partner: IHumanBody = motionHumanBody("m-average");
    for (const variant of [
      { side: "right", label: "right" },
      { side: "left", label: "left" },
      { side: "right", label: "right, meeting from 4 s", from: 4 },
    ] as const) {
      const cell: string = `lowFive ${name} ${variant.label}`;
      const five = (subject: string, other: string): HumanChain => {
        const fived: HumanChain = hips(subject).act("highFive", {
          partner: other,
          kind: "low",
          side: variant.side,
          ...("from" in variant ? { window: { from: variant.from } } : {}),
        });
        return subject === "a" && variant.label === "right"
          ? fived.registered("thumbsUp", {})
          : fived;
      };
      const film: motionHumanLaw.IFilm | undefined = attempt(cell, () =>
        perform(
          [
            { subject: "a", body, z: 0 },
            { subject: "b", body: partner, z: 0.7 },
          ],
          [five("a", "b"), five("b", "a")],
        ),
      );
      if (film === undefined) continue;
      const fived: Span | undefined = span(film, "highFive");
      complaints.check(`${cell}: the five is performed`, fived !== undefined);
      if (fived === undefined) continue;
      const end: number = fived.start + fived.plan.duration;
      clear(cell, body, (t: number): Bones => film.bones("a", t), [end]);
      const hand: AutoMovieHumanoidBone = `${variant.side}Hand`;
      const before: IAutoMovieVector3 = film
        .bones("a", fived.start)
        .get(hand)!.worldPosition;
      const after: IAutoMovieVector3 = film
        .bones("a", end)
        .get(hand)!.worldPosition;
      const off: number = Math.hypot(
        after.x - before.x,
        after.y - before.y,
        after.z - before.z,
      );
      complaints.check(
        `${cell}: the hand ends ${(off * 1000).toFixed(1)} mm from where the five began, at most 10 mm (the rows' return bound)`,
        off <= 0.01,
      );
      if (variant.label === "right")
        complaints.check(
          `${cell}: the thumbs-up after it is performed`,
          span(film, "thumbsUp") !== undefined,
        );
    }
  }
  complaints.assert(
    "the acts another act starts from leave the arms clear of the body",
  );
}
