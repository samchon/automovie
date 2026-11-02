import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import * as THREE from "three";

/**
 * CSS colours of the page legend's axis and section entries, from the model's materials.
 *
 * @param model Generated model whose `human.construction.` parts carry the axis and section materials.
 * @returns sRGB CSS colours; a role without a part is null.
 *
 * @evidence contracts/common.md#principled-implementation Converts the linear material colours of the first axis and section parts to sRGB CSS strings, the colours the unlit curves display.
 * @evidence contracts/common.md#clear-and-simple-design The legend reads the model instead of repeating generator colours in the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A role without a part reports null instead of a guessed colour.
 * @evidence contracts/common.md#meaningful-documentation States where each colour comes from.
 * @evidence contracts/performance.md#efficient-algorithms O(P) search over parts and materials.
 * @evidence contracts/performance.md#reuse-equivalent-work The page calls it once per load.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export function readHumanLegend(model: IAutoMovieModel): {
  axis: string | null;
  section: string | null;
} {
  const css: (part: IAutoMovieModelPart | undefined) => string | null = (
    part: IAutoMovieModelPart | undefined,
  ): string | null => {
    const material: IAutoMovieMaterial | undefined = model.materials.find(
      (candidate: IAutoMovieMaterial): boolean =>
        candidate.id === part?.material,
    );
    if (material === undefined) return null;
    return new THREE.Color()
      .setRGB(material.baseColor.r, material.baseColor.g, material.baseColor.b)
      .getStyle();
  };
  const curves: IAutoMovieModelPart[] = model.parts.filter(
    (part: IAutoMovieModelPart): boolean =>
      part.id.startsWith("human.construction."),
  );
  return {
    axis: css(
      curves.find((part: IAutoMovieModelPart): boolean =>
        part.id.endsWith("/axis"),
      ),
    ),
    section: css(
      curves.find(
        (part: IAutoMovieModelPart): boolean => !part.id.endsWith("/axis"),
      ),
    ),
  };
}
