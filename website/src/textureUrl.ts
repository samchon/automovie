

/** Absolute native paths become relative to the building, not the domain root. */
export const textureUrl: (asset: string, base: string) => string = (asset: string, base: string): string => {
  const relative: string = asset.replace(/^\/+/, "");
  if (!relative.startsWith("textures/") || relative.split("/").includes(".."))
    throw new Error(`Invalid production texture: ${asset}`);
  return new URL(relative, base).href;
};
