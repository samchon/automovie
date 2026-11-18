import {
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeBounds,
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

/**
 * Profile placement and the existing per-body neutral mirrored metadata.
 * Posed frames are always current values, distinct from that neutral data.
 *
 * @evidence contracts/development/design.md#principled-representation Applies each bone's world transform to the profile segment's neutral offset from the canonical rest joint, preserving the existing median-plane left/right reflection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanColliders delegates full placement, explicit geometry preparation, canonical names, fixed-demand preparePlaced and scalar floor minima to this owner. Distance consumers retain posed records; floor consumers request only actual Y/rotation and ordered scalar bounds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Moves the existing neutral SIDED weak cache without adding a posed-body or distance-result cache; current bones are read on every placement and the body definition must remain unchanged for its identity.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed names/offsets, first-observed reflected shapes and current posed frames, with their transform convention and unchanged-body cache ownership.
 */
export namespace HumanColliderPlacement {
  /**
   * One placed collider segment: the interface contract (`IAutoMovieMotionHumanColliders.IPlaced`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanColliderPlacement.IPlaced: One placed collider segment.
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanColliders.IPlaced`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IPlaced = IAutoMovieMotionHumanColliders.IPlaced;

  /**
   * Place the profile in its original order, skipping absent posed bones.
   *
   * @param body Canonical body with unchanged rest/profile metadata.
   * @param bones Current resolved bones, unchanged during this operation.
   * @returns Fresh current placed frames borrowing the neutral shape records.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original bone world position plus rotated neutral offset and the same quaternion product for segment orientation, with the established mirrored neutral definitions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One neutral-metadata owner and one ordered placement pass separate fixed profile work from current geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves profile order, first matching right twin, absent-bone skip and every transform expression; supplied posed bones are never cached across calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms Placement visits S segments and translates each owned rotated offset in place, omitting a second position vector per placed entry. Cold names/offsets cost O(B+S) for B rig bones; only entries with actual posed bones materialize mirrored shapes once, costing their V hull vertices. Name-only observations create no reflected vertices.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The weak body owner shares unchanged offsets and lazy mirrored definitions; module-owned point/turn helpers avoid two stateless closures per mirrored row. Pure reflection has no validation side effect for an unobserved segment. Nearest/cast operations may borrow completed placement only while body/bones stay unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh posed arrays/frames belong to the caller and borrow shape definitions; the existing weak body cache retains one neutral list per live body, and no current pose is stored globally.
   * @evidence contracts/development/common.md#meaningful-documentation Defines current-input stability, canonical placement, mirror/skip order, cold and warm costs and ownership.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPlaced[] {
    return place(sided(body).segments, bones);
  }

  /**
   * Bind the actual neutral entries needed by repeated current-bone queries.
   * Request names are snapshotted once; later edits require another reader.
   * Body geometry stays unchanged, while each map supplies fresh posed inputs.
   * Extra map frames outside the request are ignored; missing requested
   * frames are omitted and selected duplicates keep their profile order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed name/body scope, current-map inputs, fresh placements, ordering and request invalidation.
   * @evidence contracts/development/implementation.md#principled-implementation A profile entry whose name is outside the actual requested frame set cannot be placed by a map containing only those frames. Snapshot those entries in original order and delegate all actual position/rotation arithmetic to the same place owner as of.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One producer binds this body's genuine neutral metadata to copied names; its callback accepts only current bones, so no unrelated body/prepared-list pair can be injected.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every selected profile duplicate, original order, absent-bone skip and transform expression. No shape search, posed answer, contact verdict or tolerance is precomputed, and ordinary of retains its complete profile traversal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(K+S) pass copies K names and selects R of S neutral entries; first neutral metadata costs O(B+S) without reflected vertices or topology search. Each query traverses R and creates fresh actual placements; only their first observed mirrored shapes additionally copy their V hull vertices. No speedup is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This body's unchanged rest/profile metadata and copied request names fix the selected list. Every query still reads its actual bone position/quaternion, and changing a frame or its presence recomputes or omits the placement normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one callback and R borrowed immutable neutral entries until its fixed-demand operation ends. Temporary name indexing releases after binding; no bone map, placed frame or query history is retained, and the established neutral-body cache keeps its weak lifetime.
   */
  export function preparePlaced(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => IPlaced[] {
    const names: Set<string> = new Set();
    for (const bone of requested) names.add(bone);
    const selected: ISided[] = sided(body).segments.filter(
      (segment: ISided): boolean => names.has(segment.bone),
    );
    return (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): IPlaced[] => place(selected, bones);
  }

  /**
   * Exact floor minimum from every current placed shape, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines current canonical bones, unchanged neutral geometry, world Y and the empty Infinity result.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original origin-Y plus rotated neutral offset, bone-times-neutral orientation and the physical owner's same local-shape minimum-Y formulas.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The scalar entry shares minima with fixed-group readers, leaving full pose placement with place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every profile duplicate, missing-bone skip, shape/vertex order and Math.min/NaN behavior; no goal, contact, bound or physical check is omitted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Stages S scalar Y values, rotations, names and borrowed shape lists in four arrays instead of three unused placed/pose/position records per segment; all actual shape/vertex bounds still run.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed neutral metadata is shared under the unchanged-body contract. Every query reads current bones, and placement inputs are staged before any shape bound as in the original two phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Four temporary O(S) arrays end on return/throw, and only a scalar escapes. No bone map, posed frame or floor result is cached.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return minima(sided(body).segments, bones)[0]!;
  }

  /**
   * Bind ordered floor minima for fixed bone-name groups. Omission requests
   * one whole-profile minimum. Each group result starts at Infinity; an
   * actual shape can update several groups in their original group order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States whole-profile default, copied group membership/order, actual canonical bone inputs, world metres and unchanged-body/reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Group membership is built from actual names and applied to each placed bone. One shape bound supplies the same ordered Math.min updates for every matching group, including overlapping groups and duplicate profile entries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation snapshots name membership and selects the actual neutral union; a separate binder retains only selected entries and private group metadata for the common scalar reduction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts no external group indices, placed frames or derived floor answers. All current placement inputs are staged before bounds, preserving missing-bone skips and the original profile/shape/vertex traversal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(S+G+K) preparation indexes K memberships across G groups and selects R of S entries. Queries use four O(R) staging arrays plus G output numbers, without placed/pose/XYZ records; each actual selected shape is bounded once before its matching group updates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The genuine neutral producer and copied name memberships fix the query domain. Every call still consumes current bone transforms and computes all requested minima, with no time, posture or target-result memo.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns selected neutral references and O(K) private name/index metadata until its operation ends. Each call releases staging and returns G fresh numbers; no body, input set, bone map, posed frame or result history is retained by the binder.
   */
  export function prepareMinima(
    body: IAutoMovieMotionHumanBody,
    groups?: readonly ReadonlySet<AutoMovieHumanoidBone>[],
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => number[] {
    if (groups === undefined) return bindMinima(sided(body).segments);
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
    const selected: ISided[] = sided(body).segments.filter(
      (segment: ISided): boolean => membership.has(segment.bone),
    );
    return bindMinima(selected, { count, membership });
  }

  /**
   * Prepare the existing neutral definitions and hull-face geometry.
   *
   * @param body The unchanged body definition to prepare.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates every neutral hull's face preparation to physicalHullFaces in the original segment/shape order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One neutral-list pass prepares geometry without constructing a current pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every hull and its original points array, without precomputing a motion answer or changing the hull algorithm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits every shape and delegates its first-use hull topology cost. Cold neutral metadata additionally costs O(B+S), and the first actual mirrored lists copy their V vertices; warm lists/hulls share their completed preparation without repeating either construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing per-body neutral metadata and the existing hull-face owner's per-points preparation; current posed queries remain fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Introduces no new cache population: the moved neutral WeakMap and hull owner's existing cache keep their established body/points lifetimes.
   * @evidence contracts/development/common.md#meaningful-documentation States what is prepared, traversal order, delegated geometry cost and absence of posed-result retention.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): void {
    for (const segment of sided(body).segments)
      for (const shape of segment.shapes)
        if (shape.kind === "hull") physicalHullFaces(shape.points);
  }

  /**
   * Canonical profile-bearing names for scoped FK before collider queries.
   * The returned set is borrowed read-only while this body definition lives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines canonical name selection, scoped-FK purpose and borrowed immutable metadata.
   * @evidence contracts/development/implementation.md#principled-implementation Collider placement reads only neutral segments with a matching posed canonical bone, so requesting these names and their engine-resolved ancestors supplies every frame it consumes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Existing neutral preparation owns both its segment records and the corresponding canonical name set; collider consumers use the same owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Includes every neutral segment's actual canonical name and preserves missing-profile-bone skips; no posed frame, collision answer or contact threshold is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms First neutral metadata costs O(B+S) indexing/set/offset work for B bones and S segments; no mirrored collider vertices are materialized by this name-only demand. Later reads return fixed metadata in constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged-body neutral cache owns names and offsets; each mirrored shape list is separately materialized only when geometry is observed. Any body/profile change requires a new body under the established cache contract.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing weak body entry retains at most B canonical names with its neutral segment list, released with that body; callers borrow the set and no posed result/history is retained.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return sided(body).bones;
  }
}

/** Actual copied name membership; callers cannot supply the numerical group lists. */
interface IMinimaSelection {
  /** Number of groups, including empty groups. */
  count: number;

  /** Original ascending group indices for each actual selected bone name. */
  membership: ReadonlyMap<string, readonly number[]>;
}

/** Keep the returned reader outside any source-body or caller-set lexical scope. */
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

/** Stage the original placement phase, then reduce only the demanded scalar bounds. */
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
      const low: number = physicalShapeBounds.lowestFromParent(
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

/** One ordered numerical placement serves both full and fixed-demand readers. */
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

/** Fixed neutral segment data, before current bone placement. */
interface ISided {
  /** Profile bone name, read through the posed name map. */
  bone: string;

  /** Neutral offset from its canonical rest joint, metres. */
  offset: IAutoMovieVector3;

  /** Original neutral rotation. */
  rotation: IAutoMovieRigidTransform["rotation"];

  /** Original shapes, or one lazy median-reflected list on first actual geometry observation. */
  shapes: IAutoMoviePhysicalShape[];
}

/** The existing neutral list cache, moved with its sole owner; no posed frame is stored. */
const SIDED: WeakMap<IAutoMovieMotionHumanBody, INeutral> = new WeakMap();

/** Existing neutral records and the exact canonical names their placement consumes. */
interface INeutral {
  segments: ISided[];
  bones: ReadonlySet<AutoMovieHumanoidBone>;
}

/** Read unchanged neutral data, lazily indexing first profile names in original scan order. */
function sided(body: IAutoMovieMotionHumanBody): INeutral {
  const known: INeutral | undefined = SIDED.get(body);
  if (known !== undefined) return known;
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
  const neutral: INeutral = { segments: out, bones };
  SIDED.set(body, neutral);
  return neutral;
}

/** Fixed offsets turn immediately; pure shape reflection waits for actual geometry demand. */
function mirrored(segment: ISided, bone: string): ISided {
  let shapes: IAutoMoviePhysicalShape[] | undefined;
  return {
    bone,
    offset: mirrorPoint(segment.offset),
    rotation: mirrorTurn(segment.rotation),

    /** Materialize this actual left collider list once; failed preparation stays uncached. */
    get shapes(): IAutoMoviePhysicalShape[] {
      if (shapes !== undefined) return shapes;
      shapes = segment.shapes.map(
        (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => {
          const transform: IAutoMovieRigidTransform = {
            position: mirrorPoint(shape.transform.position),
            rotation: mirrorTurn(shape.transform.rotation),
          };
          return shape.kind === "hull"
            ? {
                ...shape,
                transform,
                points: physicalHullFaces.mirrorX(shape.points),
              }
            : { ...shape, transform };
        },
      );
      return shapes;
    },
  };
}

/** The same fresh median-plane point reflection serves every neutral row. */
function mirrorPoint(point: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: -point.x, y: point.y, z: point.z };
}

/** M R M keeps quaternion X/W and negates Y/Z, without changing normalization. */
function mirrorTurn(
  rotation: IAutoMovieRigidTransform["rotation"],
): IAutoMovieRigidTransform["rotation"] {
  return { x: rotation.x, y: -rotation.y, z: -rotation.z, w: rotation.w };
}
