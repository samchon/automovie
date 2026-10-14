import type { IAutoMovieLibraryContribution } from "@automovie/interface";

import { buildManorEnvironment } from "../manorEnvironment";

/**
 * Registers the authored manor as an in-memory library environment.
 *
 * buildManorEnvironment reads the same model entries and world transforms as
 * the viewer. manorSpatialState retains their rooms, boundaries, openings,
 * articulated panels, instance populations and measured support triangles.
 * No serialized environment or generated state directory is an input.
 *
 * The September 11 and September 15 observations recorded in earlier revisions
 * are historical. They do not certify this revised source execution path.
 * Current rendered realization remains unpaid until its complete authored
 * observation plan has been opened and compared with the design.
 *
 */
export const manorSpaceSource: { build(): IAutoMovieLibraryContribution } = {
  build: (): IAutoMovieLibraryContribution => ({ environments: [buildManorEnvironment()], models: [] }),
};
