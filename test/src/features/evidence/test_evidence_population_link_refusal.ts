import { isAutoMovieEvidencePhysicalFile } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

/** Supply scalar lstat observations without creating files or links; each call owns only a short record and two scalar-reading closures. */
const entry: (props: {
  file?: boolean;
  link?: boolean;
  nlink: number | bigint;
}) => Parameters<typeof isAutoMovieEvidencePhysicalFile>[0] = (props: {
  file?: boolean;
  link?: boolean;
  nlink: number | bigint;
}): Parameters<typeof isAutoMovieEvidencePhysicalFile>[0] => ({
  isFile: (): boolean => props.file ?? true,
  isSymbolicLink: (): boolean => props.link ?? false,
  nlink: props.nlink,
});

/**
 * An enumerated evidence population admits only independently owned files, so the scalar observation of a hardlink alias stays refused.
 *
 * A walk can reach one inode through two names; admitting both would put two graph owners of one set of bytes into the population. This unit supplies the predicate's scalar lstat observations and does not create actual operating-system links or execute the recursive walker.
 *
 * Scenarios:
 *
 * 1. A single-entry regular file is admitted, whether the host reports the
 *    count as a number or as a bigint.
 * 2. A second directory entry for the same inode is refused in both numeric
 *    forms, which is the alias case the graph must never enumerate twice.
 * 3. A symbolic link is refused even when it names exactly one entry.
 * 4. An entry that is not a regular file is refused even when it names exactly
 *    one entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained physical-file predicate and asserts true only for a singly linked regular nonsymlink observation; false expectations catch hardlink aliases, symbolic links, nonregular entries and zero/extra link counts without rejecting the valid population neighbor.
 * @evidence contracts/testing.md#independent-expectations Literal booleans follow the supported regular-file, nonsymlink and exactly-one-link admission contract, independently of the predicate's output. Supplied scalar observations do not prove native lstat accuracy, OS link creation or traversal behavior.
 * @evidence contracts/testing.md#distinguishing-cases Numeric and bigint one-link and two-link observations distinguish admission from aliases; zero, three and three-bigint counts, one-link symbolic and one-link nonregular observations retain every existing negative and boundary case. Filesystem observation failures and recursive population ownership belong to the walker and its host checks.
 * @evidence contracts/testing.md#execution-ownership The discoverable file-named exported function is a portable unit invoking the actual predicate through the workspace package; its loops register no external cases and start no process, filesystem fixture or native host.
 */
export function test_evidence_population_link_refusal(): void {
  for (const nlink of [1, 1n])
    TestValidator.equals(
      "one directory entry is an independently owned population file",
      isAutoMovieEvidencePhysicalFile(entry({ nlink })),
      true,
    );
  for (const nlink of [2, 2n])
    TestValidator.equals(
      "a hardlink alias is refused in the walked population",
      isAutoMovieEvidencePhysicalFile(entry({ nlink })),
      false,
    );
  for (const nlink of [0, 3, 3n])
    TestValidator.equals(
      "only exactly one directory entry is admitted",
      isAutoMovieEvidencePhysicalFile(entry({ nlink })),
      false,
    );
  TestValidator.equals(
    "a symbolic link is refused with one entry",
    isAutoMovieEvidencePhysicalFile(entry({ link: true, nlink: 1n })),
    false,
  );
  TestValidator.equals(
    "a non-regular entry is refused with one entry",
    isAutoMovieEvidencePhysicalFile(entry({ file: false, nlink: 1n })),
    false,
  );
}
