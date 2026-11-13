/**
 * Production-specific development contracts a commissioned film turns on.
 *
 * Each stage selects the exported declarations of its source folders against
 * one checklist under `contracts/development/` of the shared skills tree, answered in
 * their doc comments: entities in `src/entities/` answer `entities.md`, laws,
 * interactions and consequences in `src/laws/`, `src/interactions/` and
 * `src/consequences/` answer `behaviors.md` and cite the research they follow,
 * and scenes and films in `src/composition/` answer `composition.md`, scenes
 * citing the screenplay scene file or the sections and beats of it they
 * realize and films citing the scene files they order. An omitted stage stays
 * `"disabled"`, so ordinary coding and narrative-only work owe none of them.
 *
 * @evidence contracts/development/design.md#principled-representation One stage per contract mirrors the scaffold's development contracts, so a commission enables exactly the duties its code can establish.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three optional fields with the narrative stage vocabulary; folders, populations and references belong to the claim factory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stage is implied by file presence; an absent field is disabled.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names each stage's respondents, their citations and the disabled default.
 */
export interface IAutoMovieDevelopmentProps {
  /**
   * Types, classes, functions and methods under `src/entities/` answer
   * `contracts/development/entities.md`.
   */
  entities?: "disabled" | "evidence";

  /**
   * Functions and methods under `src/laws/`, `src/interactions/` and
   * `src/consequences/` answer `contracts/development/behaviors.md` and cite
   * studies in `docs/research/`; every study must be cited by some declaration.
   */
  behaviors?: "disabled" | "evidence";

  /**
   * Functions and methods under `src/composition/scenes/` answer
   * `contracts/development/composition.md` and cite a screenplay scene file
   * or its sections and beats, every section and beat of which must be cited;
   * those under `src/composition/films/` answer it and cite the scene files
   * they order, every one of which must belong to a film.
   */
  composition?: "disabled" | "evidence";
}
