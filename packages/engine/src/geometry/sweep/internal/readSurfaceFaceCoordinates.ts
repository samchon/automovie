import type { IAutoMovieSurfaceCage } from "@automovie/interface";

/* Admit one addressed cage quad and its four normalized chart coordinates. */
export function readSurfaceFaceCoordinates(
  cage: IAutoMovieSurfaceCage,
  face: number,
  label: string,
): IAutoMovieSurfaceCage["corners"][number] {
  const corners =
    Number.isSafeInteger(face) && face >= 0 ? cage.corners[face] : undefined;
  const quad = corners === undefined ? undefined : cage.cage.faces[face];
  if (corners === undefined || quad === undefined)
    throw new Error(`${label} lies on face ${face}, which is out of range`);
  if (quad.length !== 4 || corners.length !== 4)
    throw new Error(`${label} lies on face ${face}, which is not a quad`);
  const patch: number | undefined = corners[0]?.patch;
  if (
    patch === undefined ||
    !Number.isSafeInteger(patch) ||
    patch < 0 ||
    cage.patches[patch] === undefined
  )
    throw new Error(`${label} has an invalid surface patch on face ${face}`);
  for (const corner of corners)
    if (
      !corner ||
      corner.patch !== patch ||
      !Number.isFinite(corner.s) ||
      corner.s < 0 ||
      corner.s > 1 ||
      !Number.isFinite(corner.t) ||
      corner.t < 0 ||
      corner.t > 1
    )
      throw new Error(`${label} has invalid chart coordinates on face ${face}`);
  return corners;
}
