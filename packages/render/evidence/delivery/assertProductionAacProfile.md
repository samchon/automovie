# src/delivery/assertProductionAacProfile.ts#assertProductionAacProfile

## @evidence contracts/development/implementation.md#principled-implementation

Compares the AudioSpecificConfig facts (ISO/IEC 14496-3 §1.6.2.1) and the `mp4a` sample entry's own channel count and rate against the profile the encoder writes, and the media timescale against the sample rate, because an AAC track's media clock counts samples. Presentation timing is left to the decoded delivery audit, which measures it from the decoded stream and the edit list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered comparison list and one refusal, the same shape as `assertProductionVideoProfile`, so a caller reads both refusals the same way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every expected value is the profile constant's; no observed value is rounded or defaulted, and a non-AAC entry fails at `codec`.

## @evidence contracts/development/common.md#meaningful-documentation

States each compared fact, its order, what is deliberately not checked and the refusal's message form.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: eight comparisons over an already parsed probe.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check of one probe; nothing is worth sharing between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing and holds no resource.
