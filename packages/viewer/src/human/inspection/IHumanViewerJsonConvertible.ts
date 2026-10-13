/**
 * A value that may define JSON's `toJSON` conversion.
 *
 * @author Samchon
 */
export interface IHumanViewerJsonConvertible {
  /** JSON's conversion hook, called with the member key. */
  toJSON?: (key: string) => unknown;
}
