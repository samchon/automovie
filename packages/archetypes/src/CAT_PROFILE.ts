import { IAutoMovieProfile } from "@automovie/interface";
import { CAT_GAITS } from "./CAT_GAITS";
/**
 * The reusable cat profile fixture. It packages the cat's core named movement
 * vocabulary so a host can bind it onto cat-like quadruped skeletons without
 * importing playground TypeScript clips.
 *
 * Object.values allocates the gait array once at module load in declared key order; its elements alias the owning gait table. Drivers and limits are empty, so this profile adds no control or ROM enforcement. Hosts must not mutate the shared rows, and the profile retains no process or renderer state.
 *
 * @author Samchon
 */
export const CAT_PROFILE: IAutoMovieProfile = {
  id: "cat",
  name: "cat",
  drivers: [],
  limits: [],
  gaits: Object.values(CAT_GAITS),
};
