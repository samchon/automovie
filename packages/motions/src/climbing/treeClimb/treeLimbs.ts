import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * A climbable tree read from its affordances in world metres: the bole as a
 * vertical bar and each lower branch as a level bar with its astride seat. A
 * branch's load limit falls off with the distance from its root as a
 * cantilever's does: the published load at the bar's frame, half the branch
 * out, scaled by that half length over the distance.
 */
export namespace treeLimbs {
  /** The bole. */
  export interface IBole {
    /** The axis at the ground, world metres. */
    foot: IAutoMovieVector3;

    /** The radius, metres. */
    radius: number;
  }

  /** One lower branch. */
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

    /**
     * The load it bears half its length out, newtons; unbounded when the tree
     * states none.
     */
    load: number;

    /** The astride seat on its top, world metres. */
    seat: IAutoMovieVector3;
  }

  /** A tree. */
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
   * A branch's axis point a distance out from the trunk face, lifted by a share
   * of its radius.
   *
   * @param branch The branch.
   * @param out Metres from the trunk face.
   * @param lift Radii above the axis: 0 for a grip, 1 for a foot on top.
   * @returns The point, world metres.
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
   * A point on the bole's surface at a height, toward a horizontal direction,
   * slid sideways.
   *
   * @param tree The tree.
   * @param height Metres above the bole's foot.
   * @param toward Unit horizontal direction from the axis to the face.
   * @param aside Metres along the face, to the right of `toward`.
   * @returns The point, world metres.
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
