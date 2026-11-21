import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { getUp } from "../floor/getUp";
import { HumanHand } from "../posture/HumanHand";
import { treeLimbs } from "./treeLimbs";

/** Seconds per single hand or foot move (provisional). */
const BEAT: number = 0.6;

/** The near and far hold on a branch, metres out from the trunk face (provisional: two hands' widths apart, near the strong root). */
const HOLDS: readonly [number, number] = [0.15, 0.45];

/** The near and far foot on a branch's top, metres out from the trunk face (provisional). */
const STEPS: readonly [number, number] = [0.25, 0.5];

/** The feet's heights walking up the bole, metres above its foot (provisional: a knee-high and a hip-high step). */
const WALK: readonly [number, number] = [0.45, 0.9];

/** A foot's slide either side of the line facing the bole, metres (provisional: the feet hip width apart). */
const SPLAY: number = 0.12;

/** A hand's slide either side on the bole when no branch is above, metres (provisional: a hug's span). */
const HUG: number = 0.2;

/** The astride sitting pose: the thighs spread over the branch, the shins hanging, the hands forward on it (provisional). */
const ASTRIDE: IAutoMovieMotionHumanLieDown.IPose = {
  pitch: 10,
  roll: 0,
  joints: {
    ...HumanHand.shape("left", "grip"),
    ...HumanHand.shape("right", "grip"),
    leftUpperLeg: [70, 30, 0],
    rightUpperLeg: [70, 30, 0],
    leftLowerLeg: [80, 0, 0],
    rightLowerLeg: [80, 0, 0],
    leftUpperArm: [60, 10, 0],
    rightUpperArm: [60, 10, 0],
    leftLowerArm: [20, 0, 0],
    rightLowerArm: [20, 0, 0],
  },
};

/**
 * A tree climb's stances on staged points of the tree, one hand or foot
 * moving at a time: the route up grips the lowest branch from the ground,
 * walks the feet up the bole, hooks a heel over the branch and stands on
 * it, then for each higher branch moves the hands up to the next hold and
 * steps the feet up; the descent replays it reversed. Every stance is
 * checked against the branches' loads with the body's weight shared evenly
 * by its bearing contacts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the route, the single-move rule and the load check.
 * @evidence contracts/development/design.md#principled-representation Staged holds keyed by name, with their world point and normal, and stances of holds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The route builders and the staged-point lookup planTreeClimb needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every hold lies on a branch or the bole; a stance a branch cannot bear refuses.
 */
export namespace treeClimbRoute {
  /**
   * A staged hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The body part, how it touches, the point's name, world point and outward normal, and the branch and distance it loads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a stance and the load check read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by the route.
   */
  export interface IHold {
    /** The body part. */
    part: IAutoMovieMotionHumanSupport.IContact["part"];

    /** How it touches. */
    kind: "bear" | "grip";

    /** The staged point's name. */
    key: string;

    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** Its surface's outward normal. */
    normal: IAutoMovieVector3;

    /** The branch it loads and how far out, or undefined on the bole or the ground. */
    branch?: ILoad;
  }

  /**
   * Where a hold loads a branch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The branch index and the distance from its root.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the load check reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by the route.
   */
  export interface ILoad {
    /** The branch, from 0. */
    index: number;

    /** Metres out from the trunk face. */
    out: number;
  }

  /**
   * The expanded route.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The support stances and the staged holds by name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What planTreeClimb hands the support law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by expand.
   */
  export interface IRoute {
    /** The support stances. */
    stances: IAutoMovieMotionHumanSupport.IStance[];

    /** Every staged hold by its key. */
    staged: Map<string, IHold>;
  }

  /**
   * A stance of holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The holds, the event and the preferred pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the support plan is built from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by the route.
   */
  export interface IStance {
    /** The holds. */
    holds: IHold[];

    /** The event the stance is held at. */
    event: string;

    /** The pose the stance's solve stays nearest. */
    prefer?: IAutoMovieMotionHumanLieDown.IPose;
  }

  /**
   * The stances from the ground to standing on a branch, before expansion.
   *
   * @param body The canonical motion body.
   * @param tree The tree.
   * @param ground The feet's standing holds at the start.
   * @param toward Unit horizontal from the bole's axis toward the climber.
   * @param top The branch stood on at the end.
   * @returns The stances.
   * @throws {HumanRefusal} If the lowest branch is beyond the standing reach or the branch does not exist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the route and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Hand and foot points on the branches and the bole, sided so the right hand takes the hold on the climber's right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ground phase, then one block per branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A branch out of reach refuses with its height; the distances are provisional and stated as such.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the branches climbed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function up(
    body: IAutoMovieMotionHumanBody,
    tree: treeLimbs.ITree,
    ground: readonly IHold[],
    toward: IAutoMovieVector3,
    top: number,
  ): IStance[] {
    if (!(Number.isInteger(top) && top >= 0 && top < tree.branches.length))
      throw treeLimbs.refusal(
        "branch",
        top,
        `the tree has branches 0 to ${tree.branches.length - 1}`,
      );
    const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const lowest: treeLimbs.IBranch = tree.branches[0]!;
    const reach: number =
      measure.shoulderHeight + measure.upperArm + measure.forearm;
    const height: number = lowest.root.y - tree.bole.foot.y;
    if (height > reach)
      throw treeLimbs.refusal(
        "branch",
        0,
        `the lowest branch is ${height.toFixed(3)} m up, beyond the ${reach.toFixed(3)} m standing reach`,
      );
    // The climber faces the bole: their right is to the right of -toward.
    const right: IAutoMovieVector3 = { x: toward.z, y: 0, z: -toward.x };
    const sided = (
      branch: treeLimbs.IBranch,
      pair: readonly [number, number],
    ): Record<AutoMovieHumanSide, number> =>
      Vector3.dot(branch.direction, right) >= 0
        ? { left: pair[0], right: pair[1] }
        : { left: pair[1], right: pair[0] };
    const grip = (
      branch: treeLimbs.IBranch,
      side: AutoMovieHumanSide,
    ): IHold => {
      const out: number = sided(branch, HOLDS)[side];
      return {
        part: `${side}Hand`,
        kind: "grip",
        key: `${side}Hand@b${branch.index}`,
        point: treeLimbs.on(branch, out, 0),
        normal: { x: 0, y: 1, z: 0 },
        branch: { index: branch.index, out },
      };
    };
    const stand = (
      branch: treeLimbs.IBranch,
      side: AutoMovieHumanSide,
    ): IHold => {
      const out: number = sided(branch, STEPS)[side];
      return {
        part: `${side}Foot`,
        kind: "bear",
        key: `${side}Foot@b${branch.index}`,
        point: treeLimbs.on(branch, out, 1),
        normal: { x: 0, y: 1, z: 0 },
        branch: { index: branch.index, out },
      };
    };
    const bole = (
      side: AutoMovieHumanSide,
      height: number,
      hand: boolean,
    ): IHold => {
      const aside: number = (side === "right" ? 1 : -1) * (hand ? HUG : SPLAY);
      const point: IAutoMovieVector3 = treeLimbs.face(
        tree,
        height,
        toward,
        aside,
      );
      return {
        part: `${side}${hand ? "Hand" : "Foot"}`,
        kind: hand ? "grip" : "bear",
        key: `${side}${hand ? "Hand" : "Foot"}@bole${height.toFixed(3)}`,
        point,
        normal: Vector3.normalize({
          x: point.x - tree.bole.foot.x,
          y: 0,
          z: point.z - tree.bole.foot.z,
        }),
      };
    };
    const hands = (k: number): IHold[] => {
      const next: treeLimbs.IBranch | undefined = tree.branches[k + 1];
      if (next !== undefined) return [grip(next, "left"), grip(next, "right")];
      const at: number =
        tree.branches[k]!.root.y - tree.bole.foot.y + measure.shoulderHeight;
      return [bole("left", at, true), bole("right", at, true)];
    };
    const left: IHold = ground.find(
      (hold: IHold): boolean => hold.part === "leftFoot",
    )!;
    const rightFoot: IHold = ground.find(
      (hold: IHold): boolean => hold.part === "rightFoot",
    )!;
    const stances: IStance[] = [
      { holds: [left, rightFoot], event: "floor", prefer: getUp.POSES.stood },
      {
        holds: [left, rightFoot, grip(lowest, "left"), grip(lowest, "right")],
        event: "grip",
      },
      {
        holds: [
          bole("left", WALK[0], false),
          bole("right", WALK[1], false),
          grip(lowest, "left"),
          grip(lowest, "right"),
        ],
        event: "walkUp",
      },
      {
        holds: [
          stand(lowest, "left"),
          bole("right", WALK[1], false),
          grip(lowest, "left"),
          grip(lowest, "right"),
        ],
        event: "hook",
      },
      {
        holds: [stand(lowest, "left"), stand(lowest, "right"), ...hands(0)],
        event: "stand0",
        prefer: getUp.POSES.stood,
      },
    ];
    for (let k: number = 1; k <= top; k++) {
      const branch: treeLimbs.IBranch = tree.branches[k]!;
      const below: treeLimbs.IBranch = tree.branches[k - 1]!;
      stances.push({
        holds: [stand(branch, "left"), stand(below, "right"), ...hands(k - 1)],
        event: `step${k}`,
      });
      stances.push({
        holds: [stand(branch, "left"), stand(branch, "right"), ...hands(k)],
        event: `stand${k}`,
        prefer: getUp.POSES.stood,
      });
    }
    return stances;
  }

  /**
   * Sit astride a branch from standing on it.
   *
   * @param tree The tree.
   * @param index The branch.
   * @returns The stance sat in: the seat on the branch's seat, the hands on the branch ahead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stance.
   * @evidence contracts/development/implementation.md#principled-implementation The seat on the published seat point and two grips further out on the same branch, shaped by the astride pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The legs hang by the preferred pose, with no hold.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sit(tree: treeLimbs.ITree, index: number): IStance {
    const branch: treeLimbs.IBranch = tree.branches[index]!;
    const seatOut: number = Vector3.dot(
      Vector3.subtract(branch.seat, branch.root),
      branch.direction,
    );
    const hold = (side: AutoMovieHumanSide, out: number): IHold => ({
      part: `${side}Hand`,
      kind: "grip",
      key: `${side}Hand@seat${index}`,
      point: treeLimbs.on(branch, out, 0),
      normal: { x: 0, y: 1, z: 0 },
      branch: { index, out },
    });
    return {
      holds: [
        {
          part: "seat",
          kind: "bear",
          key: `seat${index}`,
          point: branch.seat,
          normal: { x: 0, y: 1, z: 0 },
          branch: { index, out: seatOut },
        },
        hold("left", seatOut + 0.25),
        hold("right", seatOut + 0.4),
      ],
      event: "astride",
      prefer: ASTRIDE,
    };
  }

  /**
   * Expand stances so one hold changes at a time, and check every one against the branches' loads.
   *
   * @param body The canonical motion body.
   * @param tree The tree.
   * @param stances The stances in order.
   * @returns The support stances, with every staged point by name.
   * @throws {HumanRefusal} If a stance loads a branch past its limit, naming the branch and the load.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the expansion, the load share and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Additions first, then moves, then removals, so the contact count stays at its highest between stances; each contact bears the weight over the count.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the stances, one over each change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An overloaded branch refuses; no hold is dropped to pass.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the stances times the parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points for the plan.
   */
  export function expand(
    body: IAutoMovieMotionHumanBody,
    tree: treeLimbs.ITree,
    stances: readonly IStance[],
  ): IRoute {
    const weight: number = body.massModel.mass * AutoMovieGravity.STANDARD;
    const staged: Map<string, IHold> = new Map();
    const out: IAutoMovieMotionHumanSupport.IStance[] = [];
    const emit = (
      holds: readonly IHold[],
      event: string,
      prefer?: IAutoMovieMotionHumanLieDown.IPose,
    ): void => {
      const share: number = weight / Math.max(1, holds.length);
      for (const hold of holds) {
        staged.set(hold.key, hold);
        if (hold.branch === undefined) continue;
        const branch: treeLimbs.IBranch = tree.branches[hold.branch.index]!;
        const bound: number = treeLimbs.limit(branch, hold.branch.out);
        if (share > bound)
          throw treeLimbs.refusal(
            "branch",
            hold.branch.index,
            `branch ${hold.branch.index} bears ${bound.toFixed(0)} N ${hold.branch.out.toFixed(2)} m out, but the ${hold.part} loads it with ${share.toFixed(0)} N`,
          );
      }
      out.push({
        contacts: holds.map(
          (hold: IHold): IAutoMovieMotionHumanSupport.IContact => ({
            part: hold.part,
            kind: hold.kind,
            target: { kind: "prop", subject: tree.subject, point: hold.key },
          }),
        ),
        seconds: BEAT,
        event,
        ...(prefer === undefined ? {} : { prefer }),
      });
    };
    let current: IHold[] = [];
    for (const stance of stances) {
      if (out.length === 0) {
        emit(stance.holds, stance.event, stance.prefer);
        current = [...stance.holds];
        continue;
      }
      const parts: string[] = [
        ...new Set(
          [...current, ...stance.holds].map((hold: IHold): string => hold.part),
        ),
      ];
      const of = (holds: readonly IHold[], part: string): IHold | undefined =>
        holds.find((hold: IHold): boolean => hold.part === part);
      const rank = (part: string): number =>
        of(current, part) === undefined
          ? 0
          : of(stance.holds, part) === undefined
            ? 2
            : 1;
      const changes: string[] = parts
        .filter(
          (part: string): boolean =>
            of(current, part)?.key !== of(stance.holds, part)?.key,
        )
        .sort((a: string, b: string): number => rank(a) - rank(b));
      changes.forEach((part: string, i: number): void => {
        const next: IHold | undefined = of(stance.holds, part);
        current = current.filter((hold: IHold): boolean => hold.part !== part);
        if (next !== undefined) current.push(next);
        const last: boolean = i === changes.length - 1;
        emit(
          current,
          last ? stance.event : `${stance.event}${part}`,
          last ? stance.prefer : undefined,
        );
      });
    }
    return { stances: out, staged };
  }
}
