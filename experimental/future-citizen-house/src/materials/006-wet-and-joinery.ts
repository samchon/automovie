/** Native finish recipes owned by docs/materials/006-wet-and-joinery.md.
 * The shared constructor supplies only the documented renderer defaults. */
import type { IAutoMovieMaterial } from "@automovie/interface";
import { materialFinish } from "./001-binding-and-scale";

/** The toilet seat is resin rather than the old linen colour's textile. */
export function sanitarySeatMaterial(): IAutoMovieMaterial {
  return materialFinish("sanitary-seat", "#e7e6df", .30);
}

/** Preserve the existing owner's actual material record, including its identity.
 * This path does not reconstruct retained colours or substitute a new finish. */
export function retainedArchitectureMaterial(material: IAutoMovieMaterial): IAutoMovieMaterial {
  if (!material.id || !Number.isFinite(material.roughness) || material.roughness < 0 || material.roughness > 1)
    throw new Error("Invalid retained architectural material: " + material.id);
  return material;
}

export const wetAndJoineryTextured = {
  "wet-tile": ["#6f746f", .65, "tile-grain", .45, .45],
  "worktop-stone": ["#dad7ce", .30, "worktop-grain", .50, .50],
} as const;

export const wetAndJoinerySolid = {
  "sanitary-ceramic": ["#e7e6df", .19, 0, .12],
  "joinery-green": ["#626b59", .44, 0, 0],
  "joinery-light": ["#c9c3b7", .48, 0, 0],
  "mirror-proxy": ["#d6ddda", .06, 1, 0],
} as const;
