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
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The export's only design address is manor-space and its only operation is the direct environment callback. Following that callback reaches current model entries and world poses, not another place or an independently authored replacement volume. The empty top-level models array does not drop geometry because the environment contains its own models.
 * @evidence principles/core/source-units.md#source-substantive-completion The IAutoMovieLibrarySourceOwner value supplies an executable build callback returning an environment contribution. The implementation resolves current geometry and poses directly instead of asking a caller to produce or locate an environment artifact.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The build member is an implemented function, not a derivedArtifact pointer or throwing stub. buildManorEnvironment assembles model entries, explicit instance definitions and decomposed world transforms, then returns manorSpatialState's environment; the caller supplies no missing artifact-generation step.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Implementing the source-owned callback exposed the obsolete derived-artifact requirement in spaces/001-manor.md#manor-space. That parent's carrier paragraph was repaired to name direct in-memory model and instance computation; its floor datums, room layout and turning stair were preserved.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The former parent required a derived artifact that this direct callback no longer consumes. Commit c93f5fa9 repaired the manor-space carrier paragraph to identify manorEnvironment.js and manorSpatialState.ts and prohibit a separate JSON input. Comparing the repaired paragraph with the callback preserves the same room polygons, 0.45 and 3.33 floor datums and central turning stair; the repair concerns the source handoff, not a new spatial layout.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership The sole selected space export binds the environment to manor-space. manorSpatialState preserves room and opening identities, storey parents and the parent's central stair and gallery joins while consuming the actual model parts and instance transforms.
 * @evidenceReview obligations/design/space-sources.md#space-source-design-ownership #c0afa1f The sole selected export names the parent's manor-space H2. The adapter places source rooms under ground-storey or upper-storey, carries source boundary/opening IDs and uses the parent's central-stair and gallery/corridor joins. No second design address or synthesized room-box model enters that registration.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities Room and boundary IDs are retained, cell IDs follow triangulation order and passage IDs derive from opening IDs. Explicit instance placement and prototype ordering are deterministic for equal ordered source inputs in the fixed meter frame.
 * @evidenceReview obligations/design/space-sources.md#space-source-stable-identities #8f4bb4a roomSpace retains each room ID and appends cell indices from triangulation order; opening passages append /passage to the opening ID. Instance prototypes and placements follow ordered entries and parts, while world transforms come from the same current scene. These operations preserve identities for equal ordered inputs, not for a reordered or edited mesh.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology The adapter refuses missing world transforms, missing or multiply owned opening panels, unbound populations, absent door endpoints and self-connected doors. It throws owner-naming errors rather than inventing a room or silently omitting a door connection; contribution validation remains a separate consumer responsibility.
 * @evidenceReview obligations/design/space-sources.md#space-source-invalid-topology #030592d The source throws before accepting an absent world transform, missing or multiply owned panel, unresolved explicit population, missing door endpoint or self-connected door. The pure door test constructs opposite rectangles and the four invalid endpoint arrangements; its direct execution passed, while the canonical runner integration remains separately under repair. These inspected refusals do not claim that a successful derivation replaces downstream environment validation.
 */
export const manorSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/001-manor.md#manor-space",
  build: () => ({ environments: [buildManorEnvironment()], models: [] }),
};
