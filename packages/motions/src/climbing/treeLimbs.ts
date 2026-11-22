import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A climbable tree read from its affordances in world metres: the bole as a
 * vertical bar and each lower branch as a level bar with its astride seat.
 * A branch's load limit falls off with the distance from its root as a
 * cantilever's does: the published load at the bar's frame, half the
 * branch out, scaled by that half length over the distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the representation and the load rule.
 * @evidence contracts/development/design.md#principled-representation The bole's axis and radius, and each branch's root, direction, length, radius, frame load and seat.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader, the points the climb stages and the load limit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from the placed prop; a moving tree or one without branches is refused.
 */
export namespace treeLimbs {
  /**
   * The bole.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The axis's foot, its height and the radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the climb reads of the trunk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by read.
   */
  export interface IBole {
    /** The axis at the ground, world metres. */
    foot: IAutoMovieVector3;

    /** The radius, metres. */
    radius: number;
  }

  /**
   * One lower branch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The root on the trunk face, a unit direction, the length, the radius, the frame load and the seat.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the climb reads of a branch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by read.
   */
  export interface IBranch {
    /** Its index from the lowest. */
    index: number;

    /** The axis at the trunk face, world metres. */
    root: IAutoMovieVector3;

    /** Unit direction out along it. */
    direction: IAutoMovieVector3;

    /** Length from the trunk face, metres. */
    length: number;

    /** Radius, metres. */
    radius: number;

    /** The load it bears half its length out, newtons; unbounded when the tree states none. */
    load: number;

    /** The astride seat on its top, world metres. */
    seat: IAutoMovieVector3;
  }

  /**
   * A tree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The bole and the branches from the lowest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The whole reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by read.
   */
  export interface ITree {
    /** The prop's subject. */
    subject: string;

    /** The bole. */
    bole: IBole;

    /** The branches, lowest first. */
    branches: IBranch[];
  }

  /**
   * Read a tree.
   *
   * @param context The action's context.
   * @param subject The tree prop.
   * @returns The tree.
   * @throws {HumanRefusal} If the prop moves or has no bole and branches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms each bar's frame to the world and takes its root half a length in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, then one pass over the affordances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a tree it cannot read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    subject: string,
  ): ITree {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const items: readonly IAutoMovieAffordance[] =
      reader.prop.affordances ?? [];
    const bole: IAutoMovieAffordance | undefined = items.find(
      (item: IAutoMovieAffordance): boolean => item.id === "bole",
    );
    if (
      reader.prop.motion !== undefined ||
      bole?.radius === undefined ||
      bole.length === undefined
    )
      throw refusal(
        "tree",
        subject,
        `${subject} is no fixed tree with a bole and branches`,
      );
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const place = (item: IAutoMovieAffordance): IAutoMovieVector3 =>
      Vector3.add(
        world.position,
        Quaternion.rotateVector(world.rotation, item.frame.translation),
      );
    const axis = (item: IAutoMovieAffordance): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.multiply(world.rotation, item.frame.rotation),
        { x: 1, y: 0, z: 0 },
      );
    const centre: IAutoMovieVector3 = place(bole);
    const branches: IBranch[] = [];
    for (let k: number = 0; ; k++) {
      const bar: IAutoMovieAffordance | undefined = items.find(
        (item: IAutoMovieAffordance): boolean => item.id === `branch${k}`,
      );
      const seat: IAutoMovieAffordance | undefined = items.find(
        (item: IAutoMovieAffordance): boolean => item.id === `seat${k}`,
      );
      if (
        bar?.length === undefined ||
        bar.radius === undefined ||
        seat === undefined
      )
        break;
      const direction: IAutoMovieVector3 = axis(bar);
      branches.push({
        index: k,
        root: Vector3.add(
          place(bar),
          Vector3.scale(direction, -bar.length / 2),
        ),
        direction,
        length: bar.length,
        radius: bar.radius,
        load: bar.load ?? Infinity,
        seat: place(seat),
      });
    }
    if (branches.length === 0)
      throw refusal("tree", subject, `${subject} has no branches to climb`);
    return {
      subject,
      bole: {
        foot: { ...centre, y: centre.y - bole.length / 2 },
        radius: bole.radius,
      },
      branches,
    };
  }

  /**
   * A branch's axis point a distance out from the trunk face, lifted by a share of its radius.
   *
   * @param branch The branch.
   * @param out Metres from the trunk face.
   * @param lift Radii above the axis: 0 for a grip, 1 for a foot on top.
   * @returns The point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation The root plus the direction times the distance plus up times the lift.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A distance past the tip is clamped to it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function on(
    branch: IBranch,
    out: number,
    lift: number,
  ): IAutoMovieVector3 {
    return Vector3.add(
      Vector3.add(
        branch.root,
        Vector3.scale(branch.direction, Math.min(branch.length, out)),
      ),
      { x: 0, y: lift * branch.radius, z: 0 },
    );
  }

  /**
   * A point on the bole's surface at a height, toward a horizontal direction, slid sideways.
   *
   * @param tree The tree.
   * @param height Metres above the bole's foot.
   * @param toward Unit horizontal direction from the axis to the face.
   * @param aside Metres along the face, to the right of `toward`.
   * @returns The point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation The axis point turned out by the radius and the slide's angle on the round face.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One turn and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The point lies on the round face, not a tangent plane.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function face(
    tree: ITree,
    height: number,
    toward: IAutoMovieVector3,
    aside: number,
  ): IAutoMovieVector3 {
    const angle: number = aside / tree.bole.radius;
    const right: IAutoMovieVector3 = { x: -toward.z, y: 0, z: toward.x };
    const out: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(toward, Math.cos(angle)),
      Vector3.scale(right, Math.sin(angle)),
    );
    return Vector3.add(
      { ...tree.bole.foot, y: tree.bole.foot.y + height },
      Vector3.scale(out, tree.bole.radius),
    );
  }

  /**
   * The load a branch bears a distance from its root.
   *
   * @param branch The branch.
   * @param out Metres from the trunk face.
   * @returns Newtons.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cantilever scaling.
   * @evidence contracts/development/implementation.md#principled-implementation A cantilever's root moment is load times distance, so the bearable load scales inversely with the distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ratio.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A load at the root is bounded by the nearest finite distance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function limit(branch: IBranch, out: number): number {
    return (branch.load * (branch.length / 2)) / Math.max(0.05, out);
  }

  /**
   * The tree climb's refusal.
   *
   * @param axis The refused parameter's path.
   * @param value The refused value.
   * @param reason Why it is refused.
   * @returns The refusal to throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation One refusal for a tree that cannot carry the climb.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names the actual parameter and value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refusal(
    axis: string,
    value: unknown,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis,
      value,
      reason,
      fix: "draw the tree with a lower or thicker branch, or climb a lower one",
    });
  }
}
