/**
 * The files a capture reads and writes, injected by its host so the capture core reaches no file system itself.
 *
 * The methods have the signatures of `readdir`, `mkdir`, `readFile`, `writeFile` and `rm` from `node:fs/promises`, declared here without Node's types, so a Node host passes that module as it is and a test passes a Map-backed object. Paths are the capture's root joined with names by `/`; the capture never names a path outside its root.
 *
 * @evidence contracts/development/design.md#principled-representation The five file operations a capture performs, with Node's own call shapes, so the host's object needs no adapter and the core's order of file steps runs unchanged against memory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the operations the capture folder calls: list a folder, create one, read a file, write one, delete one. Node owns the signatures; this interface restates only the parameters the capture passes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a host, and a missing folder or file is the host's rejection, which the capture reports with the path.
 * @evidence contracts/development/common.md#meaningful-documentation States who supplies it, whose signatures it repeats, how paths are formed and the bound on them.
 */
export interface IAutoMovieCaptureStorage {
  /**
   * The names of the entries of a folder, files and folders alike. Rejects when the folder does not exist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is listed and the missing-folder rejection.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; Node's `node:fs/promises` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  readdir(path: string): Promise<string[]>;

  /**
   * Create a folder and any missing parent; an existing folder is kept.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is created and that an existing folder is kept.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; Node's `node:fs/promises` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;

  /**
   * The bytes of a file. Rejects when the file does not exist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned and the missing-file rejection.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; Node's `node:fs/promises` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  readFile(path: string): Promise<Uint8Array>;

  /**
   * Write a file whole, replacing one of the same path; text is written as UTF-8.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the replacement rule and the text encoding.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; Node's `node:fs/promises` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  writeFile(path: string, data: Uint8Array | string): Promise<void>;

  /**
   * Delete a file; with `force`, a path that does not exist is not an error.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is deleted and what `force` changes.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; Node's `node:fs/promises` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  rm(path: string, options: { force: true }): Promise<void>;
}
