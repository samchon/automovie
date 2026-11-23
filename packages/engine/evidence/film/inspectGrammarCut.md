# src/film/inspectGrammarCut.ts#inspectGrammarCut

## @evidence contracts/development/implementation.md#principled-implementation

Axis side uses a ground-plane cross-product sign, cut angle uses the arc cosine of a clamped normalized bearing dot product, and screen relations use projected-coordinate differences. Signs within GRAMMAR_EPSILON are neutral; a bearing length product at or below that threshold instead returns 180 degrees, suppressing an ordinary jump-cut threshold. Finite admitted observations do not by themselves guarantee finite derived cross products, norm products or projections.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One entry per cut with one private inspector per finding family, so `readFilmGrammar` orders shots and applies suppression while every cut rule lives here; the displacement and entrant re-establishing checks share one flag because only one re-establishing finding is filed per cut.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot, subject or camera is special-cased and thresholds come from the caller. Screen relations are neutral when either depth is at or below GRAMMAR_EPSILON; other non-finite derived projections are not gated here, so that refusal is not a general projection-validity guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States the filing order, the condition of each finding family including the entrant rule, and the role and units of every parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant local work per cut over the prebuilt subject indexes, plus an `O(n)` entrant search over the incoming shot's `n` subjects; eyeline and screen-motion checks together use at most eight projections, and at most two sizeOf calls delegate memoized subject measurement to the caller. No earlier findings are scanned.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads sizes through the caller's memo, so the incoming start size it shares with the shot-size check and the next cut's outgoing end size are measured once per read; subject lookups use the index `normalizeGrammarShot` built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends at most six findings per call to the caller's list and retains nothing else; projected points and relation records are released on return.
