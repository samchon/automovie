/**
 * One control of a narrow connected relief curve. The attachment remains a
 * resident skin vertex, while the offset locates the curve control in the
 * current fitted surface. Adjacent controls are sampled into overlapping
 * fields by the factory; this makes a philtral crest or similar section a
 * continuous authored path rather than a collection of unrelated blobs.
 *
 * @evidence contracts/common.md#principled-implementation A control is a resident anchor vertex, an offset in the current fitted surface, positive radii and a signed displacement, sampled linearly between adjacent controls by the factory to make a continuous path.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitReliefCurvePoint carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that the anchor follows component replacement, the units and that the factory samples adjacent controls.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the head frame, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitReliefCurvePoint is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitReliefCurvePoint carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitReliefCurvePoint decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitReliefCurvePoint constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitReliefCurvePoint is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitReliefCurvePoint {
  /** Resident skin vertex used to follow component replacement. */
  anchor: number;

  /** XYZ offset from that live attachment, in construction millimetres. */
  offset: [number, number, number];

  /** Positive support radii around this control, in millimetres. */
  radius: [number, number, number];

  /** Signed displacement at this control, in millimetres. */
  displacement: [number, number, number];
}
