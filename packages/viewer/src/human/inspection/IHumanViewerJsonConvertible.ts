/**
 * A value that may define JSON's `toJSON` conversion.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the optional conversion JSON honours.
 *
 * @evidence contracts/common.md#principled-implementation An optional JSON toJSON hook models the language's key-aware serialization boundary without claiming its returned value is already validated.
 * @evidence contracts/common.md#clear-and-simple-design Only the standard conversion hook is projected; recursive serialization policy belongs to its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hook is called on the supplied value rather than replacing global JSON methods.
 *
 * @author Samchon
 */
export interface IHumanViewerJsonConvertible {
  /**
   * JSON's conversion hook, called with the member key.
   *
   * @evidence contracts/common.md#principled-implementation The optional hook receives JSON's member key and produces the value recursively serialized next.
   * @evidence contracts/common.md#clear-and-simple-design Only the language conversion hook is projected, not global serialization policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied object's own hook is invoked without replacing JSON or special-casing a specimen.
   * @evidence contracts/common.md#meaningful-documentation Absence keeps ordinary JSON conversion; the returned unknown still follows caller serialization rules.
   */
  toJSON?: (key: string) => unknown;
}
