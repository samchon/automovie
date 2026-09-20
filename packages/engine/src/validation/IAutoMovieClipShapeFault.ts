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
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `IAutoMovieClipShapeFault` carries one concrete reason an unreadable track must be refused before playback.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `IAutoMovieClipShapeFault` separates classification, track member, constraint text, and observation for one invalid clip condition.
 * @author Samchon
 */
export interface IAutoMovieClipShapeFault {
  /**
   * Violation kind the artifact gate reports this fault as.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `kind` assigns the violation category used to refuse this malformed clip condition.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `kind` keeps the refusal class independent from the invalid track member and observation.
   */
  kind: IAutoMovieConstraintViolation["kind"];

  /**
   * Field carrying the fault, relative to the track (or the clip, for
   * {@link clipDurationFault} / {@link clipLoopFault}), e.g. `values`,
   * `times[2]`, `interpolation`. The gate joins it onto its own path; the
   * sampler ignores it, because its message already names the field.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `field` names the malformed member whose state makes the owning clip unreadable.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `field` supplies the relative track segment at which the key-time or payload contract failed.
   */
  field: string;

  /**
   * The fault as a sentence, with no subject: the sampler reads it after `track
   * "<channel key>"`, the gate reads it as a violation's `expected`.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `message` states the track-shape constraint that justifies refusing this clip.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `message` remains subject-free so sampler and artifact gate apply the same refusal rule.
   */
  message: string;

  /**
   * The offending value, for the violation record. A fault about a dense
   * payload's SHAPE reports the quantity that offends (a length, a stride)
   * rather than the payload: echoing hundreds of floats back spends the
   * client's context to repeat what it just sent (#1362).
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `value` retains the decisive observation that made this clip condition invalid.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `value` records the failing quantity without echoing an entire dense keyframe payload.
   */
  value: unknown;
}
