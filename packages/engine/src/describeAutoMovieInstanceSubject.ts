import {
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSlot,
  IAutoMovieModel,
  IAutoMovieSubjectDescription,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMaterials } from "./autoMovieSubjectMaterials";
import { autoMovieSubjectPlacedBounds } from "./autoMovieSubjectPlacedBounds";
import { Quaternion } from "./math/Quaternion";
import { instanceSlot } from "./populationRuntime/instanceSlot";

/** World up, the axis an instance set's heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Describe one compact instance-set member as a subject, regenerating it.
 *
 * The member is regenerated through {@link instanceSlot}, so it cannot drift
 * from the member the compiled set was measured with, and it is refused
 * wherever that regenerator refuses, such as a slot outside the set or a set
 * whose variation derives a non-finite value. Its model is the first LOD tier
 * of the prototype it drew, or of the set when the set has no prototype table.
 * A member naming no prototype, rotation or per-axis scale is described as the
 * `default` prototype, turned by the set heading about +Y and scaled by its
 * one scale on all three axes, which is how the viewer draws it. The content
 * box is the model's vertices placed by that transform, in world metres, or
 * null when the model is not in `models`. The member has no members.
 *
 * @param set Compiled set the member belongs to.
 * @param slot Zero-based member slot.
 * @param models Runtime models by id, compiled and environment-owned.
 * @param space Address of the space the set is placed in, or null.
 * @param revision Revision of the artifact being described.
 * @param points Model-frame vertices of a model, memoized by the caller.
 * @returns The member's description.
 *
 * @evidence contracts/common.md#principled-implementation Regenerates the member with the engine's one instance-member function and places the model's own vertices with the member's transform, so the description is the member the viewer draws; the default rotation is the set heading as a normalized quaternion, the law the regenerator applies to a member with no rotation offset.
 * @evidence contracts/common.md#clear-and-simple-design One owner for a single-instance subject, called by the subject describer only when the member is addressed, because a compact set stores a count rather than its members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No set, slot or prototype is special-cased; a member the regenerator refuses is refused here instead of being described with guessed values, and an unknown model gives null bounds and no materials.
 * @evidence contracts/common.md#meaningful-documentation The documentation states how the member is regenerated and when it is refused, the model rule, the defaulting of prototype, rotation and scale, the bounds and units, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms One member regeneration, constant in the set's count, plus one pass over the model's vertices for the box; the vertices come from the caller's memo.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one addressed member per call; the model vertices it reads are shared through the caller's memo rather than recomputed here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new description the caller owns and retains nothing.
 */
export const describeAutoMovieInstanceSubject = (
  set: IAutoMovieCompiledInstanceSet,
  slot: number,
  models: ReadonlyMap<string, IAutoMovieModel>,
  space: string | null,
  revision: string,
  points: (model: IAutoMovieModel) => readonly IAutoMovieVector3[],
): IAutoMovieSubjectDescription => {
  const member: IAutoMovieInstanceSlot = instanceSlot(set, slot);
  const prototype: string = member.prototype ?? "default";
  const choice: IAutoMovieCompiledInstancePrototype | undefined =
    set.prototypes?.find(
      (entry: IAutoMovieCompiledInstancePrototype): boolean =>
        entry.id === prototype,
    );
  const model: string | null = (choice?.lod ?? set.lod)[0]?.runtimeModel ?? null;
  const transform: IAutoMovieTransform = {
    translation: member.position,
    rotation:
      member.rotation ??
      Quaternion.normalize(Quaternion.fromAxisAngle(UP, set.facingDeg)),
    scale: member.scale3 ?? {
      x: member.scale,
      y: member.scale,
      z: member.scale,
    },
  };
  const runtime: IAutoMovieModel | undefined =
    model === null ? undefined : models.get(model);
  return {
    version: 1,
    revision,
    id: member.node,
    kind: "instance",
    semanticKind: prototype,
    name: member.node,
    prototype:
      model === null ? null : autoMovieSubjectAddress("prototype", model),
    placement: member.node,
    owner: autoMovieSubjectAddress("instance-set", set.id),
    model,
    space,
    transform,
    bounds: {
      declared: null,
      content:
        runtime === undefined
          ? null
          : autoMovieSubjectPlacedBounds(points(runtime), transform),
      coordinateSpace: "world",
    },
    materials: runtime === undefined ? [] : autoMovieSubjectMaterials(runtime),
    members: { total: 0, offset: 0, items: [], omitted: 0 },
  };
};
