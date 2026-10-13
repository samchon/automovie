import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanPersonFaceRest } from "../structures/IAutoMovieHumanPersonFaceRest";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Gather the face producer's actual performed head and optional band positions by their compiled source-corner tables, in source metres. Owned arrays begin at zero; admitted complete coverage and alias agreement are producer premises rather than checks in this reader. Missing band parts fail through the required producer-part access. Repeated corners overwrite in part order without averaging.
 *
 * @evidence contracts/common.md#principled-implementation Exact region and band source indices gather emitted render vertices back into their compiled skin/view slots.
 * @evidence contracts/common.md#clear-and-simple-design The reader copies coordinates only; producer coverage, correspondence admission and subsequent skin formation stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld or averaging infers a source ID, and zero initialization does not establish missing-coverage acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre values, alias/coverage premises, last-write ordering and owned outputs.
 * @evidence contracts/performance.md#efficient-algorithms Part lookup/gather visits P parts and actual region corners, allocates F head plus optional band-view coordinates, and searches the band part once.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled corner maps are consumed directly for all regions without constructing spatial correspondence or independently evaluating face geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the newly gathered coordinate arrays escape; the reader retains no model, part table or asynchronous task.
 */
export function readHumanPersonFaceRest(
  plan: IAutoMovieHumanPersonSkinPlan,
  face: IAutoMovieModel,
): IAutoMovieHumanPersonFaceRest {
  const head: number[] = new Array<number>(plan.faceCount * 3).fill(0);
  for (const part of face.parts) {
    const sources: readonly number[] | undefined = plan.faceRegions.get(part.id);
    if (sources === undefined) continue;
    const { positions }: ReturnType<typeof meshOfHumanPart> = meshOfHumanPart(part);
    sources.forEach((source: number, vertex: number): void => {
      for (let axis: number = 0; axis < 3; axis++)
        head[source * 3 + axis] = positions[vertex * 3 + axis];
    });
  }
  const band: IAutoMovieHumanPersonSkinPlan["band"] = plan.band;
  if (band === undefined) return { head };
  const banded: number[] = new Array<number>(band.viewBodyVertices.length * 3).fill(0);
  const { positions }: ReturnType<typeof meshOfHumanPart> = meshOfHumanPart(
    face.parts.find((one: IAutoMovieModel["parts"][number]): boolean => one.id === band.surface)!,
  );
  band.sources.forEach((source: number, vertex: number): void => {
    for (let axis: number = 0; axis < 3; axis++)
      banded[source * 3 + axis] = positions[vertex * 3 + axis];
  });
  return { head, band: banded };
}
