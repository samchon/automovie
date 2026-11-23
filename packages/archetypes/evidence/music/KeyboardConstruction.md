# src/music/KeyboardConstruction.ts#KeyboardConstruction

## @evidence contracts/development/common.md#meaningful-documentation

States what the namespace builds, its frame and which end the bass is.

## @evidence contracts/development/design.md#principled-representation

Code CAD over the builder's primitives; the keys follow the keyboard's pitch pattern, so a key's colour and place come from its number, not from a table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The piano's construction, the keyboard's count and the estimates it reads; read only by `createInstrument`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Black keys are centred on the line between their white neighbours, the coarse form of the real off-centre layout; that and every size no source gives are stated here.

# src/music/KeyboardConstruction.ts#KeyboardConstruction.black

## @evidence contracts/development/common.md#meaningful-documentation

States the numbering and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The bottom key is A0, nine semitones above C; a key's pitch class is its offset from that C, and the five sharps are the black keys.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One modulus, one lookup.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/music/KeyboardConstruction.ts#KeyboardConstruction.uprightPiano

## @evidence contracts/development/common.md#meaningful-documentation

States how the keys are laid and where each is pressed.

## @evidence contracts/development/implementation.md#principled-implementation

Every key's place follows from its number: the count of white keys below it sets its `X`, and its colour sets its length and height; the keyboard is the drawn octave times the 52 white keys over seven, centred on the case.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the case and damper pedal, then the key bed, keys, fallboard and keybed contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The keys' thickness and the cheeks' and the fallboard's sizes are construction estimates. The separate damper pedal construction states its contact geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part and one contact per key, ninety-odd parts, in one pass over the keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one instrument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
