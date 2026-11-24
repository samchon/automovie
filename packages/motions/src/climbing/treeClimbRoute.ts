import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { getUp } from "../floor/getUp";
import { treeClimbRouteForms } from "./treeClimbRouteForms";
import { treeLimbs } from "./treeLimbs";

/** The alternatives of `HoldKind`'s site. */
type HoldKind = "bear" | "grip";

/**
 * A tree climb's stances on staged points of the tree, one hand or foot moving
 * at a time: the route up grips the lowest branch from the ground, walks the
 * feet up the bole, hooks a heel over the branch and stands on it, then for
 * each higher branch moves the hands up to the next hold and steps the feet up;
 * the descent replays it reversed. Every stance is checked against the
 * branches' loads with the body's weight shared evenly by its bearing
 * contacts.
 */
export namespace treeClimbRoute {
  /** A staged hold. */
  export interface IHold {
    /** The body part. */
    part: IAutoMovieMotionHumanSupport.IContact["part"];

    /** How it touches. */
    kind: HoldKind;

    /** The staged point's name. */
    key: string;

    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** Its surface's outward normal. */
    normal: IAutoMovieVector3;

    /**
     * The branch it loads and how far out, or undefined on the bole or the
     * ground.
     */
    branch?: ILoad;
  }

  /** Where a hold loads a branch. */
  export interface ILoad {
    /** The branch, from 0. */
    index: number;

    /** Metres out from the trunk face. */
    out: number;
  }

  /** The expanded route. */
  export interface IRoute {
    /** The support stances. */
    stances: IAutoMovieMotionHumanSupport.IStance[];

    /** Every staged hold by its key. */
    staged: Map<string, IHold>;
  }

  /** A stance of holds. */
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
   * @throws {HumanRefusal} If the lowest branch is beyond the standing reach or
   *   the branch does not exist.
   */
  export function up(
    body: IAutoMovieMotionHumanBody,
    tree: treeLimbs.ITree,
    ground: readonly IHold[],
    toward: IAutoMovieVector3,
    top: number,
  ): IStance[] {
    if (!(top >= 0 && top < tree.branches.length))
      throw treeLimbs.refusal(
        "branch",
        top,
        `the tree has branches 0 to ${tree.branches.length - 1}`,
      );
    const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const WALK: readonly [number, number] =
      treeClimbRouteForms.walkHeights(measure);
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
    // A lowest branch that runs more along that facing than across it (one
    // pointing at the climber) is climbed facing across it, as a horizontal
    // bar orthogonal to the body is (`across`): the climber's right then
    // runs along the branch, so every hold is sided by that facing.
    const facing: IAutoMovieVector3 = { x: toward.z, y: 0, z: -toward.x };
    const along: boolean =
      Math.abs(Vector3.dot(lowest.direction, facing)) < Math.SQRT1_2;
    const right: IAutoMovieVector3 = along
      ? Vector3.scale(lowest.direction, -1)
      : facing;
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
      const out: number = sided(branch, treeClimbRouteForms.HOLDS)[side];
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
      const out: number = sided(branch, treeClimbRouteForms.STEPS)[side];
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
      const aside: number =
        (side === "right" ? 1 : -1) *
        (hand ? treeClimbRouteForms.HUG : treeClimbRouteForms.SPLAY);
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
    // Standing on branch k the hands take the next branch, unless its grips
    // lie further round or out than an arm from the feet; then they hug the
    // bole at shoulder height.
    const arm: number = measure.upperArm + measure.forearm;
    const hands: (k: number) => IHold[] = (k: number): IHold[] => {
      const next: treeLimbs.IBranch | undefined = tree.branches[k + 1];
      const feet: IAutoMovieVector3 = Vector3.lerp(
        stand(tree.branches[k]!, "left").point,
        stand(tree.branches[k]!, "right").point,
        0.5,
      );
      const grips: IHold[] =
        next === undefined ? [] : [grip(next, "left"), grip(next, "right")];
      if (
        grips.length > 0 &&
        grips.every(
          (hold: IHold): boolean =>
            Math.hypot(hold.point.x - feet.x, hold.point.z - feet.z) <= arm,
        )
      )
        return grips;
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
    // The route onto a branch climbed facing across it: the feet step one at
    // a time from where they stand to under the branch beside its root, the
    // bar a hand's length ahead of the shoulders' plane (provisional: a
    // pull-up's bar just ahead of the face), the hands take it side by side,
    // the left heel hooks over it with the right foot still on the floor, so
    // three contacts bear throughout, and the body stands on it. No step on
    // the bole: it stands to the climber's side.
    const across: (from: IHold, to: IHold) => IStance[] = (
      from: IHold,
      to: IHold,
    ): IStance[] => {
      const ahead: IAutoMovieVector3 = { x: -right.z, y: 0, z: right.x };
      const under: IAutoMovieVector3 = treeLimbs.on(
        lowest,
        (treeClimbRouteForms.HOLDS[0] + treeClimbRouteForms.HOLDS[1]) / 2,
        0,
      );
      const centre: IAutoMovieVector3 = Vector3.addScaled(
        { x: under.x, y: from.point.y, z: under.z },
        ahead,
        -measure.hand,
      );
      const placed: (hold: IHold, side: AutoMovieHumanSide) => IHold = (
        hold: IHold,
        side: AutoMovieHumanSide,
      ): IHold => ({
        ...hold,
        key: `${hold.key}@across`,
        point: Vector3.addScaled(
          centre,
          right,
          (side === "right" ? 1 : -1) * treeClimbRouteForms.SPLAY,
        ),
      });
      const leftFloor: IHold = placed(from, "left");
      const rightFloor: IHold = placed(to, "right");
      const grips: IHold[] = [grip(lowest, "left"), grip(lowest, "right")];
      // The steps on the bole are on its face toward where the climber now
      // stands, under the grip.
      const facingBole: IAutoMovieVector3 = Vector3.normalize({
        x: centre.x - tree.bole.foot.x,
        y: 0,
        z: centre.z - tree.bole.foot.z,
      });
      const step: (side: AutoMovieHumanSide, height: number) => IHold = (
        side: AutoMovieHumanSide,
        height: number,
      ): IHold => {
        const point: IAutoMovieVector3 = treeLimbs.face(
          tree,
          height,
          facingBole,
          (side === "right" ? 1 : -1) * treeClimbRouteForms.SPLAY,
        );
        return {
          part: `${side}Foot`,
          kind: "bear",
          key: `${side}Foot@bole${height.toFixed(3)}@across`,
          point,
          normal: Vector3.normalize({
            x: point.x - tree.bole.foot.x,
            y: 0,
            z: point.z - tree.bole.foot.z,
          }),
        };
      };
      return [
        { holds: [from, to], event: "floor", prefer: getUp.POSES.stood },
        {
          holds: [leftFloor, to],
          event: "stepLeft",
          prefer: getUp.POSES.stood,
        },
        {
          holds: [leftFloor, rightFloor],
          event: "stepRight",
          prefer: getUp.POSES.stood,
        },
        { holds: [leftFloor, rightFloor, ...grips], event: "grip" },
        {
          holds: [step("left", WALK[0]), step("right", WALK[1]), ...grips],
          event: "walkUp",
        },
        // The heel hooks at the near foothold, by the root and the hands,
        // the nearest of the branch's top a heel lifted from the bole reaches.
        {
          holds: [
            {
              ...stand(lowest, "left"),
              key: `leftFoot@b${lowest.index}@hook`,
              point: treeLimbs.on(lowest, treeClimbRouteForms.STEPS[0], 1),
              branch: {
                index: lowest.index,
                out: treeClimbRouteForms.STEPS[0],
              },
            },
            step("right", WALK[1]),
            ...grips,
          ],
          event: "hook",
          prefer: treeClimbRouteForms.HOOK,
        },
        {
          holds: [stand(lowest, "left"), stand(lowest, "right"), ...hands(0)],
          event: "stand0",
          prefer: getUp.POSES.stood,
        },
      ];
    };
    const stances: IStance[] = along
      ? across(left, rightFoot)
      : [
          {
            holds: [left, rightFoot],
            event: "floor",
            prefer: getUp.POSES.stood,
          },
          {
            holds: [
              left,
              rightFoot,
              grip(lowest, "left"),
              grip(lowest, "right"),
            ],
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
            prefer: treeClimbRouteForms.HOOK,
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
   * Sit astride a branch from standing on it: the hands keep their holds above
   * while the feet leave the branch, the body hanging from them, then the seat
   * comes down onto the branch's seat with the legs either side.
   *
   * @param tree The tree.
   * @param standing The stance stood in on the branch.
   * @param index The branch.
   * @returns The hang and the astride stance.
   */
  export function sit(
    tree: treeLimbs.ITree,
    standing: IStance,
    index: number,
  ): IStance[] {
    const branch: treeLimbs.IBranch = tree.branches[index]!;
    const seatOut: number = Vector3.dot(
      Vector3.subtract(branch.seat, branch.root),
      branch.direction,
    );
    const hands: IHold[] = standing.holds.filter(
      (hold: IHold): boolean => hold.kind === "grip",
    );
    return [
      { holds: hands, event: "lift", prefer: treeClimbRouteForms.ASTRIDE },
      {
        holds: [
          {
            part: "seat",
            kind: "bear",
            key: `seat${index}`,
            point: branch.seat,
            normal: { x: 0, y: 1, z: 0 },
            branch: { index, out: seatOut },
          },
          ...hands,
        ],
        event: "astride",
        prefer: treeClimbRouteForms.ASTRIDE,
      },
    ];
  }
}
