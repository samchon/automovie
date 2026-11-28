/**
 * One oriented, closed or open piece of a section, projected to the two
 * in-plane axes.
 */
export interface IAutoMovieMeshSectionChain {
  /**
   * Ordered chart points in millimetres from the station centre. The raw chain
   * walk merges adjacent projected crossings within 1e-9 mm and omits a
   * repeated close.
   */
  points: [number, number][];

  /**
   * True when the chain closes in the segment walk or enclosing bridge pass.
   * Open chains expose unmatched segment ends.
   */
  closed: boolean;
}
