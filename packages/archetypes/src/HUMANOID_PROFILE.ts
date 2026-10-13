import { IAutoMovieProfile } from "@automovie/interface";
import { HUMANOID_GAITS } from "./HUMANOID_GAITS";
/**
 * The canonical humanoid profile fixture: the same locomotion vocabulary as
 * {@link HUMANOID_GAITS}, packaged as reusable profile data so a host can bind
 * it onto any humanoid skeleton without hand-authored TypeScript clips.
 *
 * Object.values allocates the gait array once at module load in declared key order; its elements alias the owning gait table. Drivers and limits are empty, so this profile adds no control or ROM enforcement. Hosts must not mutate the shared rows, and the profile retains no process or renderer state.
 *
 * @author Samchon
 */
export const HUMANOID_PROFILE: IAutoMovieProfile = {
  id: "humanoid",
  name: "humanoid",
  drivers: [],
  limits: [],
  gaits: Object.values(HUMANOID_GAITS),
};
