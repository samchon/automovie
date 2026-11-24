import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanApproach,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEffort,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import { walkClear } from "../actions/walkClear";
import { walkDelayed } from "../actions/walkDelayed";
import { walkStation } from "../actions/walkStation";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanEffort } from "./HumanEffort";
import { HumanProxemics } from "./HumanProxemics";
import { HumanTrunk } from "./HumanTrunk";

/** The record of `IToStop`'s site. */
type IToStop = { at: IAutoMovieVector3; yaw: number };

/**
 * Walking up to a person, a prop or a point and stopping at an interpersonal
 * distance, facing it.
 *
 * The goal is the stop, not the steps: the front of the performer's chest (the
 * sternum region) must end `gap` short of the target, horizontally, along the
 * line from where the performer stands to the target ({@link HumanProxemics}).
 * The law turns that goal into the floor point the feet's midpoint must reach,
 * `gap` plus the chest's lead over the feet back from the target, and lets the
 * walk law place whole steps to it, so the stop is exact without sliding (the
 * walk's footprints are inverse-kinematics goals) and the body faces the target
 * because it walked straight at it.
 *
 * The target is read once, at the start: a person's region (the `sternum` for
 * Hall's chest-to-chest gaps, `upperBack` to stop behind someone), a prop's
 * point or a free point. For `handing` the gap comes from both people's own
 * measures, so a short and a tall partner meet at a gap both can reach; a prop
 * or point target uses the performer's measure alone. A target already nearer
 * than the requested gap is refused with both distances, since an approach
 * never backs away.
 *
 * A `side` stops on a named side of a person target instead, in that person's
 * own frame (their sternum's outward normal is their front), at the same gap,
 * and the walk's final heading turns the body to face them on the last steps.
 * The person approached on a side is walked round like one named in `avoid`, so
 * a stop behind them is not reached through them. People named in `avoid` are
 * walked round: where the straight leg would pass one nearer than the walker's
 * lateral clearance (0.5 m, `CLEARANCE`; walkers keep an elliptical personal
 * space wider ahead than to the side while circumventing a person,
 * Gerin-Lajoie, Richards and McFadyen 2005, Motor Control 9:242) plus half the
 * walker's chest breadth, a waypoint abeam that person takes the walk round on
 * the side that deviates least. Walkers moving past each other are not avoided
 * here; reciprocal avoidance belongs to the engine. An Effort sets the walk's
 * step length, arm swing and elbow width ({@link HumanEffort}); bound flow's
 * elbows held in cannot be shown, since the walk only widens them.
 *
 * With `track`, a person who moves is followed: their placed root is read ahead
 * over `HORIZON` seconds for where and when they come to rest, the stop is
 * taken against the target carried and turned with their root to that place,
 * and the walk waits in its first posture so that it arrives `LAG` after they
 * stop, which keeps the follower behind a leader on the leader's own line.
 * Where their way bends by more than `BEND` the walk goes by the places they
 * passed, and with `track: "pace"` it matches their speed instead of waiting
 * (`walkStation`; Rio, Rhea and Warren 2014).
 *
 * Events are the walk's (each foot's toe-offs and heel strikes, `lastFootfall`,
 * `arrive`), and `depart` where the walk waited.
 */
export namespace approach {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "approach";

  /** Cancel table: an approach is a walk and is cut as one. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    walk.interrupts;

  /** What it yields to an overlay: the walk's own. */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = walk.yields;

  /**
   * Lateral clearance a walker keeps from a person it passes, metres: the
   * lateral half axis of the elliptical personal space walkers keep while
   * circumventing a person, 0.48 m on average (Gerin-Lajoie, Richards and
   * McFadyen 2005, Motor Control 9:242; 2006, Gait Posture 24:364), to which
   * the plan adds half the walker's chest breadth.
   */
  export const CLEARANCE: number = 0.5;

  /**
   * Plan an approach: the stop point from the gap, waypoints round the people
   * to avoid, and the walk law's plan to that stop, corrected once by where the
   * arriving sternum actually lands.
   *
   * @param context The action's context.
   * @returns The walk's plan to the stop point.
   * @throws {HumanRefusal} When the target is already nearer than the gap, a
   *   side or tracking is asked of a target that is not a person, or a tracked
   *   person is composed after this performer.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanApproach.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const target: IAutoMovieMotionTarget = context.params.target;
    const aimed: IAutoMovieMotionHumanApproach.IAim = context.aim(
      target,
      context.start,
    );
    if (context.params.track === undefined || context.params.track === false)
      return to(context, aimed);
    if (target.kind !== "person")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "track",
        value: true,
        reason: `only a person is followed where they go; this target is a ${target.kind}`,
        fix: "leave track out for a target that is not a person",
      });

    // Where and when the person comes to rest: their placed root is read ahead every `REST_STEP` over the horizon, and the last instant it moved or turned is kept.
    const leader: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    const began: IAutoMovieMotionHumanActionContext.IRoot = leader.root(
      context.start,
    );
    let rests: number = context.start;
    let last: IAutoMovieMotionHumanActionContext.IRoot = began;
    for (let ahead: number = REST_STEP; ahead <= HORIZON; ahead += REST_STEP) {
      const next: IAutoMovieMotionHumanActionContext.IRoot = leader.root(
        context.start + ahead,
      );
      if (
        Math.hypot(
          next.position.x - last.position.x,
          next.position.z - last.position.z,
        ) > REST_MOVE ||
        Math.abs(turnBetween(last.yaw, next.yaw)) > REST_TURN
      )
        rests = context.start + ahead;
      last = next;
    }

    // The target as it will be then: carried with the person's root and
    // turned about it by the root's turn, so a region ahead of the root
    // stays ahead of them however they face.
    const turned: number = turnBetween(began.yaw, last.yaw);
    const there: IAutoMovieMotionHumanApproach.IAim = {
      point: HumanFrame.point(
        { origin: last.position, yaw: turned },
        Vector3.subtract(aimed.point, began.position),
      ),
      normal: HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: turned },
        aimed.normal,
      ),
    };

    // Where the person's way bends, the walk goes by the places they passed, so it takes their turns instead of cutting across them: four of their places evenly spaced in time, kept when the way leaves the straight line by more than `BEND` and the place is not within `BEND` of either end.
    const passed: IAutoMovieVector3[] = [1, 2, 3, 4].map(
      (k: number): IAutoMovieVector3 =>
        leader.root(context.start + (k / 5) * (rests - context.start)).position,
    );
    const line: number = Math.hypot(
      last.position.x - began.position.x,
      last.position.z - began.position.z,
    );
    const off: (p: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number =>
      line < 1e-6
        ? Math.hypot(p.x - began.position.x, p.z - began.position.z)
        : Math.abs(
            (p.x - began.position.x) * (last.position.z - began.position.z) -
              (p.z - began.position.z) * (last.position.x - began.position.x),
          ) / line;
    const here: IAutoMovieVector3 = context.entry.posture.root;
    const bent: boolean = passed.some(
      (p: IAutoMovieVector3): boolean => off(p) > BEND,
    );

    // A place within `BEND` of where the follower stops, the requested gap
    // short of the person, is dropped: the walk's own last leg reaches it.
    const gap: number = HumanProxemics.gap(
      context.params.at ?? "personal",
      context.body.measure,
      leader.body.measure,
    );
    const path: IAutoMovieVector3[] = !bent
      ? []
      : passed
          .filter(
            (p: IAutoMovieVector3): boolean =>
              Math.hypot(p.x - here.x, p.z - here.z) > BEND &&
              Math.hypot(p.x - last.position.x, p.z - last.position.z) >
                BEND + gap,
          )
          .map((p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p, y: 0 }));

    // The walk there, begun late enough to arrive `LAG` after the person has stopped, so it never gets ahead of them on their own line.
    const walked: IAutoMovieMotionHumanActionPlan = to(context, there, path);
    if (context.params.track === "pace")
      return walkStation(
        walked,
        (seconds: number): IAutoMovieVector3 => leader.root(seconds).position,
        context.start,
        rests,
      );
    const wait: number = Math.max(
      0,
      rests + LAG - context.start - walked.duration,
    );
    return wait < 1e-6 ? walked : walkDelayed(walked, wait);
  }

  /**
   * How far ahead a tracked person's placed root is read for where they come to
   * rest, seconds. A numerical policy bounding the scan at `HORIZON /
   * REST_STEP` reads: a minute, longer than any one shot a follower is planned
   * in, so a leader still moving after it is followed to where they are then.
   */
  export const HORIZON: number = 60;

  /**
   * Seconds between two reads of a tracked person's placed root: one walking
   * step, 0.50 to 0.56 s at the 1.8 to 2.0 steps a second of 800 pedestrians
   * (Pachi and Ji 2005, Struct Eng 83(3):36), so a stop is found within the
   * step it is made on.
   */
  export const REST_STEP: number = 0.5;

  /**
   * How far a tracked person's root may move between two reads and still count
   * as at rest, metres. A numerical policy: the millimetre the balance margins
   * are reported in (`HumanBalance.TOLERANCE` resolves to half of it), far
   * below the shortest step and far above a placed root's round-off.
   */
  export const REST_MOVE: number = 1e-3;

  /**
   * How far a tracked person's heading may turn between two reads and still
   * count as at rest, degrees. A numerical policy: a tenth of a degree carries
   * a shoulder, about 0.2 m from the root, by 0.35 mm, under `REST_MOVE`, so a
   * turn is read at least as finely as a move.
   */
  export const REST_TURN: number = 0.1;

  /**
   * How far a tracked person's way must leave the straight line for the
   * follower to take it by their places, and how near either end such a place
   * is dropped, metres: the lateral clearance walkers keep from a person
   * (`CLEARANCE`, Gerin-Lajoie et al. 2005), under which taking the leader's
   * turn would not change the follower's path by more than its own personal
   * space.
   */
  export const BEND: number = CLEARANCE;

  /**
   * How long after a tracked person has stopped a walk that waited for them
   * arrives, seconds: a follower's visual-motor delay, the mean optimal delay
   * between a leader's and a follower's acceleration (420 ms; Rio, Rhea and
   * Warren 2014, J Vis 14(2):4).
   */
  export const LAG: number = 0.42;

  /**
   * The turn from one heading to another, degrees in [-180, 180), so a heading
   * crossing ±180 is not read as a whole turn.
   */
  function turnBetween(from: number, to: number): number {
    return ((((to - from) % 360) + 540) % 360) - 180;
  }

  /**
   * Plan the walk to the stop place of a target given where it is: the stop,
   * the waypoints, the walk and its one arrival correction.
   */
  function to(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanApproach.IParams>,
    aimed: IAutoMovieMotionHumanApproach.IAim,
    path: readonly IAutoMovieVector3[] = [],
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const p: IAutoMovieMotionHumanApproach.IParams = context.params;
    const target: IAutoMovieMotionTarget = p.target;
    const point: IAutoMovieVector3 = aimed.point;
    const other: IAutoMovieBodyMeasure =
      target.kind === "person"
        ? context.performer(target.subject).body.measure
        : body.measure;
    const gap: number = HumanProxemics.gap(
      p.at ?? "personal",
      body.measure,
      other,
    );
    const feet: IAutoMovieVector3 = {
      x:
        (context.entry.feet.left.ankle.x + context.entry.feet.right.ankle.x) /
        2,
      y: 0,
      z:
        (context.entry.feet.left.ankle.z + context.entry.feet.right.ankle.z) /
        2,
    };
    const lead: number = approach.chest(body);

    // The stop: along the line from the start, or on a named side of a person.
    let stop: IToStop;
    if (p.from === undefined) {
      const now: number = Math.hypot(point.x - feet.x, point.z - feet.z) - lead;
      if (now < gap - 1e-9)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "at",
          value: gap,
          feasible: { kind: "range", minimum: 0, maximum: now, unit: "m" },
          reason: `the target is ${now.toFixed(3)} m from the chest, nearer than the requested gap ${gap.toFixed(3)} m`,
          fix: "request a gap no larger than the present distance, or walk away from the target first",
        });
      stop = HumanProxemics.stop(feet, point, gap, lead);
    } else {
      if (target.kind !== "person")
        throw new HumanRefusal({
          kind: "parameter",
          axis: "from",
          value: context.params.from,
          reason: `a side is a person's side; this target is a ${target.kind}`,
          fix: "leave side out for a target that is not a person",
        });
      const facing: number =
        (Math.atan2(aimed.normal.x, aimed.normal.z) * 180) / Math.PI;
      const turn: number = { front: 0, left: 90, right: -90, behind: 180 }[
        p.from
      ];
      const out: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: facing + turn },
        { x: 0, y: 0, z: 1 },
      );
      const at: IAutoMovieVector3 = {
        x: point.x + out.x * (gap + lead),
        y: 0,
        z: point.z + out.z * (gap + lead),
      };
      stop = {
        at,
        yaw: (Math.atan2(point.x - at.x, point.z - at.z) * 180) / Math.PI,
      };
    }

    if (target.kind === "person") walkClear.between(context, stop.at, point);

    // Walk round people in the way: a waypoint abeam each one the straight leg would pass nearer than the clearance plus their half breadth, on the side that deviates least. The person approached is walked round too when the stop lies on a side of them the straight leg would reach through them.
    const round: string[] = [...(p.avoid ?? [])];
    if (
      p.from !== undefined &&
      target.kind === "person" &&
      !round.includes(target.subject)
    )
      round.push(target.subject);
    const via: IAutoMovieVector3[] = [...path];
    for (const subject of round) {
      const at: IAutoMovieVector3 = context.aim(
        { kind: "person", subject, region: "sternum" },
        context.start,
      ).point;
      const from: IAutoMovieVector3 = via.at(-1) ?? feet;
      const pass: number = CLEARANCE + body.measure.chestBreadth / 2;
      const waypoint: IAutoMovieVector3 | undefined = abeam(
        from,
        stop.at,
        at,
        pass,
      );
      if (waypoint !== undefined) via.push(waypoint);
    }

    const mods: IAutoMovieMotionHumanEffort.IModifiers = HumanEffort.modifiers(
      p.effort,
    );
    const walkTo = (at: IAutoMovieVector3): IAutoMovieMotionHumanActionPlan =>
      walk.plan({
        ...context,
        params: {
          to: at,
          face: (Math.atan2(point.x - at.x, point.z - at.z) * 180) / Math.PI,
          ...(via.length === 0 ? {} : { via }),
          ...(p.pace === undefined ? {} : { pace: p.pace }),
          ...(p.manner === undefined ? {} : { manner: p.manner }),
          ...(p.effort === undefined
            ? {}
            : {
                stride: Math.min(
                  walk.STRIDE_RANGE.maximum,
                  Math.max(walk.STRIDE_RANGE.minimum, mods.step),
                ),
                armSwing: Math.min(
                  walk.ARM_SWING_RANGE.maximum,
                  Math.max(walk.ARM_SWING_RANGE.minimum, mods.swing),
                ),
                // The elbow modifier is an outward offset in upper-arm
                // lengths, and an upper arm abducted by an angle carries the
                // elbow out by its length times the angle's sine, so the
                // offset over the upper arm is that sine.
                elbows: Math.min(
                  walk.ELBOWS_RANGE.maximum,
                  Math.max(
                    walk.ELBOWS_RANGE.minimum,
                    (Math.asin(Math.min(1, Math.max(-1, mods.elbow))) * 180) /
                      Math.PI,
                  ),
                ),
              }),
        },
      });

    // The gap is a goal on the arriving chest: plan, read where the sternum
    // actually arrives, and move the stop along the line to the target by the
    // gap's error once (the walk's arrival posture, with its lean and its
    // closing step, places the chest a few centimetres off the standing
    // estimate).
    const first: IAutoMovieMotionHumanActionPlan = walkTo(stop.at);
    const arrived: IAutoMovieVector3 = HumanTrunk.region(
      body,
      first.posture(first.duration),
      "sternum",
    ).point;
    const error: number =
      Math.hypot(point.x - arrived.x, point.z - arrived.z) - gap;
    if (Math.abs(error) <= 0.002) return first;
    const length: number = Math.hypot(point.x - stop.at.x, point.z - stop.at.z);
    return walkTo({
      x: stop.at.x + ((point.x - stop.at.x) / length) * error,
      y: 0,
      z: stop.at.z + ((point.z - stop.at.z) / length) * error,
    });
  }

  /**
   * A waypoint that takes a straight leg round a point it would pass too near:
   * abeam the point at the passing distance, on the side of the leg the point
   * already lies away from, or none when the leg passes clear or the point lies
   * beyond either end.
   *
   * @param from The leg's start, floor metres.
   * @param to The leg's end.
   * @param point The point to pass.
   * @param pass The least passing distance, metres.
   * @returns The waypoint on the floor, or undefined.
   */
  function abeam(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    point: IAutoMovieVector3,
    pass: number,
  ): IAutoMovieVector3 | undefined {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const length: number = Math.hypot(dx, dz);
    if (length < 1e-9) return undefined;
    const ux: number = dx / length;
    const uz: number = dz / length;
    const along: number = (point.x - from.x) * ux + (point.z - from.z) * uz;
    if (along <= 0 || along >= length) return undefined;
    const across: number = (point.x - from.x) * -uz + (point.z - from.z) * ux;
    if (Math.abs(across) >= pass) return undefined;
    const side: number = across >= 0 ? -1 : 1;
    return {
      x: point.x + side * pass * -uz,
      y: 0,
      z: point.z + side * pass * ux,
    };
  }

  /**
   * How far the front of the chest stands ahead of the ankles' midpoint in the
   * standing posture, metres: the sternum region's forward offset with the
   * body's upright alignment and lean.
   *
   * @param body The body.
   * @returns Metres.
   */
  export function chest(body: IAutoMovieMotionHumanBody): number {
    const posture: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const sternum: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "sternum",
    ).point;
    const ankles: number =
      (posture.limbs.leftLeg!.point.z + posture.limbs.rightLeg!.point.z) / 2;
    return sternum.z - ankles;
  }
}
