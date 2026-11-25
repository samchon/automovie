import type { IAutoMovieActionTarget } from "../harness/IAutoMovieActionTarget";

/** Positional-target input and the context for its diagnostic paths. */
export namespace IAutoMovieResolvePerformShotTarget {
  /**
   * Gate one positional target of a performance and resolve it to a world
   * point, or report why it cannot be and answer `null`.
   *
   * Positional targets are a `lookAt`, `reach` or `locomote` destination, a
   * `react` source, a `point` or `strike` gesture aim, a `launch` aim, a
   * `frame` subject or focus, and a coverage subject. They resolve against
   * every staged placement, cameras included, so an actor may look down the
   * lens.
   *
   * The checks run in this order, each answering `null` after its violation:
   *
   * 1. Unless `formationsFramed` is true, a group naming any formation is refused
   *    first, because only a lens frames a mass and every other target asks one
   *    body for one point; checking membership first would hide that.
   * 2. A `bone` target's actor must be a staged node with an actor context and a
   *    rig carrying that bone; a `group` must have every member staged, and each
   *    formation it names must be one this shot compiled. Every id must be
   *    non-blank.
   * 3. Missing nodes, malformed point vectors, empty groups and non-positional
   *    kinds are refused before invoking the live resolver.
   * 4. The point comes from the live resolver at `seconds` when it answers, and
   *    otherwise from the staged placements and opening formation points; a
   *    missing or non-finite point is refused naming the id that failed.
   */
  export type IProps = {
    /**
     * Authored target. Unresolved membership or nonfinite resolved coordinates
     * append a violation and return null; the successful point can alias a
     * callback or staged vector.
     */
    target: IAutoMovieActionTarget;
    /**
     * Diagnostic path for this target, such as an action's at field. Child id
     * checks append member/index suffixes to this path.
     */
    path: string;
    /**
     * Human-readable target name used in id/record diagnostics, supplied by the
     * calling gate.
     */
    label: string;
    /**
     * Noun phrase used in positional-resolution diagnostics; independent of the
     * serialized target identity.
     */
    subject: string;
    /**
     * Shot-local seconds passed unchanged to the live resolver. The caller
     * admits this time; target resolution validates the returned coordinates,
     * not this clock value.
     */
    seconds: number;
    /**
     * True for lens subjects that may combine compiled formations; false
     * rejects any nonempty formation list before other target checks.
     */
    formationsFramed: boolean;
  };
}
