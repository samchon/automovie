import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLean,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSupport,
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanChain,
  HumanPerformance,
  HumanPhysics,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionComposeTrunk } from "./motionComposeTrunk";
import { motionHumanBody } from "./motionHumanBody";
import { nclose } from "./nclose";
import { vclose } from "./vclose";

/**
 * Explicit balance is scoped to its own clock even on repeat or out-of-order reads.
 *
 * Scenarios:
 * 1. A real bow and crouch on a body whose mass is unreadable admit omission,
 *    zero strength and every inactive sample of a requested pulse.
 * 2. Equal standing pitch isolates hip translation. Half strength and the
 *    midpoint of the minimum-jerk blend each give half the full correction.
 * 3. A cut exposing only the zero-weight opening instant is never judged.
 */
export function motionBalancePhaseReaders(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bare: IAutoMovieMotionHumanBody = motionComposeTrunk.withoutMass(body);
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(
      body,
      motionComposeTrunk.ORIGIN,
      0,
    );
  const duration: number = motionComposeTrunk.CLOCK.duration;
  const opening: number = duration / 4;
  const edge: number = duration / 8;
  const pulse: IAutoMovieMotionHumanBalance = {
    by: "hips",
    from: { event: "start", offset: opening },
    to: { event: "end", offset: -opening },
    ramp: { in: edge, out: edge },
  };
  const bow = (
    person: IAutoMovieMotionHumanBody,
    balance?: IAutoMovieMotionHumanBalance,
    entry: IAutoMovieMotionHumanPosture = standing,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanLean.bow({
      body: person,
      standing: entry,
      peak: 45,
      balance,
      from: 0,
      to: duration,
      weight: () => 1,
    });
  const crouch = (
    person: IAutoMovieMotionHumanBody,
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanTrunk.crouch({
      body: person,
      standing,
      balance,
      clock: motionComposeTrunk.CLOCK,
      rise: motionComposeTrunk.RISE,
      fall: motionComposeTrunk.FALL,
      depth: body.measure.hipHeight / 4,
      pitch: 45,
    });
  for (const build of [bow, crouch]) {
    const omitted: IAutoMovieMotionHumanPrimitive = build(bare);
    const zero: IAutoMovieMotionHumanPrimitive = build(bare, {
      ...pulse,
      weight: 0,
    });
    const active: IAutoMovieMotionHumanPrimitive = build(bare, pulse);
    const peak: number = duration / 2;
    TestValidator.equals(
      "zero-weight write preserves the uncorrected pose",
      zero.write(standing, peak),
      omitted.write(standing, peak),
    );
    for (const t of [duration, opening, 0, duration - opening])
      TestValidator.equals(
        "inactive write never needs mass",
        active.write(standing, t),
        omitted.write(standing, t),
      );
  }

  // Start one ankle-to-ball length ahead of the same planted feet, so
  // the imposed forward pitch actually crosses the standing support.
  const forward: number = Math.abs(
    body.rest.get("leftToes")!.z - body.rest.get("leftFoot")!.z,
  );
  const pitched: IAutoMovieMotionHumanPosture = {
    ...standing,
    root: { ...standing.root, z: standing.root.z + forward },
  };
  const base: number = bow(body, undefined, pitched).write(pitched, opening)
    .root.z;
  const full: IAutoMovieMotionHumanPrimitive = bow(body, pulse, pitched);
  const displacement: number = full.write(pitched, duration / 2).root.z - base;
  TestValidator.predicate(
    "the forward bow actually needs a hip displacement",
    Math.abs(displacement) > Number.EPSILON,
  );
  TestValidator.predicate(
    "half weight moves the hips half the distance",
    nclose(
      bow(body, { ...pulse, weight: 0.5 }, pitched).write(pitched, duration / 2)
        .root.z - base,
      displacement / 2,
    ),
  );
  TestValidator.predicate(
    "the midpoint of the rising quintic has half strength",
    nclose(
      full.write(pitched, opening + edge / 2).root.z - base,
      displacement / 2,
    ),
  );
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    { balance: pulse },
    {},
    0,
    { duration, events: [] },
  );
  const cut: HumanPhysics.ISpan = {
    name: "bow",
    start: 0,
    entryTime: 0,
    end: opening,
    plan: { duration, contacts: [], balanceWindow: window },
  };
  TestValidator.predicate(
    "the cut contains only the zero-weight start",
    !HumanPhysics.judged(cut) && !HumanPhysics.judged(cut, opening),
  );
  const from: number = opening + edge / 2;
  const phase: HumanPhysics.Window = HumanPhysics.during(
    window,
    from,
    duration / 2,
  );
  const quiet: HumanPhysics.ISpan = {
    ...cut,
    end: duration,
    law: { physical: true },
    plan: { ...cut.plan, physicalWindow: null, balanceWindow: phase },
  };
  TestValidator.predicate(
    "a clipped ramp retains its authored midpoint",
    nclose(HumanPhysics.weightAt(phase, from), 0.5),
  );
  TestValidator.predicate(
    "a stationary outcome judges only the independent opt-in phase",
    !HumanPhysics.judged(quiet, opening) &&
      HumanPhysics.judged(quiet, from) &&
      !HumanPhysics.judged(quiet, duration),
  );
  TestValidator.equals(
    "only the eligible support phase contributes audit samples",
    HumanPhysics.intervals(quiet),
    [{ from, to: duration / 2 }],
  );
  crawlTransfer(body);
  registered(body);
  supportFoot(body);
}

/** The fitted support course exposes its actual stance event to an opted-in pelvis correction. */
function supportFoot(body: IAutoMovieMotionHumanBody): void {
  const plan = (
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanSegment =>
    new HumanPerformance({
      seed: "one-support",
      performers: [
        {
          subject: "a",
          body,
          at: motionComposeTrunk.ORIGIN,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").support({
        balance,
        stances: [
          {
            contacts: [
              { part: "leftFoot", kind: "bear" },
              { part: "rightFoot", kind: "bear" },
            ],
            event: "planted",
            seconds: 1,
          },
          {
            contacts: [{ part: "leftFoot", kind: "bear" }],
            event: "single",
            seconds: 1,
          },
          {
            contacts: [{ part: "leftFoot", kind: "bear" }],
            event: "held",
            seconds: 1,
          },
        ],
      }).node,
    }).segments("a")[0]!;
  const on: IAutoMovieMotionHumanSegment = plan({
    by: "hips",
    from: { event: "single" },
    to: { event: "end" },
  });
  const off: IAutoMovieMotionHumanSegment = plan();
  TestValidator.equals(
    "the support fit preserves its original course before the chosen stance",
    on.plan.posture(0),
    off.plan.posture(0),
  );
  TestValidator.predicate(
    "the selected support stance is present at the actual event",
    HumanPhysics.judged(on, on.end),
  );
  const single: number = on.plan.events.find(
    (event) => event.name === "single",
  )!.share;
  const t: number = ((single + 1) * on.plan.duration) / 2;
  const corrected: IAutoMovieMotionHumanPosture = on.plan.posture(t);
  const before: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(
    body,
    off.plan.posture(t),
    undefined,
    undefined,
    ["left"],
  );
  const after: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(
    body,
    corrected,
    undefined,
    undefined,
    ["left"],
  );
  const margin: number = resolveAutoMovieCenterOfMass.margin(
    before.centre,
    before.points,
  );
  const result: number = resolveAutoMovieCenterOfMass.margin(
    after.centre,
    after.points,
  );
  TestValidator.predicate(
    "the corrected mass reaches the declared supporting sole within the stance contact tolerance",
    result >= -AutoMovieMotionHumanSupport.support.MISS / 1000 &&
      (margin >= 0 || result > margin),
  );
}

/** A registered action which omits a requested correction reports the unsupported part at its normal placement boundary. */
function registered(body: IAutoMovieMotionHumanBody): void {
  const perform = (balance: IAutoMovieMotionHumanBalance): void => {
    new HumanPerformance({
      seed: "registered-balance",
      laws: [
        {
          ...AutoMovieMotionHumanStance.stand,
          name: "standingBalanceWitness",
          plan: (context) =>
            AutoMovieMotionHumanStance.crouch.plan({ ...context, params: {} }),
        },
      ],
      performers: [
        {
          subject: "a",
          body,
          at: motionComposeTrunk.ORIGIN,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered(
        "standingBalanceWitness",
        { seconds: 1, balance },
      ).node,
    });
  };
  perform({ ...motionComposeTrunk.BALANCE, weight: 0 });
  let axis: string | undefined;
  try {
    perform(motionComposeTrunk.BALANCE);
  } catch (error: unknown) {
    if (!(error instanceof HumanRefusal)) throw error;
    axis = error.axis;
  }
  TestValidator.equals(
    "an unsupported registered correction names its own input",
    axis,
    "balance.by",
  );
}

/** The feet, knees and palms keep their authored landing times while a hip correction changes the descent. */
function crawlTransfer(body: IAutoMovieMotionHumanBody): void {
  const perform = (
    person: IAutoMovieMotionHumanBody,
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanSegment =>
    new HumanPerformance({
      seed: "crawl-balance-contacts",
      performers: [
        {
          subject: "a",
          body: person,
          at: motionComposeTrunk.ORIGIN,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").crawl({
        kind: "knees",
        count: 1,
        balance,
      }).node,
    }).segments("a")[0]!;
  const off: IAutoMovieMotionHumanSegment = perform(
    motionComposeTrunk.withoutMass(body),
    { ...motionComposeTrunk.BALANCE, weight: 0 },
  );
  let reads: number = 0;
  const measured: IAutoMovieMotionHumanBody = {
    ...body,
    get massModel() {
      ++reads;
      return body.massModel;
    },
  };
  const on: IAutoMovieMotionHumanSegment = perform(
    measured,
    motionComposeTrunk.BALANCE,
  );
  const down: number =
    on.plan.events.find((event) => event.name === "down")!.share *
    on.plan.duration;
  const knees: number =
    on.plan.contacts.find((contact) => contact.part === "leftLowerLeg")!.from *
    on.plan.duration;
  const hands: number =
    on.plan.contacts.find((contact) => contact.part === "leftHand")!.from *
    on.plan.duration;
  TestValidator.equals(
    "hip balance preserves all prepared contact events",
    on.plan.events,
    off.plan.events,
  );
  const initial: number = reads;
  let sittingReads: number = 0;
  for (const t of [
    knees / 2,
    knees,
    (knees + hands) / 2,
    hands,
    (hands + down) / 2,
  ]) {
    const before: IAutoMovieMotionHumanPosture = off.plan.posture(t);
    const after: IAutoMovieMotionHumanPosture = on.plan.posture(t);
    if (t === knees / 2) sittingReads = reads;
    for (const side of ["leftLeg", "rightLeg"] as const)
      TestValidator.predicate(
        "the rolling foot keeps its original world anchor",
        vclose(before.limbs[side]!.point, after.limbs[side]!.point),
      );
  }
  TestValidator.predicate(
    "the feet-supported and knee-supported phases each observe real mass",
    sittingReads > initial && reads > sittingReads,
  );
  const observed: number = reads;
  const after: number = (down + on.plan.duration) / 2;
  TestValidator.predicate(
    "no hip balancing runs after the transfer",
    !HumanPhysics.judged(on, on.start + after),
  );
  TestValidator.equals(
    "the following crawl stays on its original footsteps",
    on.plan.posture(after),
    off.plan.posture(after),
  );
  TestValidator.equals(
    "the following crawl never reads mass for hip balance",
    reads,
    observed,
  );
}
