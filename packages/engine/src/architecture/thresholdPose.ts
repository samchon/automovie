/** Where an eye stands to read one opening from inside the space it serves.  * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the slack under which two derived observation stations are one station.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the numeric tolerance the derivation is deterministic under.
 * @author Samchon
 */
export const thresholdPose = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: IAutoMovieBuiltSpace;
  opening: IAutoMovieBuiltOpening;
  anchor: IAutoMovieVector3;
}): IAutoMovieSpaceObservationStation["pose"] => {
  const mouth = openingCentre(props.environment, props.opening);
  if (mouth === null) return null;
  const settled = settle(
    props.space,
    { ...mouth, y: props.anchor.y },
    props.anchor,
  );
  return settled === null ? null : aim(settled, props.anchor);
};
