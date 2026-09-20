/**
 * One frame-normalized video segment in the canonical film timeline.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `IAutoMovieFilmTimelineSegment` as the portable data boundary for the formation nested frame clock requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieFilmTimelineSegment` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieFilmTimelineSegment {
  /**
   * Current compiled shot id.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `shot` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `shot` for the performance formation hierarchy membership command system contract.
   */
  shot: string;

  /**
   * Inclusive source frame.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `sourceInFrame` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `sourceInFrame` for the performance formation hierarchy membership command system contract.
   */
  sourceInFrame: number;

  /**
   * Exclusive source frame.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `sourceOutFrame` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `sourceOutFrame` for the performance formation hierarchy membership command system contract.
   */
  sourceOutFrame: number;

  /**
   * Film-global inclusive start frame.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `startFrame` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `startFrame` for the performance formation hierarchy membership command system contract.
   */
  startFrame: number;

  /**
   * Film-global exclusive end frame.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `endFrame` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `endFrame` for the performance formation hierarchy membership command system contract.
   */
  endFrame: number;

  /**
   * Available incoming handle frames.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `headHandleFrames` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `headHandleFrames` for the performance formation hierarchy membership command system contract.
   */
  headHandleFrames: number;

  /**
   * Available outgoing handle frames.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `tailHandleFrames` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `tailHandleFrames` for the performance formation hierarchy membership command system contract.
   */
  tailHandleFrames: number;

  /**
   * Normalized incoming transition.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `transitionIn` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `transitionIn` for the performance formation hierarchy membership command system contract.
   */
  transitionIn:
    | { kind: "cut" }
    | { kind: "dissolve" | "fade"; durationFrames: number };

  /**
   * Normalized outgoing transition.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-nested-frame-clock Exposes `transitionOut` as the portable data boundary for the formation nested frame clock requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `transitionOut` for the performance formation hierarchy membership command system contract.
   */
  transitionOut:
    | { kind: "cut" }
    | { kind: "dissolve" | "fade"; durationFrames: number };
}
