# src/film/sequenceEventTimeline.ts#sequenceEventTimeline

## @evidence contracts/development/implementation.md#principled-implementation

Maps each event through the entry's affine clock map and assigns ownership with half-open source spans. Both sides of a precise seam partition events at one source instant, including when the rates differ.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads layout and the admitted shot index from preparePlaybackTimeline, the preparation sequenceTimeline also uses, so events and frames share one clock; the only additional index is the per-shot entry list the seam rule needs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No event kind, shot or entry is special-cased; the shot-end and seam rules apply to every entry by the same tests, and ties sort by code units rather than locale.

## @evidence contracts/development/common.md#meaningful-documentation

States the range rule and both closing cases with their reasons, the per-play semantics, the order and its tie-breaks, the added fields, and the inherited throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S + E) to lay out and index, O(sum of events per played entry) to place, plus an O(Es) scan of the same shot's entries only for an event exactly on a trim end, and O(V log V) to sort the V emitted events; the sort is needed because entries overlap in transitions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses preparePlaybackTimeline's shot index for every event lookup instead of indexing supplied shots twice; the layout and index refer to the same synchronous inputs. Callers derive events once per film; no cross-call cache exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The timeline, shot index and per-shot entry lists are released on return; the result holds one fresh record per emitted play, which grows with plays times events and lives as long as the caller keeps it.
