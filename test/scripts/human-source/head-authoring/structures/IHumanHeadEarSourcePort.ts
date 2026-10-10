/** One oriented native pinna/root boundary shared with its scalp host.
 * @author Samchon
 */
export interface IHumanHeadEarSourcePort {
  /** Source-owned attachment name, including side. */
  name: string;

  /** One closed cycle in original native polygon winding. */
  orderedNativeBoundary: number[];

  /** Original selected source cells when retained by the guide exporter. */
  nativePolygonOrdinals?: number[];
}
