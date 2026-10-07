import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";
import { neighboursOf } from "./bodyContactGeometry";

/** Read the tables of a basis. Throws when a joint names a missing landmark. */
export function createBodyCorrectiveWorld(
  basis: IAutoMovieHumanBodyBasis,
): IBodyCorrectiveWorld {
  const surface = basis.surfaces[0];
  const vertices = surface.positions.length / 3;
  const landmarkAt = (id: string): number[] => {
    const at = basis.landmarks.ids.indexOf(id);
    if (at < 0) throw new Error("The basis has no landmark " + id);
    return basis.landmarks.positions.slice(at * 3, at * 3 + 3);
  };
  const dominant = (v: number): string => {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (surface.skin.weights[v * 4 + k] > surface.skin.weights[v * 4 + best])
        best = k;
    return surface.skin.joints[surface.skin.boneIndices[v * 4 + best]];
  };
  const segments = new Map<string, number[]>();
  for (let t = 0; t < surface.indices.length; t += 3) {
    const corners = [
      surface.indices[t],
      surface.indices[t + 1],
      surface.indices[t + 2],
    ];
    const bones = corners.map(dominant);
    const owner =
      bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
    const list = segments.get(owner);
    if (list === undefined) segments.set(owner, corners);
    else list.push(...corners);
  }
  return {
    surface,
    vertices,
    near: neighboursOf(surface.indices, vertices),
    segments,
    dominant,
    neutral: new Map(basis.joints.map((joint) => [joint.bone, joint.neutral])),
    lengths: new Map(
      basis.joints.map((joint) => {
        const h = landmarkAt(joint.head);
        const t = landmarkAt(joint.tail);
        return [joint.bone, Math.hypot(t[0] - h[0], t[1] - h[1], t[2] - h[2])];
      }),
    ),
    parents: new Map(basis.joints.map((joint) => [joint.bone, joint.parent])),
  };
}
