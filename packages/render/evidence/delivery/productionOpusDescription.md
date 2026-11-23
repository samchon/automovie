# src/delivery/productionOpusDescription.ts#productionOpusDescription

## @evidence contracts/development/implementation.md#principled-implementation

Each field is checked against its RFC 7845 section 5.1 bit width, and the relations are the ones that section and the Opus-in-ISOBMFF encapsulation state: family channel limits, N greater than zero, M at most N, M plus N at most 255, one mapping entry per output channel with each entry below M plus N or 255, and `OutputChannelCount` equal to the sample entry's channel count; the informational input rate and an output count below the decoded count are legal and admitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function reads the box and returns the interface record, with a local integer reader so every field refusal names its key; comparison with the delivery profile stays in `assertProductionOpusProfile`, so this parser reports what the file says and refuses only what no Opus file may say.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The numeric limits are RFC 7845 field widths and family rules rather than fixture values, no file or encoder is special-cased, and a malformed box throws instead of being repaired or defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names each argument's source, the split from the profile check, what each family reports and why the channel order is null for nonzero families, why the input rate is not compared, and every refusal with its error prefix.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is linear in the child-box count B plus the mapping length C, at most 255: one filter over the boxes and two passes over the mapping, with no allocation beyond the filtered list and the copied mapping.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call parses one track's sample entry for one probe and coordinates no phases or requests whose result could be shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function keeps no reference to the parsed boxes after returning, its result copies the mapping into a new array its caller owns, and it opens no handle or task.
