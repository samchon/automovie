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
