# src/lexicon/HumanPoloHand.ts#HumanPoloHand.IHand

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and unit.

## @evidence contracts/development/design.md#principled-representation

An orthonormal hand frame and the working point's coordinates in it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.IStation

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its unit.

## @evidence contracts/development/design.md#principled-representation

The arm's goal and the working point it places.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by the polo law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

An orthonormal frame of the plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.place

## @evidence contracts/development/common.md#meaningful-documentation

States the configuration and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's line and its way round from the angle; the fingers and the tool's axis as `planar` turns them; the hand's rotation aligns the rest fingers and axis onto them (`HumanHand.align`), and the working point is the wrist plus its hand-frame coordinates on the turned axes, the across axis being `-normal`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two axes, the wrist, then the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.IPlanar

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its unit.

## @evidence contracts/development/design.md#principled-representation

Two coordinates in the plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `planar`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.planar

## @evidence contracts/development/common.md#meaningful-documentation

States the configuration and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The fingers turned by the deviation from the line and the tool's axis square to them behind, the working point's two in-plane coordinates rotated with them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two closed forms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand.deviation

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

The squared distance is the wrist's, the point's and twice the wrist times the point's projection on the turned fingers, a cosine of the deviation plus the point's own angle, inverted on its principal branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A distance no deviation gives returns NaN for the caller to refuse.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanPoloHand.ts#HumanPoloHand

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rest fingers are the direction the hand's rest rotation turns onto a requested one; the axis loses its part along them; the working point is the grip socket from the wrist plus the tool's tip from the grip, projected on the three axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame, three projections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
