/**
 * The height field of one arch's lining over its arch plane.
 *
 * Every reading takes an arch-frame point `(u, v)` in metres. The gingiva,
 * the palate or floor, the lining's outer rim and the vestibular wall all
 * read this one field, so they cannot disagree about where the lining lies.
 *
 * @evidence contracts/common.md#principled-implementation One function of the plane point defines the surface, so every sample of it, rim or interior, lies on the same surface.
 * @evidence contracts/common.md#clear-and-simple-design Three readings are all the lining builder needs: where the surface is, how far the point is from a crown and which side of the arch it is on.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exposes no per-part or per-tooth variant.
 * @evidence contracts/common.md#meaningful-documentation States the domain, unit and shared consumers.
 * @evidence contracts/modeling.md#spatial-conventions Arch-frame metres in and out.
 * @evidence contracts/modeling.md#shared-boundaries The single definition both sides of every lining boundary evaluate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The lining builder owns the parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The dimension resolver owns the inputs.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field's constructor states its anatomical basis.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 *
 * @author Samchon
 */
export interface IHumanFaceOralLiningField {
  /**
   * In-plane distance from the point to the nearest cervical ring edge.
   *
   * @evidenceExclude contracts/common.md#principled-implementation The field constructor answers for the formula.
   * @evidenceExclude contracts/common.md#clear-and-simple-design The interface answers for the set of readings.
   * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts The field constructor answers for the mechanism.
   * @evidenceExclude contracts/common.md#meaningful-documentation The sentence above is this member's documentation.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels A reading consumes no channel itself.
   * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no primitive.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The interface states arch-frame metres for every reading.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The interface answers for the shared definition.
   * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The field constructor states the anatomical basis.
   * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority A reading defines no authoring input.
   */
  distance: (u: number, v: number) => number;

  /**
   * Apical coordinate of the lining at the point: the cervical height plus the lining's rise.
   *
   * @evidenceExclude contracts/common.md#principled-implementation The field constructor answers for the formula.
   * @evidenceExclude contracts/common.md#clear-and-simple-design The interface answers for the set of readings.
   * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts The field constructor answers for the mechanism.
   * @evidenceExclude contracts/common.md#meaningful-documentation The sentence above is this member's documentation.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels A reading consumes no channel itself.
   * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no primitive.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The interface states arch-frame metres for every reading.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The interface answers for the shared definition.
   * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The field constructor states the anatomical basis.
   * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority A reading defines no authoring input.
   */
  apical: (u: number, v: number) => number;

  /**
   * Signed in-plane distance to the station polyline and its unbounded
   * posterior terminal half-rays: positive on the lingual side between the
   * arms and negative on the facial side. There is no finite posterior
   * closure or query rectangle implicit in this reading.
   *
   * @evidenceExclude contracts/common.md#principled-implementation The field constructor answers for the formula.
   * @evidenceExclude contracts/common.md#clear-and-simple-design The interface answers for the set of readings.
   * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts The field constructor answers for the mechanism.
   * @evidenceExclude contracts/common.md#meaningful-documentation The sentence above is this member's documentation.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels A reading consumes no channel itself.
   * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no primitive.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The interface states arch-frame metres for every reading.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The interface answers for the shared definition.
   * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The field constructor states the anatomical basis.
   * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority A reading defines no authoring input.
   */
  lingualDepth: (u: number, v: number) => number;
}
