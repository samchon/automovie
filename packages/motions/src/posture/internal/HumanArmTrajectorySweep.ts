import { type AutoMovieEnginePhysicsGjkTypes, AutoMovieMotionBound, Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryDeepestStep } from "./HumanArmTrajectoryDeepestStep";
import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectorySweepBound } from "./HumanArmTrajectorySweepBound";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/**
 * An arm's sweeps over one interval between read waypoints: every axis sphere
 * against every shape whose bounding sphere lies within the pairs' reach of the
 * sphere at the interval's first waypoint, its course read through its place at
 * every frame of the interval, carried into the shape's frame at the first,
 * each frame step its chord, as the frame grid's own reading takes it. Every
 * step within the active set is its own sweep, as each of trajopt's subdivided
 * casts is its own contact: the merit counts each step past its allowance and
 * the convex model linearises each, so a miss that spans several steps is moved
 * by all of them at once. A step shorter than the sphere's radius relative to a
 * shape sweeps nothing against it and is left out, as is a step the shape's
 * bounding sphere shows clear of its allowance by more than `T.CHECK`, which no
 * reader uses, and a step the last exact reading of the same course still keeps
 * that clear by conservative advancement (Mirtich 1996): the course's chord
 * travel since that reading (`AutoMovieMotionBound`) is less than its
 * distance's excess over the check.
 *
 * @param c The context.
 * @param a The arm.
 * @param k The interval's first waypoint.
 * @param from The arm placed at `k`.
 * @param near The arm on the way to the interval's last waypoint.
 * @returns The sweeps, by sphere, then shape, then step.
 */
export function HumanArmTrajectorySweep(
  c: M.IContext,
  a: number,
  k: number,
  from: IAutoMovieMotionHumanArmGeometry.IPlaced,
  near: HumanArmTrajectoryHalfStep.INear,
): HumanArmTrajectorySweep.ISwept[] {
  const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
  const out: HumanArmTrajectorySweep.ISwept[] = [];
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
        const moved: IOfMoved = HumanArmTrajectoryHalfStep.carry(
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
      const bound: AutoMovieMotionBound.IPrepared | undefined =
        HumanArmTrajectorySweepBound.chords(c, k, frames, course);

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
            (HumanArmTrajectoryHalfStep.sphere(s, course[i]!, course[i + 1]!) -
              r -
              lower) >
          T.CHECK
        )
          continue;
        const reading: IAutoMoviePhysicalShapeNearest.IResult =
          AutoMovieEnginePhysics.physicalShapeNearest(s.pose, s.shape, course[i]!, course[i + 1]!);
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
     * (negative inside): the chord's, as TrajOpt reads the step between two
     * poses (Schulman et al. 2014, section IV-B).
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
   * An arm's audit collider probes swept over one interval between read
   * waypoints: the course between the waypoints the pairs read
   * (`HumanArmTrajectoryPairs.deepest`). Each audit part is read against each
   * shape near it first as one link pair over the whole interval, the cast hull
   * of its solids through every frame of the interval, TrajOpt's hull of the
   * consecutive poses (Schulman et al. 2014, section IV-B;
   * `HumanArmTrajectoryLinks.cast`, `HumanAuditModel.certify`); where that cast
   * does not keep the shape clear, as one cast per frame step, a step an
   * earlier step's certified clearance still covers by conservative advancement
   * (Mirtich 1996: the part's solids' points have moved less than it since,
   * `HumanArmTrajectorySweepBound.solids`) left uncast; and only on a step
   * whose cast fails, probe by probe. A probe's step is its chord, carried into
   * the shape's frame at the interval's first waypoint, with no correction for
   * the course between the two poses, as TrajOpt's cast has none. Each step a
   * part passes its allowance on is one sweep, its deepest probe's, as each of
   * trajopt's subdivided casts is one contact (Schulman et al. 2014, section
   * IV-C): the merit counts each and the convex model linearises each at both
   * its frames, so a miss that spans several steps is moved at every one of
   * them.
   *
   * Every allowance is no more than zero, so a cast certified clear of the
   * shape lets no probe of it pass its allowance anywhere it covers. At a
   * boundary of an authored hold, a violating synthetic tip sphere can be
   * replaced by complete certificates of the actual hand's solids. Their
   * endpoint casts include their shortest relative rotations' chord error;
   * any missing part or unproved allowance keeps the original axis row.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint.
   * @param placed The arm placed at every waypoint, with its collider probes.
   * @param near The arm on the way to the interval's last waypoint.
   * @param axes The axis-sphere readings of this same interval.
   * @returns The axis rows still needed, then the sweeps of the physical parts.
   */
  export function links(
    c: M.IContext,
    a: number,
    k: number,
    placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
    near: HumanArmTrajectoryHalfStep.INear,
    axes: readonly ISwept[],
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
    const parts: HumanArmTrajectoryLinks.ILink[] = HumanArmTrajectoryLinks(
      c,
      a,
      k,
      from,
    );
    let hand: Set<number> | undefined;
    let tip: Map<number, Map<number, ITipStep>> | undefined;
    const sites: M.IContext["sites"][number] = c.sites[a]!;
    for (const sweep of axes) {
      if (
        sweep.probe !== G.TIP ||
        1000 * (sweep.lower - sweep.clear) <= T.TOLERANCE ||
        (sites[sweep.from] === undefined) === (sites[sweep.other] === undefined)
      )
        continue;
      hand ??= new Set(
        frame.colliders
          .filter((collider) => collider.owner === "hand")
          .map((collider) => collider.part),
      );
      if (
        hand.size === 0 ||
        [sweep.from, sweep.other].some((at: number): boolean =>
          c.frames[a]![at]!.colliders.some(
            (collider): boolean =>
              collider.owner === "hand" && !hand!.has(collider.part),
          ),
        )
      )
        continue;
      tip ??= new Map();
      let steps: Map<number, ITipStep> | undefined = tip.get(sweep.shape);
      if (steps === undefined) tip.set(sweep.shape, (steps = new Map()));
      steps.set(sweep.from, { sweep, remaining: hand.size });
    }

    // The part's sphere screens the shape's over what either travels on the
    // way. Prepare the solids once only when there is a cast to certify.
    const close: number[][] = parts.map((link): number[] => {
      let travelled: number = 0;
      for (const probe of link.probes)
        travelled = Math.max(travelled, moving.probes[probe]!);
      return c.reachable[a]![k]!.filter((shape: number): boolean => {
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        return (
          frame.related[link.part]?.[s.part] !== true &&
          ((link.owner === "hand" && tip?.has(shape) === true) ||
            Vector3.distance(link.centre, s.centre) - link.radius - s.radius <
              T.REACH + travelled + moving.shapes[shape]!)
        );
      });
    });
    const casts: boolean = parts.some(
      (link, i) =>
        link.solids.length !== 0 &&
        close[i]!.some(
          (shape) =>
            !c.rested(a, k, link.probes[0]!, frame.shapes[shape]!.bone),
        ),
    );

    // The first cast frame uses the same part solids that screened the cast.
    const steps: HumanArmTrajectoryLinks.IStep[] = casts
      ? frames.map(
          (at: number, i: number): HumanArmTrajectoryLinks.IStep => ({
            at,
            solids:
              i === 0
                ? new Map<number, AutoMovieEnginePhysicsGjkTypes.ISolid[]>(
                    parts.map(
                      (
                        link: HumanArmTrajectoryLinks.ILink,
                      ): [number, AutoMovieEnginePhysicsGjkTypes.ISolid[]] => [
                        link.part,
                        link.solids,
                      ],
                    ),
                  )
                : HumanArmTrajectoryLinks.shapes(
                    c.frames[a]![at]!,
                    placed[at]!,
                  ),
          }),
        )
      : [];
    for (let p: number = 0; p < parts.length; ++p) {
      const link: HumanArmTrajectoryLinks.ILink = parts[p]!;
      for (const shape of close[p]!) {
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        const tipSteps: Map<number, ITipStep> | undefined =
          link.owner === "hand" ? tip?.get(shape) : undefined;
        // A declared rest touches its shape by design: no cast certifies it,
        // and its probes are read on every step.
        const rested: boolean = c.rested(a, k, link.probes[0]!, s.bone);
        const solid: AutoMovieEnginePhysicsGjkTypes.ISolid | undefined =
          rested || link.solids.length === 0
            ? undefined
            : AutoMovieEnginePhysics.physicalShapeGjkSolid(s.pose, s.shape);

        // The cast's certified clearance, metres; negative infinity where
        // no cast is read.
        const certified = (
          over: readonly HumanArmTrajectoryLinks.IStep[],
        ): number =>
          solid === undefined
            ? -Infinity
            : HumanAuditModel.certify(
                HumanArmTrajectoryLinks.cast(c, a, k, link.part, over, shape),
                link.offset,
                solid,
                0,
              );
        if (
          tipSteps === undefined &&
          frames.length > 2 &&
          certified(steps) > 0
        )
          continue;

        // Conservative advancement over the steps (Mirtich 1996, ch. 3): a
        // step's cast is the hull of the part's solids' points at its two
        // frames, each within the points' travel since the last certified
        // step of that step's, and a hull's distance to a convex shape
        // changes no more than its points move, so a step that clearance
        // still covers is clear and its cast is not read.
        const bound: AutoMovieMotionBound.IPrepared | undefined =
          solid === undefined || frames.length <= 2
            ? undefined
            : HumanArmTrajectorySweepBound.solids(
                c,
                a,
                k,
                link.part,
                steps,
                shape,
              );
        let anchor: number = -1;
        let margin: number = 0;
        for (let i: number = 0; i + 1 < frames.length; ++i) {
          const refined: ITipStep | undefined = tipSteps?.get(frames[i]!);
          const remaining: number | undefined = refined?.remaining;
          if (
            remaining === undefined &&
            bound !== undefined &&
            anchor >= 0 &&
            margin > bound.travel(bound.times[anchor]!, bound.times[i + 1]!)
          )
            continue;
          if (refined !== undefined && remaining !== undefined) {
            if (
              solid !== undefined &&
              certifiesTip(
                c,
                a,
                k,
                placed,
                link,
                refined.sweep,
                steps[i]!,
                steps[i + 1]!,
                solid,
              )
            ) {
              refined.remaining = remaining - 1;
              continue;
            }
            refined.remaining = undefined;
          }
          const clearance: number =
            solid === undefined || remaining !== undefined
              ? -Infinity
              : certified([steps[i]!, steps[i + 1]!]);
          if (clearance > 0) {
            anchor = i;
            margin = clearance;
            continue;
          }
          const sweep: ISwept | undefined = HumanArmTrajectoryDeepestStep(
            c,
            a,
            k,
            placed,
            link,
            shape,
            frames[i]!,
            frames[i + 1]!,
          );
          if (sweep !== undefined) out.push(sweep);
        }
      }
    }
    return [
      ...(tip === undefined
        ? axes
        : axes.filter(
            (sweep: ISwept): boolean =>
              sweep.probe !== G.TIP ||
              tip!.get(sweep.shape)?.get(sweep.from)?.remaining !== 0,
          )),
      ...out,
    ];
  }
}

/** Certify one actual hand part over the axis row's relative frame step. */
function certifiesTip(
  c: M.IContext,
  a: number,
  k: number,
  placed: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
  link: HumanArmTrajectoryLinks.ILink,
  sweep: HumanArmTrajectorySweep.ISwept,
  start: HumanArmTrajectoryLinks.IStep,
  end: HumanArmTrajectoryLinks.IStep,
  obstacle: AutoMovieEnginePhysicsGjkTypes.ISolid,
): boolean {
  const frames: M.IContext["frames"][number] = c.frames[a]!;
  const shape: IAutoMovieMotionHumanArmGeometry.IShape =
    frames[k]!.shapes[sweep.shape]!;
  const before: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
    frames[start.at]!.shapes[sweep.shape];
  const after: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
    frames[end.at]!.shapes[sweep.shape];
  if (
    start.at !== sweep.from ||
    end.at !== sweep.other ||
    before?.part !== shape.part ||
    after?.part !== shape.part ||
    before.bone !== shape.bone ||
    after.bone !== shape.bone ||
    before.shape !== shape.shape ||
    after.shape !== shape.shape
  )
    return false;
  const own = frames[start.at]!.colliders.find((part) => part.part === link.part);
  const next = frames[end.at]!.colliders.find((part) => part.part === link.part);
  if (
    own?.owner !== "hand" ||
    next?.owner !== "hand" ||
    own.bone !== next.bone ||
    own.shapes.length !== next.shapes.length ||
    own.shapes.some((shape, i) => shape !== next.shapes[i])
  )
    return false;
  const first: AutoMovieEnginePhysicsGjkTypes.ISolid[] | undefined =
    start.solids.get(link.part);
  const last: AutoMovieEnginePhysicsGjkTypes.ISolid[] | undefined = end.solids.get(link.part);
  if (
    first?.length !== own.shapes.length ||
    last?.length !== next.shapes.length
  )
    return false;
  const initial: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[start.at]!;
  const final: IAutoMovieMotionHumanArmGeometry.IPlaced = placed[end.at]!;
  const pivot: IAutoMovieVector3 = Vector3.add(
    initial.wrist,
    Quaternion.rotateVector(initial.hand, own.pose.position),
  );
  const angle: number = Quaternion.angle(
    Quaternion.multiply(
      sweep.first,
      Quaternion.multiply(initial.hand, own.pose.rotation),
    ),
    Quaternion.multiply(
      sweep.turn,
      Quaternion.multiply(final.hand, next.pose.rotation),
    ),
  );
  let floor: number = -Infinity;
  for (const probe of link.probes)
    floor = Math.max(
      floor,
      Math.min(
        c.allowed(a, start.at, probe, sweep.shape),
        c.allowed(a, end.at, probe, sweep.shape),
      ),
    );
  return HumanArmTrajectoryLinks.certifiesTurn(
    first,
    HumanArmTrajectoryLinks.cast(c, a, k, link.part, [start, end], sweep.shape),
    pivot,
    angle,
    obstacle,
    link.offset,
    floor,
  );
}

/** The record of `IOfMoved`'s site. */
type IOfMoved = {
  point: IAutoMovieVector3;
  turn: IAutoMovieQuaternion;
};

/** An obstructed tip sweep whose native hand parts still need certification. */
interface ITipStep {
  /** The original axis-sphere reading, kept if any real part is unproved. */
  sweep: HumanArmTrajectorySweep.ISwept;
  /** The hand parts not yet certified, absent after the first failed proof. */
  remaining: number | undefined;
}
