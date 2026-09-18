/**
 * Facial performance separate from identity. A source basis records its own
 * expression in these same units; the current expression is evaluated relative
 * to that observation. Omitted channels are zero, which denotes neutral.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Separates neutral, observed and currently requested facial performance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Declares paired lids and brows, oral performance and gaze independently of optical size.
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
