# src/weapons/createSword.ts#createSword

## @evidence contracts/development/implementation.md#principled-implementation

The blade tapers in width and thickness to `TAPER` of its base at the point, so each segment's mass share is its length times its width times its thickness and the blade's own centre follows; the hilt's share is then the lever balance that puts the whole at the cited point of balance, (blade centre minus balance) over (blade centre minus hilt centre), split among guard, grip and pommel by `HILT`. A curved blade's points lie on a parabola whose chord is the blade length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the model, draw the other dimensions, lay the blade's segments, lay the hilt, weigh the hilt against the blade, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fuller, ricasso or bevel; a rapier's swept hilt is a plate, a sabre has no knuckle bow. The split of the hilt's mass, the taper, the guards' sizes and the curves are estimates named on their constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine parts: six blade segments, a guard, a grip and a pommel.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the weapon stands, where its edge and flats face, how a curved blade is measured, what the blade's parts are and where the mass properties come from.
