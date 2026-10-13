import { type IScaffoldPublicationOptions } from "./IScaffoldPublicationOptions";
import { publishFiles } from "./publishFiles";
import { ScaffoldPublicationError } from "./ScaffoldPublicationError";
import { type IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";


/**
 * Write a `{ relativePath: content }` map under `location` and return the
 * absolute paths written, sorted by UTF-16 code unit.
 *
 * This is the throwing form of {@link publishFiles}: it applies the same
 * validation and writes, and throws {@link ScaffoldPublicationError} when the
 * receipt is not `completed`. Files written before the failure are left in
 * place. Rendering the map is {@link renderScaffold}'s job.
 *
 * @param location Target directory, resolved against the working directory.
 * @param files Map from root-relative path to UTF-8 text.
 * @param options `force` admits a populated directory and in-place
 *   replacement.
 * @returns Absolute paths of every file written, sorted.
 *
 * @evidence contracts/common.md#principled-implementation The comparator uses the string relational operators, which compare UTF-16 code units independent of locale, so the returned order is the same on every host; `localeCompare` would vary with the host's ICU data.
 * @evidence contracts/common.md#clear-and-simple-design The function adds only the throw and the sort to `publishFiles`, so validation and writing have one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Files written before a failure are not deleted, because removal through a pathname could reach a different file; the receipt in the thrown error says what remains.
 * @evidence contracts/common.md#meaningful-documentation The comment states the relation to `publishFiles`, the thrown error, that earlier files stay on failure, the sort order, and the meaning of each parameter.
 * @evidence contracts/performance.md#efficient-algorithms Beyond `publishFiles`, the cost is one map and one comparison sort of the written paths, n log n in file count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This wrapper performs one publication per call; repeating a call repeats its writes as the effects require.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The receipt is released when the function returns unless it travels inside the thrown error; only the path array is returned, and `publishFiles` owns every descriptor.
 * @author Samchon
 */
export const writeFiles: (location: string, files: Record<string, string>, options?: IScaffoldPublicationOptions) => string[] = (
  location: string,
  files: Record<string, string>,
  options?: IScaffoldPublicationOptions,
): string[] => {
  const receipt: IScaffoldPublicationReceipt = publishFiles(
    location,
    files,
    options,
  );
  if (receipt.status !== "completed")
    throw new ScaffoldPublicationError(receipt);
  return receipt.completed
    .map(
      ({ entry }: IScaffoldPublicationReceipt["completed"][number]): string =>
        entry.target,
    )
    .sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    );
};
