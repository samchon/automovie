import type { IAutoMovieMaterial } from "@automovie/interface";

/** Preserve the existing owner's actual material record, including its identity.
 * This path does not reconstruct retained colours or substitute a new finish. */

export function retainedArchitectureMaterial(material: IAutoMovieMaterial): IAutoMovieMaterial {
  if (!material.id || !Number.isFinite(material.roughness) || material.roughness < 0 || material.roughness > 1)
    throw new Error("Invalid retained architectural material: " + material.id);
  return material;
}
