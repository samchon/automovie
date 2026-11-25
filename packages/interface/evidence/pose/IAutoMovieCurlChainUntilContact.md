# src/pose/IAutoMovieCurlChainUntilContact.ts#IAutoMovieCurlChainUntilContact.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Documents closing order, collider frames, step defaults and empty-input behavior.

## @evidence contracts/development/design.md#principled-representation

Clinical increments use degrees and geometry metres; the solver checks positive step/radii and collider dimensions, while callers supply nonempty individual chains and coherent topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

curlChainUntilContact borrows pose/skeleton data and replaces only tested flexion entries in a new shallow pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional axes, rest frames and topology reuse established FK contracts rather than carrying an implementation-specific rig.

# src/pose/IAutoMovieCurlChainUntilContact.ts#IAutoMovieCurlChainUntilContact.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Defines proximal-to-distal chain ordering, rest-local tip and capsule radius.

## @evidence contracts/development/design.md#principled-representation

Each chain must be nonempty with resolvable parent-linked bones, a metre tip offset and positive radius; the solver checks radius but assumes ordering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The curl solver searches each listed flexion and tests all downstream capsules against the object's colliders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same ordered chain contract handles any digit length without fixed finger-joint fields.

# src/pose/IAutoMovieCurlChainUntilContact.ts#IAutoMovieCurlChainUntilContact.ICollider

## @evidence contracts/development/common.md#meaningful-documentation

Separates the owner's world frame from the shape's relative transform.

## @evidence contracts/development/design.md#principled-representation

World translation is metres and rotation a unit quaternion; shape dimensions are admitted by curlChainUntilContact and frames remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalShapeSegmentDistance reads this frame/shape pair while the curl solver searches first contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shape reuses IAutoMoviePhysicalProfile instead of copying a physics library's collider object.

# src/pose/IAutoMovieCurlChainUntilContact.ts#IAutoMovieCurlChainUntilContact.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains shallow pose replacement and input-order chain reports.

## @evidence contracts/development/design.md#principled-representation

Returned pose/joints arrays are new but unchanged members can be shared; report bones retain their input arrays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

curlChainUntilContact returns this result for downstream pose composition and contact-gap inspection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A report records measured gap rather than implying every chain necessarily touched the object.

# src/pose/IAutoMovieCurlChainUntilContact.ts#IAutoMovieCurlChainUntilContact.IChainResult

## @evidence contracts/development/common.md#meaningful-documentation

States flexion degrees, borrowed bone identity and positive, negative or infinite gap meanings.

## @evidence contracts/development/design.md#principled-representation

Flexion entries match the input bone order; gap is the least capsule clearance in metres and may remain negative for pre-existing penetration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The curl solver constructs one such report per chain after the sequential flexion search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Infinity records no collider distance and is not substituted with an invented zero-contact value.
