/**
 * Closed source-anatomical exterior traits driven by a shared head provider.
 *
 * Values are source-neutral displacement differences in millimetres, except
 * forehead and pinna inclination differences in degrees. Positive projections
 * advance the named source support, breadth widens it, height raises vault/tip
 * or lengthens the named lobule/chin, and recession/hollow deepens its source
 * section. These authored traits are not clinical measurements or an inverse
 * reconstruction. The generation descriptor owns exact directions, support,
 * signed endpoint conversion and permitted source conditions.
 *
 * @evidence contracts/common.md#principled-implementation A closed anatomical path set distinguishes independently authored source traits without exposing personal vertices or curves.
 * @evidence contracts/common.md#clear-and-simple-design Each path identifies one cranial, facial, cervical, nasal or paired-pinna source trait.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths select registered source traits; they carry neither a source identity shortcut nor default measured values.
 * @evidence contracts/common.md#meaningful-documentation States source-relative units, positive directions and the separate clinical meaning.
 * @evidence contracts/modeling.md#parameter-channels Domains and paired paths keep each source trait distinct; the provider owns intentional coupling and its neutral.
 * @evidence contracts/anatomy.md#parametric-authority Only named anatomical exterior differences select the source's numerical controls; a person cannot address a vertex, free curve or patch.
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
