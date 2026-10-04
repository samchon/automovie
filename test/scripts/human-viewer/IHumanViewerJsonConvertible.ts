/**
 * A value that may define JSON's `toJSON` conversion.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the optional conversion JSON honours.
 * @author Samchon
 */
export interface IHumanViewerJsonConvertible {
  /** JSON's conversion hook, called with the member key. */
  toJSON?: (key: string) => unknown;
}
