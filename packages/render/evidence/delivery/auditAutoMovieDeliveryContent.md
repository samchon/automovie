# src/delivery/auditAutoMovieDeliveryContent.ts#auditAutoMovieDeliveryContent

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the decoded and reference evidence consumed, the four outcomes, which of them block, the loudness and true-peak checks against commissioned targets, and the delivery decision returned.

## @evidence contracts/development/implementation.md#principled-implementation

Compares signed native timestamps by exact integer cross products. Requires a contiguous video grid at the commissioned duration and permits only floor or ceiling sample quantization for decoded audio; a reference must pass the same coverage test before it can explain an interval. Pieces other than intentional ones shorter than the detector's own minimum duration are below its resolution and are not reported, so a boundary shifted by encoding does not become a finding. Loudness is compared as the absolute distance from the target against the tolerance and true peak against the maximum, both on the decoded delivery because lossy encoding can raise true peak; a stream without a measurement has no loudness to accept and blocks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates the commissioned policy and loudness targets, then per medium indexes the reference windows, audits stream coverage, splits each measured interval at allowance and reference boundaries, and checks the audio stream's measured loudness in one helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses typed stream and finding discriminants and guards safe integer inputs before BigInt conversion. A report retains incomplete or invalid decoder evidence as findings, and missing reference evidence never passes an interval silently.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorts authored and reference windows once per detector and merges overlaps. Each observation is cut only at the window edges inside it. The audit reads no pixels or samples; the loudness check is constant time on the host's measurement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each artifact is audited independently. Inside a call the sorted and merged windows are shared across its observations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The pure audit acquires no handles and retains no state between calls. The report retains its supplied evidence and findings.
