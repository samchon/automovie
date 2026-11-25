# src/props/createFood.ts#createFood

## @evidence contracts/development/implementation.md#principled-implementation

A loaf as two boxes of half its drawn length each, its drawn width and height, the `+X` one on the slider; an apple as one ball of the drawn diameter; a drumstick as its meat and its knuckle on one axis, the meat as thick as the drawn diameter. Every grip's frame lies at the centre of the part it closes on, with that part's span across the grip as the aperture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, then the kind's parts, grip and bite.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A loaf's dome and an apple's dimples are not modelled; the stalk, a drumstick's shape and the tear's travel are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how each food lies, where it is held and bitten, and how two hands tear a loaf.
