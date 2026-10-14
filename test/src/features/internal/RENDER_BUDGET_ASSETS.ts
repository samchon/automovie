/** Existing authored asset identity; its digest is supplied data, not a file-content observation. */
export const RENDER_BUDGET_ASSETS: Array<{ path: string; digest: `sha256:${string}` }> = [
  { path: "textures/stone.png", digest: `sha256:${"a".repeat(64)}` as const },
];
