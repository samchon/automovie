import { IAutoMovieLight } from "@automovie/interface";

/** Every runtime light discriminator, shared by every ingress gate. */
export const AutoMovieEngineLightTypes = new Set<IAutoMovieLight["type"]>([
  "directional",
  "point",
  "spot",
  "area",
]);
