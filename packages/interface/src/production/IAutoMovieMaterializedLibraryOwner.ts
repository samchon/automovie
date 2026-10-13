
/**
 * What one design owner's executed source published on this compile.
 *
 * @evidence contracts/common.md#principled-implementation Records the admitted owner address, normalized executed source digest and sorted ids from its accepted contribution, allowing later observations to resolve exact published semantic artifacts.
 * @evidence contracts/common.md#clear-and-simple-design Separates source provenance from the three semantic id lists, leaving full environment, model and context payloads in their generated artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current writers always emit contexts; omission is accepted only to read older indexes as no context contribution, not as proof that a map owner completed.
 * @evidence contracts/common.md#meaningful-documentation Defines branch and owner address, project-relative module and export, normalized source identity, code-unit ordering and legacy context omission.
 * @author Samchon
 */
export interface IAutoMovieMaterializedLibraryOwner {
  /** Active manifest-derived design branch. */
  branch: string;

  /** Exact design-document and H2 address the artifacts realize. */
  owner: string;

  /** Project-relative source file whose export produced them. */
  source: string;

  /** Named export inside that file. */
  export: string;

  /** Digest of the normalized source bytes that were executed. */
  sourceDigest: string;

  /** Ids of the built environments this owner published, in code-unit order. */
  environments: string[];

  /** Ids of the models this owner published, in code-unit order. */
  models: string[];

  /**
   * Published environment context ids in code-unit order. Current writers always emit this field; older indexes may omit it and mean no contexts.
   */
  contexts?: string[];
}
