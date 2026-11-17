import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Causal recovery ownership and accepted world displacement at a replay instant. */
export namespace IAutoMovieSamplePhysicalRecoverySupport {
  /**
   * Causal support-controller activity and the accepted displacement at a replay instant.
   *
   * active describes an unresolved recovery interval; offset is a world translation in metres selected only from landings at or before the requested time. samplePhysicalRecoverySupport returns a new offset vector, choosing the latest retained endpoint offset or the adopted root offset after an authored handoff. Absent state yields inactive and zero offset. A future completed landing cannot modify an earlier sample; active does not assert actual floor contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Causal support-controller activity and the accepted displacement at a replay instant.
   * @evidence contracts/development/design.md#principled-representation active describes an unresolved recovery interval; offset is a world translation in metres selected only from landings at or before the requested time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface samplePhysicalRecoverySupport returns a new offset vector, choosing the latest retained endpoint offset or the adopted root offset after an authored handoff.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent state yields inactive and zero offset. A future completed landing cannot modify an earlier sample; active does not assert actual floor contact.
   */
  export type IResult = { 
  
  /** True while the latest started recovery step remains unresolved at the requested second; this is controller ownership, not observed support contact. */
  active: boolean; 
  
  /** New world displacement in metres from the latest causally eligible landing; uses root displacement after endpoint handoff and zero when no landing exists. */
  offset: IAutoMovieVector3 };
}
