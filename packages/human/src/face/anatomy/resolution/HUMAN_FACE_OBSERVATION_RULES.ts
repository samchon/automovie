import type { IHumanFaceObservationRule } from "./IHumanFaceObservationRule";

/**
 * How the face resolver treats each clinical observation field, longest path
 * first applying.
 *
 * The record's reference fields are kept; a jaw reference or dentition stage
 * the basis cannot represent is refused, because the basis carries one adult
 * permanent dentition in maximum intercuspation and no proxy for a primary,
 * mixed or edentulous mouth is built. Mouth, dental, tongue and oral cavity
 * values are kept as observations: lip and commissure distances are compared
 * with their measurements, the dentition has no per-tooth registration, and
 * the tongue and cavity have no shaping channel. Jaw motion capacity is kept
 * and checked against the document's own pose. Each face part owner adds the
 * rules for its subtree here; a field no rule covers is refused.
 *
 * @author Samchon
 */
export const HUMAN_FACE_OBSERVATION_RULES: readonly IHumanFaceObservationRule[] = [
  {
    path: "referencePose",
    outcome: "observed",
    reason: "the basis neutral is eyes open, forward gaze, lips apposed",
    values: ["eyes-open-forward-gaze-lips-apposed"],
  },
  {
    path: "jawReference",
    outcome: "observed",
    reason: "the basis jaw neutral is maximum intercuspation of one permanent dentition",
    values: ["maximum-intercuspation"],
  },
  {
    path: "ageYears",
    outcome: "observed",
    reason: "kept for the record; no channel ages the face",
  },
  {
    path: "referenceSex",
    outcome: "observed",
    reason: "kept as the reference population for comparing measurements",
  },
  {
    path: "mouth",
    outcome: "observed",
    reason: "compared with the face's mouth.* measurements; a target moves shape only through a listed channel",
  },
  {
    path: "dentition",
    outcome: "observed",
    reason: "compared with the face's dental.* measurements, which name the missing tooth registration; dental dimensions do not move shape",
  },
  {
    path: "dentition.stage",
    outcome: "observed",
    reason: "the basis models one adult permanent dentition; a primary, mixed or edentulous mouth has no representation",
    values: ["permanent"],
  },
  {
    path: "dentition.overjetMm",
    outcome: "observed",
    reason: "compared with dental.overjet; the incisors are not moved",
  },
  {
    path: "dentition.overbiteMm",
    outcome: "observed",
    reason: "compared with dental.overbite; the incisors are not moved",
  },
  {
    path: "dentition.teeth.*.state",
    outcome: "observed",
    reason: "the dental surface carries every permanent tooth erupted; an unerupted, absent or prosthetic tooth has no representation",
    values: ["erupted"],
  },
  {
    path: "oralCavity",
    outcome: "observed",
    reason: "compared with oralCavity.properSpaceVolume, which names the missing palate and floor-of-mouth registration",
  },
  {
    path: "tongue",
    outcome: "observed",
    reason: "compared with the face's tongue.* measurements; no channel shapes the tongue",
  },
  {
    path: "motionCapacity.jaw",
    outcome: "observed",
    reason: "checked against jaw.interincisalOpening, jaw.protrusionBeyondOverjet and jaw.lateralExcursion on the document's own pose",
  },
  {
    path: "craniofacial",
    outcome: "observed",
    reason: "compared with the face's craniofacial measurements (craniofacial.*)",
  },
  {
    path: "nose",
    outcome: "observed",
    reason: "compared with the face's nasal measurements (nose.*)",
  },
  {
    path: "ears",
    outcome: "observed",
    reason: "compared with the face's auricle measurements (ear.<side>.*); helix rim and lobule categories have no measurement and are kept for the record",
  },
  {
    path: "eyes",
    outcome: "observed",
    reason: "compared with the face's eye measurements (eye.* and eye.<side>.*), which name the missing periocular and optical-support registrations",
  },
  {
    path: "eyes.*.lowerEyelid",
    outcome: "observed",
    reason: "kept for the record; missing registration: the face carries no lower-lid tissue layer, orbital fat or bag channel",
  },
  {
    path: "brows",
    outcome: "observed",
    reason: "compared with the face's brow measurements (brow.<side>.*), which name the missing periocular registration",
  },
  {
    path: "brows.*.hairCoverageFraction",
    outcome: "observed",
    reason: "kept for the record; missing registration: the brow is one card with no mature-hair population to cover",
  },
  {
    path: "eyelashes",
    outcome: "observed",
    reason: "compared with the face's lash measurements (eyelash.<side>.<row>.*), which name the missing periocular registration",
  },
  {
    path: "eyelashes.*.*.centralTwoMmShaftCount",
    outcome: "observed",
    reason: "kept for the record; missing registration: the lashes are cards with no shaft population to count",
  },
  {
    path: "eyelashes.*.*.form",
    outcome: "observed",
    reason: "kept for the record; the document's lash profiles carry the rendered curl, and no rule maps a straight or curly class onto them",
  },
  {
    path: "motionCapacity.leftEye",
    outcome: "observed",
    reason: "kept for the record; missing rule: left ocular duction endpoints against the gaze rig, whose expression range is an authoring range, not a duction limit",
  },
  {
    path: "motionCapacity.rightEye",
    outcome: "observed",
    reason: "kept for the record; missing rule: right ocular duction endpoints against the gaze rig, whose expression range is an authoring range, not a duction limit",
  },
  {
    path: "performance.leftEye",
    outcome: "observed",
    reason: "kept as the observed performance; missing rule: left globe gaze readout, and the palpebral aperture compares with eye.left.fissureHeight once it reads",
  },
  {
    path: "performance.rightEye",
    outcome: "observed",
    reason: "kept as the observed performance; missing rule: right globe gaze readout, and the palpebral aperture compares with eye.right.fissureHeight once it reads",
  },
  {
    path: "cheeks",
    outcome: "observed",
    reason: "an MRI fat-compartment volume; the face carries no fat compartment, so it is kept for the record and moves no shape",
  },
  {
    path: "neck",
    outcome: "observed",
    reason: "the face view holds no neck below the cut; on a person the body owns the neck and measures its girth at the infrathyroid level (measureNeckCirc), not at the cricothyroid membrane",
  },
  {
    path: "performance",
    outcome: "observed",
    reason: "kept as the observed performance; no resolver maps it onto expression weights yet",
  },
  {
    path: "performance.jaw.interincisalGapMm",
    outcome: "observed",
    reason: "compared with jaw.interincisalOpening on the document's own pose",
  },
  {
    path: "performance.jaw.lateralExcursionMm",
    outcome: "observed",
    reason: "compared with jaw.lateralExcursion on the document's own pose",
  },
  {
    path: "performance.interlabialGapMm",
    outcome: "observed",
    reason: "compared with mouth.interlabialGap on the document's own pose",
  },
  {
    path: "softTissue",
    outcome: "observed",
    reason: "kept for the record; the face surface has no epidermal, dermal or subcutaneous layers to thicken",
  },
  {
    path: "skinCondition",
    outcome: "observed",
    reason: "kept for the record; no channel or material carries a photonumeric line or sagging grade",
  },
  {
    path: "skinColour",
    outcome: "observed",
    reason: "kept for the record; no appearance solver lowers calibrated CIELAB to material reflectance",
  },
  {
    path: "appearance",
    outcome: "observed",
    reason: "kept for the record; the document's materials carry the rendered finishes",
  },
  {
    path: "scalpHair",
    outcome: "observed",
    reason: "kept for the record; the document's numerical hair carries the rendered scalp hair",
  },
  {
    path: "facialHair",
    outcome: "observed",
    reason: "kept for the record; no facial-hair producer exists",
  },
];
