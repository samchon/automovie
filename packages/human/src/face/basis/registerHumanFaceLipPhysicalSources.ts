import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceLipPhysicalSources } from "./IHumanFaceLipPhysicalSources";

/**
 * Register both native lip courses as physical source points for one instance.
 * Native vertices keep their existing canonical skin IDs. Nonvertex seats use
 * a separate material domain and ordinals of all exact identities in sorted
 * order. Sorting assigns IDs only: original parent/coefficient order remains
 * untouched for the engine's represented interpolation on final Person skin.
 * A shared-edge exact identity can have two zero-weight third corners; the
 * first source course witness supplies its original represented triangle.
 * No coordinate welding, hash-to-integer conversion or source vertex insertion
 * enters. The supplied reader population must contain both complete courses.
 */
export function registerHumanFaceLipPhysicalSources(
  surface: IAutoMovieHumanFaceBasisSurface,
  points: IHumanFaceLipMarginPoints,
  instance: string,
  generation: string,
): IHumanFaceLipPhysicalSources {
  const domain = humanPhysicalSourceDomain(instance, generation);
  const materialDomain = domain + ":material-skin";
  const sources = new Map<string, IAutoMovieMeshPhysicalSource>();
  const material = new Map<string, IHumanFaceMaterialAttachment>();
  for (const point of [...points.upper, ...points.lower]) {
    if (point.nativeVertex !== null) {
      const id = surface.sourcePartition?.samples[point.nativeVertex] ?? point.nativeVertex;
      if (!Number.isSafeInteger(id) || id < 0)
        throw new Error("Native lip physical source has no canonical sample ID.");
      sources.set(point.identity, { domain, id });
      continue;
    }
    if (surface.sourcePartition?.generation !== generation ||
        point.vertices.length !== 3 || point.weights.length !== 3)
      throw new Error("Material lip physical source needs its same-generation native triangle.");
    const parents: [number, number, number] = [
      surface.sourcePartition.samples[point.vertices[0]],
      surface.sourcePartition.samples[point.vertices[1]],
      surface.sourcePartition.samples[point.vertices[2]],
    ];
    const weights: [number, number, number] = [point.weights[0], point.weights[1], point.weights[2]];
    if (parents.some((id) => !Number.isSafeInteger(id) || id < 0) ||
        weights.some((weight) => !Number.isFinite(weight) || weight < 0))
      throw new Error("Material lip physical source has invalid native support.");
    if (!material.has(point.identity))
      material.set(point.identity, { surface: surface.id, parents, weights, identity: point.identity });
  }
  const attachments = new Map<number, IHumanFaceMaterialAttachment>();
  const identities = [...material.keys()].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  identities.forEach((identity, id) => {
    if (sources.has(identity)) throw new Error("Native and material lip physical identities collide.");
    sources.set(identity, { domain: materialDomain, id });
    attachments.set(id, material.get(identity)!);
  });
  return {
    sources,
    materialAttachments: attachments.size === 0 ? new Map() : new Map([[materialDomain, attachments]]),
  };
}
