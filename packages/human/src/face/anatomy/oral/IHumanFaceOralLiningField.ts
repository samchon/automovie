/**
 * The height field of one arch's lining over its arch plane.
 *
 * Every reading takes an arch-frame point `(u, v)` in metres. The gingiva, the palate or floor, the lining's outer rim and the vestibular wall all read this one field, so they cannot disagree about where the lining lies.
 *
 * @evidence contracts/common.md#principled-implementation Shared ring distance, apical height and lingual-side depth define one arch-plane lining field.
 * @evidence contracts/common.md#clear-and-simple-design Gingiva, vault, outer rim and wall consumers read the same formulas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored rise and posterior rays are not reconstructed pharyngeal or tissue mechanics, and emitted contact still requires separate admission.
 * @evidence contracts/common.md#meaningful-documentation Inputs u/v and outputs distance/height/depth are arch-frame metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Ring and station traversal execute in createHumanFaceOralLiningField and shared distance readers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One compiled field borrows the resolved frame for all assembly samples; results are not memoized per point.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The field closure retains frame/dimension references while construction uses it and no query history is stored by this type.
 *
 * @author Samchon
 */
export interface IHumanFaceOralLiningField {
  /**
   * In-plane distance from the point to the nearest cervical ring edge.
   *
   * @evidence contracts/common.md#principled-implementation The shared ring-edge instrument reads nearest in-plane cervical distance.
   * @evidence contracts/common.md#clear-and-simple-design Field rise and finish classification use this same ring geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The metric is not a tooth long axis, clinical CEJ or intrinsic geodesic.
   * @evidence contracts/common.md#meaningful-documentation u/v and result are arch-frame metres and valid ring stations remain a producer premise.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Ring-edge scans execute in measureHumanFaceOralRingDistance.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The field borrows one resolved station population for repeated reads without per-point memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The field closure retains ring arrays; this signature adds no cache or query handle.
   */
  distance: (u: number, v: number) => number;

  /**
   * Apical coordinate of the lining at the point: the cervical height plus the lining's rise.
   *
   * @evidence contracts/common.md#principled-implementation Local cervical edge height plus authored collar/vault rise determines the lining's apical coordinate.
   * @evidence contracts/common.md#clear-and-simple-design Assembly regions and vestibular wall read one common height field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The profile does not reconstruct clinical gingiva/palate and may still require emitted crown-contact refusal.
   * @evidence contracts/common.md#meaningful-documentation u/v and output height are arch-frame metres under the current arch's apical sign.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Cervical/station reductions execute in createHumanFaceOralLiningField, currently reading cervical height twice.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One frame/dimension set is shared across all height samples; sampled heights are not cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The owning field borrows stable frame arrays for construction lifetime and retains no sampled mesh here.
   */
  apical: (u: number, v: number) => number;

  /**
   * Signed in-plane distance to the station polyline and its unbounded posterior terminal half-rays: positive on the lingual side between the arms and negative on the facial side. There is no finite posterior closure or query rectangle implicit in this reading.
   *
   * @evidence contracts/common.md#principled-implementation Station-polyline parity and two posterior half-rays supply signed side and nearest distance.
   * @evidence contracts/common.md#clear-and-simple-design The same unbounded arch geometry owns both sign and metric for the height profile.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No hidden finite posterior wall or acquired pharyngeal boundary is introduced.
   * @evidence contracts/common.md#meaningful-documentation Positive arch-frame metre depth is lingual and negative is facial.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Linear segment/ray work executes in measureHumanFaceOralArchDepth.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The field shares retained stations with its other readers rather than compiling another boundary.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The existing field closure owns station-reference lifetime and this signature retains no history.
   */
  lingualDepth: (u: number, v: number) => number;
}
