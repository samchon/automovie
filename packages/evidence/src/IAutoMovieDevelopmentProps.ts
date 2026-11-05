/**
 * Production-specific development contracts a commissioned film turns on.
 *
 * Each stage selects the exported functions of one source folder against its
 * checklist under `.agents/skills/contracts/development/`, answered in their
 * doc comments: asset functions in `src/assets/` answer `assets.md`, movement
 * family functions in `src/motion/` answer `motion.md` and cite the
 * performance study they follow, and shot functions in `src/shots/` answer
 * `shots.md` and cite the screenplay H2s they execute. An
 * omitted stage stays `"disabled"`, so ordinary coding and narrative-only work
 * owe none of them.
 *
 * @evidence contracts/common.md#principled-implementation One stage per source folder mirrors the scaffold's development contracts, so a commission enables exactly the duties its code can establish.
 * @evidence contracts/common.md#clear-and-simple-design Three optional fields with the narrative stage vocabulary; populations and references belong to the claim factory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stage is implied by file presence; an absent field is disabled.
 * @evidence contracts/common.md#meaningful-documentation The comment names each stage's respondents, their citations and the disabled default.
 * @evidence contracts/performance.md#efficient-algorithms This erased interface chooses no algorithm; the claim factory owns composition.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased interface coordinates no computation or retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This erased interface owns no handles, tasks or resource lifetime.
 */
export interface IAutoMovieDevelopmentProps {
  /** Functions under `src/assets/` answer `contracts/development/assets.md`. */
  assets?: "disabled" | "evidence";

  /**
   * Functions under `src/motion/` answer `contracts/development/motion.md` and
   * cite studies in `docs/research/`; every study must be cited by some function.
   */
  motion?: "disabled" | "evidence";

  /**
   * Functions under `src/shots/` answer `contracts/development/shots.md` and
   * cite screenplay H2s; every screenplay H2 must be cited by some function.
   */
  shots?: "disabled" | "evidence";
}
