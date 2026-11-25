# src/handling/HumanSheath.ts#HumanSheath

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the derived frames and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The seat is the mouth's frame turned 180 degrees about its `X`, so the blade's `+Y` runs into the carrier and its shoulder sits on the mouth, as `createHolster` seats a sheathed blade; the entry is the seat moved out along the mouth's `+Y` by the tip's distance plus the clearance, so a blade there has its tip the clearance above the mouth; the slider's travel runs over that distance and the slide socket sits at its travel, posed again from every pose of the mouth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the inputs, derive the frames, then return the two props, the posing reader and the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clearance is the author's; the tip distance is the blade's own geometry.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the two props' affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call stages one independent pair.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned props own copies of the affordance lists; the inputs are not changed.

# src/handling/HumanSheath.ts#HumanSheath.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the entry state, the appended action and its events.

## @evidence contracts/development/implementation.md#principled-implementation

The carrier pickup grips the handle and is cut at grip closure, so the body does not straighten away from the carrier first; then the draw moves the blade's frame from the seat to the entry on the carrier's line, the hand keeping its grip. Grip and draw are one manoeuvre: a timed draw times its first grip, so the hand never waits on a seated hilt between them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two registered actions; the pickup owns reach and grip refusals and the draw owns the line and reach refusals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The line is the staged seat and entry, not a tuned height.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Appends two intents.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned chain owns the new intent.

# src/handling/HumanSheath.ts#HumanSheath.sheathe

## @evidence contracts/development/common.md#meaningful-documentation

States the entry state, the appended action and its events.

## @evidence contracts/development/implementation.md#principled-implementation

Aperture placement carries the blade's frame to the entry, the carrier's guide carries it straight to the seat at the same attitude with the hand following, and it mounts on the seat as the hand opens.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One registered action; aperture placement owns the frame checks and reach refusals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sockets are the staged ones, derived from the carrier's mouth and the blade's tip.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Appends one intent.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned chain owns the new intent.
