/**
 * Facial performance separate from identity. A source basis records its own
 * expression in these same units; the current expression is evaluated relative
 * to that observation. Omitted channels are zero, which denotes neutral.
 *
 * @evidence contracts/common.md#principled-implementation Named millimetre/degree/fraction performance is resolved independently on each anatomical side and evaluated relative to the recorded source expression, with zero omissions and finite supported authoring envelopes.
 * @evidence contracts/common.md#clear-and-simple-design Blink, brow/commissure motion, jaw/lips/tongue and gaze retain their units and owners instead of arbitrary vertex deltas or an undifferentiated weight vector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Opposite sides do not fill omissions, declared envelopes are not universal clinical maxima, and nonzero tongue/jaw motion still requires the admitted profile/hinge and coupled geometry support.
 * @evidence contracts/common.md#meaningful-documentation Members give signs, physical/fraction units, supported bounds and oral/hinge prerequisites; the parent explains observed-versus-current reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no expression resolution or tissue posing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A saved performance record defines no pose cache or reference-expression reuse strategy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The personal document owns its optional scalar/pair values; the schema opens no joint or tissue resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceExpression {
  /** Paired eyelid closure fractions in [0,1]; one is closed. */
  blink?: { right?: number; left?: number };

  /** Paired brow elevation in [-6,8] mm; negative lowers the brow. */
  browRaise?: { right?: number; left?: number };

  /** Paired mouth-corner elevation in [-5,8] mm; positive is a smile direction. */
  smile?: { right?: number; left?: number };

  /** Inferior mandibular rotation in [0,25] degrees about the bound jaw hinge. */
  jawOpen?: number;

  /** Central lip separation in [0,30] mm before mandibular rotation; zero closes the paired oral margins. */
  lipPart?: number;

  /** Lip protrusion in [0,4] mm with coupled transverse narrowing. */
  pucker?: number;

  /** Dorsal tongue centreline elevation in [-8,8] mm; zero is neutral and a selected tongue profile is required for nonzero values. */
  tongueRaise?: number;

  /** Anterior tongue displacement in [-8,8] mm, fading to a fixed posterior endpoint; zero is neutral and nonzero values require a tongue profile. */
  tongueAdvance?: number;

  /** Paired vertical gaze angles in [-20,20] degrees; positive looks up. */
  gazePitch?: { right?: number; left?: number };

  /** Paired horizontal gaze angles in [-25,25] degrees; positive looks towards anatomical left. */
  gazeYaw?: { right?: number; left?: number };
}
