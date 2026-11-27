import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieSubjectDescription,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieInstanceAddress } from "../../populationRuntime/internal/autoMovieInstanceAddress";
import { AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT } from "../../constants/AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT";
import { Quaternion } from "../../math/Quaternion";
import { Transform } from "../../math/Transform";
import { compareAutoMovieRenderIds } from "../../render/internal/compareAutoMovieRenderIds";
import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMaterials } from "./autoMovieSubjectMaterials";

/*
 * Describe one compiled instance set as a subject.
 *
 * The set's model is the first tier of its own LOD list, its transform is the
 * anchor turned by the heading about +Y at unit scale, and its content box is
 * the compiled `bounds`, in world metres. It is owned by, and placed in, the
 * space `space` names, if any. Its members are drawn from the slot range rather
 * than a list, because a compact set stores a count and not its members: the
 * page is the slots from `memberOffset`, clamped to the count, up to
 * `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` of them, addressed by
 * autoMovieInstanceAddress and sorted in render-id order.
 * Parameter set: Compiled set to describe.
 * Parameter models: Runtime models by id, compiled and environment-owned.
 * Parameter space: Address of the space the set is placed in, or null.
 * Parameter revision: Revision of the artifact being described.
 * Parameter memberOffset: Rank of the first member to name, a whole number from 0.
 * Returns: The set's description.
 */
export const describeAutoMovieInstanceSetSubject = (
  set: IAutoMovieCompiledInstanceSet,
  models: ReadonlyMap<string, IAutoMovieModel>,
  space: string | null,
  revision: string,
  memberOffset: number,
): IAutoMovieSubjectDescription => {
  const model: string | null = set.lod[0]?.runtimeModel ?? null;
  const address: string = autoMovieSubjectAddress("instance-set", set.id);
  const runtime: IAutoMovieModel | undefined =
    model === null ? undefined : models.get(model);
  const offset: number = Math.min(memberOffset, set.count);
  const items: string[] = Array.from(
    {
      length: Math.min(
        set.count - offset,
        AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
      ),
    },
    (_: unknown, index: number): string =>
      autoMovieInstanceAddress(set, offset + index),
  ).sort(compareAutoMovieRenderIds);
  return {
    version: 1,
    revision,
    id: address,
    kind: "instance-set",
    semanticKind: set.layout.kind,
    name: set.id,
    prototype:
      model === null ? null : autoMovieSubjectAddress("prototype", model),
    placement: address,
    owner: space,
    model,
    space,
    transform: Transform.of(
      structuredClone(set.anchor),
      Quaternion.fromAxisAngle(UP, set.facingDeg),
    ),
    bounds: {
      declared: null,
      content: structuredClone(set.bounds),
      coordinateSpace: "world",
    },
    materials: runtime === undefined ? [] : autoMovieSubjectMaterials(runtime),
    members: {
      total: set.count,
      offset,
      items,
      omitted: set.count - items.length,
    },
  };
};

/*
 * World up, the axis an instance set's heading turns about.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
