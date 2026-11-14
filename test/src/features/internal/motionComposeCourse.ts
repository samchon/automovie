import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanCourse,
  HumanBalance,
  type IHumanBody,
  type IHumanPosture,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The hips' course that keeps the extrapolated centre of mass on a target,
 * on real bodies.
 *
 * The course's contract is the first-order law `c' = w (T - c)` for the
 * whole-body centre of mass `c` along the heading, with
 * `w = sqrt(g / (1.34 hip heights))` (Hof, Gazendam and Sinke 2005). Its
 * closed forms are the expectations: a target held on the centre keeps it
 * there; a target stepped away by `d` is followed as `d (1 - exp(-w t))`,
 * always behind it; a target leaving at a speed `v` is followed as
 * `v (t - (1 - exp(-w t)) / w)`. The centre is read back on the posture the
 * builder gives at the course's place, through `HumanBalance.support`, so the
 * test holds for a builder whose centre does not follow the hips one to one
 * (hips carried over planted feet).
 *
 * Scenarios, on one body of the sweep (the `test_human_motion_compose_course_*`
 * specs run one body each):
 * 1. A whole body carried along +Z with the target held on its centre stays
 *    where it started.
 * 2. The same body with the target stepped 0.3 m ahead follows the closed
 *    form within 1 mm at five instants, never passes the target and never
 *    comes back.
 * 3. A body heading +X whose target leaves at 0.25 m/s follows the ramp's
 *    closed form within 1 mm.
 * 4. Hips carried over planted feet toward a target 0.06 m ahead put the
 *    centre on the closed form within 1 mm, with the hips moved farther than
 *    the centre.
 * 5. A second before the span reads the span's first place and a second
 *    after it reads its last.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reads the owner's results on a real body through the public functions and the resolver, as the scenarios state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body's cells, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its numbers; no cell is sampled away for time.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export function motionComposeCourse(name: motionHumanBody.Name): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  const INSTANTS: readonly number[] = [0.1, 0.25, 0.5, 0.75, 1];

  {
    const body: IHumanBody = motionHumanBody(name);
    const omega: number = Math.sqrt(9.81 / (1.34 * body.measure.hipHeight));
    const centre = (posture: IHumanPosture, yaw: 0 | 90): number => {
      const c: IAutoMovieVector3 = HumanBalance.support(body, posture).centre;
      return yaw === 90 ? c.x : c.z;
    };
    const carried =
      (yaw: 0 | 90) =>
      (_seconds: number, along: number): IHumanPosture =>
        stand.posture(
          body,
          yaw === 90 ? { x: along, y: 0, z: 0.4 } : { x: -0.3, y: 0, z: along },
          yaw,
        );

    // 1. A held target.
    const rest: number = centre(carried(0)(0, 0.5), 0);
    const held: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
      body,
      yaw: 0,
      posture: carried(0),
      target: (): number => rest,
      from: 0,
      to: 0.25,
      start: 0.5,
    });
    all.check(
      `${name}: a target held on the centre keeps the hips, at ${mm(held(0.125))} and ${mm(held(0.25))} mm from 500 mm`,
      Math.abs(held(0.125) - 0.5) <= 1e-4 && Math.abs(held(0.25) - 0.5) <= 1e-4,
    );

    // 2. A stepped target.
    const stepped: (seconds: number) => number =
      AutoMovieMotionHumanCourse.solve({
        body,
        yaw: 0,
        posture: carried(0),
        target: (): number => rest + 0.3,
        from: 2,
        to: 3,
        start: 0.5,
      });
    let last: number = rest;
    for (const t of INSTANTS) {
      const got: number = centre(carried(0)(2 + t, stepped(2 + t)), 0);
      const expected: number = rest + 0.3 * (1 - Math.exp(-omega * t));
      all.check(
        `${name}: ${t} s after a step of 300 mm the centre has gone ${mm(got - rest)} mm, the law's ${mm(expected - rest)} mm`,
        Math.abs(got - expected) <= 0.001 && got < rest + 0.3 && got > last,
      );
      last = got;
    }

    // 5. Outside the span.
    all.check(
      `${name}: a course outside its span reads its ends`,
      stepped(1) === stepped(2) &&
        stepped(4) === stepped(3) &&
        Math.abs(stepped(2) - 0.5) <= 1e-12,
    );

    // 3. A moving target, heading +X.
    const side: number = centre(carried(90)(0, -0.2), 90);
    const ramp: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
      body,
      yaw: 90,
      posture: carried(90),
      target: (seconds: number): number => side + 0.25 * seconds,
      from: 0,
      to: 1,
      start: -0.2,
    });
    for (const t of INSTANTS) {
      const got: number = centre(carried(90)(t, ramp(t)), 90);
      const expected: number =
        side + 0.25 * (t - (1 - Math.exp(-omega * t)) / omega);
      all.check(
        `${name}: ${t} s after a target leaves along +X at 250 mm/s the centre has gone ${mm(got - side)} mm, the law's ${mm(expected - side)} mm`,
        Math.abs(got - expected) <= 0.001,
      );
    }

    // 4. Hips carried over planted feet.
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const planted = (_seconds: number, along: number): IHumanPosture =>
      resolveHumanPosture.lower(body, {
        ...standing,
        root: { x: 0, y: 0, z: along },
      });
    const still: number = centre(planted(0, 0), 0);
    const over: (seconds: number) => number = AutoMovieMotionHumanCourse.solve({
      body,
      yaw: 0,
      posture: planted,
      target: (): number => still + 0.06,
      from: 0,
      to: 1,
      start: 0,
    });
    for (const t of INSTANTS) {
      const got: number = centre(planted(t, over(t)), 0);
      const expected: number = still + 0.06 * (1 - Math.exp(-omega * t));
      all.check(
        `${name}: ${t} s into a carry over planted feet the centre has gone ${mm(got - still)} mm, the law's ${mm(expected - still)} mm, the hips ${mm(over(t))} mm`,
        Math.abs(got - expected) <= 0.001 && over(t) > got - still,
      );
    }
  }
  all.assert(`the course follows its law on every body (${name})`);
}
