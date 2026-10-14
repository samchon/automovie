

/**
 * Angular subdivision count used by the existing draft producers.
 *
 * The authored 24 subdivisions are shared by circular walls, bores, caps and silhouettes; this retained scalar fixes tessellation density rather than measuring geometric error.
 */
export const SEGMENTS: number = 24 as const;
