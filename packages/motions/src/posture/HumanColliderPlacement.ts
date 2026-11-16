import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalHullFaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Profile placement and the existing per-body neutral mirrored metadata.
 * Posed frames are always current values, distinct from that neutral data.
 *
 * @evidence contracts/development/design.md#principled-representation Applies each bone's world transform to the profile segment's neutral offset from the canonical rest joint, preserving the existing median-plane left/right reflection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanColliders delegates full placement, explicit geometry preparation, canonical bone names and fixed-demand preparePlaced to this owner; distance/floor consumers retain their facade and actual ordered posed records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Moves the existing neutral SIDED weak cache without adding a posed-body or distance-result cache; current bones are read on every placement and the body definition must remain unchanged for its identity.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed names/offsets, first-observed reflected shapes and current posed frames, with their transform convention and unchanged-body cache ownership.
 */
export namespace HumanColliderPlacement {
  /**
   * One profile segment placed by its current resolved bone.
   *
   * @evidence contracts/development/design.md#principled-representation Couples a canonical bone name, world-metre segment pose and its shape definitions, whose local transforms compose with that pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Collider distance/bounds and floor candidate readers consume exactly these three fields through the existing HumanColliders.IPlaced alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the actual current bone transform and ordered profile geometry; no nearest answer or previous posed frame is represented.
   * @evidence contracts/development/common.md#meaningful-documentation States frame, metre units, local-shape composition and borrowed geometry.
   */
  export interface IPlaced {
    /** The resolved rig bone carrying this segment. */
    bone: AutoMovieHumanoidBone;

    /** Current world segment frame, including its neutral offset and turn. */
    pose: P.ITransform;

    /** Existing neutral shape definitions, borrowed without mutation. */
    shapes: readonly P.IShape[];
  }

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
   * @evidence contracts/development/implementation.md#efficient-algorithms Placement visits S segments; cold neutral names/offsets cost O(B+S) using a first-name index for B rig bones. Only entries with actual posed bones materialize their mirrored shape definitions once, costing their V hull vertices; bone-name-only observations create no reflected vertices.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The weak body owner shares unchanged neutral offsets and lazily materialized mirrored definitions. Pure shape reflection has no validation side effect to run for an unobserved segment; nearest/cast operations may borrow completed placement only while body/bones stay unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh posed arrays/frames belong to the caller and borrow shape definitions; the existing weak body cache retains one neutral list per live body, and no current pose is stored globally.
   * @evidence contracts/development/common.md#meaningful-documentation Defines current-input stability, canonical placement, mirror/skip order, cold and warm costs and ownership.
   */
  export function of(
    body: IHumanBody,
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
    body: IHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) => IPlaced[] {
    const names: Set<string> = new Set();
    for (const bone of requested) names.add(bone);
    const selected: ISided[] = sided(body).segments.filter(
      (segment: ISided): boolean => names.has(segment.bone),
    );
    return (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): IPlaced[] =>
      place(selected, bones);
  }

  /**
   * Prepare the existing neutral definitions and hull-face geometry.
   *
   * @param body The unchanged body definition to prepare.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates every neutral hull's face preparation to physicalHullFaces in the original segment/shape order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One neutral-list pass prepares geometry without constructing a current pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every hull and its original points array, without precomputing a motion answer or changing the hull algorithm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds one shape pass to the delegated first-use hull-face costs; already prepared hulls use their owning numeric cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing per-body neutral metadata and the existing hull-face owner's per-points preparation; current posed queries remain fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Introduces no new cache population: the moved neutral WeakMap and hull owner's existing cache keep their established body/points lifetimes.
   * @evidence contracts/development/common.md#meaningful-documentation States what is prepared, traversal order, delegated geometry cost and absence of posed-result retention.
   */
  export function prepare(body: IHumanBody): void {
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
  export function bones(body: IHumanBody): ReadonlySet<AutoMovieHumanoidBone> {
    return sided(body).bones;
  }
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
    out.push({
      bone: posed.bone,
      pose: {
        position: Vector3.add(posed.worldPosition, Quaternion.rotateVector(posed.worldRotation, segment.offset)),
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
  rotation: P.ITransform["rotation"];

  /** Original shapes, or one lazy median-reflected list on first actual geometry observation. */
  shapes: P.IShape[];
}

/** The existing neutral list cache, moved with its sole owner; no posed frame is stored. */
const SIDED: WeakMap<IHumanBody, INeutral> = new WeakMap();

/** Existing neutral records and the exact canonical names their placement consumes. */
interface INeutral {
  segments: ISided[];
  bones: ReadonlySet<AutoMovieHumanoidBone>;
}

/** Read unchanged neutral data, lazily indexing first profile names in original scan order. */
function sided(body: IHumanBody): INeutral {
  const known: INeutral | undefined = SIDED.get(body);
  if (known !== undefined) return known;
  const rests: ReadonlyMap<string, IAutoMovieVector3> = body.rest;
  const own: (segment: P.ISegment) => ISided | null = (segment: P.ISegment): ISided | null => {
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
  const first: Map<string, P.ISegment> = new Map();
  let scanned: number = 0;
  const twin: (name: string) => P.ISegment | undefined = (name: string): P.ISegment | undefined => {
    const found: P.ISegment | undefined = first.get(name);
    if (found !== undefined) return found;
    while (scanned < body.profile.segments.length) {
      const segment: P.ISegment = body.profile.segments[scanned++]!;
      const bone: string = segment.bone;
      if (!first.has(bone)) first.set(bone, segment);
      if (bone === name) return segment;
    }
    return undefined;
  };
  const out: ISided[] = [];
  for (const segment of body.profile.segments) {
    const mirroredFrom: P.ISegment | undefined = segment.bone.startsWith("left")
      ? twin(`right${segment.bone.slice(4)}`)
      : undefined;
    const read: ISided | null = own(mirroredFrom ?? segment);
    if (read === null) continue;
    out.push(
      mirroredFrom === undefined ? read : mirrored(read, segment.bone),
    );
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
  const point: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -p.x,
    y: p.y,
    z: p.z,
  });
  const turn: (q: P.ITransform["rotation"]) => P.ITransform["rotation"] = (q: P.ITransform["rotation"]): P.ITransform["rotation"] => ({
    x: q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
  });
  let shapes: P.IShape[] | undefined;
  return {
    bone,
    offset: point(segment.offset),
    rotation: turn(segment.rotation),

    /** Materialize this actual left collider list once; failed preparation stays uncached. */
    get shapes(): P.IShape[] {
      if (shapes !== undefined) return shapes;
      shapes = segment.shapes.map((shape: P.IShape): P.IShape => {
        const transform: P.ITransform = {
          position: point(shape.transform.position),
          rotation: turn(shape.transform.rotation),
        };
        return shape.kind === "hull"
          ? { ...shape, transform, points: physicalHullFaces.mirrorX(shape.points) }
          : { ...shape, transform };
      });
      return shapes;
    },
  };
}
