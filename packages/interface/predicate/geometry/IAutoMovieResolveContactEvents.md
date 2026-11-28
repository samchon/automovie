# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.Departure

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the union as the body's physical statement about the initially touching pair. The two variants give the conditions for a witness or a whole-search certificate.

## @evidence contracts/development/design.md#principled-representation

The Engine's firstContactImpact scans one pair under the current stops. It branches on the existing kind, admits a positive gap witness within the search and accepts a no-entry certificate for that pair. The public field projection preserves the existing dictionary assignment and both discriminants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callback result carries only the chosen claim and the time for a witness. The input already supplies the pair, active search interval and actual gap reader.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IClearance

## @evidence contracts/development/common.md#meaningful-documentation

The variant documents the certified time and the resolver's positive-gap check. Its time uses the same second scale as the initiating search.

## @evidence contracts/development/design.md#principled-representation

The `clearance` branch requires a second after the supplied `from` and at or before `to`. `firstContactImpact` samples the real pair at that second and stores the accepted release for that body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The branch adds one witness second. Contact shape, active stops and gap evaluation remain on the supplied initial contact and its `at` callback.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.INoEntry

## @evidence contracts/development/common.md#meaningful-documentation

The variant identifies the case where the body certifies the absence of a new entry for this pair through the search.

## @evidence contracts/development/design.md#principled-representation

The `no-entry` branch stores a pair-local suppression in the active scan. A body supplies this certificate only for an already present touch or overlap. The Engine's continuing scan still evaluates other bodies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kind carries the full claim for this branch. The current scan already identifies the pair, scope and stop state, so the certificate has no other fields.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IClearance.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the exact branch that makes the scan check a proposed release second and its actual gap.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IClearance.seconds

## @evidence contracts/development/common.md#meaningful-documentation

Gives the certified second in the search clock. The resolver compares it with the active endpoints before evaluating that same time.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.INoEntry.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the per-pair suppression branch for the active search. The scanner stores the suppression on the body that supplied the certificate.
