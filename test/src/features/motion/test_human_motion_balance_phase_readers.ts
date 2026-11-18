import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanLean, AutoMovieMotionHumanTrunk, HumanPhysics, stand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionComposeTrunk } from "../internal/motionComposeTrunk";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

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
export function test_human_motion_balance_phase_readers(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bare: IAutoMovieMotionHumanBody = motionComposeTrunk.withoutMass(body);
  const standing: IAutoMovieMotionHumanPosture = stand.posture(body, motionComposeTrunk.ORIGIN, 0);
  const duration: number = motionComposeTrunk.CLOCK.duration;
  const opening: number = duration / 4;
  const edge: number = duration / 8;
  const pulse: IAutoMovieMotionHumanBalance = {
    by: "hips", from: { event: "start", offset: opening },
    to: { event: "end", offset: -opening }, ramp: { in: edge, out: edge },
  };
  const bow = (person: IAutoMovieMotionHumanBody, balance?: IAutoMovieMotionHumanBalance, entry: IAutoMovieMotionHumanPosture = standing): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanLean.bow({ body: person, standing: entry, peak: 45, balance, from: 0, to: duration, weight: () => 1 });
  const crouch = (person: IAutoMovieMotionHumanBody, balance?: IAutoMovieMotionHumanBalance): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanTrunk.crouch({
      body: person, standing, balance, clock: motionComposeTrunk.CLOCK,
      rise: motionComposeTrunk.RISE, fall: motionComposeTrunk.FALL,
      depth: body.measure.hipHeight / 4, pitch: 45,
    });
  for (const build of [bow, crouch]) {
    const omitted: IAutoMovieMotionHumanPrimitive = build(bare);
    const zero: IAutoMovieMotionHumanPrimitive = build(bare, { ...pulse, weight: 0 });
    const active: IAutoMovieMotionHumanPrimitive = build(bare, pulse);
    const peak: number = duration / 2;
    TestValidator.equals("zero-weight write preserves the uncorrected pose", zero.write(standing, peak), omitted.write(standing, peak));
    for (const t of [duration, opening, 0, duration - opening])
      TestValidator.equals("inactive write never needs mass", active.write(standing, t), omitted.write(standing, t));
  }

  // Start one ankle-to-ball length ahead of the same planted feet, so
  // the imposed forward pitch actually crosses the standing support.
  const forward: number = Math.abs(body.rest.get("leftToes")!.z - body.rest.get("leftFoot")!.z);
  const pitched: IAutoMovieMotionHumanPosture = { ...standing, root: { ...standing.root, z: standing.root.z + forward } };
  const base: number = bow(body, undefined, pitched).write(pitched, opening).root.z;
  const full: IAutoMovieMotionHumanPrimitive = bow(body, pulse, pitched);
  const displacement: number = full.write(pitched, duration / 2).root.z - base;
  TestValidator.predicate("the forward bow actually needs a hip displacement", Math.abs(displacement) > Number.EPSILON);
  TestValidator.predicate("half weight moves the hips half the distance", nclose(
    bow(body, { ...pulse, weight: 0.5 }, pitched).write(pitched, duration / 2).root.z - base, displacement / 2,
  ));
  TestValidator.predicate("the midpoint of the rising quintic has half strength", nclose(
    full.write(pitched, opening + edge / 2).root.z - base, displacement / 2,
  ));
  const window: HumanPhysics.Window = HumanPhysics.prepare({ balance: pulse }, {}, 0, { duration, events: [] });
  const cut: HumanPhysics.ISpan = { name: "bow", start: 0, entryTime: 0, end: opening, plan: { duration, contacts: [], balanceWindow: window } };
  TestValidator.predicate("the cut contains only the zero-weight start", !HumanPhysics.judged(cut) && !HumanPhysics.judged(cut, opening));
  const from: number = opening + edge / 2;
  const phase: HumanPhysics.Window = HumanPhysics.during(window, from, duration / 2);
  const quiet: HumanPhysics.ISpan = { ...cut, end: duration, law: { physical: true },
    plan: { ...cut.plan, physicalWindow: null, balanceWindow: phase } };
  TestValidator.predicate("a clipped ramp retains its authored midpoint", nclose(HumanPhysics.weightAt(phase, from), 0.5));
  TestValidator.predicate("a stationary outcome judges only the independent opt-in phase",
    !HumanPhysics.judged(quiet, opening) && HumanPhysics.judged(quiet, from) && !HumanPhysics.judged(quiet, duration));
  TestValidator.equals("only the eligible support phase contributes audit samples",
    HumanPhysics.intervals(quiet), [{ from, to: duration / 2 }]);
}
