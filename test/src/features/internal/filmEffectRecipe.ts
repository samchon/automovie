import { IAutoMovieEffectRecipe } from "@automovie/interface";
/** Return the existing bounded fog recipe with its original numeric defaults and optional id. Each call creates fresh nested recipe records; this data factory neither admits a cue nor starts an effect consumer. */
export const filmEffectRecipe: (id?: string) => IAutoMovieEffectRecipe = (
  id: string = "fog-recipe",
): IAutoMovieEffectRecipe => ({
  id,
  kind: "fog",
  seed: 7,
  emission: { rate: 10, burst: 2, duration: 5 },
  particle: {
    lifetime: { min: 1, max: 2 },
    size: { min: 0.1, max: 0.2 },
    color: "#aabbcc",
    opacity: { min: 0.2, max: 0.6 },
  },
  motion: { wind: { x: 0.1, y: 0, z: 0 }, rise: 0.05, turbulence: 0.01 },
  budget: { maxParticles: 64, lodDistance: 30 },
  blend: "alpha",
});
