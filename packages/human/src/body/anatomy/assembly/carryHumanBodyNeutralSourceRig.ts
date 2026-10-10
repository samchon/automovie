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
