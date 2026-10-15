import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

/**
 * World centre and face normal of one opening's void, and the reach from the
 * wall's mid-plane to 0.05 m beyond either face: the one place route checks and
 * observations read which outside zone an envelope opening opens on to.
 * Throws when the opening, its host face or its void is missing.
 */

export const openingAxis = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string
): { centre: IAutoMovieVector3; normal: IAutoMovieVector3; reach: number; } => {
  const opening = environment.openings.find((o) => o.id === openingId);
  const face = opening === undefined
    ? undefined
    : environment.boundaries.find((b) => b.id === opening.boundary)?.face;
  if (opening === undefined ||
    face === undefined ||
    opening.profile === undefined)
    throw new Error(`opening "${openingId}" has no host face or void`);
  const n = opening.profile.outline.length;
  const cx = opening.profile.outline.reduce((s, q) => s + q.x, 0) / n;
  const cy = opening.profile.outline.reduce((s, q) => s + q.y, 0) / n;
  const r = face.rotation;
  const rotate = (v: IAutoMovieVector3): IAutoMovieVector3 => {
    const t = {
      x: 2 * (r.y * v.z - r.z * v.y),
      y: 2 * (r.z * v.x - r.x * v.z),
      z: 2 * (r.x * v.y - r.y * v.x),
    };
    return {
      x: v.x + r.w * t.x + (r.y * t.z - r.z * t.y),
      y: v.y + r.w * t.y + (r.z * t.x - r.x * t.z),
      z: v.z + r.w * t.z + (r.x * t.y - r.y * t.x),
    };
  };
  const local = rotate({ x: cx, y: cy, z: 0 });
  return {
    centre: {
      x: face.origin.x + local.x,
      y: face.origin.y + local.y,
      z: face.origin.z + local.z,
    },
    normal: rotate({ x: 0, y: 0, z: 1 }),
    reach: face.thickness / 2 + 0.05,
  };
};
