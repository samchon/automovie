import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkStanceCourse } from "../actions/walkStanceCourse";
import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import type { HumanFoot } from "../posture/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";
import { staggerSequential } from "./staggerSequential";
import { staggerNearest } from "./staggerNearest";

/**
 * A caught stagger's close (`staggerRecover`): the other foot closes to
 * stand the body over where it is caught, and the centre of pressure then
 * carries the extrapolated centre of mass to rest over the feet, the
 * divergent component tracked on a minimum-jerk course (Englsberger, Ott and
 * Albu-Schaffer 2015) and the centre of mass following it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the closing step, the settling and its source.
 * @evidence contracts/development/design.md#principled-representation One function over the pendulum the catching steps left, returning the whole recovery.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `staggerRecover`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The closing stance is the entry's width, and the rest the place the body stood over its feet at the entry.
 */
export namespace staggerClose {
  /**
   * Close and settle a caught order, and judge its course through both.
   *
   * @param pendulum The pendulum the catching steps left, advanced through the close.
   * @param bend This recovery's eagerly measured entry trunk-shift vectors per sine of tilt.
   * @param kinematic Whether the course is judged; the pendulum alone when false.
   * @param stepped The foot that stepped last.
   * @param judging The course of the catching steps.
   * @param righting How long the centre of pressure takes to carry the extrapolated centre of mass to rest, seconds.
   * @returns The recovery, or null when its course does not meet the legs' ranges.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The closing foot at the entry's stance width, the middle of the ankles under the caught point as the entry stood over its own; then p = xi - xi_ref' / omega + `TRACKING` (xi - xi_ref) inside the base, xi' = omega (xi - p), x' = omega (xi - x), integrated exactly per held step until both rest within `SETTLED`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The closing step, the settling loop, the courses, the judged course.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A course that misses the ranges is null.
   * @evidence contracts/development/implementation.md#efficient-algorithms The settling in millisecond steps once; the course solved from the last catching landing on.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Continues the catching steps' course. Fixed support prepares ordered edge differences/spans once, and fixed righting/frequency/STEP prepare the same rate and growth/decay coefficients; each millisecond retains its actual reference, pressure projection and state update. Paired knot reads share phase selection before settling and preserve tail formulas afterward.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers retain the original settling arrays, pendulum course readers and their recovery record; each paired result is fresh, and no time-keyed samples or external handles are retained.
   */
  export function of(
    pendulum: StaggerPendulum,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    kinematic: boolean,
    stepped: "left" | "right",
    judging: walkStanceCourse.ICourse | undefined,
    righting: number,
  ): staggerRecover.IRecovery | null {
    const { STEP, STEP_TIME, TRANSFER, SETTLED, TRACKING, KNOTS }: typeof staggerBounds =
      staggerBounds;
    const flat: typeof StaggerPendulum.flat = StaggerPendulum.flat;
    const { body, entry, centre, across, forward, entered, w }: StaggerPendulum = pendulum;
    const feet: StaggerPendulum["feet"] = pendulum.feet;
    const steps: StaggerPendulum["steps"] = pendulum.steps;

    // Caught. The other foot closes to stand the body over where it is
    // caught: at the entry's stance width from the stepping foot, and as far
    // ahead or behind it as puts the middle of the two ankles where the body
    // stood over them at the entry, under the caught point.
    const anchor: "left" | "right" = stepped;
    const closer: "left" | "right" = anchor === "left" ? "right" : "left";
    const middle: (of: Record<"left" | "right", HumanFoot.IPlacement>) => IAutoMovieVector3 = (of: Record<"left" | "right", HumanFoot.IPlacement>): IAutoMovieVector3 =>
      flat(Vector3.scale(Vector3.add(of.left.ankle, of.right.ankle), 0.5));
    const stance: number = Vector3.dot(
      Vector3.subtract(entered[closer].ankle, entered[anchor].ankle),
      across,
    );
    const caughtAt: IAutoMovieVector3 = pendulum.xi();
    const under: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(centre, caughtAt),
      Vector3.subtract(flat(centre), middle(entered)),
    );
    const placed: IAutoMovieVector3 = feet[anchor].ankle;
    const closing: HumanFoot.IPlacement = {
      ankle: {
        ...Vector3.add(
          Vector3.add(placed, Vector3.scale(across, stance)),
          Vector3.scale(
            forward,
            2 * Vector3.dot(Vector3.subtract(under, flat(placed)), forward),
          ),
        ),
        y: entered[closer].ankle.y,
      },
      rotation: entered[closer].rotation,
    };
    pendulum.transfer(anchor, AutoMovieMotionHumanTiming.seconds(TRANSFER));
    const start: number = pendulum.t;
    pendulum.bear(
      [anchor],
      pendulum.bound(
        flat(Vector3.subtract(closing.ankle, feet[closer].ankle)),
        STEP_TIME,
      ),
    );
    steps.push({
      side: closer,
      from: feet[closer],
      to: closing,
      start,
      land: pendulum.t,
    });
    feet[closer] = closing;

    // Then the centre of pressure carries the extrapolated centre of mass
    // over the righting to where the body stood over its feet: the
    // extrapolated centre of mass tracks a minimum-jerk course there from
    // where the catch left it, the centre of pressure placed by the
    // divergent component's tracking law, p = xi - xi_ref' / omega +
    // `TRACKING` (xi - xi_ref) (Englsberger, Ott and Albu-Schaffer 2015,
    // IEEE Trans Robot 31:355), as near that as the base holds it; xi' =
    // omega (xi - p), and the centre of mass follows, x' = omega (xi - x),
    // until both rest there.
    const rest: IAutoMovieVector3 = Vector3.subtract(
      middle(feet),
      middle(entered),
    );
    const begin: IAutoMovieVector3 = pendulum.xi();
    const last: number = pendulum.t;
    const base: IAutoMovieVector3[] = pendulum.bearing(["left", "right"]);
    const nearest: ReturnType<typeof staggerNearest.prepare> = staggerNearest.prepare(base);
    const settle: IAutoMovieVector3[] = [pendulum.s];
    const drifting: IAutoMovieVector3[] = [begin];
    const pressing: IAutoMovieVector3[] = [];
    let x: IAutoMovieVector3 = pendulum.s;
    let e: IAutoMovieVector3 = begin;
    const longest: number = righting + 20 / w;
    const grow: number = Math.exp(w * STEP);
    const halfGrowth: number = grow / 2;
    const decay: number = 1 / grow;
    const rate: number = righting * w;
    const travel: IAutoMovieVector3 = Vector3.subtract(rest, begin);
    for (let i: number = 1; i * STEP <= longest; i++) {
      const reference: minimumJerk.IProfile = minimumJerk(
        ((i - 1) * STEP) / righting,
      );
      const towards: IAutoMovieVector3 = Vector3.lerp(begin, rest, reference.s);
      const p: IAutoMovieVector3 = nearest(
        Vector3.add(
          Vector3.subtract(
            e,
            Vector3.scale(
              travel,
              reference.ds / rate,
            ),
          ),
          Vector3.scale(Vector3.subtract(e, towards), TRACKING),
        ),
      );
      pressing.push(p);
      // The exact step with the centre of pressure held: xi - p grows as
      // e^(omega t), and x - p is half of it plus a part that decays.
      const z: IAutoMovieVector3 = Vector3.subtract(e, p);
      const y: IAutoMovieVector3 = Vector3.subtract(x, p);
      x = Vector3.add(
        p,
        Vector3.add(
          Vector3.scale(z, halfGrowth),
          Vector3.scale(Vector3.subtract(y, Vector3.scale(z, 0.5)), decay),
        ),
      );
      e = Vector3.add(p, Vector3.scale(z, grow));
      settle.push(x);
      drifting.push(e);
      if (
        i * STEP >= righting &&
        Vector3.distance(x, rest) <= SETTLED &&
        Vector3.distance(e, rest) <= SETTLED
      )
        break;
    }
    const settled: number = last + (settle.length - 1) * STEP;
    const swung: staggerRecover.ICourses = pendulum.courses();
    const recovery: staggerRecover.IRecovery = {
      steps,
      caught: caughtAt,
      settled,
      sample: (seconds: number, extrapolated: boolean): staggerRecover.IReading => {
        if (!(seconds >= last)) {
          const sample: staggerRecover.IReading | undefined =
            swung.sample?.(seconds, extrapolated);
          if (sample !== undefined) return sample;
        }
        return {
          course: recovery.course(seconds),
          pressure: recovery.pressure(seconds),
          ...(extrapolated ? { extrapolated: recovery.extrapolated(seconds) } : {}),
        };
      },
      course: (seconds: number): IAutoMovieVector3 => {
        if (seconds >= last) {
          const at: number = Math.min(settle.length - 1, (seconds - last) / STEP);
          const i: number = Math.floor(at);
          return Vector3.lerp(
            settle[i]!,
            settle[Math.min(settle.length - 1, i + 1)]!,
            at - i,
          );
        }
        return swung.course(seconds);
      },
      pressure: (seconds: number): IAutoMovieVector3 => {
        if (seconds >= last)
          return flat(
            Vector3.add(
              centre,
              pressing[
                Math.min(pressing.length - 1, Math.floor((seconds - last) / STEP))
              ]!,
            ),
          );
        return swung.pressure(seconds);
      },
      extrapolated: (seconds: number): IAutoMovieVector3 => {
        if (seconds >= last) {
          const at: number = Math.min(
            drifting.length - 1,
            (seconds - last) / STEP,
          );
          const i: number = Math.floor(at);
          return flat(
            Vector3.add(
              centre,
              Vector3.lerp(
                drifting[i]!,
                drifting[Math.min(drifting.length - 1, i + 1)]!,
                at - i,
              ),
            ),
          );
        }
        return swung.extrapolated(seconds);
      },
    };

    if (!kinematic) return recovery;
    // The order's course, judged: the course of its catching steps
    // continued, from their last landing, over the closing step and the
    // settling, by the course's own receding horizon.
    const landed: number = steps.at(-2)!.land;
    const course: walkStanceCourse.ICourse = staggerSequential.solve(
      body,
      staggerKnots.of(body, entry, bend, { ...recovery, caught: landed }, settled),
      judging,
      judging === undefined
        ? 0
        : Math.min(judging.knots.length, Math.floor(landed * KNOTS + 1e-9)),
    );
    return course.unmet > walkStanceCourse.MET
      ? null
      : { ...recovery, stances: course };
  }
}
