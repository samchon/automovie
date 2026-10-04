/**
 * One non-upstream input of a generation: a published basis, a Git blob of a
 * historical basis or a receipt, identified by repository path, revision when
 * read from history, and SHA-256 of the exact bytes read.
 */
export interface IHumanSourceGenerationInput {
  role: string;
  path: string;
  revision: string | null;
  bytes: number;
  sha256: string;
}
