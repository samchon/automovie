import type { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/** Boundary identity index and individually admitted faces produced during building validation. */
export namespace IAutoMovieValidateBuiltBoundaries {
  /**
   * Boundary identity index and individually admitted faces produced during building validation.
   *
   * The set records declarations, not successful admission. Each face is admitted
   * independently for finite world origin, unit rotation, positive metre thickness
   * and a usable planar outline. Other defects on the boundary do not exclude its
   * face. Both containers are new and caller-owned; face records remain borrowed.
   *
   * @evidence contracts/development/design.md#principled-representation The mutable set contains every declared boundary id, including blank and repeated strings; the face map contains only faces that added no face-validation diagnostics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateBuiltBoundaries allocates the containers for validateBuiltEnvironment, which passes them to validateBuiltOpenings; face values remain references to authored records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This is a partial index even when validation fails, not a successful-building certificate; later passing faces overwrite earlier faces sharing an id.
   * @evidence contracts/development/common.md#meaningful-documentation Boundary identity index and individually admitted faces produced during building validation. The mutable set contains every declared boundary id, including blank and repeated strings; the face map contains only faces that added no face-validation diagnostics.
   */
  export type IResult = {
    /** New mutable set of every declared boundary id, including blank and repeated declarations. */
    ids: Set<string>;

    /** New mutable map to borrowed faces that passed their own checks; the last passing face wins a duplicate id. */
    faces: Map<string, IAutoMovieBoundaryFace>
  };
}
