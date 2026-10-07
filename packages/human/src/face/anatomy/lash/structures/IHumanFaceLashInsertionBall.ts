/**
 * One shaft's insertion region measured from its emitted Float32 root ring.
 * The closed ball permits insertion only at crossing points within it; the
 * remaining original triangles and all witnesses outside it remain measured.
 *
 * @evidence contracts/common.md#principled-implementation Holds the observed root centre and maximum ring radius used for vertex and crossing-point classification.
 * @evidence contracts/common.md#clear-and-simple-design One region record serves both free vertex selection and transverse witness classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no anatomical radius or tolerance allowance.
 * @evidence contracts/common.md#meaningful-documentation Names emitted precision, closed-boundary semantics and units.
 * @evidence contracts/modeling.md#spatial-conventions Centre and radius are head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Classifies the same observed skin insertion for vertices and transverse witnesses.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries one existing shaft region without defining a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical contact transport; the lash assembly owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no inferred tissue dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range This record defines no biological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No authoring input is introduced.
 * @author Samchon
 */
export interface IHumanFaceLashInsertionBall {
  /** Mean of the eight distinct root ring vertices, in head-frame metres. */
  centre: readonly number[];

  /** Maximum emitted root-ring vertex distance from the centre, in metres. */
  radius: number;
}
