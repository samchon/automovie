

/**
 * Resident legacy-project inventory derived from sequential slate, prop, actor and manifest reads. Flags describe admitted non-null content, ids/counts describe returned records, and registered asset paths prove no binary existence or media acceptance.
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
   * Whether the admitted optional script value is non-null; absent bytes and parsed JSON null both produce false.
   */
  script: boolean;

  /**
   * Whether admitted keyed scenes or the historical scene.json fallback contribute any scene.
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
   * Number of admitted stored review notes, with no open/closed status filtering.
   */
  notes: number;

  /**
   * Whether the admitted optional film value is non-null; file existence alone does not determine this flag.
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
   * Advisory top-level renders/ paths outside the film/shot filename-stem families and registered asset descendants. No film yields an empty list; this filename policy performs no byte verification or deletion.
   */
  staleRenders: string[];

  /**
   * Registered project-relative asset paths in manifest order; registration alone establishes no resident bytes.
   */
  assets: string[];
}
