/**
 * A skin part: one region of the body surface whose form is one continuous mass, generated alone as a control cage and joined to its neighbours through boundary rings.
 *
 * Parts are cut only where the cross-section is a simple tube: mid upper arm, mid thigh, wrist, ankle, the base and top of the neck, and the attachment of the ear. The shoulder, armpit, hip and groin stay inside the trunk, because the deltoid, trapezius, latissimus and gluteus maximus cross them and a cut there would split one mass. Facial features are not parts: they are generator modules that shape the one continuous surface of the head. Eyeballs, teeth, tongue, nails and hair are separate meshes, not skin parts.
 *
 * Arms, hands, legs, feet and ears exist once per side; one generator serves both sides.
 *
 * @author Samchon
 */
export type AutoMovieHumanPart =
  /**
   * Torso, pelvis, shoulder girdle with the deltoid and armpit, and hip and groin with the gluteal region and the upper thigh, open at the neck base, mid upper arms and mid thighs.
   */
  | "trunk"

  /** Neck from its base on the trunk to the head, with the sternocleidomastoid and upper trapezius. */
  | "neck"

  /** Cranial vault and face as one continuous surface, open at the neck and the ear attachments. */
  | "head"

  /** Ear, open at its attachment to the head. */
  | "ear"

  /** Arm from mid upper arm to the wrist, with the elbow. */
  | "arm"

  /** Hand from the wrist, with the fingers. */
  | "hand"

  /** Leg from mid thigh to the ankle, with the knee. */
  | "leg"

  /** Foot from the ankle, with the toes. */
  | "foot";
