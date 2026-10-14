

/**
 * What a resident project holds, which slate slices exist as files and which
 * binary assets the manifest tracks (#614: the project folder is the memory).
 *
 * @evidence contracts/common.md#principled-implementation AutoMovieProject.summary derives slice presence, keys, asset registration and stale render names from the admitted resident store; this type describes that observation rather than committed content.
 * @evidence contracts/common.md#clear-and-simple-design One summary is the legacy importer inventory input, keeping disk observation with the resident-store owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence and stale names are observations, not proof that rendered outputs are valid; no files are deleted by the summary.
 * @evidence contracts/common.md#meaningful-documentation States absolute root, slice populations, registration order and stale-render ownership semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A summary shape scans no directories; the resident summary operation owns slice discovery and stale-render matching.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Summary metadata promises no watch-based freshness or retained successful gate answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inventory caller owns returned key lists/counts and no filesystem descriptor remains in this type.
 * @author Samchon
 */
export interface IAutoMovieLegacyProjectSummary {
  /**
   * Absolute project root directory.
   */
  root: string;

  /**
   * Whether `script.json` exists.
   */
  script: boolean;

  /**
   * Whether `scene.json` exists.
   */
  scene: boolean;

  /**
   * Committed shot ids (`shots/<beat>.json`).
   */
  shots: string[];

  /**
   * Committed beat-end beats (`beatEnds/<beat>.json`).
   */
  beatEnds: string[];

  /**
   * Open review note count.
   */
  notes: number;

  /**
   * Whether `film.json` exists.
   */
  film: boolean;

  /**
   * Stored forged prop nodes (`props/<node>.json`).
   */
  props: string[];

  /**
   * Stored actor context nodes (`actors/<node>.json`, #1176).
   */
  actors: string[];

  /**
   * Render outputs the committed truth no longer owns (#1130): top-level
   * `renders/` entries whose name matches neither the committed film's stem
   * family, nor any committed shot's, nor a registered asset. Re-committing
   * upstream clears the film while its rendered frames and videos linger; the
   * server NEVER deletes user-visible files, so detection is the server's and
   * the corrective action (delete the strays, or register them deliberately) is
   * the agent's. Empty when the directory matches the committed truth, and
   * always empty while no film is committed (a film mid-rework owns nothing
   * yet).
   */
  staleRenders: string[];

  /**
   * Tracked binary asset paths, project-relative, in registration order.
   */
  assets: string[];
}
