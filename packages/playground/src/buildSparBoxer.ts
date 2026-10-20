import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

/**
 * Tint a fresh conventional stick figure's ink material while retaining its eyes/pupils. Model and top-level skeleton share the supplied identity and bone wrapper; authored RGB values are not measured armour, skin or lighting properties.
 *
 * @evidence contracts/common.md#principled-implementation The canonical stick figure supplies geometry/bones, and replacing only the named ink base color preserves other authored material properties and part attachments.
 * @evidence contracts/common.md#clear-and-simple-design One shared producer serves the red/blue wrappers without copying the rig construction or owning viewer placement/animation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed caller palette is conventional demonstration input, not an anatomical observation or visual correctness claim; both returned skeleton references use one identity rather than retaining a stale stickman id.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies changed material, preserved eyes/pupils, shared skeleton and authored palette provenance.
 * @evidence contracts/performance.md#efficient-algorithms Fresh fixed-size stick construction and one material pass dominate assembly; later primitive tessellation, upload and animation belong to the viewer and retain their cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One fresh stick result supplies geometry/bones and unaffected materials within a call; mutable models are not cached across distinct page actors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned model/skeleton data belong to the page, with no producer-owned GPU handle, timer or worker. The page owns resources realized by buildModel and must retire them separately from mountViewer's renderer; non-ink material records remain borrowed from this call's fresh stick model.
 */
export function buildSparBoxer(
  id: string,
  rgb: [number, number, number],
): {
  /** Actor-identified wrapper shared with model.skeleton, borrowing this call's fresh stick bone array. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh tint-adjusted document; the page owns its later realized geometry and materials. */
  model: IAutoMovieModel;
} {
  const built: ReturnType<typeof buildStickman> =
    buildStickman(DEFAULT_STICKMAN);
  const skeleton: IAutoMovieSkeleton = { ...built.skeleton, id };
  return {
    skeleton,
    model: {
      ...built.model,
      skeleton,
      id,
      materials: built.model.materials.map(
        (material: IAutoMovieMaterial): IAutoMovieMaterial =>
          material.id === "ink"
            ? {
                ...material,
                baseColor: { r: rgb[0], g: rgb[1], b: rgb[2], a: 1, hex: null },
              }
            : material,
      ),
    },
  };
}
