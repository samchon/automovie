import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanWalkFacing,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { walkPaced } from "../actions/walkPaced";
import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/** The record of `IPlanLast`'s site. */
type IPlanLast = { mid: IAutoMovieVector3; turn: number };

/** The record of `IAskedH`'s site. */
type IAskedH = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IAskedResult`'s site. */
type IAskedResult = { mid: IAutoMovieVector3; turn: number };

/** The record of `IPlanTaken`'s site. */
type IPlanTaken = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IPropsHandle`'s site. */
type IPropsHandle = {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
};

/**
 * The walk a person takes with a door they pull open, the hand on its handle: a
 * walk that keeps the place relative to the leaf the handle was taken from, at
 * the handle's own pace.
 *
 * The stance a held handle asks at a second is the taking stance carried with
 * the handle, turned by the leaf's turn (the handle's normal turning about the
 * vertical) and moved with the point the hand holds. A leaf turns about its
 * hinge, so that stance turns about the hinge too: the walk goes the feet's
 * midpoint along those stances, facing the hinge turned by the angle it faced
 * it at the take (`walk`'s `facing`), backward and round the leaf as it comes
 * toward the person, and is played on the handle's clock (`walkPaced`): the
 * person pulls the door, so the body has gone the share of its way the stance
 * has gone of its own, setting off as the leaf does and closing at its own pace
 * once it rests, never stepping faster than the walk's fastest cadence
 * (`HURRY`), so a leaf swung faster leaves it behind. Humanoid
 * loco-manipulation plans the feet the same way, so the hand's target stays
 * inside the arm's reachable region along the object's path (Murooka et al.
 * 2025, arXiv:2508.11275).
 */
export namespace HumanTravelLeafWalk {
  /** The door law's entry, action clock and actual held-handle path. */
  export interface IProps {
    /** The door law's context; its entry is where the walk starts. */
    context: IAutoMovieMotionHumanActionContext<object>;

    /** The action's length, seconds. */
    seconds: number;

    /** When the hand has taken the handle, seconds from the start. */
    take: number;

    /**
     * Where the hand holds the handle at an action-local second, metres in
     * world coordinates, with the handle's outward world normal.
     */
    handle: (seconds: number) => IPropsHandle;
  }

  /** Readings of the handle's path, seconds apart. */
  const TICK: number = 1 / 24;

  /** The spacing of the walk's way points, seconds of the handle's path. */
  const SPACING: number = 0.2;

  /**
   * The most the handle may hurry the walk, a multiple of its own cadence: the
   * walking gait's cadence at the walk-to-run transition, Froude 0.5 (Kram,
   * Domingo and Ferris 1997, J Exp Biol 200:821), over its normal pace's, since
   * `walk.walking`'s cadence grows as the fourth root of the Froude number; the
   * footprints are the walk's own, so only the cadence can rise.
   */
  const HURRY: number = (0.5 / walk.FROUDE.normal) ** 0.25;

  /**
   * The walk that keeps the take relation, re-timed to the handle; none when
   * the handle does not move.
   *
   * @param props The context, the timing and the handle's path.
   * @returns The plan, in the action's seconds; null when the leaf does not
   *   turn.
   * @throws {HumanRefusal} Whatever the walk refuses (an obstacle in the way).
   */
  export function plan(props: IProps): IAutoMovieMotionHumanActionPlan | null {
    const { context, seconds, take }: IProps = props;
    const entry: IAutoMovieMotionHumanActionContext["entry"] = context.entry;
    const yaw0: number = entry.posture.yaw;
    const mid0: IAutoMovieVector3 = {
      x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
      y: 0,
      z: (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2,
    };
    const heading: (v: IAutoMovieVector3) => number = (
      v: IAutoMovieVector3,
    ): number => (Math.atan2(v.x, v.z) * 180) / Math.PI;
    const turned: (from: number, to: number) => number = (
      from: number,
      to: number,
    ): number => ((((to - from) % 360) + 540) % 360) - 180;
    const yaw: ReturnType<typeof Quaternion.prepareAxisAngle> =
      Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
    const yawY: (v: IAutoMovieVector3, degrees: number) => IAutoMovieVector3 = (
      v: IAutoMovieVector3,
      degrees: number,
    ): IAutoMovieVector3 => Quaternion.rotateVector(yaw(degrees), v);
    const taken: IPlanTaken = props.handle(take);
    const local: IAutoMovieVector3 = Vector3.subtract(taken.point, mid0);
    const takenHeading: number = heading(taken.normal);

    // The feet's midpoint and the turn the take relation asks at a second.
    function asked(t: number): IAskedResult {
      const h: IAskedH = props.handle(t);
      const turn: number = turned(takenHeading, heading(h.normal));
      const at: IAutoMovieVector3 = Vector3.subtract(
        h.point,
        yawY(local, turn),
      );
      return { mid: { x: at.x, y: 0, z: at.z }, turn };
    }

    // Where the swing ends: the last reading at which the stance moves.
    let rests: number = take;
    let before: IAutoMovieVector3 = asked(take).mid;
    for (let t: number = take + TICK; t <= seconds + 1e-9; t += TICK) {
      const now: IAutoMovieVector3 = asked(t).mid;
      if (Vector3.length(Vector3.subtract(now, before)) > 1e-4) rests = t;
      before = now;
    }
    const last: IPlanLast = asked(rests);
    if (rests <= take || Math.abs(last.turn) < 1) return null;

    // The way, its points a spacing apart along the handle's path.
    const way: IAutoMovieVector3[] = [];
    for (let t: number = take + SPACING; t < rests; t += SPACING) {
      const p: IAutoMovieVector3 = asked(t).mid;
      const prior: IAutoMovieVector3 = way.at(-1) ?? mid0;
      if (Vector3.length(Vector3.subtract(p, prior)) > 0.02) way.push(p);
    }

    // The hinge: the centre the stance turns about, from the first and the
    // last, and the angle the body faced it at.
    const r: number = (last.turn * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    // p1 = C + R (p0 - C), R turning +Z to (sin, cos): (I - R) C = p1 - R p0.
    const rotated: IAutoMovieVector3 = yawY(mid0, last.turn);
    const bx: number = last.mid.x - rotated.x;
    const bz: number = last.mid.z - rotated.z;
    // I - R = [[1 - c, -s], [s, 1 - c]] on (x, z) for a turn about +Y.
    const det: number = (1 - c) ** 2 + s ** 2;
    const hinge: IAutoMovieVector3 = {
      x: ((1 - c) * bx + s * bz) / det,
      y: 0,
      z: (-s * bx + (1 - c) * bz) / det,
    };
    const facing: IAutoMovieMotionHumanWalkFacing.IFacing = {
      toward: hinge,
      turn: turned(heading(Vector3.subtract(hinge, mid0)), yaw0),
    };
    const walked: IAutoMovieMotionHumanActionPlan = walkOnEntryFloor(context, {
      to: last.mid,
      ...(way.length === 0 ? {} : { via: way }),
      facing,
      armSwing: 0,
    });
    // The person drives the door, so the walk keeps pace with it, not
    // behind it: at each second the body has gone the share of its way the
    // stance it asks has gone of its own, and once the leaf rests the walk
    // closes at its own pace.
    const travelled: (
      at: (t: number) => IAutoMovieVector3,
      to: number,
    ) => number[] = (
      at: (t: number) => IAutoMovieVector3,
      to: number,
    ): number[] => {
      const lengths: number[] = [0];
      let prior: IAutoMovieVector3 = at(0);
      for (let i: number = 1; i * TICK <= to + 1e-9; i++) {
        const p: IAutoMovieVector3 = at(i * TICK);
        lengths.push(
          lengths.at(-1)! + Math.hypot(p.x - prior.x, p.z - prior.z),
        );
        prior = p;
      }
      return lengths;
    };
    const stance: number[] = travelled(
      (t: number): IAutoMovieVector3 => asked(Math.max(take, t)).mid,
      rests,
    );
    const walking: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const went: number[] = travelled(
      (t: number): IAutoMovieVector3 =>
        walked.posture(t, ["root"], walking).root,
      walked.duration,
    );
    const total: number = went.at(-1)!;
    const reached: (length: number) => number = (length: number): number => {
      let i: number = 0;
      let end: number = went.length - 1;
      while (i < end) {
        const middle: number = Math.floor((i + end) / 2);
        if (went[middle + 1]! < length) i = middle + 1;
        else end = middle;
      }
      const span: number =
        (i + 1 < went.length ? went[i + 1]! : went[i]!) - went[i]!;
      return Math.min(
        walked.duration,
        (i + (span > 1e-12 ? (length - went[i]!) / span : 0)) * TICK,
      );
    };
    // No faster than the walk's fastest cadence: a leaf swung faster leaves
    // the walk behind, and the hand loses the handle.
    const span: number = Math.max(1e-9, stance.at(-1)!);
    const clock: number[] = [];
    for (const length of stance)
      clock.push(
        Math.min(
          reached((length / span) * total),
          (clock.at(-1) ?? -HURRY * TICK) + HURRY * TICK,
        ),
      );
    for (let at: number = clock.at(-1)!; at < walked.duration; )
      clock.push((at = Math.min(walked.duration, at + TICK)));
    return walkPaced(walked, TICK, clock);
  }

  /**
   * Match the walk's level datum to the planted feet's floor and return its
   * poses and contacts in world space. The path and obstacle check keep their
   * XZ coordinates, and obstacle heights are already floor-relative.
   */
  function walkOnEntryFloor(
    context: IAutoMovieMotionHumanActionContext<object>,
    params: IAutoMovieMotionHumanWalkParams,
  ): IAutoMovieMotionHumanActionPlan {
    const entry: IAutoMovieMotionHumanEntryState = context.entry;
    const floor: number = HumanSupportFrame.floor(context.body, entry);
    if (floor === 0) return walk.plan({ ...context, params });

    const frame: HumanFrame.IPrepared = HumanFrame.prepare({
      origin: { x: 0, y: floor, z: 0 },
      yaw: 0,
    });
    const lower: IAutoMovieMotionHumanSupportCarry.ICarry = {
      point: frame.local,
      turn: Quaternion.identity(),
      yaw: 0,
    };
    const raise: IAutoMovieMotionHumanSupportCarry.ICarry = {
      ...lower,
      point: frame.point,
    };
    const root: IAutoMovieTransform = entry.pose.root ?? Transform.identity();
    const walked: IAutoMovieMotionHumanActionPlan = walk.plan({
      ...context,
      params,
      entry: {
        ...entry,
        pose: {
          ...entry.pose,
          root: { ...root, translation: frame.local(root.translation) },
        },
        posture: HumanSupportCarry.posture(lower, entry.posture),
        feet: {
          left: {
            ...entry.feet.left,
            ankle: frame.local(entry.feet.left.ankle),
          },
          right: {
            ...entry.feet.right,
            ankle: frame.local(entry.feet.right.ankle),
          },
        },
        supports: entry.supports.map(
          (
            contact: IAutoMovieMotionHumanEntryState.ISupport,
          ): IAutoMovieMotionHumanEntryState.ISupport =>
            contact.support.kind === "ground" &&
            contact.support.height !== undefined
              ? {
                  ...contact,
                  support: {
                    kind: "ground",
                    height: contact.support.height - floor,
                  },
                }
              : contact,
        ),
      },
    });
    return {
      ...walked,
      contacts: walked.contacts.map(
        (
          contact: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow =>
          contact.support.kind === "ground"
            ? {
                ...contact,
                support: {
                  kind: "ground",
                  height: floor + (contact.support.height ?? 0),
                },
              }
            : contact,
      ),
      posture: (
        ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
      ): ReturnType<IAutoMovieMotionHumanActionPlan["posture"]> =>
        HumanSupportCarry.posture(raise, walked.posture(...args)),
    };
  }
}
