import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceHairResultCache } from "../anatomy/hair/createHumanFaceHairResultCache";
import { resolveHumanFaceFacialHair } from "../anatomy/hair/resolveHumanFaceFacialHair";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFaceHairContactLayout } from "../anatomy/hair/IHumanFaceHairContactLayout";

/**
 * Append numerical hair after the face's existing geometry and occlusion stages.
 * The original pose/document cache, collision checks and complete model gate
 * retain their order. Each appended mesh and finish is an owned cache copy.
 * Scalp locks and terminal facial shafts have distinct retained cache entries
 * over the same native producer, so their alternating composition does not
 * invalidate one another. Their actual generated station counts still share
 * the original million-station assembled budget. Actual completed hair owners report progress; a cache hit does
 * not pretend that guide or ribbon construction ran again. Observer exceptions
 * propagate and cannot certify or cache an unfinished build.
 *
 * @author Samchon
 */
export function createHumanFaceHairComposition(basis: IAutoMovieHumanFaceBasis) {
  const producer = createHumanFaceHairBuilder(basis);
  const buildScalp = createHumanFaceHairResultCache(producer);
  const buildFacial = createHumanFaceHairResultCache(producer);
  return (
    document: IAutoMovieHumanFaceBasisDocument,
    positions: ReadonlyMap<string, readonly number[]>,
    pose: object,
    model: IAutoMovieModel,
    progress?: (owner: string) => void,
    contactLayouts?: Map<string, IHumanFaceHairContactLayout>,
  ): string[] => {
    const populations = [{ input: document.hair, build: buildScalp }];
    if (document.facialHair !== undefined && document.facialHair !== null)
      populations.push({ input: resolveHumanFaceFacialHair(document.facialHair, basis), build: buildFacial });
    const ids: string[] = [];
    let stationCount = 0;
    for (const { input: population, build } of populations) {
      if (population === undefined || population === null) continue;
      assertHumanFaceHair(population);
      const generated = build(population, positions, pose, progress);
      const hair = generated.value;
      stationCount += hair.stationCount;
      if (stationCount > 1_000_000)
        throw new Error("Composed scalp and facial hair exceed the original million-station assembled budget.");
      ids.push(...hair.parts.map((part) => part.id));
      if (
        hair.parts.some((part) => model.parts.some((resident) => resident.id === part.id)) ||
        hair.materials.some((material) => model.materials.some((resident) => resident.id === material.id))
      ) throw new Error("Numerical hair identities collide with resident face geometry or finishes.");
      if (generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
      }
      model.parts.push(...hair.parts);
      model.materials.push(...hair.materials);
      for (const [id, layout] of hair.contactLayouts) contactLayouts?.set(id, layout);
      if (!generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
        generated.certify();
      }
      progress?.("hair-composition");
    }
    return ids;
  };
}
