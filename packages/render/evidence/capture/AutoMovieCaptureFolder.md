# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder

## @evidence contracts/development/common.md#meaningful-documentation

States where a capture writes with and without a round, which entries the folder owns, every step in order and what an interruption leaves.

## @evidence contracts/development/design.md#principled-representation

Ownership is the list the record names, so the folder needs no naming pattern to tell its files from a reader's and a renamed file is not mistaken for one of its own.

## @evidence contracts/development/design.md#minimal-and-owned-surface `open`, `claim`, `write`, `remove`, `read` and `close`, the steps the capture run, the comparison and the video capture take; drawing, sheets and comparisons are theirs. `round` and `compare` let the run confirm the folder was opened for its plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A foreign entry refuses the folder instead of being kept or deleted, and the compared round is confirmed before anything is deleted.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.open

## @evidence contracts/development/common.md#meaningful-documentation

States the three things it does and every refusal, all of which precede the first deletion.

## @evidence contracts/development/implementation.md#principled-implementation

Steps 1 to 3 of the class's order check the compared round, directory identity and ownership before the first deletion. The actual path from the host detects folder aliases and other spellings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the compared record, create and list the folder, read the previous record, refuse foreign entries, delete owned files.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Files are deleted by the names the previous record lists, never the folder as a whole, so kept rounds survive, and a missing listed file is not an error.

## @evidence contracts/development/implementation.md#efficient-algorithms

One listing of the folder, one read of each record and one deletion per owned file.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A folder is opened once per capture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the compared record and two name sets; no handle stays open.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.prototype.claim

## @evidence contracts/development/common.md#meaningful-documentation

States what is written, what it lists and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Step 4: the record names a file before the file exists, so an interrupted capture leaves no file its record does not own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the names, add them, rewrite the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A name with a separator or a relative step is refused, so no write leaves the folder.

## @evidence contracts/development/implementation.md#efficient-algorithms

One record write per call, linear in the names claimed so far; callers claim in batches.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each batch is claimed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The claimed set grows by the names given and lives as long as the folder.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.prototype.write

## @evidence contracts/development/common.md#meaningful-documentation

States the precondition and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Step 5: only a claimed name is written, so every file in the folder is owned by its record.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the claim, write, note the name.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unclaimed name throws instead of being claimed silently.

## @evidence contracts/development/implementation.md#efficient-algorithms

One write.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each file is written once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The data is handed to storage and not kept.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.prototype.remove

## @evidence contracts/development/common.md#meaningful-documentation

States what may be deleted, why, and the missing-file case.

## @evidence contracts/development/implementation.md#principled-implementation

Only a claimed name is deleted, so a reader's file is never touched, and a deleted name is no longer listed as written.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the claim, delete, unlist.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unclaimed name throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One deletion.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each file is deleted once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Nothing is kept.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.prototype.read

## @evidence contracts/development/common.md#meaningful-documentation

States which folder each form reads.

## @evidence contracts/development/implementation.md#principled-implementation

Reads go through the same storage and path rule as writes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One path, one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reading the compared round without one throws instead of reading this folder.

## @evidence contracts/development/implementation.md#efficient-algorithms

One read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each still is read once by the comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The bytes are the caller's.

# src/capture/AutoMovieCaptureFolder.ts#AutoMovieCaptureFolder.prototype.close

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and what it lists.

## @evidence contracts/development/implementation.md#principled-implementation

Step 6: written last, so every file it names exists.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Complete the record's file list, write it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The list is what was written, not what was claimed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One write, linear in the record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A folder is closed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Nothing stays open after the call.
