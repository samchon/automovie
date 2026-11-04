/** The viewer server's environment, read once by `HumanDebugEnvironment`; every path is absolute. */
export interface IHumanDebugEnvironment {
  /** The Human package directory, the Vite root. */
  directory: string;

  /** The repository root, which Vite may serve files from. */
  repository: string;

  /** Directory of the typed people (`packages/playground/src/human-parameters`). */
  people: string;

  /** Server port. */
  port: number;

  /** Log of the one compile collector, `ttsc --noEmit --watch` in `test/`. */
  checkLog: string;

  /** Concurrent person generations allowed on the machine. */
  slots: number;

  /** Directory holding one sub-directory per held generation slot. */
  slotRoot: string;

  /** Directory batch renders write their evidence under, `packages/human/.shots/debug`. */
  evidence: string;
}
