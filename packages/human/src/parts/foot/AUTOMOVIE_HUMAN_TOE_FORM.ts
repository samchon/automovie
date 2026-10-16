/**
 * Toe layout and free-part form in the shared foot frame, hallux first.
 *
 * Free-part breadth and plan angle are separate named
 * coefficients fitted offline on twelve primary young, lean reference meshes:
 * each reference's horizontal pternion-to-longest-toe frame removes its own foot turn;
 * sections perpendicular to a toe's proximal bone at its next joint supply a
 * breadth only when the closed component encloses that bone and no other toe
 * joint's projection. Median breadths are normalized by that frame's foot
 * envelope. Angles minimize the equal-subject squared error of the modelled
 * proximal bone directions under a nondecreasing medial-to-lateral fan, fitted
 * by pool-adjacent-violators. This sufficient nonconvergence constraint owns the
 * shared layout: independent reference directions are not accepted when their
 * generated free parts would converge through one another.
 * The probe is a modelled-joint convention, not a clinical interphalangeal
 * measurement; extending its direction along a straight Human toe remains a
 * form approximation to check on the complete generated foot.
 *
 * Proximal offsets are measured relative to the reference shared ball joint;
 * axial lengths are dominant-digit skin support along that proximal bone,
 * transferred as a common-cohort convention for this straight-toe family.
 * Grade: reference-fitted form, not a population or diagnostic norm. Reference
 * geometry, weights and joint indices stay outside Human. The pitch and web
 * allocation remains conventional and is validated with the resulting skin.
 */
export const AUTOMOVIE_HUMAN_TOE_FORM: {
  readonly breadth: readonly number[];
  readonly angle: readonly number[];
  /** Proximal-joint offsets from the hallux root, of foot length. */
  readonly rootAlong: readonly number[];
  /** Hallux root ahead of the shared toes fulcrum, of foot length. */
  readonly rootFromFulcrum: number;
  /** Native digit axial skin length from its proximal modelled joint, of foot length. */
  readonly length: readonly number[];
  readonly web: number;
} = {
  breadth: [0.2654, 0.1628, 0.1416, 0.143, 0.1334],
  angle: [9.2813, 11.6613, 12.3422, 12.3422, 12.3422],
  rootAlong: [0.0, -0.02458, -0.03395, -0.06456, -0.10854],
  rootFromFulcrum: 0.04293,
  length: [0.23481, 0.22515, 0.19462, 0.16782, 0.12276],
  web: 0.012,
};
