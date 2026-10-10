/**
 * The height field of one arch's lining over its arch plane.
 *
 * Every reading takes an arch-frame point `(u, v)` in metres. The gingiva,
 * the palate or floor, the lining's outer rim and the vestibular wall all
 * read this one field, so they cannot disagree about where the lining lies.
 *
 * @author Samchon
 */
export interface IHumanFaceOralLiningField {
  /**
   * In-plane distance from the point to the nearest cervical ring edge.
   */
  distance: (u: number, v: number) => number;

  /**
   * Apical coordinate of the lining at the point: the cervical height plus the lining's rise.
   */
  apical: (u: number, v: number) => number;

  /**
   * Signed in-plane distance to the station polyline and its unbounded
   * posterior terminal half-rays: positive on the lingual side between the
   * arms and negative on the facial side. There is no finite posterior
   * closure or query rectangle implicit in this reading.
   */
  lingualDepth: (u: number, v: number) => number;
}
