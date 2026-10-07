/** Fixed source-semantic anchors used by the head provider's own charts.
 * These are ancestral native correspondences, not a current clinical or bony
 * landmark acquisition. The same anchor remains attached to the source under
 * chart authoring; rig influence does not determine its anatomical role.
 * @author Samchon
 */
export interface IHumanSourceHeadGuide {
  landmarkNativeIds: Record<string, number>;
  qualification: string;
}
