/**
 * Access to the inputs directory for the sidecar reader, and whom to tell when a sidecar's facts become known.
 *
 * @evidence contracts/common.md#principled-implementation Sidecar facts stream-hash bytes and use the selected basis/person/view identity reader, publishing pending, failure or completed facts by path/stamp.
 * @evidence contracts/common.md#clear-and-simple-design Separates filesystem version/stream access from numerical identity scanning and catalogue publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Provider stamps may miss same-mtime/size rewrites and streams are not atomic snapshots. Publication rejects stamps differing from the current tracked stamp; equal or recurring stamps do not establish fresh bytes or distinguish request generations.
 * @evidence contracts/common.md#meaningful-documentation Identifies byte streams, file classification and notification after stored facts; whole-file compressed/inflated buffers may coexist despite streaming IO.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props record performs no scan; its consumer hashes linear bytes and may inflate then structurally scan a complete packet.
 * @evidence contracts/performance.md#reuse-equivalent-work Same path/stamp reuses completed facts or the currently tracked read. Changed stamps start new work; an earlier same-stamp read can publish after A-to-B-to-A recurrence because request identity is not checked.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Completed task entries retire, but known paths and simultaneous read bytes/tasks have no independent cap; stream/buffer lifetime follows actual read/scan settlement.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerSidecarFactsProps {
  /**
   * Provider version stamp for reuse; the current mtime/size stamp can miss byte changes that preserve both metadata values.
   *
   * @evidence contracts/common.md#principled-implementation Returns the filesystem provider's version identity for one sidecar, selecting memoized facts and refusing publication only when the currently tracked stamp differs.
   * @evidence contracts/common.md#clear-and-simple-design Keeps filesystem metadata policy at the IO provider rather than assuming the facts reader can cheaply hash bytes during lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The current mtime/size-style provider can miss preserved-metadata byte edits; equal stamp is an explicit limited reuse premise, not a content digest.
   * @evidence contracts/common.md#meaningful-documentation The string changes under the provider's observed version rules and is checked before selecting facts; no atomic stream snapshot is promised.
   * @evidence contracts/performance.md#efficient-algorithms A metadata read precedes map lookup; full byte hashing is deferred to the asynchronous read when the stamp changes.
   * @evidence contracts/performance.md#reuse-equivalent-work Equal path/stamp shares the kept result; changed stamps start another read. Publication rejects a differing current stamp but cannot distinguish earlier and later reads carrying the same stamp.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The stamp retains no stream or native file handle; memo records retain encountered paths/stamps without an independent count cap.
   */
  stamp: (file: string) => string;

  /**
   * Streams the file's bytes.
   *
   * @evidence contracts/common.md#principled-implementation Provides asynchronous compressed sidecar byte chunks for hashing and later basis/packet/view identity reading.
   * @evidence contracts/common.md#clear-and-simple-design Lets filesystem IO yield chunks while the facts owner owns hashing, concatenation and optional zlib inflation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Asynchronous IO does not remove event-loop hash/structural scanning cost or make arbitrary external rewrites an atomic snapshot.
   * @evidence contracts/common.md#meaningful-documentation The iterable must yield the selected file's actual bytes and propagate read failure; buffers may coexist during concat/inflate.
   * @evidence contracts/performance.md#efficient-algorithms Hashing is linear in compressed bytes and scanning in decoded bytes; the owner retains chunks before concatenating, so streaming is not constant-memory parsing.
   * @evidence contracts/performance.md#reuse-equivalent-work A changed path/stamp uses a fresh stream; unchanged completed facts avoid reopening it under the provider's limited equivalence premise.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The iterable/file provider owns actual stream closure; buffers and read tasks remain until settlement, with no concurrency or byte cap enforced here.
   */
  stream: (file: string) => AsyncIterable<Buffer>;

  /**
   * Called after new facts were stored, so the host can republish its catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Notifies the host after the current path/stamp's facts or named read failure has been stored.
   * @evidence contracts/common.md#clear-and-simple-design Leaves complete catalogue publication to the controller rather than mutating source inventory inside the byte reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Replies with a differing tracked stamp skip publication; same-stamp recurrence has no request-generation guard. Notification failure is reported without manufacturing successful identity facts.
   * @evidence contracts/common.md#meaningful-documentation The callback announces completed state and its existing failure reason, allowing pending catalogue entries to be republished.
   * @evidence contracts/performance.md#efficient-algorithms One notification follows an accepted completion; the host's complete catalogue refresh owns its separate document/path traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Host notifications can coalesce refreshes while unchanged facts remain cached; byte reads are not repeated just to publish.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host callback stays borrowed for the facts service lifetime; settled requests leave task maps while known path facts remain uncapped.
   */
  changed: () => void;

  /**
   * What a file is: a candidate basis (its opening id), a person candidate packet (its id and face/body ids) or a typed generation view (its id and member ids).
   *
   * @evidence contracts/common.md#principled-implementation Chooses the supported identity reader: raw basis opening identity or inflated person/view packet identity scanning.
   * @evidence contracts/common.md#clear-and-simple-design Keeps path classification with the source provider and interpretation with existing owner readers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The closed label is a parsing route, not admitted numerical content; malformed bytes retain a named failure in stored facts.
   * @evidence contracts/common.md#meaningful-documentation Called after bytes are read; basis avoids packet gunzip, while person and view use their corresponding actual packet structures.
   * @evidence contracts/performance.md#efficient-algorithms Classification is provider-defined path work; the selected downstream inflate/hash/scan cost scales with compressed and decoded bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work Classification and facts are reused only for the same path/provider stamp; a stable label alone cannot authorize changed content reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one discriminator and owns no buffer or decoder; the facts operation retains bytes until its selected reader settles.
   */
  kind: (file: string) => "basis" | "person" | "view";
}
