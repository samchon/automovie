import {
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSlot,
  IAutoMovieModel,
  IAutoMovieSubjectDescription,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { instanceSlot } from "../../populationRuntime/internal/instanceSlot";
import { subjectAddress } from "./subjectAddress";
import { subjectMaterials } from "./subjectMaterials";
import { subjectPlacedBounds } from "./subjectPlacedBounds";

/*
 * Describe one compact instance-set member as a subject, regenerating it.
 *
 * The member is regenerated through instanceSlot, so it cannot drift
 * from the member the compiled set was measured with, and it is refused
 * wherever that regenerator refuses, such as a slot outside the set or a set
 * whose variation derives a non-finite value. Its model is the first LOD tier
 * of the prototype it drew, or of the set when the set has no prototype table.
 * A member naming no prototype, rotation or per-axis scale is described as the
 * `default` prototype, turned by the set heading about +Y and scaled by its one
 * scale on all three axes, which is how the viewer draws it. The content box is
 * the model's vertices placed by that transform, in world metres, or null when
 * the model is not in `models`. The member has no members.
 * Parameter set: Compiled set the member belongs to.
 * Parameter slot: Zero-based member slot.
 * Parameter models: Runtime models by id, compiled and environment-owned.
 * Parameter space: Address of the space the set is placed in, or null.
 * Parameter revision: Revision of the artifact being described.
 * Parameter points: Model-frame vertices of a model, memoized by the caller.
 * Returns: The member's description.
 */
export const describeInstanceSubject = (
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
  const model: string | null =
    (choice?.lod ?? set.lod)[0]?.runtimeModel ?? null;
  const transform: IAutoMovieTransform = {
    translation: member.position,
    rotation:
      member.rotation ??
      AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.fromAxisAngle(UP, set.facingDeg)),
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
      model === null ? null : subjectAddress("prototype", model),
    placement: member.node,
    owner: subjectAddress("instance-set", set.id),
    model,
    space,
    transform,
    bounds: {
      declared: null,
      content:
        runtime === undefined
          ? null
          : subjectPlacedBounds(points(runtime), transform),
      coordinateSpace: "world",
    },
    materials: runtime === undefined ? [] : subjectMaterials(runtime),
    members: { total: 0, offset: 0, items: [], omitted: 0 },
  };
};

/*
 * World up, the axis an instance set's heading turns about.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
