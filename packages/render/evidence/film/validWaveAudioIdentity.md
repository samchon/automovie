# src/film/validWaveAudioIdentity.ts#validWaveAudioIdentity

## @evidence contracts/development/implementation.md#principled-implementation

Each relation restates a rule of the decoder's supported subset, the WAVEFORMATEXTENSIBLE speaker masks and the KSDATAFORMAT SubFormat GUIDs, so a record the decoder emitted for this rate and channel count passes and any edited field fails; ordered fields compare through `equalOrderedScalars` because channel order is meaningful.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One boolean expression mirrors the decoder record field by field, with the expected stage, speakers and matrix derived first from the channel count and the rate, so the provenance-independent rules stay in `normalizeAudioAssets`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The constants are the Microsoft speaker masks and GUIDs and the mix rate typed from `IAutoMovieProductionSoundPlan`; no file or rate is special-cased, and the predicate returns false rather than repairing a field.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the decoder whose record this mirrors and lists every required relation for format, speakers, header and processing.

## @evidence contracts/development/implementation.md#efficient-algorithms

The check does constant work: a fixed set of field comparisons and two ordered comparisons of at most two entries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `normalizeAudioAssets` calls it once per WAVE asset on that asset's own record, so there is no equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The predicate retains nothing after returning a boolean and opens no handle or task.
