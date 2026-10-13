import type { IHumanPersonBodyDressInput } from "../structures/IHumanPersonBodyDressInput";
import type { IHumanPersonDressedBody } from "../structures/IHumanPersonDressedBody";

/**
 * Obtain prepared rest coverage and register its fabric material while retaining the body's original skin regions. The person consumer places/stitches skin, completes anatomical layer readings, then cuts/lifts final fabric from that coverage. This adapter constructs no clothing mesh and certifies no fit. Omission returns the original body; a garment adds shallow body/model wrappers and a copied palette while borrowing parts and the actual garment descriptor.
 *
 * @evidence contracts/common.md#principled-implementation The prepared body garment owner supplies material/rest coverage before final person-region composition, preserving original skin as anatomy authority.
 * @evidence contracts/common.md#clear-and-simple-design This adapter registers one material; rest coverage, final skin placement and later fabric cutting retain their respective owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Before-join garment geometry is not emitted here, and material registration alone supplies no cloth fitting or optical qualification.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies deferred geometry, unchanged omission and shallow wrapper/borrowed descriptor ownership.
 * @evidence contracts/performance.md#efficient-algorithms Prepared dress pays its owner's actual coverage cost; this adapter adds an O(M) palette copy and constant wrappers without a vertex traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The prepared source garment and existing parts are consumed directly rather than recompiling skin or independently sampling final posed coverage.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned wrappers/palette and garment reference follow caller lifetime; no independent cache, mesh buffer or running task is retained.
 */
export function dressHumanPersonBody(
  input: IHumanPersonBodyDressInput,
): IHumanPersonDressedBody {
  const garment: ReturnType<IHumanPersonBodyDressInput["prepared"]["dress"]> = input.prepared.dress();
  if (garment === undefined) return { body: input.body };
  return {
    garment,
    body: { ...input.body, model: { ...input.body.model,
      materials: [...input.body.model.materials, garment.material],
    } },
  };
}
