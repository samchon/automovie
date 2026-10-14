import { IAutoMovieProfile } from "@automovie/interface";

import { HORSE_GAITS } from "./HORSE_GAITS";

/**
 * The reusable horse profile fixture. It packages the mount's named movement
 * vocabulary so a host can bind it onto horse-like skeletons without importing
 * playground TypeScript clips.
 *
 * Object.values allocates the gait array once at module load in declared key order; its elements alias the owning gait table. Drivers and limits are empty, so this profile adds no control or ROM enforcement. Hosts must not mutate the shared rows, and the profile retains no process or renderer state.
 *
 * @author Samchon
 */
export const HORSE_PROFILE: IAutoMovieProfile = {
  id: "horse",
  name: "horse",
  drivers: [],
  limits: [],
  gaits: Object.values(HORSE_GAITS),
};
