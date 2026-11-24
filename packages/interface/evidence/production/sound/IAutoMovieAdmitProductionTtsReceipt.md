# src/production/sound/IAutoMovieAdmitProductionTtsReceipt.ts#IAutoMovieAdmitProductionTtsReceipt

## @evidence contracts/development/common.md#meaningful-documentation

Names the admission's inputs and result; the members state each refusal and unit.

## @evidence contracts/development/design.md#principled-representation

Groups the admission's input and output records under the operation they belong to.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contracts ingest's `admitProductionTtsReceipt` exposes; render's route and the admission test use them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace declares no member of its own beyond the two records.

# src/production/sound/IAutoMovieAdmitProductionTtsReceipt.ts#IAutoMovieAdmitProductionTtsReceipt.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States every refusal with the field it names, that paths serve only messages, and the output rate's unit.

## @evidence contracts/development/design.md#principled-representation

The line's id and text, both files' bytes and the output rate are all the admission compares or produces; bytes stay raw because admission owns their parsing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the admission; the line carries only the two fields the receipt must match.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The receipt arrives as bytes rather than a typed record, so no caller can skip the field checks by handing a pre-typed object.

# src/production/sound/IAutoMovieAdmitProductionTtsReceipt.ts#IAutoMovieAdmitProductionTtsReceipt.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States that the receipt is admitted and the audio is decoded and converted to the requested rate.

## @evidence contracts/development/design.md#principled-representation

The decoded audio reuses the decoder's record, so its source facts and processing read the same as any decoded asset's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The route reads the receipt's digest and the samples; the viseme and lip-sync work reads the receipt's chunks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Imports both records from their owners instead of restating them.
