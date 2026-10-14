

/**
 * Process-local ownership keyed by exact supplied lock path, retaining token and nesting depth until release or explicit retirement. Different lexical paths are not normalized here, and unreleased distinct paths have no numeric population bound.
 */
export const projectCommitLockHeld: Map<string, { token: string; depth: number; }> = new Map<string, { token: string; depth: number }>();
