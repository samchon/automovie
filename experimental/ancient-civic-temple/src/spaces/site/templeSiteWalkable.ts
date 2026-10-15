import type { IAutoMovieBuiltSurface } from "@automovie/interface";


export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] => supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
