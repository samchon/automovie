import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieSubjectDescription,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieInstanceAddress } from "./autoMovieInstanceAddress";
import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMaterials } from "./autoMovieSubjectMaterials";
import { AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT } from "./constants/AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT";
import { Quaternion } from "./math/Quaternion";
import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/** World up, the axis an instance set's heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Describe one compiled instance set as a subject.
 *
 * The set's model is the first tier of its own LOD list, its transform is the
 * anchor turned by the heading about +Y at unit scale, and its content box is
 * the compiled `bounds`, in world metres. It is owned by, and placed in, the
 * space `space` names, if any. Its members are drawn from the slot range
 * rather than a list, because a compact set stores a count and not its
 * members: the page is the slots from `memberOffset`, clamped to the count, up
 * to `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` of them, addressed by
 * {@link autoMovieInstanceAddress} and sorted in render-id order.
 *
 * @param set Compiled set to describe.
 * @param models Runtime models by id, compiled and environment-owned.
 * @param space Address of the space the set is placed in, or null.
 * @param revision Revision of the artifact being described.
 * @param memberOffset Rank of the first member to name, a whole number from 0.
 * @returns The set's description.
 *
 * @evidence contracts/common.md#principled-implementation Reads the set's placement and bounds from its compiled record, which the kernel measured over every member, and pages members by slot arithmetic, so even a set of millions is described without regenerating a member.
 * @evidence contracts/common.md#clear-and-simple-design One owner for an instance-set subject, called by the subject describer for both single and inventory description.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No set or layout is special-cased; a set whose first LOD model is unknown is described without materials rather than with guessed ones.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the model, transform, bounds and units, the owner and space, and how the member page is drawn, sized, addressed and ordered.
 * @evidence contracts/performance.md#efficient-algorithms Constant in the set's count: only one page of at most the sample limit of addresses is generated and sorted.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one set per call and coordinates no shared work; the compiled bounds it reports were measured once by the kernel.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new description holding at most one page of addresses, and retains nothing.
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
    transform: {
      translation: structuredClone(set.anchor),
      rotation: Quaternion.fromAxisAngle(UP, set.facingDeg),
      scale: { x: 1, y: 1, z: 1 },
    },
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
