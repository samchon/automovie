/** How one body reading answers one ANSUR II column. */
export interface IAnsurBodyMeasure {
  /** Report name. */
  name: string;

  /**
   * What the body is read with: a `measureHumanBodySimpleShape.channel` rule
   * id, or the height of a skeleton landmark above the lowest skin point.
   */
  read:
    | { kind: "channel"; id: string }
    | { kind: "landmarkHeight"; landmark: string };

  /** Lower-cased ANSUR II column, in millimetres. */
  column: string;

  /**
   * True when the body reading and the survey measure the same thing under
   * the same definition, so a residual is a defect of the body or of the
   * simple tier's solve. False when the definitions differ and the residual
   * mixes a real difference with a definition difference; the reason says
   * which.
   */
  sameDefinition: boolean;

  reason: string;
}

/**
 * The body readings a census compares with ANSUR II (measurement protocol:
 * Hotzman et al., NATICK/TR-11/017, 2011), with the
 * definition each side uses. Stature, mass, age and sex are the simple tier's
 * identity-card inputs, so they are never a residual; every row here is an
 * output the body derives from them.
 *
 * Each row's `reason` is the checked difference or agreement: the buttock,
 * calf, ankle and wrist tapes are the instruments the body's rule table
 * documents (`HUMAN_BODY_MEASUREMENTS`, `HUMAN_BODY_ANSUR_II_REFERENCE`); the
 * others are listed because a viewer reads them as proportion even though the
 * survey landmark is a different structure from the body's joint centre or
 * tape rule. The survey stands the subject in a prescribed posture and the
 * body is read at its rest A-pose, a difference the table cannot remove.
 */
export const ANSUR_BODY_MEASURES: readonly IAnsurBodyMeasure[] = [
  {
    name: "buttock circumference",
    read: { kind: "channel", id: "measureHipsCirc" },
    column: "buttockcircumference",
    sameDefinition: true,
    reason: "both at the rearmost buttock projection",
  },
  {
    name: "calf circumference",
    read: { kind: "channel", id: "measureCalfCirc" },
    column: "calfcircumference",
    sameDefinition: true,
    reason: "both the maximum standing calf tape",
  },
  {
    name: "ankle circumference",
    read: { kind: "channel", id: "measureAnkleCirc" },
    column: "anklecircumference",
    sameDefinition: true,
    reason: "both the minimum tape above the malleoli",
  },
  {
    name: "wrist circumference",
    read: { kind: "channel", id: "measureWristCirc" },
    column: "wristcircumference",
    sameDefinition: true,
    reason: "both at the narrowest forearm tape near the stylion",
  },
  {
    name: "waist circumference",
    read: { kind: "channel", id: "measureWaistCirc" },
    column: "waistcircumference",
    sameDefinition: false,
    reason: "the body reads the smallest trunk tape, ANSUR the tape at the navel",
  },
  {
    name: "chest circumference",
    read: { kind: "channel", id: "measureBustCirc" },
    column: "chestcircumference",
    sameDefinition: false,
    reason: "the body reads bare skin at the nipple level, ANSUR over clothing",
  },
  {
    name: "thigh circumference",
    read: { kind: "channel", id: "measureThighCirc" },
    column: "thighcircumference",
    sameDefinition: false,
    reason: "the body reads the maximum tape at 25 to 60 percent of the thigh, ANSUR at the gluteal furrow",
  },
  {
    name: "neck-base height",
    read: { kind: "channel", id: "macroHeight" },
    column: "cervicaleheight",
    sameDefinition: false,
    reason: "the body ends at the clip ring of its neck, ANSUR at the seventh cervical spine",
  },
  {
    name: "upper arm length",
    read: { kind: "channel", id: "measureUpperarmLength" },
    column: "acromionradialelength",
    sameDefinition: false,
    reason: "shoulder joint centre to elbow joint centre against the acromion to the radiale on the surface",
  },
  {
    name: "forearm length",
    read: { kind: "channel", id: "measureLowerarmLength" },
    column: "radialestylionlength",
    sameDefinition: false,
    reason: "elbow joint centre to wrist joint centre against the radiale to the stylion on the surface",
  },
  {
    name: "shoulder joint height",
    read: { kind: "landmarkHeight", landmark: "joint-l-shoulder" },
    column: "acromialheight",
    sameDefinition: false,
    reason: "joint centre inside the shoulder against the acromion on its surface",
  },
  {
    name: "hip joint height",
    read: { kind: "landmarkHeight", landmark: "joint-l-upper-leg" },
    column: "trochanterionheight",
    sameDefinition: false,
    reason: "femoral head centre against the greater trochanter on the surface",
  },
  {
    name: "knee joint height",
    read: { kind: "landmarkHeight", landmark: "joint-l-knee" },
    column: "lateralfemoralepicondyleheight",
    sameDefinition: false,
    reason: "knee joint centre against the lateral femoral epicondyle",
  },
  {
    name: "ankle joint height",
    read: { kind: "landmarkHeight", landmark: "joint-l-ankle" },
    column: "lateralmalleolusheight",
    sameDefinition: false,
    reason: "ankle joint centre against the lateral malleolus",
  },
];
