# src/posture/prepareHumanFootAnkle.ts#prepareHumanFootAnkle

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed inputs with their frames and units, the equivalence to the pivot's ankle, and that the returned record is the reader's own, valid until its next read.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle of a rigid foot turned about a fixed sole point is that point less the rotated socket offset. The placement's rotation is heading, then roll (none here), then a turn of minus the pitch about the foot's own lateral axis X (`HumanFootRotation`), so the rotated offset is the heading's rotation applied to the offset turned about X: `(x, y cos t - z sin t, y sin t + z cos t)` with `t` minus the pitch. The heading's rotation is read once as the images of the three axes under `HumanFootRotation.prepare`'s own prefix at zero pitch, so the three numbers are that placement's ankle up to the rounding of one rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The heading's three axis images and the socket offset precede one pitch reader of one sine, one cosine and three sums; the placement's rotation, which a rocker search never reads, is not built.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pitch is cached, rounded or clamped; the heading's rotation and the socket offset are their owners' values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation. A read is one sine, one cosine and fifteen products, with no record made: the pitch's quaternion, its product with the prefix, the normalization and the rotated offset record a read built before are four records and a square root it no longer pays. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side, socket, world point and heading fix the axis images and the offset for every pitch of one search; a change in any needs another reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds nine axis components, the socket offset and one ankle record until its search releases it; no pitch or earlier ankle is kept.
