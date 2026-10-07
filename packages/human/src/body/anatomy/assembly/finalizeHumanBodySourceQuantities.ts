import type { IAutoMovieModel } from "@automovie/interface";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";
import { readHumanBodySourceBoundaryVolume } from "./readHumanBodySourceBoundaryVolume";

/**
 * Read requested compartments on the actual emitted source geometry.
 *
 * The source solver's Float64 target and Float32 rest readings stay separate
 * from this posed Float32 boundary volume. The exact source member IDs locate
 * output meshes; geometry is quantized by the same owner preview and export
 * use, then measured by the existing closed-boundary instrument. An observed
 * acquisition remains undefined because no registered acquisition comparison
 * has been supplied. No rounding difference changes the caller's target.
 *
 * @evidence contracts/common.md#principled-implementation Requested member identities select actual output geometry, and the shared Float32 conversion precedes the existing oriented boundary-volume integral.
 * @evidence contracts/common.md#clear-and-simple-design One final reading augments existing source-stage quantities without repeating the source solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stored header, bbox estimate or solved target substitutes for the emitted boundary; an unavailable member refuses.
 * @evidence contracts/common.md#meaningful-documentation Separates source-rest and posed-export precision and preserves undefined acquisition comparison.
 * @evidence contracts/modeling.md#spatial-conventions Emitted metre coordinates yield cubic metres, converted explicitly to millilitres by 1e6.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source binding retains each compartment's member identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function reads existing targets and adds no control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source membership and attachment owners define boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer observes the emitted geometry.
 * @evidence contracts/anatomy.md#anatomical-source Actual geometric boundary volume is distinct from an acquisition comparison or clinical tissue segmentation.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source and conversion owners enforce their supported conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Caller targets and raw observations remain unchanged.
 */
export function finalizeHumanBodySourceQuantities(
  readings: readonly IHumanBodySourceQuantityReading[],
  sourceParts: readonly IAutoMovieHumanBodySourcePart[],
  outputParts: IAutoMovieModel["parts"],
): readonly IHumanBodySourceQuantityReading[] {
  const actual = new Map(outputParts.map((part) => [part.id, part]));
  return readings.map((reading) => {
    if (reading.input.kind === "observed")
      return { ...reading, finalFloat32Millilitres: null };
    const source = sourceParts.find((part) =>
      part.quantityBindings?.some((binding) => binding.path === reading.path),
    );
    const binding = source?.quantityBindings?.find(
      (candidate) => candidate.path === reading.path,
    );
    if (source === undefined || binding === undefined)
      throw new Error(
        "Final quantity has no source compartment: " + reading.path,
      );
    let volume = 0;
    for (const member of binding.members) {
      const part = actual.get("anatomical-source:" + source.id + "/" + member);
      if (part === undefined || part.geometry.type !== "mesh")
        throw new Error(
          "Final quantity has no emitted source mesh: " +
            reading.path +
            "/" +
            member,
        );
      const buffers = float32MeshBuffers(part.geometry.mesh, part.id);
      volume += readHumanBodySourceBoundaryVolume({
        ...part.geometry.mesh,
        positions: Array.from(buffers.positions),
        indices: Array.from(buffers.indices),
      });
    }
    return { ...reading, finalFloat32Millilitres: volume * 1e6 };
  });
}
