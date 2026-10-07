/** One sheet's canonical source-cell and boundary incidence, before attribute compaction.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTopology {
  /** Canonical a,b,c,d source corners of every original structured cell. */
  cells: [number, number, number, number][];

  /** Original perimeter order after the same source endpoint quotient. */
  perimeter: number[];
}
