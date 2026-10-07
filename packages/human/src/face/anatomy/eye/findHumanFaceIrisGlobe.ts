import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisGlobeTriangle } from "./structures/IHumanFaceIrisGlobeTriangle";

/**
 * The globe of one eye: the first textured, UV-bearing region whose triangles
 * are fully bound to that eye owner (weight one on all three vertices), with
 * the neutral positions of those vertices. Null when no surface has one.
 *
 * Only an embedded PNG can be repainted, so a region whose material names an
 * external texture, or has no UVs, is skipped. The basis is read only.
 *
 * @evidence contracts/common.md#principled-implementation Rigid weight-one attachment to the eye owner selects exactly the triangles that move as that eye.
 * @evidence contracts/common.md#clear-and-simple-design One search from a basis and an eye owner to that eye's textured globe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No region, material or vertex is named; attachment weights and textures decide.
 * @evidence contracts/common.md#meaningful-documentation States the selection rule, the skipped regions and the null result.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the globe region that belongs to one articulated eye owner.
 * @evidence contracts/modeling.md#spatial-conventions Positions are copied in neutral basis metres; UVs are copied unchanged.
 * @evidenceExclude contracts/modeling.md#parameter-channels findHumanFaceIrisGlobe defines and consumes no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry findHumanFaceIrisGlobe emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries findHumanFaceIrisGlobe builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes findHumanFaceIrisGlobe's result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source findHumanFaceIrisGlobe carries basis geometry and texture, not an anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range findHumanFaceIrisGlobe admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority findHumanFaceIrisGlobe defines no input through which a caller shapes a face.
 * @author Samchon
 */
export function findHumanFaceIrisGlobe(
  basis: IAutoMovieHumanFaceBasis,
  eye: string,
): IHumanFaceIrisGlobe | null {
  for (const surface of basis.surfaces) {
    const rows =
      surface.attachments?.find((one) => one.owner === eye)?.rows ?? [];
    const bound = new Set<number>();
    for (let i = 0; i < rows.length; i += 2)
      if (rows[i + 1] === 1) bound.add(rows[i]);
    const point = (vertex: number): [number, number, number] => [
      surface.positions[3 * vertex],
      surface.positions[3 * vertex + 1],
      surface.positions[3 * vertex + 2],
    ];
    for (const region of surface.regions) {
      const texture = basis.materials.find(
        (one) => one.id === region.material,
      )?.baseColorTexture;
      // Only an embedded PNG can be repainted; a texture reference names an
      // image this builder cannot read, and untextured geometry has no iris.
      if (region.uvs === null || typeof texture !== "string") continue;
      const uvs = region.uvs;
      const triangles: IHumanFaceIrisGlobeTriangle[] = [];
      for (let t = 0; t < region.indices.length; t += 3) {
        const corners = region.indices.slice(t, t + 3);
        if (corners.every((vertex) => bound.has(vertex)))
          triangles.push({
            positions: corners.map(point),
            uvs: [0, 1, 2].map((k) => [uvs[2 * (t + k)], uvs[2 * (t + k) + 1]]),
          });
      }
      if (triangles.length === 0) continue;
      const vertices = [
        ...new Set(region.indices.filter((vertex) => bound.has(vertex))),
      ];
      return {
        eye,
        material: region.material,
        texture,
        triangles,
        positions: vertices.map(point),
      };
    }
  }
  return null;
}
