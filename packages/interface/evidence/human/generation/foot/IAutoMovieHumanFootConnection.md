# src/human/generation/foot/IAutoMovieHumanFootConnection.ts#IAutoMovieHumanFootConnection.IAnkle

## @evidence contracts/development/common.md#meaningful-documentation

The real leg section and its sagittal contact points, not a global support box.

## @evidence contracts/development/design.md#principled-representation `owner`: Same leg family and its complete or explicitly bounded regional capability. `station`: Actual ankle source station. `frame`: Original oriented section frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootConnection.ankle. Read by AutoMovieHumanFootInterim.roof. Also types AutoMovieHumanFootInterim.connection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `owner`, `station`, `frame`, `frameJet`, `points`, `phases`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootConnection.ts#IAutoMovieHumanFootConnection.FrameJet

## @evidence contracts/development/common.md#meaningful-documentation

Actual optional frame capability obtained from the public source-axis contract.

## @evidence contracts/development/design.md#principled-representation

Actual optional frame capability obtained from the public source-axis contract. NonNullable< ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> > retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootConnection.frameJet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootConnection.frameJet for actual optional frame capability obtained from the public source-axis contract.

# src/human/generation/foot/IAutoMovieHumanFootConnection.ts#IAutoMovieHumanFootConnection.IChord

## @evidence contracts/development/common.md#meaningful-documentation

Two actual parent crossings at the child's across place, in world mm.

## @evidence contracts/development/design.md#principled-representation `owner`: Same generating owner; a regional reader keeps full-parent demand explicit. `station`: Parent station and chart-across coordinate, calibration mm. `across`: Across coordinate in the parent's signed chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootConnection.chord. Read by AutoMovieHumanToeVertical.create. Also types AutoMovieHumanFootToeSources.rootChord, AutoMovieHumanFootToeSources.hiddenChord.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `owner`, `station`, `across`, `frame`, `bottom`, `top`, `centre`, `depth`, `lower`, `upper`, `unavailable`; callers supply the complete record.
