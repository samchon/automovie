/**
 * The knee strike's form: the angles, shares and rounds its solve and its
 * course are built from. Every value is a provisional reading of coaching
 * photographs unless its comment names a source.
 */
export namespace KneeForm {
  /**
   * Knee flexion while driven, degrees: the heel drawn to the buttock so the
   * foot trails behind the knee, a tenth inside `DEFAULT_HUMANOID_ROM`'s 150.
   */
  export const FLEXION: number = 135;

  /**
   * Ankle plantarflexion while driven, degrees: the toes pointed down along
   * the shank, a tenth inside `DEFAULT_HUMANOID_ROM`'s 50.
   */
  export const PLANTAR: number = 45;

  /** Back lean at contact, degrees (provisional). */
  export const LEAN: number = 10;

  /** The hip's flexion range used, degrees: `DEFAULT_HUMANOID_ROM`'s 120 kept a tenth inside. */
  export const HIP_FLEXION: number = 108;

  /** The lowest thigh elevation below the horizontal, degrees: a knee to the thigh (provisional). */
  export const LOWEST: number = 45;

  /**
   * The pelvis's longest travel along the line, as a share of the stance
   * length: a rear knee squares the hips until the rear hip is level with
   * the lead (support) foot, half a stance; a lead knee drives the lead hip a
   * quarter. Provisional readings of the clinch knee's hip drive.
   */
  export const TRAVEL: Readonly<Record<"lead" | "rear", number>> = {
    lead: 0.25,
    rear: 0.5,
  };

  /**
   * The share of the way out the thigh's lift takes from the launch, and the
   * share the pelvis's drive takes up to the contact: the knee is lifted,
   * then the hips are driven in, the two overlapping in the middle. The way
   * back mirrors it, the hips withdrawn before the leg is lowered.
   * Provisional.
   */
  export const LIFT_SHARE: number = 0.6;

  /** The support heel's raise at contact, degrees (provisional). */
  export const HEEL_RAISE: number = 15;

  /**
   * How far each clinching hand sits to its own side of the other's nape, as
   * a share of the other's shoulder half width (provisional).
   */
  export const CLINCH_SHARE: number = 0.5;

  /** How far past the nape the clinching hands hold, metres (provisional: the hands cupped behind the neck). */
  export const CLINCH_DEPTH: number = 0.03;

  /**
   * How many times the knee is solved again from the hip the solved carriage
   * leaves it: the support leg lowers the pelvis as it travels, which moves
   * the hip the solve started from.
   */
  export const ROUNDS: number = 3;
}
