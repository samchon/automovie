import type { IAutoMovieBuiltSurface } from "@automovie/interface";


/** Surface identities of the site supports people walk on, excluding the bare ground. */
export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] => supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
