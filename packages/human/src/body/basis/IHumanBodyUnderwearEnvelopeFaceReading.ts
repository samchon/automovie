/**
 * Complete qualified centre-field direction over a planar material face.
 * Positive possible-centre directions bound every active branch. An opposing
 * centre refuses only when its exact restricted Voronoi cell is nonempty.
 */
export interface IHumanBodyUnderwearEnvelopeFaceReading {
  /** Positive lower bound, or minimum opposing active direction, in metres. */
  minimumOrientation: number | null;

  /** Complete spatial candidate population; no centre count is changed. */
  candidates: number;

  /** Opposing or directionless branches with a nonempty exact active cell. */
  activeInvalidBranches: number;

  /** Unrepresentable or undefined direction prevents acceptance. */
  unavailable: string | null;
}
