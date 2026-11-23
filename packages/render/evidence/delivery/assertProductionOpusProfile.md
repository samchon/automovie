# src/delivery/assertProductionOpusProfile.ts#assertProductionOpusProfile

## @evidence contracts/development/implementation.md#principled-implementation

Each fact is compared exactly, numbers by identity and arrays by their JSON spelling, and the presentation length is computed as the exact BigInt quotient of movie duration times media timescale over movie timescale, so no rounding can admit a fractional-sample edit; clock checks come before every derived check so a zero clock is reported by name rather than as a division artifact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered list of named comparisons is the whole check, so the error names the first failing field and adding a fact is one row; the expected codec and `dOps` values come from the exported `AUTOMOVIE_PRODUCTION_OPUS_PROFILE` constant rather than literals in the rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The expected values are the encoder's contract, the codec string is compared by its family prefix as MP4 codec strings are spelled, and nothing is relaxed for a particular file.

## @evidence contracts/development/common.md#meaningful-documentation

The doc lists every compared group, the derived clock conditions, the order that decides which field is reported, and the error format.

## @evidence contracts/development/implementation.md#efficient-algorithms

The check is constant-time over a fixed set of fields plus a single edit-list length; all comparisons are built before the first mismatch is found, which costs a few dozen operations per delivered track.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call judges one probe once; the probe and delivery validators call it for different files, so no result is equivalent across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function holds only its comparison list until it returns or throws, and opens no file, buffer or task.
