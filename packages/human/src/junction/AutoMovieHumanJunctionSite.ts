/**
 * Where two skin parts meet, each a cut across a simple tube.
 *
 * Both parts at a site open a boundary ring there, and the junction joins the two rings. Sites from mid upper arm down exist once per side.
 *
 * @author Samchon
 */
export type AutoMovieHumanJunctionSite =
  /** Trunk to neck, at the root of the neck. */
  | "neckBase"

  /** Neck to head, below the skull base and the jaw. */
  | "neckTop"

  /** Trunk to arm, at mid upper arm, below the deltoid insertion. */
  | "upperArm"

  /** Arm to hand, at the wrist. */
  | "wrist"

  /** Trunk to leg, at mid thigh, below the gluteal fold. */
  | "thigh"

  /** Leg to foot, at the ankle above the malleoli. */
  | "ankle"

  /** Head to ear, around the attachment of the auricle. */
  | "ear";
