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
