import { IAutoMovieLight } from "@automovie/interface";

/** Every runtime light discriminator, shared by every ingress gate. */
export const AUTO_MOVIE_LIGHT_TYPES = new Set<IAutoMovieLight["type"]>([
  "directional",
  "point",
  "spot",
  "area",
]);
