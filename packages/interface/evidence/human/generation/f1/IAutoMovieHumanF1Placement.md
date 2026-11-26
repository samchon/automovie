# src/human/generation/f1/IAutoMovieHumanF1Placement.ts#IAutoMovieHumanF1Placement.IFrames

## @evidence contracts/development/common.md#meaningful-documentation

Every segment's frame in the figure's frame, by name.

## @evidence contracts/development/design.md#principled-representation

Every segment's frame in the figure's frame, by name. ReadonlyMap<string, IAutoMovieHumanSegmentFrame> retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1Placement.frames. Read by AutoMovieHumanF1Placement.frame, AutoMovieHumanF1Placement.point, AutoMovieHumanF1Placement.points. Also types AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1.frames, AutoMovieHumanF1Placement.REFERENCE, AutoMovieHumanF1Placement.frames, AutoMovieHumanF1Placement.frame for every segment's frame in the figure's frame, by name.

# src/human/generation/f1/IAutoMovieHumanF1Placement.ts#IAutoMovieHumanF1Placement.IPose

## @evidence contracts/development/common.md#meaningful-documentation

A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.

## @evidence contracts/development/design.md#principled-representation

A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation. The callable takes name and returns AutoMovieMatrix3Tuple | undefined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.frames. Also types AutoMovieHumanF1Placement.NEUTRAL.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1.assemble, AutoMovieHumanF1.construction, AutoMovieHumanF1Placement.NEUTRAL, AutoMovieHumanF1Placement.frames for a pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation.

# src/human/generation/f1/IAutoMovieHumanF1Placement.ts#IAutoMovieHumanF1Placement.ILocals

## @evidence contracts/development/common.md#meaningful-documentation

Resolve a registered datum's local coordinates for one person's segment lengths.

## @evidence contracts/development/design.md#principled-representation

The datum name addresses a stored segment point. It returns that point's segment coordinates in millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1Placement reads this callback before transporting each datum to its new pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback describes local placement. The frame owner supplies a fallback when the callback itself is absent.
