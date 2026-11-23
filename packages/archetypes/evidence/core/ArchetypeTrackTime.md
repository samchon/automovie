# src/core/ArchetypeTrackTime.ts#ArchetypeTrackTime.end

## @evidence contracts/development/common.md#meaningful-documentation

States units, negative-start support and end/duration admission.

## @evidence contracts/development/implementation.md#principled-implementation

The public end is start+duration under binary64 and must remain finite and strictly later so a represented interval exists.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit duration, compute end, admit interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nudging, cap or replacement hides an unsupported clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One prepared interval serves each reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained input or resource.

# src/core/ArchetypeTrackTime.ts#ArchetypeTrackTime.elapsed

## @evidence contracts/development/common.md#meaningful-documentation

States admitted interval premises, sample domain and held offsets.

## @evidence contracts/development/implementation.md#principled-implementation

Boundary comparisons precede subtraction, so distant finite samples cannot overflow an offset before selecting the held endpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit sample, hold boundaries, subtract inside.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite samples refuse instead of becoming held ends.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared interval without rebuilding it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained input or allocation on admitted reads.

# src/core/ArchetypeTrackTime.ts#ArchetypeTrackTime.roundingError

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted-sum premise and residual meaning.

## @evidence contracts/development/implementation.md#principled-implementation

Absolute-magnitude ordering satisfies FastTwoSum. b-(end-a) recovers the low part while avoiding general TwoSum's potentially overflowing end-start on opposite-sign clocks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Order addends and recover the residual.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No epsilon, shifted clock or residual clamp changes the sum.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Prepared once for subsequent remaining-time reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/ArchetypeTrackTime.ts#ArchetypeTrackTime.instant

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint direction, residual and event representability.

## @evidence contracts/development/implementation.md#principled-implementation

End-relative events use end+(error-offset), preserving the end residual before final clock addition. A strict interior offset must remain strict on the represented clock; exact endpoint events use the prepared endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the anchored instant, then admit offset and interior placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No event nudge or time epsilon hides unavailable clock resolution.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared end and residual.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained input or resource.
