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
 * with their measurements and per-tooth clinical protocol axes remain
 * unregistered. Authored crown, tongue and lining dimensions have their own
 * geometry consumers; these observations do not infer those dimensions or
 * establish clinical proper-space boundaries. Jaw motion capacity is kept
 * and checked against the document's own pose. Each face part owner adds the
 * rules for its subtree here; a field no rule covers is refused. Upper-face
 * skin line observations retain Lorenc et al.'s published 1–4 labels at rest
 * and maximum contraction; neither a zero-based index nor a geometry depth is
 * accepted as one of those raw labels.
 *
 * @author Samchon
 */
export const HUMAN_FACE_OBSERVATION_RULES: readonly IHumanFaceObservationRule[] =
  [
    {
      path: "referencePose",
      outcome: "observed",
      reason: "the basis neutral is eyes open, forward gaze, lips apposed",
      values: ["eyes-open-forward-gaze-lips-apposed"],
    },
    {
      path: "jawReference",
      outcome: "observed",
      reason:
        "the basis jaw neutral is maximum intercuspation of one permanent dentition",
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
      reason:
        "compared with the face's mouth.* measurements; a target moves shape only through a listed channel",
    },
    {
      path: "dentition",
      outcome: "observed",
      reason:
        "compared with the face's dental.* measurements, which name the missing tooth registration; dental dimensions do not move shape",
    },
    {
      path: "dentition.stage",
      outcome: "observed",
      reason:
        "the basis models one adult permanent dentition; a primary, mixed or edentulous mouth has no representation",
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
      reason:
        "clinical eruption and dentition-state conversion are not registered; authored present:false can omit a source crown without establishing a clinical absent-tooth state",
      values: ["erupted"],
    },
    {
      path: "oralCavity",
      outcome: "observed",
      reason:
        "coarse oral lining exists; oralCavity.properSpaceVolume still requires registered clinical palate and floor-of-mouth boundaries",
    },
    {
      path: "tongue",
      outcome: "observed",
      reason:
        "compared with tongue.* measurements; authored tongue geometry dimensions exist separately and have no automatic conversion from these clinical observations",
    },
    {
      path: "motionCapacity.jaw",
      outcome: "observed",
      reason:
        "checked against raw jaw.interincisalOpening and reference-relative jaw.protrusionFromReference/jaw.lateralExcursionFromReference on the document's own identity and pose",
    },
    {
      path: "craniofacial",
      outcome: "observed",
      reason:
        "compared with the face's craniofacial measurements (craniofacial.*)",
    },
    {
      path: "nose",
      outcome: "observed",
      reason: "compared with the face's nasal measurements (nose.*)",
    },
    {
      path: "ears",
      outcome: "observed",
      reason:
        "compared with the face's auricle measurements (ear.<side>.*); helix rim and lobule categories have no measurement and are kept for the record",
    },
    {
      path: "eyes",
      outcome: "observed",
      reason:
        "compared with eye.* and eye.<side>.* measurements, including generated optical dimensions; clinical crease registration and physiological light-adapted pupil acquisition remain separate gaps",
    },
    {
      path: "eyes.*.lowerEyelid",
      outcome: "observed",
      reason:
        "coarse lower-lid tissue shells exist; observed orbital-fat and bag grades have no registered acquisition or physiological conversion into those dimensions",
    },
    {
      path: "brows",
      outcome: "observed",
      reason:
        "compared with brow.<side>.* measurements; generated brow shafts do not supply the unregistered clinical limbal verticals or arch-apex acquisition protocol",
    },
    {
      path: "brows.*.hairCoverageFraction",
      outcome: "observed",
      reason:
        "generated brow shafts exist; mature-hair coverage acquisition and its surface-area denominator are not registered",
    },
    {
      path: "eyelashes",
      outcome: "observed",
      reason:
        "compared with eyelash.<side>.<row>.*; generated shaft counts and sampled centreline lengths are output quantities, while the clinical central-2-mm caliper protocol remains unimplemented",
    },
    {
      path: "eyelashes.*.*.centralTwoMmShaftCount",
      outcome: "observed",
      reason:
        "generated lash shafts exist; the clinical central-2-mm acquisition window and its biological shaft-count protocol are not registered",
    },
    {
      path: "eyelashes.*.*.form",
      outcome: "observed",
      reason:
        "kept for the record; the document's lash profiles carry the rendered curl, and no rule maps a straight or curly class onto them",
    },
    {
      path: "motionCapacity.leftEye",
      outcome: "observed",
      reason:
        "kept for the record; missing rule: left ocular duction endpoints against the gaze rig, whose expression range is an authoring range, not a duction limit",
    },
    {
      path: "motionCapacity.rightEye",
      outcome: "observed",
      reason:
        "kept for the record; missing rule: right ocular duction endpoints against the gaze rig, whose expression range is an authoring range, not a duction limit",
    },
    {
      path: "performance.leftEye",
      outcome: "observed",
      reason:
        "kept as the observed performance; missing rule: left globe gaze readout, and the palpebral aperture compares with eye.left.fissureHeight once it reads",
    },
    {
      path: "performance.rightEye",
      outcome: "observed",
      reason:
        "kept as the observed performance; missing rule: right globe gaze readout, and the palpebral aperture compares with eye.right.fissureHeight once it reads",
    },
    {
      path: "cheeks",
      outcome: "observed",
      reason:
        "an MRI fat-compartment volume; the face carries no fat compartment, so it is kept for the record and moves no shape",
    },
    {
      path: "neck",
      outcome: "observed",
      reason:
        "the face view holds no neck below the cut; on a person the body owns the neck and measures its girth at the infrathyroid level (measureNeckCirc), not at the cricothyroid membrane",
    },
    {
      path: "performance",
      outcome: "observed",
      reason:
        "kept as the observed performance; no resolver maps it onto expression weights yet",
    },
    {
      path: "performance.jaw.interincisalGapMm",
      outcome: "observed",
      reason:
        "compared with jaw.interincisalOpening on the document's own pose",
    },
    {
      path: "performance.jaw.lateralExcursionMm",
      outcome: "observed",
      reason:
        "compared with jaw.lateralExcursionFromReference, correcting the current identity's initial dental midline deviation",
    },
    {
      path: "performance.jaw.protrusionMm",
      outcome: "observed",
      reason:
        "compared with jaw.protrusionFromReference, including the current identity's initial overjet",
    },
    {
      path: "performance.interlabialGapMm",
      outcome: "observed",
      reason: "compared with mouth.interlabialGap on the document's own pose",
    },
    {
      path: "softTissue",
      outcome: "observed",
      reason:
        "kept for the record; the face surface has no epidermal, dermal or subcutaneous layers to thicken",
    },
    {
      path: "skinCondition",
      outcome: "observed",
      reason:
        "kept for the record; no channel or material carries a photonumeric line or sagging grade",
    },
    ...[
      "foreheadLines",
      "glabellarLines",
      "leftLateralCanthalLines",
      "rightLateralCanthalLines",
    ].flatMap((site) =>
      ["protocol", "restGrade", "maximumContractionGrade"].map(
        (state): IHumanFaceObservationRule => ({
          path: `skinCondition.${site}.${state}`,
          outcome: "observed",
          values:
            state === "protocol" ? ["medytox-upper-face-2025"] : [1, 2, 3, 4],
          reason:
            "Lorenc et al. 2025 upper-face protocol keeps raw severity labels 1 none/minimal, 2 mild, 3 moderate, 4 severe; omission is unobserved and no geometry is inferred",
        }),
      ),
    ),
    {
      path: "skinColour",
      outcome: "observed",
      reason:
        "kept for the record; no appearance solver lowers calibrated CIELAB to material reflectance",
    },
    {
      path: "appearance",
      outcome: "observed",
      reason:
        "kept for the record; the document's materials carry the rendered finishes",
    },
    {
      path: "scalpHair",
      outcome: "observed",
      reason:
        "kept for the record; the document's numerical hair carries the rendered scalp hair",
    },
    {
      path: "facialHair",
      outcome: "observed",
      reason: "kept for the record; the numerical document owns emitted terminal-shaft targets independently of observed density",
    },
  ];
