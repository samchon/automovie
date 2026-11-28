# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names both populations and explains why the scope changes script and screenplay selection while treatments stay flat.

## @evidence contracts/development/design.md#principled-representation

The mode discriminant reserves the part name for the pilot branch. The public factory validates route compatibility and the selector validates the exact 001 folder spelling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This type belongs to authored narrative selection. The same part identity selects script and screenplay files without creating a second treatment partition.

# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope.ICompleteWork

## @evidence contracts/development/common.md#meaningful-documentation

The interface and mode comments specify all authored scenes or episodes and the omission default.

## @evidence contracts/development/design.md#principled-representation

The complete-work tag carries no part because file selectors cover the whole route. The factory treats an omitted scope as this value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both narrative routes reuse the complete-work member because neither needs a part argument to select its full body.

# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope.IFirstPartPilot

## @evidence contracts/development/common.md#meaningful-documentation

The interface names the script and screenplay population and states the exact first-part folder format.

## @evidence contracts/development/design.md#principled-representation

The type requires the 001 prefix. The boundary checks the complete lower-kebab-case spelling before the selectors interpolate the folder. Only a long route admits the pilot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The part names the exact folder already authored in the production. The same value scopes scripts and screenplay and leaves treatment events under their existing flat layout.

# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope.ICompleteWork.mode

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the complete-work literal and explains that the factory uses it when no scope is supplied.

# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope.IFirstPartPilot.mode

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the literal that makes the selected part exact.

# src/narrative/AutoMovieEvidenceNarrativeScope.ts#AutoMovieEvidenceNarrativeScope.IFirstPartPilot.part

## @evidence contracts/development/common.md#meaningful-documentation

The comment supplies the first-part folder format checked by scope admission before the selectors use the path.
