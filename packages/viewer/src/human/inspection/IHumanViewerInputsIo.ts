/**
 * Host-owned directory names, document bytes and optional version stamps supplied to the numerical input reader. Candidate-sidecar facts are read by their separate asynchronous owner; photographs are outside this port.
 *
 * @evidence contracts/common.md#principled-implementation The host provides complete directory names, actual document bytes and optional version stamps to the generic numerical-input projection.
 * @evidence contracts/common.md#clear-and-simple-design Keeps filesystem access outside parsing/basis-key logic while candidate sidecar facts have their separate asynchronous owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current metadata stamp can miss preserved-time/size edits; absent stamps disable file memo reuse rather than inventing byte equivalence.
 * @evidence contracts/common.md#meaningful-documentation Names are admitted by the reader, byte failures propagate into named refusals and no photograph access belongs to this IO port.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings perform no read; directory enumeration scales with names and changed documents are parsed/hashed by their input owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Memo reuse requires the supplied stamp plus sidecars/bases/generation/source signature; equal names alone do not authorize reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns directory/file access; buffers live through parsing/memo publication and the port retains no native descriptors itself.
 *
 * @author Samchon
 */
export interface IHumanViewerInputsIo {
  /**
   * Names present in the input directory; the reader validates accepted names.
   *
   * @evidence contracts/common.md#principled-implementation Returns the complete current input-directory name inventory used for supported-name selection and removed-file memo pruning.
   * @evidence contracts/common.md#clear-and-simple-design Separates directory observation from per-file numerical parsing and sidecar interpretation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A selected-document read still needs all names for pruning; returning only selected files would retain removed memo entries incorrectly.
   * @evidence contracts/common.md#meaningful-documentation The reader sorts supported JSON names and validates stems; this callback supplies names without asserting document schema.
   * @evidence contracts/performance.md#efficient-algorithms Enumeration and the returned array scale with directory membership; sorting supported names is O(n log n) in the consumer.
   * @evidence contracts/performance.md#reuse-equivalent-work Names are reread on each projection because membership can change independently of source digests or document selection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns directory access and the temporary name array; no watcher or file handle transfers through this method.
   */
  names(): string[];

  /**
   * Bytes of one enumerated document or candidate-basis file.
   *
   * @evidence contracts/common.md#principled-implementation Returns the enumerated file's actual bytes for JSON parsing and document identity projection.
   * @evidence contracts/common.md#clear-and-simple-design Keeps file acquisition at the host boundary while the reader owns supported-name and basis/document rules.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/unreadable bytes become named refusal; the buffer is not assumed admitted JSON and no reference photograph is read.
   * @evidence contracts/common.md#meaningful-documentation name is a directory entry validated by the consumer; errors remain original causes for that file rather than an empty invented document.
   * @evidence contracts/performance.md#efficient-algorithms IO and parsing scale with file bytes, with full buffers retained during parse and later offered parameter projection.
   * @evidence contracts/performance.md#reuse-equivalent-work Changed signatures invoke a fresh read; equal provider stamps permit reuse only under their disclosed metadata limitations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host closes its underlying read capability; the returned buffer belongs to the current projection and no descriptor is retained by this signature.
   */
  read(name: string): Buffer;

  /**
   * The file's version stamp (modification time and size); without it no result is reused.
   *
   * @evidence contracts/common.md#principled-implementation Optionally supplies the provider's per-file version identity for memo selection, currently modification time and size at the filesystem host.
   * @evidence contracts/common.md#clear-and-simple-design Keeps metadata policy outside input parsing and requires explicit provider availability before any result reuse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal metadata can miss byte rewrites preserving size/time; omission disables reuse rather than treating an empty signature as content authority.
   * @evidence contracts/common.md#meaningful-documentation The string participates with sidecar facts and shared basis/generation/source identity; it is not a content hash or atomic snapshot.
   * @evidence contracts/performance.md#efficient-algorithms A metadata observation precedes memo lookup and avoids full parse/hash only under an unchanged complete signature.
   * @evidence contracts/performance.md#reuse-equivalent-work Changed stamps invalidate the memo; same-stamp changes remain an acknowledged provider limit, and admission is always reapplied separately.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string and retains no stream; current filename memo populations are pruned against complete names by the reader.
   */
  stamp?(name: string): string;
}
