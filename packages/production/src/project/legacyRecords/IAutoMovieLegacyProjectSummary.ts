/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */


/**
 * What a resident project holds, which slate slices exist as files and which
 * binary assets the manifest tracks (#614: the project folder is the memory).
 *
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
