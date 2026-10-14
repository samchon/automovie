import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieModelPart as IAutoMovieModelPartImported, IAutoMovieMaterial as IAutoMovieMaterialImported, IAutoMovieValidation as IAutoMovieValidationImported } from "@automovie/interface";

import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceHairResultCache } from "../anatomy/hair/createHumanFaceHairResultCache";
import { resolveHumanFaceFacialHair } from "../anatomy/hair/resolveHumanFaceFacialHair";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFaceHairContactLayout } from "../anatomy/hair/IHumanFaceHairContactLayout";
import type { IAutoMovieHumanFaceHair as IAutoMovieHumanFaceHairImported } from "../../index";



/**
 * Append numerical hair after the face's existing geometry and occlusion stages.
 * The original pose/document cache, collision checks and complete model gate
 * retain their order. Each appended mesh and finish is an owned cache copy.
 * Scalp locks and terminal facial shafts have distinct retained cache entries
 * over the same native producer, so their alternating composition does not
 * invalidate one another. Their actual generated station counts still share
 * the original million-station assembled budget. Actual completed hair owners report progress; a cache hit does
 * not pretend that guide or ribbon construction ran again. Observer exceptions
 * propagate. Certification follows successful complete-model validation;
 * a later composition progress callback can still throw after certification,
 * without publishing the caller's stage.
 *
 * @evidence contracts/common.md#principled-implementation Admitted scalp and resolved facial populations share the native producer but have distinct result caches. Their actual station counts share the assembled budget, ids are checked against the current model, and new results are certified only after validateModel succeeds on that assembled model.
 * @evidence contracts/common.md#clear-and-simple-design One composition owner preserves population order, copy ownership, collision checks, cache certification and optional contact-layout transfer; geometry generation and facial-hair source resolution remain with their producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The million-station cap is an explicit resource admission bound, not a biological hair count. Certified hits still validate the current base and check ids; validateModel proves model/reference consistency rather than cross-part anatomical clearance or GPU appearance.
 * @evidence contracts/common.md#meaningful-documentation Prose states post-occlusion ordering, separate population caches, owned copies, shared actual station budget, progress miss semantics and certification versus later observer failure.
 * @evidence contracts/performance.md#efficient-algorithms Misses pay native guide/shaft work and full model validation; hits pay owned result copies, current-base validation and nested new/resident id scans. Station admission bounds assembled generated stations, while part/material and validation work follows their actual populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Each population cache keys its own numerical document layers and pose identity; scalp/facial alternation does not evict the other entry. Current base structure and resident ids are rechecked even when generated geometry was previously certified.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder owns one producer and latest scalp/facial cache entries; replacing or releasing it frees retained generated results. Current owned meshes/materials/layouts transfer to the supplied model/maps, and no worker, viewer or GPU resource is acquired.
 *
 * @author Samchon
 */
export function createHumanFaceHairComposition(basis: IAutoMovieHumanFaceBasis): (document: IAutoMovieHumanFaceBasisDocument, positions: ReadonlyMap<string, readonly number[]>, pose: object, model: IAutoMovieModel, progress?: (owner: string) => void, contactLayouts?: Map<string, IHumanFaceHairContactLayout>) => string[]  {
  const producer: (hair: IAutoMovieHumanFaceHairImported, positions: ReadonlyMap<string, readonly number[]>, progress?: (owner: string) => void) => { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; } = createHumanFaceHairBuilder(basis);
  const buildScalp: (hair: IAutoMovieHumanFaceHairImported, positions: ReadonlyMap<string, readonly number[]>, pose: object, progress?: (owner: string) => void) => { value: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; }; certified: boolean; certify: () => void; } = createHumanFaceHairResultCache(producer);
  const buildFacial: (hair: IAutoMovieHumanFaceHairImported, positions: ReadonlyMap<string, readonly number[]>, pose: object, progress?: (owner: string) => void) => { value: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; }; certified: boolean; certify: () => void; } = createHumanFaceHairResultCache(producer);
  return (
    document: IAutoMovieHumanFaceBasisDocument,
    positions: ReadonlyMap<string, readonly number[]>,
    pose: object,
    model: IAutoMovieModel,
    progress?: (owner: string) => void,
    contactLayouts?: Map<string, IHumanFaceHairContactLayout>,
  ): string[] => {
    const populations: { input: IAutoMovieHumanFaceHairImported | null | undefined; build: (hair: IAutoMovieHumanFaceHairImported, positions: ReadonlyMap<string, readonly number[]>, pose: object, progress?: (owner: string) => void) => { value: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; }; certified: boolean; certify: () => void; }; }[] = [{ input: document.hair, build: buildScalp }];
    if (document.facialHair !== undefined && document.facialHair !== null)
      populations.push({ input: resolveHumanFaceFacialHair(document.facialHair, basis), build: buildFacial });
    const ids: string[] = [];
    let stationCount: number = 0;
    for (const { input: population, build } of populations) {
      if (population === undefined || population === null) continue;
      assertHumanFaceHair(population);
      const generated: { value: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; }; certified: boolean; certify: () => void; } = build(population, positions, pose, progress);
      const hair: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; contactLayouts: Map<string, IHumanFaceHairContactLayout>; stationCount: number; } = generated.value;
      stationCount += hair.stationCount;
      if (stationCount > 1_000_000)
        throw new Error("Composed scalp and facial hair exceed the original million-station assembled budget.");
      ids.push(...hair.parts.map((part: IAutoMovieModelPartImported): string  => part.id));
      if (
        hair.parts.some((part: IAutoMovieModelPartImported): boolean  => model.parts.some((resident: IAutoMovieModelPartImported): boolean  => resident.id === part.id)) ||
        hair.materials.some((material: IAutoMovieMaterialImported): boolean  => model.materials.some((resident: IAutoMovieMaterialImported): boolean  => resident.id === material.id))
      ) throw new Error("Numerical hair identities collide with resident face geometry or finishes.");
      if (generated.certified) {
        const validation: IAutoMovieValidationImported = validateModel({ model });
        if (!validation.success)
          throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
      }
      model.parts.push(...hair.parts);
      model.materials.push(...hair.materials);
      for (const [id, layout] of hair.contactLayouts) contactLayouts?.set(id, layout);
      if (!generated.certified) {
        const validation: IAutoMovieValidationImported = validateModel({ model });
        if (!validation.success)
          throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
        generated.certify();
      }
      progress?.("hair-composition");
    }
    return ids;
  };
}
