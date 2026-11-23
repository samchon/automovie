# src/delivery/assertProductionVideoProfile.ts#assertProductionVideoProfile

## @evidence contracts/development/implementation.md#principled-implementation

Each fact is compared exactly in the file's own integer units; the frame rate is compared as a reduced rational through `equalProductionFrameRates` on timescale over sample duration, and the sample clock is checked by name before that rate is derived, so a zero clock is reported as its field rather than as an arithmetic failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered list of named comparisons, with conditional rows for brands, explicit pixel aspect, `nclx` fields and edits, is the whole check, so every normalizer, assembler and delivery validator applies the same profile and reports the same field name.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Container, codec, `nclx` and sRGB identities are the single delivery format the normalizer writes, an extra compatible brand is allowed because brands only advertise readers, and no file or caller is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc lists every compared group, the timing and edit-list conditions, and the error format; the order of rows decides which field a multiply-wrong file reports.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar checks are constant work; required-brand membership costs the product of required and observed brand counts. Matrix serialization and any mismatched edit-list serialization depend on their lengths, which caller-supplied records do not cap here. No coded sample bytes are read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call judges one probe of one file, and the several callers check different files or the same file after it changed, so no earlier verdict is equivalent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The comparison list is the only allocation and dies with the call; the function opens no file, process or task.
