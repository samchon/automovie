import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Observed section charts and the shoulder-to-wrist walk, with millimetre stations and unit headings. Runtime construction and admission remain with AutoMovieHumanArmAxis in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes observed section charts and the shoulder-to-wrist walk, with millimetre stations and unit headings; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Observed section charts and the shoulder-to-wrist walk, with millimetre stations and unit headings. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanArmAxis; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ArmAxis contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanArmAxis {
  /** One physically observed absolute digit section frame in native world millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One physically observed absolute digit section frame in native world millimetres.
   * @evidence contracts/development/design.md#principled-representation `stationMm`: Distance along the unchanged source course, millimetres. `originMm`: Absolute plane origin in native world millimetres. `u`: First observed tangent to the section plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmAxis.observed. Also types AutoMovieHumanArmAxis.vector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stationMm`, `originMm`, `u`, `v`; callers supply the complete record.
   */
  export interface IFixedChart {
    /** Distance along the unchanged source course, millimetres. */
    stationMm: number;

    /** Absolute plane origin in native world millimetres. */
    originMm: AutoMovieVector3Tuple;

    /** First observed tangent to the section plane. */
    u: AutoMovieVector3Tuple;

    /** Second observed tangent in the native chart's handedness. */
    v: AutoMovieVector3Tuple;
  }

  /** The walk.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The walk.
   * @evidence contracts/development/design.md#principled-representation `elbow`: Walk length of the turn's middle, where the heading bisects the corner. `soft`: Half the turn's length, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmAxis.walk. Read by AutoMovieHumanArmPieces.inputs, AutoMovieHumanArmTube.build. Also types AutoMovieHumanArmLaw.axis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `elbow`, `soft`; callers supply the complete record.
   */
  export interface IAxis {
    /**
     * Point at a walk length.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Point at a walk length.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This at signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmAxis and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes at at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmAxis.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual at provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmAxis determines the work per at call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmAxis's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the at provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    at(s: number): AutoMovieVector3Tuple;

    /**
     * Unit heading at a walk length, away from the shoulder.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Unit heading at a walk length, away from the shoulder.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This heading signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmAxis and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes heading at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmAxis.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual heading provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmAxis determines the work per heading call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmAxis's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the heading provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    heading(s: number): AutoMovieVector3Tuple;

    /** Walk length of the turn's middle, where the heading bisects the corner. */
    elbow: number;

    /**
     * Walk length of a station a distance down the forearm from the elbow
     * centre, along it; inside the turn, the share of the way from the
     * turn's middle to its end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Walk length of a station a distance down the forearm from the elbow centre, along it; inside the turn, the share of the way from the turn's middle to its end.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This fore signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmAxis and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes fore at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmAxis.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual fore provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmAxis determines the work per fore call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmAxis's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the fore provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    fore(d: number): number;

    /**
     * Walk length of a station a distance down the humerus from the shoulder
     * centre; inside the turn, the share of the way from its start to its
     * middle.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Walk length of a station a distance down the humerus from the shoulder centre; inside the turn, the share of the way from its start to its middle.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This upper signature specifies the documented callback contract without an implementation body; AutoMovieHumanArmAxis and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes upper at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanArmAxis.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual upper provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanArmAxis determines the work per upper call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanArmAxis's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the upper provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    upper(d: number): number;

    /** Half the turn's length, mm. */
    soft: number;
  }
}
