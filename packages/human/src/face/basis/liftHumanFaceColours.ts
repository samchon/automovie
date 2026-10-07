import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanFaceColourPart } from "./IHumanFaceColourPart";

/**
 * Fold vertex colours above one into their materials' base colours.
 *
 * A colour field may lighten a region beyond its material (a gain over
 * one: a site whose albedo exceeds the reference skin's), but a vertex
 * colour is a multiplier in [0, 1]. For each material and channel the
 * largest colour its mesh parts reach, when above one, multiplies the base
 * colour and divides every such part's colours, so each vertex's albedo,
 * the base colour times the vertex colour, is unchanged. A material's parts
 * without colours take the reciprocal as colours of their own, keeping
 * their albedo too. An albedo that would exceed one refuses by name: no
 * surface reflects more light than it receives. Materials whose parts stay
 * within one are untouched. Mutates the parts' colours and the materials.
 *
 * @evidence contracts/common.md#principled-implementation A vertex colour multiplies the material base colour, so dividing every part's colour by the per-channel maximum L and multiplying the base by L leaves every vertex albedo unchanged while colours return to [0,1]; parts of the material with no colours take 1/L, which preserves their albedo too. An albedo above one is not a reflectance and is refused by name.
 * @evidence contracts/common.md#clear-and-simple-design Two passes: find the per-material per-channel maxima, then fold them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; the rule applies to every material whose parts exceed one.
 * @evidence contracts/common.md#meaningful-documentation States the invariant preserved, the refusal and that materials and part colours are mutated.
 * @evidence contracts/modeling.md#spatial-conventions Linear RGB throughout; no unit or frame change.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping liftHumanFaceColours is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels liftHumanFaceColours defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry liftHumanFaceColours decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries liftHumanFaceColours constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation liftHumanFaceColours owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source liftHumanFaceColours carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range liftHumanFaceColours admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority liftHumanFaceColours defines no input through which a caller shapes a human form.
 */
export function liftHumanFaceColours(
  parts: readonly IHumanFaceColourPart[],
  materials: ReadonlyMap<string, IAutoMovieMaterial>,
): void {
  const lifts = new Map<string, number[]>();
  for (const part of parts) {
    const colors = part.geometry.mesh.colors;
    if (colors === undefined) continue;
    const lift = lifts.get(part.material) ?? [1, 1, 1];
    for (let i = 0; i < colors.length; ++i)
      lift[i % 3] = Math.max(lift[i % 3]!, colors[i]!);
    lifts.set(part.material, lift);
  }
  for (const [id, lift] of lifts) {
    if (lift.every((value) => value <= 1)) continue;
    const material = materials.get(id)!;
    const base = [
      material.baseColor.r,
      material.baseColor.g,
      material.baseColor.b,
    ].map((value, channel) => value * lift[channel]!);
    if (base.some((value) => value > 1))
      throw new Error(
        `A colour field lifts material ${id}'s albedo above one: ${base
          .map((value) => value.toFixed(4))
          .join(", ")}.`,
      );
    material.baseColor = {
      ...material.baseColor,
      r: base[0]!,
      g: base[1]!,
      b: base[2]!,
      hex: null,
    };
    for (const part of parts) {
      if (part.material !== id) continue;
      const mesh = part.geometry.mesh;
      mesh.colors =
        mesh.colors === undefined
          ? Array.from(
              { length: mesh.positions.length },
              (_v, i) => 1 / lift[i % 3]!,
            )
          : mesh.colors.map((value, i) => value / lift[i % 3]!);
    }
  }
}
