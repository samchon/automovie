import type { IAnsurBodyMeasure } from "./IAnsurBodyMeasure";

/**
 * The body readings a census compares with ANSUR II (measurement protocol:
 * Hotzman et al., NATICK/TR-11/017, 2011), with the
 * definition each side uses. Stature, mass, age and sex are the simple tier's
 * identity-card inputs, so they are never a residual; every row here is an
 * output the body derives from them.
 *
 * The survey instruments below were checked against Hotzman et al. (2011),
 * sections 6.4.5, 6.4.17, 6.4.22, 6.4.25 and 6.4.93:
 * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf.
 * `HUMAN_BODY_MEASUREMENTS` owns the body instruments. Their sampled rest
 * sections approximate some survey sites, but anatomical purpose alone does
 * not establish identical planes, sides, landmarks or acquisition postures.
 * `HUMAN_BODY_ANSUR_II_REFERENCE` remains comparable sample context, not proof
 * of protocol identity. The census and its formatter pass these distinctions
 * through without altering any measurement or fitted body. A residual also
 * includes individual variation that the identity-card inputs do not specify.
 */
export const ANSUR_BODY_MEASURES: readonly IAnsurBodyMeasure[] = [
  {
    name: "buttock circumference",
    read: { kind: "channel", id: "measureHipsCirc" },
    column: "buttockcircumference",
    sameDefinition: false,
    reason: "the body samples the shared rearmost trunk section in its rest A-pose; the survey uses the right buttock's maximum projection level with heels together",
  },
  {
    name: "calf circumference",
    read: { kind: "channel", id: "measureCalfCirc" },
    column: "calfcircumference",
    sameDefinition: false,
    reason: "the body samples the maximum left calf section perpendicular to the knee-to-ankle axis at rest; the survey uses the maximum horizontal right-calf tape standing with heels about 10 cm apart",
  },
  {
    name: "ankle circumference",
    read: { kind: "channel", id: "measureAnkleCirc" },
    column: "anklecircumference",
    sameDefinition: false,
    reason: "the body samples the minimum left ankle section perpendicular to the knee-to-ankle axis at rest; the survey uses the minimum horizontal ankle tape standing with feet about 10 cm apart",
  },
  {
    name: "wrist circumference",
    read: { kind: "channel", id: "measureWristCirc" },
    column: "wristcircumference",
    sameDefinition: false,
    reason: "the body samples the minimum left distal-forearm section at rest; the survey places the tape at stylion perpendicular to the right forearm with elbow flexed 90 degrees and palm up",
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
    reason: "the body reads bare skin at its left nipple-fill level at rest; the 2011 protocol uses the right chest-point level at quiet respiration, a bra landmark for women, and notes its change from the earlier male thelion level",
  },
  {
    name: "thigh circumference",
    read: { kind: "channel", id: "measureThighCirc" },
    column: "thighcircumference",
    sameDefinition: false,
    reason: "the body reads the maximum tape at 25 to 60 percent of the thigh, ANSUR at the gluteal furrow",
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
