import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

type SourceSite = {
  bone: AutoMovieHumanBodyBoneId;
  id: string;
  position: IAutoMovieVector3;
};

/**
 * Carry a held anatomical graph through its parts' evaluated exterior map.
 *
 * The neutral-only pose owner has already admitted fixed joints without public projections. Every rest origin and resolved world site therefore takes the same point map as the source member and field endpoints. Original rotations remain coordinate conventions and each carried rest remains its own posed frame; this introduces no movement, inferred anatomical axis or rigid-bone certificate. Caller-owned graph maps and site objects remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation One exterior point map carries held rest origins/sites, retaining rotations and rest-equals-posed under the admitted fixed neutral-only premise.
 * @evidence contracts/common.md#clear-and-simple-design Origins and sites share one packed mapping call, keeping source tissue and graph displacement under one authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical axis, rigid-bone or clinical certificate is inferred, and caller graph maps/sites remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation The prose states neutral-only prerequisites, shared endpoint mapping, retained orientations and unchanged caller data.
 * @evidence contracts/performance.md#efficient-algorithms Packing B origins and S sites costs O(B+S) time/storage plus the supplied mapping cost; all moved locations require new maps.
 * @evidence contracts/performance.md#reuse-equivalent-work One carry invocation shares exterior mapping for graph origins/sites while source rotations retain their coordinate convention.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only new origin/site maps escape; packed/moved arrays are temporary and the borrowed callback owns its own retention.
 */
export function carryHumanBodyNeutralSourceRig(
  rig: IAutoMovieHumanBodySourceRigResult,
  carry: (positions: readonly number[]) => number[],
): IAutoMovieHumanBodySourceRigResult {
  const frames: [AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform][] = [...rig.bones];
  const sourceSites: SourceSite[] = [...rig.sites].flatMap(([bone, sites]: [AutoMovieHumanBodyBoneId, ReadonlyMap<string, IAutoMovieVector3>]): SourceSite[] =>
    [...sites].map(([id, position]: [string, IAutoMovieVector3]): SourceSite => ({ bone, id, position })),
  );
  const points: IAutoMovieVector3[] = [
    ...frames.map(([, frame]: [AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform]): IAutoMovieVector3 => frame.rest.position),
    ...sourceSites.map((site: SourceSite): IAutoMovieVector3 => site.position),
  ];
  const moved: number[] = carry(points.flatMap((point: IAutoMovieVector3): number[] => [point.x, point.y, point.z]));
  const pointAt: (index: number) => IAutoMovieVector3 = (index: number): IAutoMovieVector3 => ({
    x: moved[index * 3],
    y: moved[index * 3 + 1],
    z: moved[index * 3 + 2],
  });
  const bones: IAutoMovieHumanBodySourceRigResult["bones"] = new Map(
    frames.map(([bone, frame]: [AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform], at: number): [AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform] => {
      const rest: IAutoMovieHumanBodyBoneWorldRest = { ...frame.rest, position: pointAt(at) };
      return [bone, { ...frame, rest, posed: rest }];
    }),
  );
  const sites: Map<AutoMovieHumanBodyBoneId, Map<string, IAutoMovieVector3>> = new Map<
    AutoMovieHumanBodyBoneId,
    Map<string, IAutoMovieVector3>
  >([...rig.sites].map(([bone]: [AutoMovieHumanBodyBoneId, ReadonlyMap<string, IAutoMovieVector3>]): [AutoMovieHumanBodyBoneId, Map<string, IAutoMovieVector3>] => [bone, new Map()]));
  sourceSites.forEach((site: SourceSite, at: number): void => {
    sites.get(site.bone)!.set(site.id, pointAt(frames.length + at));
  });
  return { ...rig, bones, sites };
}
