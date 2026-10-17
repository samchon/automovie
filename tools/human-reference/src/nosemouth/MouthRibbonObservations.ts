/**
 * Ordered sagittal source-skin curves surrounding an oral region in world mm.
 * Each ribbon runs from the upper exterior collar through any oral pocket to
 * the lower collar. Contact fractions identify source sheet intersections;
 * their anatomical correspondence and correction remain unresolved.
 *
 * @evidence contracts/common.md#principled-implementation Source plane-cut order preserves recess sheets that a front envelope would discard.
 * @evidence contracts/common.md#clear-and-simple-design One observation document owns the shared frame, curves, collar and source defects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference identities, source arrays or clinical landmark assumptions are embedded in this type.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, curve order, collision meaning and the uncertainty of event observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface MouthRibbonObservations {
  /** Identifies these observations without certifying a supported product body. */
  gate: string;

  /** All coordinates, distances and collar positions use world millimetres. */
  units: "mm";

  /** The producer's explicit axis convention, unchanged by the fitter. */
  frame: string;

  /** Source measurements use the native reference posture. */
  pose: "native-A";

  /** Complete source-byte hashes remain outside the product geometry. */
  sources: { file: string; sha256: string; pose: string }[];

  /** Physical collar cuts are producer conventions, not anatomical landmarks. */
  scope: {
    xMinimum: number;
    xMaximum: number;
    topY: number;
    bottomY: number;
    boundaryDefinition: string;
  };

  /** Ascending-X curves retain both contact occurrences on separate sheets. */
  ribbons: {
    id: string;
    xMm: number;
    sourcePoints: [number, number, number][];
    sourceCollision: {
      upperFraction: number;
      lowerFraction: number;
      p: [number, number, number];
    } | null;
  }[];

  /** Missing source sections are explicit; fitting never bridges their gaps. */
  missing: number[];

  /** Brackets locate collision changes; pocket length decides whether a pole is justified. */
  events?: {
    side: string;
    bracketX: number[];
    uncertaintyMm: number;
    limitingPocketArcMm: number;
    present?: MouthRibbonObservations["ribbons"][number];
    absent?: MouthRibbonObservations["ribbons"][number];
  }[];
}
