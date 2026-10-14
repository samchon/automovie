import type { IConnectedPersonUndescribedInput } from "./IConnectedPersonUndescribedInput";

/**
 * Neutral numerical inputs of the person document whose owners publish no range descriptor the page can read yet. The catalogue names them and where they are edited instead of listing them with bounds of its own.
 *
 * Each entry leaves this list when its owner's descriptor reaches the page; the catalogue then lists its members from that descriptor. Units are the ones the document type states. Motion inputs (pose, expression and the performed fractions) are outside this list by scope.
 *
 * @author Samchon
 */
export const CONNECTED_PERSON_UNDESCRIBED_INPUTS: IConnectedPersonUndescribedInput[] =
  [
    {
      paths: "face.eyes.{left,right}.*",
      unit: "mm; central thickness in micrometres",
      edited: "Eyes, lashes and optics",
    },
    {
      paths: "face.eyelids.{left,right}.<section>.{elevationMm,projectionMm}",
      unit: "mm",
      edited: "Eyes, lashes and optics",
    },
    {
      paths: "face.ocularSurfaces.{left,right}.*",
      unit: "mm",
      edited: "Eyes, lashes and optics",
    },
    {
      paths: "face.skinRelief.nasolabial.{left,right}.{restDepthMm,widthMm}",
      unit: "mm",
      edited: "Skin relief",
    },
    {
      paths:
        "face.skinRelief.regions.<region>.{restOffsetMm,widthMm,lengthMm,elevationMm}",
      unit: "mm",
      edited: "Skin relief",
    },
    {
      paths: "face.oral.{teeth,maxillary,mandibular,space,tongue}.*",
      unit: "authored dimensions in mm; crown presence is a separate closed choice",
      edited: "Oral assembly",
    },
    {
      paths: "body.humeralHeads.{leftRadiusMillimetres,rightRadiusMillimetres}",
      unit: "mm",
      edited: "Humeral heads",
    },
    {
      paths: "body.anatomy.surface.* (bound exterior targets)",
      unit: "metres in the document; the controls display mm",
      edited: "Body control group Anatomy",
    },
    {
      paths: "body.shape.<channel> without a measurement rule",
      unit: "weight",
      edited: "Complete document only",
    },
    {
      paths: "face.skin and legacy face.hair fields",
      unit: "legacy coordinate styling fields",
      edited:
        "Document JSON preserves these fields; named skinAppearance and hairTraits controls author appearance",
    },
    {
      paths: "face.scalpHair (new population)",
      unit: "named styling records",
      edited:
        "Document JSON only; existing populations have named hairTraits controls and no new population is inferred",
    },
    {
      paths: "face.materials.<material>.{pigment,density}",
      unit: "linear colour and coverage gain",
      edited: "Complete document only",
    },
    {
      paths: "body.underwear",
      unit: "closed choices",
      edited: "Complete document only",
    },
    {
      paths: "body.anatomicalInspection",
      unit: "source-registered reference atlas identities",
      edited: "Body control group Pose: Reference atlas inspection",
    },
  ];
