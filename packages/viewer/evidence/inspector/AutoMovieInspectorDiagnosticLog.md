# src/inspector/AutoMovieInspectorDiagnosticLog.ts#AutoMovieInspectorDiagnosticLog

## @evidence contracts/development/common.md#meaningful-documentation

States the two span bases, what a playback span does and does not claim, the live reporting and closure rules, and the replay history's limit.

## @evidence contracts/development/design.md#principled-representation

Pending spans have a basis and first, last and worst evidence. A bounded history separately remembers visited observations, including visits without a measured interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mount supplies current packets and the playhead's playing flag and jump count, and receives new observations and meaningful closures through the existing mount report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A visual visit never invents a frame index, and a playback span never claims the unpainted film between its samples.

# src/inspector/AutoMovieInspectorDiagnosticLog.ts#AutoMovieInspectorDiagnosticLog.prototype.observe

## @evidence contracts/development/common.md#meaningful-documentation

States which findings are read and which playhead state accompanies them.

## @evidence contracts/development/implementation.md#principled-implementation

Groups matching checked findings at adjacent output indices, or across painted samples the playhead joined without a jump. Replay history retains exact frame runs or exact off-grid seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Decide the link to the previous sample once, advance active observations of that basis, retire closed spans and track recent sample identities independently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A gap, a seek or a reverse visit closes a known span. Replaying a recorded range never publishes a new span without newly visited evidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses keyed active findings and a scan capped by HISTORY_LIMIT per confirmed error. No geometry work or scene seeks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A repeated posed sample keeps its prior reporting; the caller still paints the same witness.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only open evidence and a bounded replay history, released by dispose.

# src/inspector/AutoMovieInspectorDiagnosticLog.ts#AutoMovieInspectorDiagnosticLog.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is reported at the end and what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Closes every open span through the same completion rule a live closure uses, so ending the mount reports what a closing sample would have.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the open spans, then the three state resets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An open measured span is reported, not dropped, and a single-sample or replayed span stays unreported as in a live closure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the open spans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mount ends once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Clears the open spans, the replay history and the previous sample.
