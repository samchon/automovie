import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * Carry a held anatomical graph through its parts' evaluated exterior map.
 *
 * The neutral-only pose owner has already admitted fixed joints without public
 * projections. Every rest origin and resolved world site therefore takes the
 * same point map as the source member and field endpoints. Original rotations
 * remain coordinate conventions and each carried rest remains its own posed
 * frame; this introduces no movement, inferred anatomical axis or rigid-bone
 * certificate. Caller-owned graph maps and site objects remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation One supplied point map carries all held origins and world sites, preserving a site's identity and its member's common evaluated frame.
 * @evidence contracts/common.md#clear-and-simple-design One batch contains the graph's existing anchors and one result reconstructs its immutable maps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumes the same exterior map as source geometry rather than a separate bone or site correction.
 * @evidence contracts/common.md#meaningful-documentation States held-neutral admission, unchanged rotation conventions and caller ownership.
 * @evidence contracts/modeling.md#spatial-conventions Origins and resolved sites enter and leave in the actual common body metre frame.
 * @evidence contracts/modeling.md#shared-boundaries Coincident source points take the identical point rule already used by the source members and held field endpoints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing graph and member owners retain every bone and attachment identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The exterior and field owners retain their source channels and numerical meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This graph transport emits no mesh.
 * @evidenceExclude contracts/modeling.md#rendered-observation The anatomical assembly and final person observe the coupled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This transport reads existing authored origins and sites without establishing new anatomical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range The neutral pose owner already refuses all performance, and the final geometry owners retain shape and clearance admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal transport exposes no personal frame or vertex input.
 */
export function carryHumanBodyNeutralSourceRig(
  rig: IAutoMovieHumanBodySourceRigResult,
  carry: (positions: readonly number[]) => number[],
): IAutoMovieHumanBodySourceRigResult {
  const frames = [...rig.bones];
  const sourceSites = [...rig.sites].flatMap(([bone, sites]) =>
    [...sites].map(([id, position]) => ({ bone, id, position })),
  );
  const points = [
    ...frames.map(([, frame]) => frame.rest.position),
    ...sourceSites.map((site) => site.position),
  ];
  const moved = carry(points.flatMap((point) => [point.x, point.y, point.z]));
  const pointAt = (index: number): IAutoMovieVector3 => ({
    x: moved[index * 3],
    y: moved[index * 3 + 1],
    z: moved[index * 3 + 2],
  });
  const bones: IAutoMovieHumanBodySourceRigResult["bones"] = new Map(
    frames.map(([bone, frame], at) => {
      const rest = { ...frame.rest, position: pointAt(at) };
      return [bone, { ...frame, rest, posed: rest }];
    }),
  );
  const sites = new Map<
    AutoMovieHumanBodyBoneId,
    Map<string, IAutoMovieVector3>
  >([...rig.sites].map(([bone]) => [bone, new Map()]));
  sourceSites.forEach((site, at) =>
    sites.get(site.bone)!.set(site.id, pointAt(frames.length + at)),
  );
  return { ...rig, bones, sites };
}
