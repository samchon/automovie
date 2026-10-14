

/** Historical project directories created in this fixed order during initialization; later failures do not roll back prior mkdir effects. */
export const AUTOMOVIE_PROJECT_RESERVED_DIRS: ReturnType<() => readonly ["scenes", "shots", "beatEnds", "props", "actors", "models", "assets", "renders"]> = [
    "scenes",
    "shots",
    "beatEnds",
    "props",
    "actors",
    "models",
    "assets",
    "renders",
] as const;
