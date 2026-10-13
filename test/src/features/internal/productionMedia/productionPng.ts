import { PNG } from "pngjs";

/** Write a small nonuniform RGBA raster through the native PNG encoder; raster extent is independently given by the caller. */
export const productionPng = (width: number, height: number): Uint8Array => {
  const image = new PNG({ width, height });
  image.gamma = 0.45455;
  image.data.fill(180);
  image.data[0] = 0;
  return PNG.sync.write(image);
};
