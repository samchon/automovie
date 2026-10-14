type AutoMovieProductionProjectMarkerList = readonly [
    "package.json",
    "lint.config.ts"
];

/**
 * Module-resident package.json and lint.config.ts path tuple used for root discovery. Both marker existences are observed afresh at each visited ancestor; existence alone does not parse project identity or require regular files. The private literal alias preserves tuple extent/spelling, and this value acquires no host handle or result cache. It is an internal scalar, not a native function/type Evidence host.
 */
export const AUTOMOVIE_PRODUCTION_PROJECT_MARKERS: AutoMovieProductionProjectMarkerList = ["package.json", "lint.config.ts"] as const;
