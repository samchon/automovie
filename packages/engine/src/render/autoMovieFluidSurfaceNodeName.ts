/** Name of the viewer object drawing one fluid domain's free surface. */
export function autoMovieFluidSurfaceNodeName(domain: string): string {
  return `water:${domain}`;
}
