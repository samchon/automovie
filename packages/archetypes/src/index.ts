/**
 * Typed producers of shipped model groups and the humanoid gait tables a host may bind.
 *
 * Each producer takes named, typed dimensions and returns one `IAutoMovieModel`, the group a film references directly.
 *
 * The gait tables live here because the engine owns the gait machinery, the phase/duty/amplitude/contact math that walks any jointed body, while which bones swing, at which phases, with which amplitudes is data about one kind of body.
 */
export * from "./HUMANOID_GAITS";
export * from "./HUMANOID_PROFILE";
export * from "./IAutoMoviePrimitivePropProps";
export * from "./IAutoMovieStickmanProps";
export * from "./createAutoMoviePrimitiveProp";
export * from "./createAutoMovieStickman";
