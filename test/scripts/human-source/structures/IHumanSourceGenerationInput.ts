/**
 * One non-upstream input of a generation: a basis, receipt, producer module
 * or the resolved producer reference graph. Existing files use their exact
 * byte SHA-256, and graph records hash their portable serialized edges.
 * Absent candidates and directory membership are run-local stability facts,
 * never portable content identity. Repository paths and external
 * package-name/version paths are portable content locators, while physical
 * paths and platform execution facts stay outside the content identity.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationInput {
  /** Input authority or the kind of producer-resolution observation. */
  role: string;

  /** Repository-relative path or dependency/name@version-relative locator. */
  path: string;

  /** Git revision for historical inputs, otherwise null. */
  revision: string | null;

  /** Number of file bytes or serialized graph bytes hashed. */
  bytes: number;

  /** SHA-256 of the exact file bytes or portable graph serialization. */
  sha256: string;
}
