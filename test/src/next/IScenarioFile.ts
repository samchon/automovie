/** One discovered spec file. */
export interface IScenarioFile {
  /** The file's base name with its extension, which the selection matches. */
  name: string;

  /** The file's absolute path. */
  location: string;
}
