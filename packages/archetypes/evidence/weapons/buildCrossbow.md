# src/weapons/buildCrossbow.ts#buildCrossbow

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, where it lies and where its places come from.

## @evidence contracts/development/implementation.md#principled-implementation

The stock a box of its fore-end's section, split at the nut into the butt-stock and the fore-stock the bow hand closes across, its aperture the stock's read thickness; the bow's halves straight from its centre, braced its read height ahead of the string at rest; the string a slider following the crank by the cranequin's travel over its turns, the halves hinges following the string by `createBow.limbs`, and the string's halves spans from the tips to the nock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The parts, then the crank, the string and the limbs that follow, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stock's taper is not drawn; the cranequin's axle direction and the stirrup's height are unread and placed provisionally, as `createBow.CROSSBOW` states.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine parts; the limbs' table is bisected once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `createBow.limbs` and `AutoMovieArchetypeBuilder.span`, as a bow does.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
