# src/motion/import/IAutoMovieExternalMotionAdoptionReceipt.ts#IAutoMovieExternalMotionAdoptionReceipt

## @evidence contracts/development/design.md#principled-representation

The receipt pairs the byte identity with a deep copy of the chosen take and its handoff, so later stages work from a snapshot that mutation of the inspection or decision cannot alter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The top-level mode correlates with the handoff arm for receipt inspection; the source identity and selected take occur once. Adoption tests consume these records; a receipt alone performs no native playback or retargeting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer copies the selected take and declared decision fields after its mapped-basis checks; the type does not certify every unmapped rig field or authenticate externally constructed receipts.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state that every member is a copy, that the take keeps source track order, and which consumer each handoff arm feeds.

# src/motion/import/IAutoMovieExternalMotionAdoptionReceipt.ts#IAutoMovieExternalMotionAdoptionReceipt.IProps

## @evidence contracts/development/design.md#principled-representation

Inspection, manifest identity and authored decision are separate premises; the producer validates their relationships and copies a receipt.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation consumes these three records without carrying shot/actor authoring metadata from the distinct production adoption contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies source identity and rig mapping explicitly; no name guessing or implicit take selection occurs.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowing, digest binding, admitted profile, first-refusal behavior and deferred conversion.
