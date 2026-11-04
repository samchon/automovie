import type { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

/** The model's mesh parts and materials as the Human emits them: millimetre buffers scaled into a part, and the opaque materials the parts name. */
export namespace AutoMovieHumanModelParts {
  /**
   * Mesh part from millimetre buffers, scaled into metres.
   *
   * @param id Part id: `human.construction.<curve id>`.
   * @param name Material name; the material id is `human.<name>`.
   * @param mesh Positions and indices in mm.
   * @param normals Unit vertex normals, unchanged by the uniform scale.
   * @param scale Millimetre-to-model factor including the stature scale.
   */
  export function part(
    id: string,
    name: string,
    mesh: { positions: number[]; indices: number[] },
    normals: number[],
    scale: number,
  ): IAutoMovieModelPart {
    return {
      id,
      name: id,
      geometry: {
        type: "mesh",
        mesh: {
          // These tubes are drawn to look at, and every digit travels to the
          // page as text, so they stop at a hundredth of a millimetre.
          positions: mesh.positions.map(
            (v: number): number => Math.round(v * scale * 1e5) / 1e5,
          ),
          normals: normals.map((v: number): number => Math.round(v * 1e4) / 1e4),
          uvs: null,
          indices: mesh.indices,
          skin: null,
        },
      },
      material: "human." + name,
      attachedBone: null,
      transform: null,
    };
  }

  /** Opaque dielectric material of one linear colour. */
  export function material(
    name: string,
    colour: [number, number, number],
    doubleSided: boolean,
  ): IAutoMovieMaterial {
    return {
      id: "human." + name,
      name,
      baseColor: { r: colour[0], g: colour[1], b: colour[2], a: 1, hex: null },
      metallic: 0,
      roughness: 0.9,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      doubleSided,
    };
  }
}
