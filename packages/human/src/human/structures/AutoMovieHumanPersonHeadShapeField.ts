/**
 * Closed source-anatomical exterior trait identities driven by one shared head provider. Values are source-neutral displacement differences in millimetres except forehead/pinna inclination in degrees. Projection advances named support, breadth widens it, height raises/lengthens it and recession/hollow deepens its source section. The generation owns actual directions, support, signed endpoint conversion and allowed source conditions; names alone establish no clinical measurement or inverse reconstruction.
 *
 * @evidence contracts/common.md#principled-implementation Named source exterior domains distinguish cranial/facial/cervical/nasal and bilateral pinna controls with one shared public difference-unit owner.
 * @evidence contracts/common.md#clear-and-simple-design The closed identity union routes traits while generation qualification and numerical endpoint resolution remain separate implementations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anatomical names do not create missing qualified support, and millimetre/degree differences are not absolute patient measurements or portrait-derived reconstruction.
 * @evidence contracts/common.md#meaningful-documentation Prose states source-neutral units, directional conventions, bilateral domains and source authority boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased trait identity union performs no source resolution, support traversal or geometry evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared trait naming implements no endpoint/provider cache; publisher/resolver consumers own reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Trait names acquire no source geometry, clinical data or running task; actual provider records have their own owner lifetime.
 *
 * @author Samchon
 */
export type AutoMovieHumanPersonHeadShapeField =
  | "cranial.vaultBreadth"
  | "cranial.vaultHeight"
  | "cranial.occipitalProjection"
  | "cranial.foreheadInclination"
  | "cranial.temporalBreadth"
  | "facial.leftMalarProjection"
  | "facial.rightMalarProjection"
  | "facial.leftBuccalHollow"
  | "facial.rightBuccalHollow"
  | "facial.leftMandibularBreadth"
  | "facial.rightMandibularBreadth"
  | "facial.chinProjection"
  | "facial.chinHeight"
  | "cervical.anteriorFullness"
  | "cervical.posteriorFullness"
  | "cervical.cervicomentalProjection"
  | "cervical.cervicalJointSpan"
  | "nasalExterior.rootProjection"
  | "nasalExterior.dorsumProjection"
  | "nasalExterior.tipProjection"
  | "nasalExterior.tipBreadth"
  | "nasalExterior.tipHeight"
  | "nasalExterior.columellarProjection"
  | "nasalExterior.columellarBreadth"
  | "nasalExterior.leftAlarBreadth"
  | "nasalExterior.rightAlarBreadth"
  | "nasalExterior.leftAlarHeight"
  | "nasalExterior.rightAlarHeight"
  | `ears.${"left" | "right"}.${
      | "helixRimProjection"
      | "antihelixProjection"
      | "superiorCrusProjection"
      | "inferiorCrusProjection"
      | "cymbaFloorRecession"
      | "cavumFloorRecession"
      | "tragusProjection"
      | "antitragusProjection"
      | "lobuleHeight"
      | "lobuleBreadth"
      | "pinnaSectionThickness"
      | "retroauricularSulcusRecession"
      | "pinnaInclination"}`;
