# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Ratio

## @evidence contracts/development/common.md#meaningful-documentation

States both uses and the integer domain.

## @evidence contracts/development/design.md#principled-representation

A rational pair keeps clocks and rates exact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by timestamps and the commissioned frame rate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No floating-point rate replaces the pair.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.ITimestamp

## @evidence contracts/development/common.md#meaningful-documentation

Names the tick count and its clock.

## @evidence contracts/development/design.md#principled-representation

Integer ticks with their own time base locate an instant exactly in its stream.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, carried by observations, allowances, thresholds and streams.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ticks are never converted to rounded seconds inside the contract.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Media

## @evidence contracts/development/common.md#meaningful-documentation

Names the two media.

## @evidence contracts/development/design.md#principled-representation

A closed literal union keys the per-medium records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only video and audio are audited.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No secondary stream is inspected under these names.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Detector

## @evidence contracts/development/common.md#meaningful-documentation

Names what each detector measures.

## @evidence contracts/development/design.md#principled-representation

A closed literal union names the three detectors the decode runs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by observations, allowances and findings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No detector is implied by another; each reports its own intervals.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IObservation

## @evidence contracts/development/common.md#meaningful-documentation

States the detector, the half-open bounds and the meaning of a null end.

## @evidence contracts/development/design.md#principled-representation

A detector with a first-inside and first-after timestamp is a half-open interval on the stream clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, produced by the host decode and read by the audit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null end is used only up to a verified stream end, never for an unknown one.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IAllowance

## @evidence contracts/development/common.md#meaningful-documentation

States the detector and the inclusive and exclusive film bounds.

## @evidence contracts/development/design.md#principled-representation

A detector with half-open film-clock bounds, matching how observations are reconciled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, carried by the intent and the commissioned expectation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only explicit authored ranges allow a condition; nothing is allowed by default.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IThresholds

## @evidence contracts/development/common.md#meaningful-documentation

Names each detector's settings and their units.

## @evidence contracts/development/design.md#principled-representation

Per-detector minimum durations in ticks with ratio thresholds in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the settings the three detectors need, shared by the delivery and the reference measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The delivery and the reference use the same thresholds, so their intervals compare directly.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Stream

## @evidence contracts/development/common.md#meaningful-documentation

States how continuity is established, each status and the audio-only fields, including the measured loudness and true peak of the presented samples.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by status separates a missing stream, uncovered evidence with its reason, and decoded evidence with its grid, clock and observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by the host decode for each medium and read by the audit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Incomplete evidence never supplies inferred ends, and codec padding beyond the presented end is excluded from the stream and from the loudness measurement.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.ISource

## @evidence contracts/development/common.md#meaningful-documentation

Names the file and the digest format.

## @evidence contracts/development/design.md#principled-representation

A relative file name with the digest of its exact bytes identifies what was decoded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, carried from the host into the result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The digest is of the decoded bytes, not of an earlier candidate.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IIntent

## @evidence contracts/development/common.md#meaningful-documentation

Names the soundtrack obligation, the allowances, the optional thresholds and the optional loudness targets with how the render applies them.

## @evidence contracts/development/design.md#principled-representation

Optional authored obligations: the soundtrack and whether it is required, approved ranges, detector policy and the interface-owned loudness targets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by the production with its subject and read by the delivery host.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent obligation is not inferred from the film.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Names the source, the commissioned expectation with its optional loudness targets, the thresholds, the delivered streams and the optional reference.

## @evidence contracts/development/design.md#principled-representation

The decoded delivery, its commissioned clock and policy, and the encoder's own measured inputs are separate members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what the pure audit reads, supplied by the delivery host.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An interval also present in the reference is classified drawn only with complete reference evidence.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

Names the four outcomes.

## @evidence contracts/development/design.md#principled-representation

A closed literal union separates authored, drawn, encoder-introduced and undecidable intervals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by content findings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Without reference evidence an interval stays unclassified instead of being called drawn or introduced.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.Finding

## @evidence contracts/development/common.md#meaningful-documentation

Names the content, coverage, loudness and true-peak finding kinds and their members, with the measured values the loudness kinds carry.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by kind separates content intervals with their outcome and clock, coverage failures with their reason, and loudness and true-peak misses with their measured and target values; the two measurement kinds always block.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by the audit and returned in its result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each finding states whether it blocks; coverage failures never pass as content.

# src/render/delivery/IAutoMovieDeliveryContentAudit.ts#IAutoMovieDeliveryContentAudit.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Names each retained input, the findings and the decision.

## @evidence contracts/development/design.md#principled-representation

The supplied evidence, the findings and one pass flag together let a reader recheck the decision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the audit to the delivery host and its report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every finding is retained, and the pass flag follows from the blocking ones.
