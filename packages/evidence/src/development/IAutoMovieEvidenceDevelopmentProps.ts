/**
 * Production-specific development contracts a commissioned film turns on.
 *
 * Each stage selects the exported declarations of its source folders against
 * checklists under `contracts/development/` of the shared skills tree, answered
 * in their doc comments: entities in `src/entities/` answer `entities.md`,
 * laws, interactions and consequences in `src/laws/`, `src/interactions/` and
 * `src/consequences/` answer `behaviors.md`, a law naming the study it follows
 * in its answer, scenes in `src/composition/` answer `composition.md`, citing
 * the screenplay scene file or the sections and beats of it they realize,
 * screenplay films answer `films.md`, citing the scene files they order, and a
 * separately selected catalog answers `catalog.md`. Ordinary coding and
 * narrative-only work leave development stages disabled.
 */
export interface IAutoMovieEvidenceDevelopmentProps {
  /**
   * Types, classes, functions and methods under `src/entities/` answer
   * `contracts/development/entities.md`. Submitting entities or composition on
   * a narrative route also connects entity types to its subject records.
   */
  entities?: "disabled" | "evidence";

  /**
   * Functions and methods under `src/laws/`, `src/interactions/` and
   * `src/consequences/` answer `contracts/development/behaviors.md`. Cite a
   * skilled behavior's study passage in its studied laws answer.
   */
  behaviors?: "disabled" | "evidence";

  /**
   * Functions and methods under `src/composition/scenes/` answer
   * `contracts/development/composition.md` and cite a screenplay scene file or
   * its sections and beats, every section and beat of which must be cited;
   * those under `src/composition/films/` answer
   * `contracts/development/films.md` and cite the scene files they order, every
   * one of which must belong to a film. Catalog files have their own contract.
   */
  composition?: "disabled" | "evidence";

  /**
   * Case functions and the catalog film answer
   * `contracts/development/catalog.md`. The stage requires case sources, the
   * catalog film and its acceptance record. Omission keeps an existing catalog
   * selected under composition Evidence. Use `"disabled"` to clear that
   * selection explicitly.
   */
  catalog?: "disabled" | "evidence";
}
