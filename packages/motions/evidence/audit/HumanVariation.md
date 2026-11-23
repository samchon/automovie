# src/audit/HumanVariation.ts#HumanVariation.over

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the generated seed names and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The population mean and standard deviation over the readings; distinctness counted on values rounded to a millionth of the range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass to read, one to summarise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every seed is read; none is sampled away.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the seeds, each costing what the caller's reading costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the readings until it returns.
