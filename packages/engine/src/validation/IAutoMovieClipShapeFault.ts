import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * What a well-formed clip track IS, stated once for the two sides that must
 * never disagree about it (#1353).
 *
 * `sampleClip` refuses a malformed track by THROWING (a track it cannot read is
 * an engine-level defect once every gate has run), while the artifact gate
 * refuses one by returning a located violation. Those are two failure modes of
 * one rule, and holding the rule twice is what let the gate learn a single one
 * of the sampler's checks: #1331 taught it strictly increasing times, and an
 * uneven `values` stride, an empty keyframe list, a wrong value width, an
 * unsupported interpolation, a non-triplet `cubicspline` stride, a non-boolean
 * `loop`, and an unknown node channel path all still validated clean,
 * committed, persisted, and threw out of the engine at playback.
 *
 * So the rule lives here as data, and each side formats it in its own voice:
 * the sampler prefixes the track's channel key and throws the first fault, the
 * gate appends every fault at `<track path>.<field>`.
 *
 * @author Samchon
 */
export interface IAutoMovieClipShapeFault {
  /** Violation kind the artifact gate reports this fault as. */
  kind: IAutoMovieConstraintViolation["kind"];

  /**
   * Field carrying the fault, relative to the track (or the clip, for
   * {@link clipDurationFault} / {@link clipLoopFault}), e.g. `values`,
   * `times[2]`, `interpolation`. The gate joins it onto its own path; the
   * sampler ignores it, because its message already names the field.
   */
  field: string;

  /**
   * The fault as a sentence, with no subject: the sampler reads it after `track
   * "<channel key>"`, the gate reads it as a violation's `expected`.
   */
  message: string;

  /**
   * The offending value, for the violation record. A fault about a dense
   * payload's SHAPE reports the quantity that offends (a length, a stride)
   * rather than the payload: echoing hundreds of floats back spends the
   * client's context to repeat what it just sent (#1362).
   */
  value: unknown;
}
