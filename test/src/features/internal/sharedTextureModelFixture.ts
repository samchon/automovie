import { IAutoMovieModel } from "@automovie/interface";

/** Build one box binding the shared image through legacy or explicit sampling declarations. */
export const sharedTextureModelFixture = (
  id: string,
  material: string,
  binding: "shared" | "reference",
): IAutoMovieModel => ({
  id,
  name: null,
  origin: "generated",
  parts: [
    {
      id: `${id}-part`,
      name: null,
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      material,
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [
    {
      id: material,
      name: null,
      baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
      metallic: 0,
      roughness: 1,
      emissive: null,
      opacity: 1,
      baseColorTexture:
        binding === "shared"
          ? "textures/shared.png"
          : {
              asset: "textures/shared.png",
              texCoord: 0,
              colorSpace: "srgb",
            },
      normalTexture:
        binding === "reference"
          ? { asset: "textures/normal.png", texCoord: 0, colorSpace: "linear" }
          : null,
    },
  ],
  asset: null,
});
