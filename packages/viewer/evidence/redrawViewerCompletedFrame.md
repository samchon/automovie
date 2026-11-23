# src/redrawViewerCompletedFrame.ts#redrawViewerCompletedFrame

## @evidence contracts/development/implementation.md#principled-implementation

Compares the completed revision around the original producer call; explicit completion must report requested seconds. Without explicit completion, only a distinct newly supplied producer record can be published, and its declared clock must match. No previous observation is relabeled as a new draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracts mountViewer's actual redraw-admission boundary while leaving rendering, source admission and completion publication with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fulfilled void remains supported and thrown refusal propagates unchanged; stale or mismatched records cannot become successful requested frames. Record freshness is producer attestation, not independent pixel or physical-admission proof.

## @evidence contracts/development/common.md#meaningful-documentation

States explicit and legacy completion paths, exact clock agreement, absent-clock inheritance and original-producer refusal responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-count revision/record/clock reads and one original producer invocation use O(1) coordination without traversing scenes or reading pixels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the original completed observation but never reuses an old record to stand in for a new effect; distinct requested redraws invoke the producer separately.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows callbacks and frame records only for this synchronous invocation and acquires no task, renderer or resource lease.
