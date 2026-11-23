# src/sport/createStartingBlock.ts#createStartingBlock

## @evidence contracts/development/implementation.md#principled-implementation

A rail box of one Polanik block's bar width, and two plate boxes of its footplates' size, each turned about `X` by the drawn angle so its face looks forward and up, its lowest edge on the rail's top.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the block, draw the settings, the rail, then each plate with its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No spikes, ratchets or pedal faces; the rail's height and the plates' thickness are named estimates; the rail runs only as far back as the rear plate, not the bar's full length.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the block lies, where each plate stands and how it is tilted, and its two contacts.
