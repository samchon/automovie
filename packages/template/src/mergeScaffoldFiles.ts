/**
 * Join rendered scaffold layers that install into one directory, refusing a path two layers both supply.
 *
 * The result has no prototype, like each rendered layer, so a key such as `__proto__` stays an ordinary file path.
 *
 * @param layers Rendered layers in installation order.
 * @returns One file map holding every layer's files.
 * @throws When two layers supply the same path, naming it.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Own-property lookup on the null-prototype result detects a repeated path exactly, and `Object.defineProperty` stores every key as data.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner composes layers for both a single production and a workspace root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A shared path is refused rather than resolved by layer order, so no layer silently overrides another.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the refusal, the null prototype and the input order.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over every layer's entries with constant-time membership checks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call joins distinct layers once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result references the layers' strings without copying them and is owned by the caller.
 */
export const mergeScaffoldFiles: (
  ...layers: readonly Readonly<Record<string, string>>[]
) => Record<string, string> = (
  ...layers: readonly Readonly<Record<string, string>>[]
): Record<string, string> => {
  const files: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (const layer of layers)
    for (const [relative, content] of Object.entries(layer)) {
      if (Object.prototype.hasOwnProperty.call(files, relative))
        throw new Error(`scaffold layers collide at "${relative}"`);
      Object.defineProperty(files, relative, {
        configurable: true,
        enumerable: true,
        value: content,
        writable: true,
      });
    }
  return files;
};
