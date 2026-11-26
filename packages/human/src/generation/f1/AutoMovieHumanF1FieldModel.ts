import type {
  IAutoMovieHumanF1Engineering,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieHumanF1SegmentLengths,
} from "@automovie/interface";

/**
 * The working anatomical field model of the F1 derivation (#3172, campaign #3151): which measurable fields account for f1's controls,
 * each with its unit, definition, frame, posture and source, the controls it drives and the owner that applies it, and which quantities
 * one reference person cannot identify.
 *
 * Primary fields are inside-out: joint centres and segment lengths, the segment frames and rest angles they fix, bony breadths where a
 * published bony breadth exists, then the tissue reach at each measurement site. Girths, tapes and stature are derived checks of the
 * generated source, never inputs, and are listed apart (`CHECKS`). The typed records the fields live in are declared by their owners and
 * only referenced here: `IPrimary` joins the segment lengths (`AutoMovieHumanF1SegmentLengths.IFields`) and the native path's tissue
 * inputs with the hip support (`AutoMovieHumanF1NativeFieldTypes.IFields`). The
 * tape reading is `IAutoMovieHumanF1Engineering.IReading`. Each catalogue row
 * names the members it documents so a renamed member fails at compile time.
 * Documentation and audits read this model.
 */
export namespace AutoMovieHumanF1FieldModel {
  /**
   * The primary working fields of one person, by reference to their owners' declarations.
   *
   * @evidence contracts/development/design.md#principled-representation Skeleton first (segment lengths; the hip support rides in the tissue record's `hipJointCentreBreadth`), then tissue reach at the sites; no girth is a member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each the record its applying owner already declares; nothing is duplicated.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No bone, muscle and fat split is declared, because one person's skin cannot identify it (`UNRESOLVED`).
   * @evidence contracts/development/common.md#meaningful-documentation Names both owners and the units their members carry (mm).
   */
  export interface IPrimary {
    /** Joint-centre segment lengths, mm, which move the chain's joint centres, frames and course runs. */
    lengths: IAutoMovieHumanF1SegmentLengths.IFields;

    /** The hip joint centre breadth and the directional tissue calipers at the measurement sites, mm. */
    tissue: IAutoMovieHumanF1NativeLaw.IFields;
  }

  /** A field's layer, from the skeleton outward. */
  export type Layer = "joint" | "length" | "frame" | "rest" | "bone" | "tissue" | "check";

  /** What f1 can say about a field: measured by its definition, identifiable from f1's controls, or not separable on one person. */
  export type Identifiability = "measured" | "identifiable" | "unresolved";

  /** A member of the typed working records a catalogue row documents. */
  export type Member =
    | `lengths.${keyof IAutoMovieHumanF1SegmentLengths.IFields}`
    | `tissue.${keyof IAutoMovieHumanF1NativeLaw.IFields}`
    | `checks.${keyof IAutoMovieHumanF1Engineering.IReading}`;

  /**
   * One working field or derived check.
   *
   * @evidence contracts/development/design.md#principled-representation The attributes #3172 asks of every field: unit, definition, frame, posture, source, identifiability, driven controls and applying owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is read by the documentation and the audits that list the model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `members` is typed against the owners' records; a field with no typed member yet says so with an empty list.
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   */
  export interface IField {
    /** The field's name, as its owner spells it. */
    name: string;
    /** Its layer. */
    layer: Layer;
    /**
     * The members of `IPrimary` or `IAutoMovieHumanF1Engineering.IReading` this
     * row documents. An empty or absent list marks a row without a typed member.
     */
    members?: readonly Member[];
    /** Its unit. */
    unit: string;
    /** Its written definition and standard. */
    definition: string;
    /** The frame it is expressed in. */
    frame: string;
    /** The posture its value holds in. */
    posture: string;
    /** Where f1's value comes from. */
    source: string;
    /** What f1 can say about it. */
    identifiable: Identifiability;
    /** The f1 controls it drives, by owner and member. */
    drives: readonly string[];
    /** The module that applies it, its shared joint owner. */
    owner: string;
  }

  /**
   * One quantity the model needs and one person cannot give.
   *
   * @evidence contracts/development/design.md#principled-representation The quantity, why one person cannot identify it, what would, and the issue that receives it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the handoff to the receiving issue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No estimate stands in for an unresolved quantity.
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   */
  export interface IUnresolved {
    /** The quantity. */
    quantity: string;
    /** Why f1 alone cannot identify it. */
    reason: string;
    /** What would identify it: a measurement, a source or another person. */
    needs: string;
    /** The issue that receives it: #3187 the public parameter type, #3205 the cross-person campaign; absent while undecided. */
    to?: "#3187" | "#3205";
  }

  /** The primary working fields, from the skeleton outward. */
  export const PRIMARY: readonly IField[] = [
    {
      name: "hipJointCentreBreadth",
      layer: "joint",
      members: ["tissue.hipJointCentreBreadth"],
      unit: "mm",
      definition: "horizontal distance between the two hip joint centres in the common rest frame (IAutoMovieHumanBodyIdentity)",
      frame: "pelvis (origin the hip centres' midpoint, axes parallel to the figure's)",
      posture: "rest frame; independent of pose",
      source: "f1's rig bind joints: twice the femur origin's lateral offset in the pelvis frame (AutoMovieHumanF1NativeCalibration.readReference)",
      identifiable: "measured",
      drives: ["Placing.CHAIN femur offset z", "every leg datum and course past the femur", "AutoMovieHumanF1Datums.legOrigin"],
      owner: "AutoMovieHumanHipSupportPlacement",
    },
    {
      name: "upperArm, forearm, thigh, shank",
      layer: "length",
      members: ["lengths.upperArm", "lengths.forearm", "lengths.thigh", "lengths.shank"],
      unit: "mm",
      definition: "joint-centre lengths of the long bones: glenohumeral to elbow centre, elbow to wrist centre, hip to knee centre, knee to ankle centre (de Leva 1996 joint-centre convention)",
      frame: "the parent segment's frame (the far joint's offset)",
      posture: "rigid; no posture changes it",
      source: "f1's chain (AutoMovieHumanF1SegmentLengths.reference)",
      identifiable: "measured",
      drives: ["Placing.CHAIN forearm, hand, tibia, foot offsets", "the arm, hand and leg course centres past each joint", "AutoMovieHumanF1NativeSites.maps: the knots and sites of each run by tau"],
      owner: "AutoMovieHumanF1SegmentLengths",
    },
    {
      name: "pelvisToThorax, thoraxToHead",
      layer: "length",
      members: ["lengths.pelvisToThorax", "lengths.thoraxToHead"],
      unit: "mm",
      definition: "trunk runs: the hip centres' midpoint to suprasternale (Wu et al. 2005 IJ), suprasternale to the bitragion midpoint (Farkas)",
      frame: "pelvis and thorax",
      posture: "standing reference; the thorax and head are rigid on the pelvis in this model",
      source: "f1's chain",
      identifiable: "measured",
      drives: ["Placing.CHAIN thorax and head offsets", "the trunk course's crown end (a head datum)", "the trunk course's run ends and every trunk knot and site carried by tau"],
      owner: "AutoMovieHumanF1SegmentLengths",
    },
    {
      name: "handLength, handBreadth, footLength, footBreadth, phalanges",
      layer: "length",
      members: ["lengths.handLength", "lengths.handBreadth", "lengths.footLength", "lengths.footBreadth", "lengths.phalanges"],
      unit: "mm",
      definition: "the hand's wrist-centre-to-third-metacarpal-head length and second-to-fifth metacarpal head spread; the foot's ankle-centre-to-course-end length square to the sole and its first-to-fifth metatarsophalangeal spread; each finger's bone lengths. Joint-centre quantities: ISO 7250-1 6.3.1 hand length and ISO 8559-1 5.5.5 foot length are landmark lengths and enter through an adapter",
      frame: "hand and foot frames; each phalanx's parent",
      posture: "rigid",
      source: "f1's chain and datums",
      identifiable: "measured",
      drives: ["digit first joints and hand/foot datums spread along and across", "later phalanx joints and digit ends", "toe joints by the foot's length (no source gives a toe's bones)"],
      owner: "AutoMovieHumanF1SegmentLengths",
    },
    {
      name: "segment frames",
      layer: "frame",
      members: [],
      unit: "unit vectors, mm origins",
      definition: "ISB frames from joint centres and landmarks (Wu et al. 2002 for the pelvis, femur, tibia and foot; Wu et al. 2005 for the thorax, humerus, forearm and hand), with the substitutes AutoMovieHumanF1Frames.segments declares where a landmark does not show on f1's skin",
      frame: "figure frame, per segment",
      posture: "reference pose",
      source: "f1's landmarks and joint centres (AutoMovieHumanF1Landmarks, AutoMovieHumanF1Joints)",
      identifiable: "measured",
      drives: ["every family's course, up direction and relief directions (AutoMovieHumanF1Placement.repose)"],
      owner: "AutoMovieHumanF1Frames, AutoMovieHumanF1Placing",
    },
    {
      name: "rest angles",
      layer: "rest",
      members: [],
      unit: "rotation matrix, dimensionless",
      definition: "the reference rotations A_parent^T A_child of the chain; the anatomical neutral is the identity at every articulated joint",
      frame: "parent segment",
      posture: "the reference pose f1 was traced in",
      source: "f1's chain",
      identifiable: "measured",
      drives: ["Placing.CHAIN rotations", "AutoMovieHumanConicPose turns"],
      owner: "AutoMovieHumanF1Placement",
    },
    {
      name: "elbowBreadth, wristBreadth, kneeBreadth, bimalleolarBreadth",
      layer: "bone",
      members: [],
      unit: "mm",
      definition: "bony breadths: humeral biepicondylar, bistyloid, femoral biepicondylar (ISAK, caliper with firm pressure), bimalleolar (ANSUR II)",
      frame: "humerus, forearm, femur, tibia",
      posture: "standing, segment axis vertical",
      source: "f1 shows only skin breadths: 75.0, 55.7, 107.8 and 61.3 mm (AutoMovieHumanF1Landmarks); the bony values need a caliper",
      identifiable: "unresolved",
      drives: ["none yet: the tissue reach at the elbow, wrist, knee and ankle sites holds bone and tissue together"],
      owner: "IAutoMovieHumanBodyAnatomy (declared, not read by the native path)",
    },
    {
      name: "tissue reach at each site",
      layer: "tissue",
      members: ["tissue.wall", "tissue.arm", "tissue.leg", "tissue.extremities", "tissue.roots"],
      unit: "mm",
      definition: "the bare wall's directional calipers at the sites of AutoMovieHumanF1NativeSites: depth = +u reach + -u reach, breadth = +v + -v, in the course-normal section plane",
      frame: "the family's course chart at the site",
      posture: "reference pose; limbs in their course-normal planes (ANSUR II's perpendicular convention, not ISO 8559-1's horizontal)",
      source: "f1's stored families (AutoMovieHumanF1NativeCalibration.readReference)",
      identifiable: "identifiable",
      drives: ["the directional ratio profiles of the trunk, arm, leg, hand and roots (NativeBuild, NativeRoots)", "feature heights on each wall"],
      owner: "AutoMovieHumanF1NativeCalibration with AutoMovieHumanF1NativeSites",
    },
    {
      name: "breastProjection",
      layer: "tissue",
      members: ["tissue.breastProjection"],
      unit: "mm",
      definition: "the breast course's world chord from its rail to its native pole; not a published breast projection",
      frame: "figure frame",
      posture: "reference pose",
      source: "f1's breast family",
      identifiable: "identifiable",
      drives: ["AutoMovieHumanNativeProjectionCourse (only f1's own value is generated: AutoMovieHumanF1NativeBuild refuses any other until the breast is one mound family)"],
      owner: "AutoMovieHumanF1NativeBuild with the projection owner",
    },
  ];

  /** The derived surface checks: read on the generated source, never written as inputs. */
  export const CHECKS: readonly IField[] = [
    {
      name: "girths and tapes",
      layer: "check",
      members: ["checks.girths", "checks.bareBust"],
      unit: "mm",
      definition: "ISO 8559-1 hip (5.3.13), under bust (5.3.8), bust (5.3.4) and neck (5.3.2) girths and the girth at omphalion; limb girths at the same sites as their calipers; read as taut tapes on the generated source",
      frame: "horizontal planes (trunk); course-normal planes (limbs)",
      posture: "reference pose",
      source: "derived from the generated source at the stations of AutoMovieHumanF1NativeSites (AutoMovieHumanF1NativeTape)",
      identifiable: "measured",
      drives: [],
      owner: "AutoMovieHumanF1NativeTape",
    },
    {
      name: "stature",
      layer: "check",
      members: [],
      unit: "mm",
      definition: "ISO 7250-1 6.1.2, vertex to floor",
      frame: "figure frame",
      posture: "standing",
      source: "derived from the chain and the head's crown",
      identifiable: "measured",
      drives: [],
      owner: "derived check",
    },
  ];

  /** What one person cannot give the model, with the issue that receives each. */
  export const UNRESOLVED: readonly IUnresolved[] = [
    { quantity: "bone half-width, muscle thickness and fat thickness at a site", reason: "f1's tissue reach is their sum along each direction; one person's skin cannot split it", needs: "published bony breadths per site, skinfolds or imaging, and other people", to: "#3205" },
    { quantity: "the hip joint centre by Hara et al. 2016 (lateral offset 8 + 0.086 LL mm)", reason: "LL is the leg length from the anterior superior iliac spine to the medial malleolus, and neither landmark shows on f1's skin; the rig's bind joint stands as the supplied value", needs: "the person's ASIS-to-medial-malleolus length", to: "#3187" },
    { quantity: "the ISO 8559-1 5.3.2 neck girth level", reason: "the thyroid cartilage does not show on f1's skin; the site is f1's authored station carried by tau", needs: "a thyroid landmark or cervicale with a published offset", to: "#3187" },
    { quantity: "the head's own boundary site", reason: "no published measure names where the head's sections begin", needs: "a head landmark rule (gonion or menton level) from the head owners", to: "#3187" },
    { quantity: "the acromion and biacromial breadth", reason: "the shoulder joint centre stands in for the acromion in the upper arm site and no acromion datum is stored", needs: "an acromion landmark read on f1 and the ANSUR II acromial definitions", to: "#3187" },
    { quantity: "the gluteal furrow", reason: "f1 shows no gluteal notch; the thigh site stands at the crotch's height", needs: "a gluteal furrow height input or another landmark rule", to: "#3187" },
    { quantity: "quadrant fullness and conic shoulders under a tissue change", reason: "the directional ratio is affine and keeps every share; whether fat changes a quadrant's fullness needs people who differ in fat", needs: "other people", to: "#3205" },
    { quantity: "a toe's bone lengths and a digit's own girth", reason: "no source gives them and f1 gives one value each; toes follow the foot's length and digits their hand's or foot's ratio", needs: "other people or a published phalangeal series", to: "#3205" },
    { quantity: "every coefficient read on f1 alone (site taus of the provisional sites, held shares)", reason: "one person supports no covariate relation", needs: "the held-out people of the cross-person campaign", to: "#3205" },
  ];

  /**
   * Proposed domain constraints of the working fields, for the public parameter type (#3187). Each follows from the construction's own
   * premises or from an anatomical order that holds for every person; population ranges are left to the cross-person campaign.
   */
  export const CONSTRAINTS: readonly string[] = [
    "Every segment length and every caliper is finite and positive (AutoMovieHumanSegmentScaling and the native builder refuse others).",
    "Along each course the sites keep their anatomical order: hip, omphalion, under bust, bust, neck, head; mid upper arm, elbow, forearm, wrist, metacarpals; thigh, knee, calf, ankle, ball of foot. The scale profile refuses anchors that do not increase.",
    "Every site stays inside its run (tau in [0, 1]), so a length change never carries a site across a joint.",
    "Course run ends increase strictly (AutoMovieHumanCourseRuns.map), which bounds how short a segment may be against its neighbours' turns.",
    "The hip joint centres lie inside the hip wall: hipJointCentreBreadth is smaller than the hip caliper's breadth.",
    "Girth order along each limb (wrist below the forearm maximum; ankle below the calf, the calf below the knee's level thigh) holds on the derived checks.",
  ];

  /** The changes this model asks of `AutoMovieHumanF1NativeFieldTypes`, whose owner applies them. */
  export const REQUESTS: readonly string[] = [
    "IFields gains the segment lengths of AutoMovieHumanF1SegmentLengths.IFields (by reference) so the native path moves joint centres and courses.",
    "IFields.leg gains a thigh site (AutoMovieHumanF1NativeSites.REFERENCE.leg.thigh), replacing the root rail's stand-in for the thigh.",
    "IFields.extremities drops finger and toe: each digit follows its hand's or foot's profile at its own root.",
    "ISize splits into the four directional reaches (+u, -u, +v, -v), the limb law's per-direction profile, or states that depth and breadth fix the course's place in its section.",
    "The doc comments of IFields.wall, roots and extremities cite AutoMovieHumanF1NativeSites instead of literal stations.",
  ];
}
