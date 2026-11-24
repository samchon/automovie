import {
  AutoMovieMotionBound,
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeNearest,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryStray } from "./HumanArmTrajectoryStray";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/**
 * The arm's probes swept between two read waypoints of its trajectory
 * (`HumanArmTrajectoryModel`): each probe's course from one to the next is read
 * through its place at every frame between, each frame step its chord, against
 * every shape near it (TrajOpt's continuous-time check, Schulman et al. 2013,
 * section V, its long steps subdivided into several casts as trajopt's
 * `longest_valid_segment_length` does). The axis spheres sweep as capsules
 * (`of`); the audit's collider probes sweep part by part, certified first by
 * the parts' cast hulls (`links`). Every frame step is its own reading, one
 * contact as each of trajopt's subdivided casts is, and one reading serves the
 * merit and the convex model of the same iterate.
 */
export namespace HumanArmTrajectorySweep {
  /** One probe's sweep against one shape over one frame step. */
  export interface ISwept {
    /**
     * The probe, by index among the placed arm's probes: an axis sphere below
     * `HumanArmGeometry.SURFACE`, an audit collider probe from it.
     */
    probe: number;

    /** The shape, by index in the frame of the interval's first waypoint. */
    shape: number;

    /** The step's first waypoint. */
    from: number;

    /**
     * The probe's place there, carried into the shape's frame at the interval's
     * first waypoint (`HumanArmTrajectoryHalfStep.carry`), world metres.
     */
    start: IAutoMovieVector3;

    /**
     * The turn that carries a direction from that waypoint's frame of the shape
     * to the interval's first.
     */
    first: IAutoMovieQuaternion;

    /** The step's last waypoint. */
    other: number;

    /** The probe's place there, carried the same way, world metres. */
    to: IAutoMovieVector3;

    /**
     * The turn that carries a direction from that waypoint's frame the same
     * way.
     */
    turn: IAutoMovieQuaternion;

    /**
     * The step's signed distance to the shape less the probe's radius, metres
     * (negative inside); a collider probe's less, too, the played course's
     * stray from the step's chord toward the shape (`links`).
     */
    clear: number;

    /**
     * The least distance the sphere may keep to the shape over the step,
     * metres: the lesser of its allowances at the step's two waypoints.
     */
    lower: number;

    /**
     * The shape's reading against the step's chord (`physicalShapeNearest`), in
     * the shape's frame at the interval's first waypoint: the convex model
     * takes the step's gradient from it, reading the shape no more.
     */
    near: IAutoMoviePhysicalShapeNearest.IResult;
  }

  /**
   * An arm's sweeps over one interval between read waypoints: every axis sphere
   * against every shape whose bounding sphere lies within the pairs' reach of
   * the sphere at the interval's first waypoint, its course read through its
   * place at every frame of the interval, carried into the shape's frame at the
   * first, each frame step its chord, as the frame grid's own reading takes it.
   * Every step within the active set is its own sweep, as each of trajopt's
   * subdivided casts is its own contact: the merit counts each step past its
   * allowance and the convex model linearises each, so a miss that spans
   * several steps is moved by all of them at once. A step shorter than the
   * sphere's radius relative to a shape sweeps nothing against it and is left
   * out, as is a step the shape's bounding sphere shows clear of its allowance
   * by more than `T.CHECK`, which no reader uses, and a step the last exact
   * reading of the same course still keeps that clear by conservative
   * advancement (Mirtich 1996): the course's chord travel since that reading
   * (`AutoMovieMotionBound`) is less than its distance's excess over the
   * check.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param from The arm placed at `k`.
   * @param near The arm on the way to the interval's last waypoint.
   * @returns The sweeps, by sphere, then shape, then step.
   */
  export function of(
    c: M.IContext,
    a: number,
    k: number,
    from: IAutoMovieMotionHumanArmGeometry.IPlaced,
    near: HumanArmTrajectoryHalfStep.INear,
  ): ISwept[] {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: ISwept[] = [];
    for (let probe: number = 0; probe < G.SURFACE; ++probe) {
      const [pa, r]: readonly [IAutoMovieVector3, number] = from.probes[probe]!;
      for (const shape of S.near(
        frame,
        pa,
        r + T.REACH,
        undefined,
        c.reachable[a]![k]!,
      )) {
        // The hand's spheres on what the hand rests on are the goal's contact.
        if (probe >= G.WRIST && frame.resting.has(frame.shapes[shape]!.part))
          continue;
        // The probe's course relative to the shape, which may move too.
        const frames: number[] = [k];
        const course: IAutoMovieVector3[] = [pa];
        const turns: IAutoMovieQuaternion[] = [Quaternion.identity()];
        for (const step of near.path) {
          const moved: {
            point: IAutoMovieVector3;
            turn: IAutoMovieQuaternion;
          } = HumanArmTrajectoryHalfStep.carry(
            c,
            a,
            k,
            step.at,
            shape,
            step.placed.probes[probe]![0],
          );
          frames.push(step.at);
          course.push(moved.point);
          turns.push(moved.turn);
        }
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        const bound: AutoMovieMotionBound.IPrepared | undefined = chords(
          c,
          k,
          frames,
          course,
        );

        // The last exact reading of this course: its step and its distance.
        let read: number = -1;
        let gap: number = 0;
        for (let i: number = 0; i + 1 < course.length; ++i) {
          // A step shorter than the sphere's radius relative to the shape
          // passes through nothing its two places do not already touch: the
          // sweep guards the course between frames against passing through a
          // shape, and what a place itself touches is the pairs' reading, at
          // the read waypoints and over their courses through every frame.
          if (Vector3.distance(course[i]!, course[i + 1]!) < r) continue;
          const lower: number = Math.min(
            c.allowed(a, frames[i]!, probe, shape),
            c.allowed(a, frames[i + 1]!, probe, shape),
          );

          // Conservative advancement (Mirtich 1996, ch. 3): each end of this
          // step's chord lies within the course's travel since the last
          // exact reading of that reading's chord ends, and a segment's
          // distance to a convex shape changes no more than its ends move, so
          // a step that reading still keeps past the check distance has no
          // reader and its shape is not read.
          if (
            bound !== undefined &&
            read >= 0 &&
            1000 *
              (gap -
                bound.travel(bound.times[read]!, bound.times[i + 1]!) -
                r -
                lower) >
              T.CHECK
          )
            continue;

          // A step its shape's bounding sphere shows clear of its allowance
          // by more than the active set's check distance has no reader: the
          // merit counts only a sweep past its allowance and the convex model
          // only one within `T.CHECK` of it (TrajOpt's d_check, Schulman et
          // al. 2014, section IV), so its exact distance is not read.
          if (
            1000 *
              (HumanArmTrajectoryHalfStep.sphere(
                s,
                course[i]!,
                course[i + 1]!,
              ) -
                r -
                lower) >
            T.CHECK
          )
            continue;
          const reading: IAutoMoviePhysicalShapeNearest.IResult =
            physicalShapeNearest(s.pose, s.shape, course[i]!, course[i + 1]!);
          read = i;
          gap = reading.distance;
          if (1000 * (reading.distance - r - lower) > T.CHECK) continue;
          out.push({
            probe,
            shape,
            from: frames[i]!,
            start: course[i]!,
            first: turns[i]!,
            other: frames[i + 1]!,
            to: course[i + 1]!,
            turn: turns[i + 1]!,
            clear: reading.distance - r,
            lower,
            near: reading,
          });
        }
      }
    }
    return out;
  }

  /**
   * An arm's audit collider probes swept over one interval between read
   * waypoints: the course between the waypoints the pairs read
   * (`HumanArmTrajectoryPairs.deepest`). Each audit part is read against each
   * shape near it first as one link pair over the whole interval, the cast hull
   * of its solids through every frame of the interval widened by the played
   * course's stray within a frame step (`HumanArmTrajectoryLinks.cast`,
   * `HumanAuditModel.certify`); where that cast does not keep the shape clear,
   * as one cast per frame step; and only on a step whose cast fails, probe by
   * probe. A probe's step is its chord, carried into the shape's frame at the
   * interval's first waypoint, less the played cubic's interpolation error
   * toward the shape: an eighth of the second difference about each of the
   * step's frames, along the shape's outward normal at the step's nearest
   * point. Each step a part passes its allowance on is one sweep, its deepest
   * probe's, as each of trajopt's subdivided casts is one contact (Schulman et
   * al. 2014, section IV-C): the merit counts each and the convex model
   * linearises each at both its frames, so a miss that spans several steps is
   * moved at every one of them.
   *
   * Every allowance is no more than zero, so a cast certified clear of the
   * shape lets no probe of it pass its allowance anywhere it covers.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param placed The arm placed at every waypoint, with its collider probes.
   * @param near The arm on the way to the interval's last waypoint.
   * @returns The sweeps past their allowances, by part, then shape, then step.
   */
  export function links(
    c: M.IContext,
    a: number,
    k: number,
    placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
    near: HumanArmTrajectoryHalfStep.INear,
  ): ISwept[] {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const from: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[k]!;
    const out: ISwept[] = [];
    const frames: number[] = [
      k,
      ...near.path.map(
        (step: HumanArmTrajectoryHalfStep.IStep): number => step.at,
      ),
    ];
    const moving: HumanArmTrajectoryHalfStep.ITravel =
      HumanArmTrajectoryHalfStep.travel(c, a, k, from, near);
    const parts: HumanArmTrajectoryLinks.ILink[] = HumanArmTrajectoryLinks.of(
      c,
      a,
      k,
      from,
    );

    // Each shape's carrying stray over the interval, a function of the shape
    // alone, read once for every part (`HumanArmTrajectoryStray.shape`).
    const carrying: (HumanArmTrajectoryStray.IStray | undefined)[] = [];
    const carried = (shape: number): HumanArmTrajectoryStray.IStray =>
      (carrying[shape] ??= HumanArmTrajectoryStray.shape(
        c,
        a,
        k,
        near.at,
        shape,
      ));

    // Each frame's solids by part, made on the first cast that reads them and
    // shared by every pair.
    const steps: (HumanArmTrajectoryLinks.IStep | undefined)[] = [];
    const step = (i: number): HumanArmTrajectoryLinks.IStep =>
      (steps[i] ??= {
        at: frames[i]!,
        solids: HumanArmTrajectoryLinks.shapes(
          c.frames[a]![frames[i]!]!,
          placed[frames[i]!]!,
        ),
      });
    const all = (): HumanArmTrajectoryLinks.IStep[] =>
      frames.map(
        (_: number, i: number): HumanArmTrajectoryLinks.IStep => step(i),
      );
    for (const link of parts) {
      let travelled: number = 0;
      for (const probe of link.probes)
        travelled = Math.max(travelled, moving.probes[probe]!);
      const own: number = HumanArmTrajectoryStray.of(
        near.stray[link.owner],
        link.reach,
      );
      for (const shape of c.reachable[a]![k]!) {
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        if (frame.related[link.part]?.[s.part] === true) continue;

        // The course strays from its chords by the part's stray and the
        // shape's carrying stray at the part's lever from the shape's origin
        // (`HumanArmTrajectoryStray`), and the part's sphere screens the
        // shape's over what either travels on the way.
        const lever: number =
          Vector3.distance(link.centre, s.pose.position) +
          link.radius +
          travelled;
        const stray: number =
          own + HumanArmTrajectoryStray.of(carried(shape), lever);
        if (
          Vector3.distance(link.centre, s.centre) - link.radius - s.radius >=
          T.REACH + travelled + moving.shapes[shape]! + stray
        )
          continue;

        // A declared rest touches its shape by design: no cast certifies it,
        // and its probes are read on every step.
        const rested: boolean = c.rested(a, k, link.probes[0]!, s.bone);
        const solid: physicalShapeGjk.ISolid | undefined =
          rested || link.solids.length === 0
            ? undefined
            : physicalShapeGjk.solid(s.pose, s.shape);
        const clear = (
          over: readonly HumanArmTrajectoryLinks.IStep[],
        ): boolean =>
          solid !== undefined &&
          HumanAuditModel.certify(
            HumanArmTrajectoryLinks.cast(
              c,
              a,
              k,
              link.part,
              over,
              shape,
              stray,
            ),
            link.offset,
            solid,
            0,
          ) > 0;
        if (frames.length > 2 && clear(all())) continue;
        for (let i: number = 0; i + 1 < frames.length; ++i) {
          if (clear([step(i), step(i + 1)])) continue;
          const sweep: ISwept | undefined = deepestStep(
            c,
            a,
            k,
            placed,
            link,
            shape,
            frames[i]!,
            frames[i + 1]!,
            stray,
          );
          if (sweep !== undefined) out.push(sweep);
        }
      }
    }
    return out;
  }
}

/**
 * The bound on a probe's course over an interval, prepared once
 * (`AutoMovieMotionBound.prepare`): its chord lengths per frame step over the
 * steps' seconds from the interval's first waypoint, the chords being the
 * course `HumanArmTrajectorySweep.of` reads. None where two frames share an
 * instant or the course has no step.
 */
function chords(
  c: M.IContext,
  k: number,
  frames: readonly number[],
  course: readonly IAutoMovieVector3[],
): AutoMovieMotionBound.IPrepared | undefined {
  const along: number[] = frames.map((g: number): number =>
    Math.abs(c.times[g]! - c.times[k]!),
  );
  const speeds: number[] = [];
  for (let i: number = 0; i + 1 < along.length; ++i) {
    const h: number = along[i + 1]! - along[i]!;
    if (!(h > 0)) return undefined;
    speeds.push(Vector3.distance(course[i]!, course[i + 1]!) / h);
  }
  return speeds.length === 0
    ? undefined
    : AutoMovieMotionBound.prepare(along, speeds);
}

/**
 * A part's deepest probe past its allowance over one frame step, as a sweep
 * (`HumanArmTrajectorySweep.links`); none where no probe passes it. Each
 * probe's chord is bounded first by the shape's bounding sphere less the
 * course's stray in any direction, and read exactly only where that bound could
 * pass its allowance and the deepest so far (branch and bound).
 */
function deepestStep(
  c: M.IContext,
  a: number,
  k: number,
  placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
  link: HumanArmTrajectoryLinks.ILink,
  shape: number,
  g0: number,
  g1: number,
  stray: number,
): HumanArmTrajectorySweep.ISwept | undefined {
  const s: IAutoMovieMotionHumanArmGeometry.IShape =
    c.frames[a]![k]!.shapes[shape]!;
  const carried = (
    g: number,
    probe: number,
  ): ReturnType<typeof HumanArmTrajectoryHalfStep.carry> =>
    HumanArmTrajectoryHalfStep.carry(
      c,
      a,
      k,
      g,
      shape,
      HumanArmTrajectoryHalfStep.point(c.frames[a]![g]!, placed[g]!, probe),
    );
  let best: HumanArmTrajectorySweep.ISwept | undefined;
  let deepest: number = 0;
  for (const probe of link.probes) {
    const r: number = placed[k]!.probes[probe]![1];
    const lower: number = Math.min(
      c.allowed(a, g0, probe, shape),
      c.allowed(a, g1, probe, shape),
    );
    const start: ReturnType<typeof HumanArmTrajectoryHalfStep.carry> = carried(
      g0,
      probe,
    );
    const end: ReturnType<typeof HumanArmTrajectoryHalfStep.carry> = carried(
      g1,
      probe,
    );

    // The chord's least distance the bounding sphere allows, less the
    // course's stray in any direction: a probe it shows within its
    // allowance, or no deeper than the deepest so far, is not read exactly.
    const bound: number =
      HumanArmTrajectoryHalfStep.sphere(s, start.point, end.point) - r - stray;
    if (bound >= lower || lower - bound <= deepest) continue;
    const reading: IAutoMoviePhysicalShapeNearest.IResult =
      physicalShapeNearest(s.pose, s.shape, start.point, end.point);

    // Within the step the played cubic stands off its chord by an eighth of
    // the second difference about its frames; its share along the shape's
    // outward normal at the nearest point is how much nearer the shape the
    // course comes than the chord (`h^2 p'' / 8`). A frame at the course's
    // end has no second difference: the course stops there.
    const bend = (g: number, at: IAutoMovieVector3): number => {
      if (g < 1 || g + 1 >= c.n) return 0;
      const second: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(carried(g - 1, probe).point, carried(g + 1, probe).point),
        Vector3.scale(at, 2),
      );
      return Math.max(0, Vector3.dot(reading.normal, second) / 8);
    };
    const toward: number = Math.max(bend(g0, start.point), bend(g1, end.point));
    const clear: number = reading.distance - toward - r;
    if (clear >= lower || lower - clear <= deepest) continue;
    deepest = lower - clear;
    best = {
      probe,
      shape,
      from: g0,
      start: start.point,
      first: start.turn,
      other: g1,
      to: end.point,
      turn: end.turn,
      clear,
      lower,
      near: reading,
    };
  }
  return best;
}
