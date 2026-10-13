import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourceVolumeBinding } from "./IAutoMovieHumanBodySourceVolumeBinding";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";
import { readHumanBodySourceBoundaryVolume } from "./readHumanBodySourceBoundaryVolume";

type SourceCompartment = {
  source: IAutoMovieHumanBodySourcePart;
  binding: IAutoMovieHumanBodySourceVolumeBinding;
};

/**
 * Read requested compartments on the actual emitted source geometry.
 *
 * The source solver's Float64 target and Float32 rest readings stay separate from this posed Float32 boundary volume. The exact source member IDs locate output meshes; geometry is quantized by the same owner preview and export use, then measured by the existing closed-boundary instrument. An observed acquisition remains undefined because no registered acquisition comparison has been supplied. No rounding difference changes the caller's target.
 *
 * @evidence contracts/common.md#principled-implementation Exact source member IDs select emitted meshes, shared Float32 conversion precedes closed-boundary integration, and cubic metres convert to mL.
 * @evidence contracts/common.md#clear-and-simple-design A final metric owner separates posed export readings from source-rest reports and keeps unavailable acquisition comparison null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rounding changes no target or acquisition kind, and missing output compartments refuse without substituting source geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies emitted authority, member correspondence, precision stages and unavailable acquisition comparison.
 * @evidence contracts/performance.md#efficient-algorithms O(P+B) emitted-part and source-binding indexes serve R readings with expected constant-time identity lookup; each consumed compartment still requires its actual Float32 buffer conversion and triangle integration. Index storage is O(P+B).
 * @evidence contracts/performance.md#reuse-equivalent-work Emitted-part and first-owner source-binding indexes serve all readings within this call; original first-match ownership is preserved and later calls rebuild indexes for their current source/outputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only new reading records escape; maps/quantized buffers are temporary and original reports/source meshes stay unchanged.
 */
export function finalizeHumanBodySourceQuantities(
  readings: readonly IHumanBodySourceQuantityReading[],
  sourceParts: readonly IAutoMovieHumanBodySourcePart[],
  outputParts: IAutoMovieModel["parts"],
): readonly IHumanBodySourceQuantityReading[] {
  const actual: Map<string, IAutoMovieModelPart> = new Map(outputParts.map((part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [part.id, part]));
  const compartments: Map<string, SourceCompartment> = new Map();
  for (const source of sourceParts)
    for (const binding of source.quantityBindings ?? [])
      if (!compartments.has(binding.path))
        compartments.set(binding.path, { source, binding });
  return readings.map((reading: IHumanBodySourceQuantityReading): IHumanBodySourceQuantityReading => {
    if (reading.input.kind === "observed")
      return { ...reading, finalFloat32Millilitres: null };
    const compartment: SourceCompartment | undefined = compartments.get(reading.path);
    if (compartment === undefined)
      throw new Error(
        "Final quantity has no source compartment: " + reading.path,
      );
    const { source, binding }: SourceCompartment = compartment;
    let volume: number = 0;
    for (const member of binding.members) {
      const part: IAutoMovieModelPart | undefined = actual.get("anatomical-source:" + source.id + "/" + member);
      if (part === undefined || part.geometry.type !== "mesh")
        throw new Error(
          "Final quantity has no emitted source mesh: " +
            reading.path +
            "/" +
            member,
        );
      const buffers: ReturnType<typeof float32MeshBuffers> = float32MeshBuffers(part.geometry.mesh, part.id);
      volume += readHumanBodySourceBoundaryVolume({
        ...part.geometry.mesh,
        positions: Array.from(buffers.positions),
        indices: Array.from(buffers.indices),
      });
    }
    return { ...reading, finalFloat32Millilitres: volume * 1e6 };
  });
}
