# src/geometry/construction/AutoMovieLoftCapSource.ts#AutoMovieLoftCapSource

## @evidence contracts/development/common.md#meaningful-documentation

Gives station units, immutable callback lifetime, copy semantics and unsupported transformed ownership.

## @evidence contracts/development/design.md#principled-representation

Represents Explicit ownership of original cap intervals beyond principal positive rows: companion namespace of 4 members (`ISource`, `retain`, `bounds`, `at`); units and frames named in its text: world, frame. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieLoftCapSource` in packages/engine/src/geometry/construction/AutoMovieLoftCapSource.ts; its surface is the 4 members listed and the text shows 5 other files naming it, mostly packages/engine (5), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieLoftCapSource.ts#AutoMovieLoftCapSource.retain

## @evidence contracts/development/implementation.md#principled-implementation

Existing pole declarations and the direct native scalar source define the original end stations; original axis ownership is passed by the producer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shallow chain copy attaches two independent end records without changing any row or curve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Source absence leaves legacy poles unchanged; lift-bearing boundaries have no authored cap lift owner and are not silently extrapolated.

## @evidence contracts/development/common.md#meaningful-documentation

Input and callback dependencies remain immutable, numeric records are copied, and unsupported ownership throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two O(K+N) snapshots and constant end/frame checks; no phase inverse or source2 is required.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares existing scalar preparations and the actual original axis instead of preparing curves again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned chain owns new end records and shares unchanged rows/source; no registry or cache is retained.

# src/geometry/construction/AutoMovieLoftCapSource.ts#AutoMovieLoftCapSource.bounds

## @evidence contracts/development/implementation.md#principled-implementation

Extends principal bounds only through explicit end ownership whose source, adjacent row and pole value still match.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same validator supplies bounds and actual cap selection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A clipped or deformed present end throws; it is never revived from the old source.domain or silently discarded.

## @evidence contracts/development/common.md#meaningful-documentation

Returns inclusive station mm; no physical2 or pole regularity is implied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(K+N) ownership comparisons, without a numerical geometry query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure cold validation retains no result and does not change geometry by access history.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh pair escapes; no chain is retained globally.

# src/geometry/construction/AutoMovieLoftCapSource.ts#AutoMovieLoftCapSource.at

## @evidence contracts/development/implementation.md#principled-implementation

Selects only a retained end's inclusive physical interval and validates its unchanged generating bindings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ordinary interpolation remains with the existing row readers; this branch owns only missing cap intervals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance widens ownership and nonfinite stations fail explicitly; malformed present bindings propagate.

## @evidence contracts/development/common.md#meaningful-documentation

A null result means no extra cap owner at that station, not unavailable derivatives becoming legacy geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary stations take constant comparisons; selected caps validate O(K+N) data once per cold preparation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The single-shot selector revalidates each encountered cap. Prepared consumers share bindings through the explicit cap reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a borrowed immutable record or null, with no retained query state.
# src/geometry/construction/AutoMovieLoftCapSource.ts#AutoMovieLoftCapSource.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Checks each original pole's retained source, boundary rows, axis and tip using the existing owner checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation publishes both the full domain and fixed end interval lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An invalid surviving cap throws before its prepared geometry is used.

## @evidence contracts/development/common.md#meaningful-documentation

Documents millimetre bounds and immutable ownership scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

Examines at most two caps. Subsequent coordinate lookup compares only interval bounds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All reads in the same operation reuse the end bindings checked at preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A caller-owned closure retains at most two source records.
