import { IAutoMovieLight } from "@automovie/interface";

/**
 * Every runtime light discriminator, shared by every ingress gate.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Enumerates the light kinds that may enter deterministic authored lighting state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Keeps runtime light-kind admission aligned with the authored-source branches.
 */
export const AUTO_MOVIE_LIGHT_TYPES = new Set<IAutoMovieLight["type"]>([
  "directional",
  "point",
  "spot",
  "area",
]);
