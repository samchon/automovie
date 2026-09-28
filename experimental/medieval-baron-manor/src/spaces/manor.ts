import type { IAutoMovieLibrarySourceOwner } from "@automovie/interface";

import { buildManorEnvironment } from "../manorEnvironment.js";

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
 * @evidence spaces/001-manor.md#manor-space The build callback derives the one manor environment from the current model, room polygons, shared boundaries, openings and instance placements required by this design. It does not replace the house with independent room boxes.
 * @evidence spaces/001-manor.md The design field selects this file's manor-space H2, and its current-model carrier paragraph assigns the direct model and instance computation to this export. No other design file is registered.
 * @evidence principles/core/source-units.md#source-scope-preservation The registration delegates only the named manor environment to buildManorEnvironment and manorSpatialState. Its returned models list is empty because the environment carries its own actual models; it introduces no second design or placement authority.
 * @evidence principles/core/source-units.md#source-substantive-completion The IAutoMovieLibrarySourceOwner value supplies an executable build callback returning an environment contribution. The implementation resolves current geometry and poses directly instead of asking a caller to produce or locate an environment artifact.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Implementing the source-owned callback exposed the obsolete derived-artifact requirement in spaces/001-manor.md#manor-space. That parent's carrier paragraph was repaired to name direct in-memory model and instance computation; its floor datums, room layout and turning stair were preserved.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership The sole selected space export binds the environment to manor-space. manorSpatialState preserves room and opening identities, storey parents and the parent's central stair and gallery joins while consuming the actual model parts and instance transforms.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities Room and boundary IDs are retained, cell IDs follow triangulation order and passage IDs derive from opening IDs. Explicit instance placement and prototype ordering are deterministic for equal ordered source inputs in the fixed meter frame.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology The adapter refuses missing world transforms, missing or multiply owned opening panels, unbound populations, absent door endpoints and self-connected doors. It throws owner-naming errors rather than inventing a room or silently omitting a door connection; contribution validation remains a separate consumer responsibility.
 */
export const manorSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/001-manor.md#manor-space",
  build: () => ({ environments: [buildManorEnvironment()], models: [] }),
};
