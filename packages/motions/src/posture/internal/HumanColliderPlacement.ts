import {
  Quaternion,
  Vector3,
  AutoMoviePhysicalHullFaces,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Place the profile in its original order, skipping absent posed bones.
 * Parameter body: Canonical body with unchanged rest/profile metadata.
 * Parameter bones: Current resolved bones, unchanged during this operation.
 * Returns: Fresh current placed frames borrowing the neutral shape records.
 */
export function HumanColliderPlacement(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): HumanColliderPlacement.IPlaced[] {
  return place(body.colliders.segments, bones);
}

/*
 * Profile placement and the per-body neutral mirrored metadata it reads,
 * derived from the body where read or bound once by a prepare companion. Posed
 * frames are always current values, distinct from that neutral data.
 */
export namespace HumanColliderPlacement {
  /*
   * One placed collider segment: the interface contract
   * (`IAutoMovieMotionHumanColliders.IPlaced`).
   */
  export type IPlaced = IAutoMovieMotionHumanColliders.IPlaced;

  /*
   * Bind the actual neutral entries needed by repeated current-bone queries.
   * Request names are snapshotted once; later edits require another reader.
   * Body geometry stays unchanged, while each map supplies fresh posed inputs.
   * Extra map frames outside the request are ignored; missing requested frames
   * are omitted and selected duplicates keep their profile order.
   */
  export function preparePlaced(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => IPlaced[] {
    const names: Set<string> = new Set();
    for (const bone of requested) names.add(bone);
    const selected: ISided[] = body.colliders.segments.filter(
      (segment: ISided): boolean => names.has(segment.bone),
    );
    return (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): IPlaced[] => place(selected, bones);
  }

  /*
   * Exact floor minimum from every current placed shape, world metres.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return minima(body.colliders.segments, bones)[0]!;
  }

  /*
   * Bind ordered floor minima for fixed bone-name groups. Omission requests one
   * whole-profile minimum. Each group result starts at Infinity; an actual
   * shape can update several groups in their original group order.
   */
  export function prepareMinima(
    body: IAutoMovieMotionHumanBody,
    groups?: readonly ReadonlySet<AutoMovieHumanoidBone>[],
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => number[] {
    if (groups === undefined) return bindMinima(body.colliders.segments);
    const membership: Map<string, number[]> = new Map();
    let count: number = 0;
    for (const group of groups) {
      const index: number = count++;
      const names: Set<AutoMovieHumanoidBone> = new Set(group);
      for (const name of names) {
        let entries: number[] | undefined = membership.get(name);
        if (entries === undefined) {
          entries = [];
          membership.set(name, entries);
        }
        entries.push(index);
      }
    }
    const selected: ISided[] = body.colliders.segments.filter(
      (segment: ISided): boolean => membership.has(segment.bone),
    );
    return bindMinima(selected, { count, membership });
  }

  /*
   * The colliders at rest of a rig, mirrored left from right: what a body
   * carries (IAutoMovieMotionHumanBody.colliders), made once when it is made.
   * Parameter body: The rig, its rest joints and its profile, hulls attached.
   * Returns: The neutral segments and the bones they ride.
   */
  export function neutral(
    body: Pick<IAutoMovieMotionHumanBody, HumanColliderRig>,
  ): INeutral {
    return sided(body);
  }

  /*
   * Canonical profile-bearing names for scoped FK before collider queries. The
   * returned set is borrowed read-only while this body definition lives.
   */
  export function bones(
    body: Pick<IAutoMovieMotionHumanBody, HumanColliderRig>,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return sided(body).bones;
  }
}

/*
 * Keep the returned reader outside any source-body or caller-set lexical scope.
 */
function bindMinima(
  segments: readonly ISided[],
  selection?: IMinimaSelection,
): (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
) => number[] {
  return (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number[] => minima(segments, bones, selection);
}

/*
 * Stage the original placement phase, then reduce only the demanded scalar
 * bounds.
 */
function minima(
  segments: readonly ISided[],
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  selection?: IMinimaSelection,
): number[] {
  const byName: ReadonlyMap<string, IAutoMovieResolvedBone> = bones;
  const names: AutoMovieHumanoidBone[] = [];
  const positions: number[] = [];
  const rotations: IAutoMovieRigidTransform["rotation"][] = [];
  const shapes: (readonly IAutoMoviePhysicalShape[])[] = [];
  for (const segment of segments) {
    const posed: IAutoMovieResolvedBone | undefined = byName.get(segment.bone);
    if (posed === undefined) continue;
    const name: AutoMovieHumanoidBone = posed.bone;
    const origin: IAutoMovieVector3 = posed.worldPosition;
    const offset: number = Quaternion.rotateVectorY(
      posed.worldRotation,
      segment.offset,
    );
    const position: number = origin.y + offset;
    const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      posed.worldRotation,
      segment.rotation,
    );
    names.push(name);
    positions.push(position);
    rotations.push(rotation);
    shapes.push(segment.shapes);
  }
  const result: number[] = new Array<number>(selection?.count ?? 1).fill(
    Infinity,
  );
  for (let i: number = 0; i < positions.length; i++) {
    const groups: readonly number[] | undefined = selection?.membership.get(
      names[i]!,
    );
    if (selection !== undefined && groups === undefined) continue;
    for (const shape of shapes[i]!) {
      const low: number = AutoMovieEnginePhysics.physicalShapeBoundsLowestFromParent(
        positions[i]!,
        rotations[i]!,
        shape,
      );
      if (groups === undefined) result[0] = Math.min(result[0]!, low);
      else
        for (const group of groups)
          result[group] = Math.min(result[group]!, low);
    }
  }
  return result;
}

/*
 * One ordered numerical placement serves both full and fixed-demand readers.
 */
function place(
  segments: readonly ISided[],
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): HumanColliderPlacement.IPlaced[] {
  const byName: ReadonlyMap<string, IAutoMovieResolvedBone> = bones;
  const out: HumanColliderPlacement.IPlaced[] = [];
  for (const segment of segments) {
    const posed: IAutoMovieResolvedBone | undefined = byName.get(segment.bone);
    if (posed === undefined) continue;

    // The rotated offset is fresh; keep the original origin-plus-offset order.
    const bone: AutoMovieHumanoidBone = posed.bone;
    const origin: IAutoMovieVector3 = posed.worldPosition;
    const position: IAutoMovieVector3 = Quaternion.rotateVector(
      posed.worldRotation,
      segment.offset,
    );
    position.x = origin.x + position.x;
    position.y = origin.y + position.y;
    position.z = origin.z + position.z;

    out.push({
      bone,
      pose: {
        position,
        rotation: Quaternion.multiply(posed.worldRotation, segment.rotation),
      },
      shapes: segment.shapes,
    });
  }
  return out;
}

/*
 * Read unchanged neutral data, lazily indexing first profile names in original
 * scan order.
 */
function sided(
  body: Pick<IAutoMovieMotionHumanBody, HumanColliderRig>,
): INeutral {
  const rests: ReadonlyMap<string, IAutoMovieVector3> = body.rest;
  const own: (segment: IAutoMoviePhysicalSegment) => ISided | null = (
    segment: IAutoMoviePhysicalSegment,
  ): ISided | null => {
    const rest: IAutoMovieVector3 | undefined = rests.get(segment.bone);
    return rest === undefined
      ? null
      : {
          bone: segment.bone,
          offset: Vector3.subtract(segment.neutral.position, rest),
          rotation: segment.neutral.rotation,
          shapes: segment.shapes,
        };
  };
  const first: Map<string, IAutoMoviePhysicalSegment> = new Map();
  let scanned: number = 0;
  const twin: (name: string) => IAutoMoviePhysicalSegment | undefined = (
    name: string,
  ): IAutoMoviePhysicalSegment | undefined => {
    const found: IAutoMoviePhysicalSegment | undefined = first.get(name);
    if (found !== undefined) return found;
    while (scanned < body.profile.segments.length) {
      const segment: IAutoMoviePhysicalSegment =
        body.profile.segments[scanned++]!;
      const bone: string = segment.bone;
      if (!first.has(bone)) first.set(bone, segment);
      if (bone === name) return segment;
    }
    return undefined;
  };
  const out: ISided[] = [];
  for (const segment of body.profile.segments) {
    const mirroredFrom: IAutoMoviePhysicalSegment | undefined =
      segment.bone.startsWith("left")
        ? twin(`right${segment.bone.slice(4)}`)
        : undefined;
    const read: ISided | null = own(mirroredFrom ?? segment);
    if (read === null) continue;
    out.push(mirroredFrom === undefined ? read : mirrored(read, segment.bone));
  }
  const canonical: Map<string, AutoMovieHumanoidBone> = new Map();
  for (const bone of body.skeleton.bones) canonical.set(bone.bone, bone.bone);
  const bones: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of out) {
    const bone: AutoMovieHumanoidBone | undefined = canonical.get(segment.bone);
    if (bone !== undefined) bones.add(bone);
  }
  return { segments: out, bones };
}

/*
 * A neutral row reflected in the median plane: its offset, turn and shapes.
 */
function mirrored(segment: ISided, bone: string): ISided {
  return {
    bone,
    offset: mirrorPoint(segment.offset),
    rotation: mirrorTurn(segment.rotation),
    shapes: segment.shapes.map(
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => {
        const transform: IAutoMovieRigidTransform = {
          position: mirrorPoint(shape.transform.position),
          rotation: mirrorTurn(shape.transform.rotation),
        };
        if (shape.kind !== "hull") return { ...shape, transform };
        const points: IAutoMovieVector3[] = AutoMoviePhysicalHullFaces.mirrorX(
          shape.points,
        );
        return {
          ...shape,
          transform,
          points,
          ...(shape.hull === undefined
            ? {}
            : { hull: AutoMoviePhysicalHullFaces.mirrorHull(points, shape.hull) }),
        };
      },
    ),
  };
}

/*
 * The same fresh median-plane point reflection serves every neutral row.
 */
function mirrorPoint(point: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: -point.x, y: point.y, z: point.z };
}

/*
 * M R M keeps quaternion X/W and negates Y/Z, without changing normalization.
 */
function mirrorTurn(
  rotation: IAutoMovieRigidTransform["rotation"],
): IAutoMovieRigidTransform["rotation"] {
  return { x: rotation.x, y: -rotation.y, z: -rotation.z, w: rotation.w };
}

/*
 * The body fields the neutral collider rows are read from: the rig, its rest
 * joints and the profile, all fixed before any of the body's solves.
 */
type HumanColliderRig = "profile" | "rest" | "skeleton";

/*
 * Actual copied name membership; callers cannot supply the numerical group
 * lists.
 */
interface IMinimaSelection {
  /*
   * Number of groups, including empty groups.
   */
  count: number;

  /*
   * Original ascending group indices for each actual selected bone name.
   */
  membership: ReadonlyMap<string, readonly number[]>;
}

/*
 * Fixed neutral segment data, before current bone placement.
 */
type ISided = IAutoMovieMotionHumanColliders.ISegment;

/*
 * The neutral records and the canonical names their placement consumes.
 */
type INeutral = IAutoMovieMotionHumanColliders.INeutral;
