/**
 * One requested value of a registered face measurement.
 *
 * `measurement` names a measurement the face resolver registers (for example
 * `mouth.fissureWidth`); `value` is in that measurement's declared unit,
 * such as millimetres, square millimetres, degrees, volume or count. The editor solves the target onto the existing
 * channels the measurement lists and stores the solved weights beside it, so
 * a saved document replays without solving; the builder re-reads the final
 * surface and reports requested against measured. An unregistered name is
 * refused by name.
 *
 * @evidence contracts/common.md#principled-implementation A registry-addressed target uses its owner's declared unit and channel solve; the saved numerical weights replay while the builder independently rereads final geometry.
 * @evidence contracts/common.md#clear-and-simple-design One name/value pair delegates measurement protocol, channels and unit to the registry rather than embedding a second instrument definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown measurement names refuse and a requested value does not replace the measured reading; source-qualified instruments cannot be promoted to unregistered clinical quantities.
 * @evidence contracts/common.md#meaningful-documentation The example uses the actual mouth.fissureWidth registry address and distinguishes request, solved weights and final requested-versus-measured reporting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This target record performs no numerical solve or instrument evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Replay weights are owned by the saved document/resolver, not a cache in this pair.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A name and value retain no solver state or geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementTarget {
  /** Registered measurement name. */
  measurement: string;

  /** Requested value in the measurement's declared unit. */
  value: number;
}
