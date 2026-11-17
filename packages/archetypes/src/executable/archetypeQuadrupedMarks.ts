import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieMark,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QuadrupedBody } from "../animals/QuadrupedBody";
import { QuadrupedRestFloor } from "../animals/QuadrupedRestFloor";
import { QuadrupedSkeleton } from "../animals/QuadrupedSkeleton";
import type { Archetype } from "../core";

/** An actual primitive's two axis endpoints and joint frame, in model metres. */
interface Bar {
  /** Lower local-Y endpoint: the actual generic joint origin. */
  from: IAutoMovieVector3;
  /** Upper local-Y endpoint: the bar's distal axis end. */
  to: IAutoMovieVector3;
  /** Rigid frame at from, with the actual part rotation. */
  frame: IAutoMovieTransform;
}

/**
 * Prepare actual quadruped bone, attachment, sole and floor observations.
 *
 * @param reference Immutable actual neutral source, absent for unrelated rides.
 * @returns Marks for one actual posed model, named scene anchor and optional same-sample producer terminal goals. Non-quadrupeds produce none.
 * @throws {RangeError} For an incomplete source or missing/non-bar posed bone.
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre coordinates, actual neutral/posed ownership, independently carried parent attachment expectations, exact primitive floor heights and binary64-only gap admission. Marks expose geometry, not anatomical ROM or force fidelity.
 * @evidence contracts/development/implementation.md#principled-implementation Neutral actual bar frames supply parent-local joint offsets once. Each drawn model supplies fresh endpoints and parent frames; their rigidly carried expected origins are compared with actual child origins. The existing exact primitive support owner measures floor clearance. Support functions locate actual terminal soles, and only explicitly supplied producer goals are compared with terminal axes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Recognize the quadruped vocabulary, prepare its neutral hierarchy, then index one current model and emit separately named bone, joint, attachment-gap, sole-height and floor marks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No renderer proxy, second pose sample, achieved-point-as-goal assertion, strict posed-chain decoder, biological tolerance or guessed foot radius hides a failure. A floor-height witness is explicitly a vertical projection at the part centre, not a claimed physical contact point.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P+B) time and storage for actual parts and 21 bones per draw; source hierarchy preparation is O(P+B) once per member.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains only the source hierarchy and reuses Quaternion, Vector3 and QuadrupedRestFloor. One actual sampled model supplies both drawing and every current observation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The draw subject owns the prepared closure; returned marks contain fresh numeric arrays and acquire no geometry, process, cache, file or renderer handle.
 */
export function archetypeQuadrupedMarks(
  reference: Archetype | undefined,
): (
  animal: Archetype,
  path: string,
  goals?: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieVector3>,
) => readonly IAutoMovieMark[] {
  if (
    reference === undefined ||
    !reference.parts.some(
      (part: IAutoMovieModelPart): boolean => part.id === "leftForeHumerus",
    )
  )
    return (): readonly IAutoMovieMark[] => [];
  const rig: IAutoMovieArticulatedRig<QuadrupedBody.Bone> =
    QuadrupedSkeleton.of(reference);

  return (
    animal: Archetype,
    path: string,
    goals?: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieVector3>,
  ): readonly IAutoMovieMark[] => {
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const bars: Map<QuadrupedBody.Bone, Bar> = new Map(
      rig.bones.map(
        (bone: (typeof rig.bones)[number]): [QuadrupedBody.Bone, Bar] => [
          bone.bone,
          bar(parts.get(bone.bone)),
        ],
      ),
    );
    const marks: IAutoMovieMark[] = [];
    const bones: number[] = [];
    const joints: number[] = [];
    let scale: number = 1;
    for (const current of bars.values()) {
      bones.push(...xyz(current.from), ...xyz(current.to));
      joints.push(...xyz(current.from));
      scale = Math.max(
        scale,
        ...xyz(current.from).map(Math.abs),
        ...xyz(current.to).map(Math.abs),
      );
    }
    const epsilon: number = 256 * Number.EPSILON * scale;
    marks.push(
      mark("bone", "Actual bar axes", 0x2761c3, false, {
        type: "segments",
        points: bones,
      }),
    );
    marks.push(
      mark("joint", "Actual generic joint origins", 0x8844bb, false, {
        type: "points",
        points: joints,
      }),
    );

    for (const node of rig.bones) {
      if (node.parent === null) continue;
      const parent: Bar = bars.get(node.parent)!;
      const current: Bar = bars.get(node.bone)!;
      const expected: IAutoMovieVector3 = Vector3.add(
        parent.frame.translation,
        Quaternion.rotateVector(parent.frame.rotation, node.rest.translation),
      );
      const gap: number = Vector3.length(
        Vector3.subtract(expected, current.from),
      );
      marks.push(
        mark(
          `attachment/${node.bone}`,
          "Parent attachment error; flagged above binary64 roundoff",
          0xe28318,
          gap > epsilon,
          {
            type: "segments",
            points: [...xyz(expected), ...xyz(current.from)],
          },
        ),
      );
      marks.push(
        mark(
          `attachment-goal/${node.bone}`,
          "Neutral attachment carried by current parent",
          0x0f998d,
          gap > epsilon,
          { type: "points", points: xyz(expected) },
        ),
      );
    }

    // Support heights are exact; their X/Z projection is an inspection ruler, not a fabricated contact point.
    for (const part of animal.parts) {
      const height: number = QuadrupedRestFloor(part);
      if (!Number.isFinite(height)) continue;
      const centre: IAutoMovieVector3 = part.transform!.translation;
      marks.push(
        mark(
          `floor/${part.id}`,
          "Actual lowest-height ruler to floor zero",
          0x8a6722,
          height < -epsilon,
          {
            type: "segments",
            points: [centre.x, 0, centre.z, centre.x, height, centre.z],
          },
        ),
      );
    }
    for (const limb of QuadrupedBody.LIMBS) {
      const terminal: QuadrupedBody.Bone = QuadrupedBody.BONES[limb][3]!;
      const part: IAutoMovieModelPart = parts.get(terminal)!;
      const height: number = QuadrupedRestFloor(part);
      marks.push(
        mark(
          `sole/${limb}`,
          "Actual terminal surface support in -Y",
          0x159947,
          height < -epsilon,
          { type: "points", points: xyz(sole(part)) },
        ),
      );
    }
    for (const [bone, target] of goals ?? []) {
      const actual: Bar | undefined = bars.get(bone);
      if (actual === undefined)
        throw new RangeError(`No actual bar for inspection goal ${bone}`);
      const gap: number = Vector3.length(Vector3.subtract(actual.to, target));
      marks.push(
        mark(
          `effector-goal/${bone}`,
          "Producer-declared terminal axis goal",
          0x2aa5b9,
          gap > epsilon,
          { type: "points", points: xyz(target) },
        ),
      );
      marks.push(
        mark(
          `effector-gap/${bone}`,
          "Actual terminal-axis error from producer goal",
          0xbe3293,
          gap > epsilon,
          { type: "segments", points: [...xyz(target), ...xyz(actual.to)] },
        ),
      );
    }
    return marks;

    /** Keep every diagnostic in its actual model's frame and stable named mark family. */
    function mark(
      suffix: string,
      label: string,
      color: number,
      flagged: boolean,
      shape: IAutoMovieMark["shape"],
    ): IAutoMovieMark {
      return {
        path: `${path}/rig/${suffix}`,
        anchor: path,
        kind: `rig/${suffix.split("/")[0]}`,
        label,
        color,
        flagged,
        shape,
      };
    }
  };
}

/** Decode the actual part directly so a disconnected posed chain remains observable. */
function bar(part: IAutoMovieModelPart | undefined): Bar {
  if (
    part === undefined ||
    part.transform === null ||
    part.transform === undefined ||
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new RangeError(
      "Quadruped inspection requires each actual transformed bar",
    );
  const frame: IAutoMovieTransform = part.transform;
  const half: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: part.geometry.shape.height / 2,
    z: 0,
  });
  const from: IAutoMovieVector3 = Vector3.subtract(frame.translation, half);
  return {
    from,
    to: Vector3.add(frame.translation, half),
    frame: { ...frame, translation: from },
  };
}

/** Copy a model-metre point into the native mark's packed coordinate convention. */
function xyz(point: IAutoMovieVector3): number[] {
  return [point.x, point.y, point.z];
}

/** The actual cylinder rim or capsule support in -Y, rather than an axis-end proxy. */
function sole(part: IAutoMovieModelPart): IAutoMovieVector3 {
  if (
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new RangeError(
      "Quadruped sole inspection requires an actual cylinder or capsule",
    );
  const shape: typeof part.geometry.shape = part.geometry.shape;
  const current: Bar = bar(part);
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    current.frame.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const end: IAutoMovieVector3 = axis.y > 0 ? current.from : current.to;
  if (shape.type === "capsule") return { ...end, y: end.y - shape.radius };
  const projected: IAutoMovieVector3 = {
    x: axis.x * axis.y,
    y: axis.y * axis.y - 1,
    z: axis.z * axis.y,
  };
  const length: number = Vector3.length(projected);
  return length === 0
    ? { ...end }
    : Vector3.add(end, Vector3.scale(projected, shape.radius / length));
}
