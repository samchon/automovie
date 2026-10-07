/** Borrowed text reader used with the revision resolver to hash loaded source.
 * @author Samchon
 */
export interface IHumanViewerRevisionReadIo {
  /** Return current source text, or undefined when this file cannot be read. */
  read(file: string): string | undefined;
}
