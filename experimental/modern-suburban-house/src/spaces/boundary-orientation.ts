/** Preserve world points while orienting a one-sided wall frame toward outdoors. */
import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * @evidence spaces/07-boundary-assembly.md The existing wall's two probe sides determine its one-sided frame orientation without changing its body or void.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A single interior side receives an outward local +Z, with the local horizontal coordinate reversed alongside the quaternion; a two-room boundary keeps its frame.
 * @evidence principles/core/source-units.md#source-scope-preservation Returns orientation data for the existing world wall; it creates no room, wall, opening, or facade observation.
 * @evidence principles/core/source-units.md#source-substantive-completion Resolves both wall axes and both exterior sides, preserving every world point when local horizontal coordinates are multiplied by the returned sign.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work GPU census views looked inside rear and right walls because a short containment probe could not span half their thickness. The boundary design now authors outward frame orientation from the measured side identities instead of relying on that probe.
 */
export const boundaryOrientation=(axis:"x"|"z",sides:readonly [string,string]):{
  rotation:IAutoMovieQuaternion;sign:1|-1;
}=>{
  const single=sides.includes("house-site");
  const reversed=single&&(axis==="x"?sides[0]==="house-site":sides[1]==="house-site");
  const sign=reversed?-1:1;
  const yaw=axis==="x"?(reversed?Math.PI:0):(reversed?Math.PI/2:-Math.PI/2);
  return {rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},sign};
};
