import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

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
 */
export function liftHumanFaceColours(
  parts: readonly { material: string; geometry: { mesh: IAutoMovieMesh } }[],
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
