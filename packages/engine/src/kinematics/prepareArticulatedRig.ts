import type {
  IAutoMovieAngleRange,
  IAutoMovieArticulatedRig,
  IAutoMovieArticulatedRigReader,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";

/** The three local degree coordinates, independent of a humanoid bone name. */
type Rotation = Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">;

/** One admitted owned joint in parent-first order. */
interface IPrepared<Bone extends string> {
  /** Semantic bone identity. */
  bone: Bone;
  /** Parent identity or sole root. */
  parent: Bone | null;
  /** Owned normalized neutral transform. */
  rest: IAutoMovieTransform;
  /** Owned normalized basis. */
  axes: IAutoMovieJointAxes;
  /** Explicit copied boxes or unknown limits. */
  limits: IAutoMovieArticulatedRig<Bone>["bones"][number]["limits"];
}

/**
 * Prepare generic rigid FK without a species or humanoid-bone branch.
 *
 * @param rig A connected rigid tree with explicit axes and declared degree
 *   boxes.
 * @returns An independent prepared reader; later mutation of rig data cannot
 *   rewrite it.
 * @throws {Error} For malformed graph, transform, basis or limits, or when a
 *   read names an absent bone or violates a declared box.
 * @throws {RangeError} When a composed world position is nonfinite or its
 *   quaternion is nonfinite or zero, even if all source transforms were
 *   finite.
 */
export function prepareArticulatedRig<Bone extends string>(
  rig: IAutoMovieArticulatedRig<Bone>,
): IAutoMovieArticulatedRigReader<Bone> {
  if (rig.bones.length === 0)
    throw new RangeError("An articulated rig needs bones");
  const nodes: Map<Bone, IPrepared<Bone>> = new Map();
  const children: Map<Bone | null, Bone[]> = new Map();
  for (const raw of rig.bones) {
    const bone: Bone = raw.bone;
    const parent: Bone | null = raw.parent;
    if (nodes.has(bone))
      throw new RangeError("Articulated bone names must be unique");
    const rest: IAutoMovieTransform = rigid(raw.rest);
    const axes: IAutoMovieJointAxes = normalizeJointAxes(
      {
        flexion: { ...raw.axes.flexion },
        abduction: { ...raw.axes.abduction },
        twist: { ...raw.axes.twist },
        ...(raw.axes.twistPlacement === undefined
          ? {}
          : { twistPlacement: raw.axes.twistPlacement }),
        ...(raw.axes.rotationOrder === undefined
          ? {}
          : { rotationOrder: raw.axes.rotationOrder }),
      },
      `${rig.id}/${bone}.axes`,
    );
    const declared: IPrepared<Bone>["limits"] = raw.limits;
    const limits: IPrepared<Bone>["limits"] =
      declared === null
        ? null
        : {
            flexion: range(declared.flexion),
            abduction: range(declared.abduction),
            twist: range(declared.twist),
          };
    nodes.set(bone, { bone, parent, rest, axes, limits });
    const siblings: Bone[] = children.get(parent) ?? [];
    siblings.push(bone);
    children.set(parent, siblings);
  }
  const roots: readonly Bone[] = children.get(null) ?? [];
  if (roots.length !== 1)
    throw new RangeError("An articulated rig needs one root");
  for (const node of nodes.values())
    if (node.parent !== null && !nodes.has(node.parent))
      throw new RangeError(`Missing articulated parent ${node.parent}`);
  const queue: Bone[] = [roots[0]!];
  const ordered: IPrepared<Bone>[] = [];
  for (let i: number = 0; i < queue.length; i++) {
    const bone: Bone = queue[i]!;
    ordered.push(nodes.get(bone)!);
    for (const child of children.get(bone) ?? []) queue.push(child);
  }
  if (ordered.length !== nodes.size)
    throw new RangeError("An articulated rig must be connected and acyclic");
  return {
    bones: Object.freeze(
      ordered.map((node: IPrepared<Bone>): Bone => node.bone),
    ),
    read: (
      joints: ReadonlyMap<Bone, Rotation> = new Map(),
      root?: IAutoMovieTransform,
    ): ReadonlyMap<Bone, IAutoMovieTransform> => {
      for (const bone of joints.keys())
        if (!nodes.has(bone))
          throw new RangeError(`Unknown articulated bone ${bone}`);
      const world: Map<Bone, IAutoMovieTransform> = new Map();
      const origin: IAutoMovieTransform =
        root === undefined
          ? {
              translation: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            }
          : rigid(root);
      for (const node of ordered) {
        const raw: Rotation | undefined = joints.get(node.bone);
        const angles: Rotation =
          raw === undefined
            ? { flexion: null, abduction: null, twist: null }
            : {
                flexion: raw.flexion,
                abduction: raw.abduction,
                twist: raw.twist,
              };
        for (const axis of ["flexion", "abduction", "twist"] as const) {
          const observed: number | null = angles[axis];
          const value: number = observed === null ? 0 : observed;
          const allowed: IAutoMovieAngleRange | null | undefined =
            node.limits?.[axis];
          if (
            (node.limits !== null &&
              (allowed === null
                ? value !== 0
                : value < allowed!.min || value > allowed!.max))
          )
            throw new RangeError(
              `Articulated ${node.bone}.${axis} violates its declared range`,
            );
        }
        const parent: IAutoMovieTransform =
          node.parent === null ? origin : world.get(node.parent)!;
        const local: IAutoMovieQuaternion = Quaternion.multiply(
          node.rest.rotation,
          jointToQuaternionOnBasis(angles, node.axes),
        );

        // Finite operands can overflow during composition. Admit the actual
        // world frame before a descendant or the caller can consume it.
        world.set(
          node.bone,
          rigid({
            translation: Vector3.add(
              parent.translation,
              Quaternion.rotateVector(parent.rotation, node.rest.translation),
            ),
            rotation: Quaternion.multiply(parent.rotation, local),
            scale: { x: 1, y: 1, z: 1 },
          }),
        );
      }
      return world;
    },
  };
}

/**
 * Admit source or composed rigid data before normalizing its finite nonzero
 * quaternion.
 */
function rigid(raw: IAutoMovieTransform): IAutoMovieTransform {
  const point: IAutoMovieTransform["translation"] = raw.translation;
  const turn: IAutoMovieQuaternion = raw.rotation;
  const translation: IAutoMovieTransform["translation"] = {
    x: point.x,
    y: point.y,
    z: point.z,
  };
  const rotation: IAutoMovieQuaternion = {
    x: turn.x,
    y: turn.y,
    z: turn.z,
    w: turn.w,
  };
  for (const axis of ["x", "y", "z"] as const)
    if (raw.scale[axis] !== 1)
      throw new RangeError(
        "Articulated transforms need finite position and unit scale",
      );
  if (
    Math.max(
      Math.abs(rotation.x),
      Math.abs(rotation.y),
      Math.abs(rotation.z),
      Math.abs(rotation.w),
    ) === 0
  )
    throw new RangeError(
      "Articulated rotations need a finite nonzero quaternion",
    );
  return {
    translation,
    rotation: Quaternion.normalize(rotation),
    scale: { x: 1, y: 1, z: 1 },
  };
}

/**
 * Copy an explicit finite ordered degree interval, keeping null as an immobile
 * axis.
 */
function range(raw: IAutoMovieAngleRange | null): IAutoMovieAngleRange | null {
  if (raw === null) return null;
  const min: number = raw.min;
  const max: number = raw.max;
  if (!(min <= max))
    throw new RangeError(
      "Articulated limits need finite ordered degree endpoints",
    );
  return { min, max };
}
