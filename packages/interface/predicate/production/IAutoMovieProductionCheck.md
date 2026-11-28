# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck

## @evidence contracts/development/common.md#meaningful-documentation

A production subject and its authored verification criteria. A subject can address a whole delivery or a local model, motion or shot check.

## @evidence contracts/development/design.md#principled-representation

The check runner loads subject definitions, keeps each criterion's stable ID and reads or refreshes the evidence owning its selected scope. A requested stage remains blocked until each required criterion passes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The definition holds authored expectations and stage requirements. Current conclusions are computed from receipts and files and returned in the report.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.id

## @evidence contracts/development/common.md#meaningful-documentation

Nonblank stable subject key within the production. It selects the subject and keys retained local receipt paths with each check ID.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.checks

## @evidence contracts/development/common.md#meaningful-documentation

Authored criterion list in report order. Check IDs are unique within this subject.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.required

## @evidence contracts/development/common.md#meaningful-documentation

Optional stage-name map of required check IDs. The runner reports a required row even when the criterion is filtered out, disabled or removed.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

A scalar criterion evaluated by project code under explicit input-byte tracking.

## @evidence contracts/development/design.md#principled-representation

The runner hashes the criterion and its file inputs, optionally verifies the source graph loaded with the definition, and records a finite measured quantity for later status reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The criterion owns the callback and inclusive bounds. The runner owns source identity, local receipt retention and stage reporting.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.kind

## @evidence contracts/development/common.md#meaningful-documentation

Routes to local measurement execution for an explicit run, or to the matching retained receipt during a status read.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.source

## @evidence contracts/development/common.md#meaningful-documentation

Optional project-relative defining module used as the root of the loaded source graph. The CLI uses the loaded check entry when omitted.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.inputs

## @evidence contracts/development/common.md#meaningful-documentation

Explicit project-relative files affecting the result. A nested production can name shared files whose resolved destinations remain within its owning checkout.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.unit

## @evidence contracts/development/common.md#meaningful-documentation

Nonblank unit shared by the observed number and all supplied limits.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.minimum

## @evidence contracts/development/common.md#meaningful-documentation

Optional finite inclusive lower bound in the observation unit. When both bounds are present, this cannot exceed the upper bound.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.maximum

## @evidence contracts/development/common.md#meaningful-documentation

Optional finite inclusive upper bound in the observation unit. Supply at least one of the two limits.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.measure

## @evidence contracts/development/common.md#meaningful-documentation

Synchronous or asynchronous callback receiving the production root and returning the finite observed number. Keep the declared inputs unchanged during execution.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture

## @evidence contracts/development/common.md#meaningful-documentation

Criterion for existing drawn diagnostic coverage in a selected capture subject, view, pass and time scope.

## @evidence contracts/development/design.md#principled-representation

The checker pairs settled capture cells and current still bytes with matching diagnostic coverage, occurrence and time. When configured, an explicit run refreshes the named record and binds it to its input signature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The criterion names the capture and diagnostic scope. The capture owner publishes the rendered cells, coverage and episodes.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.kind

## @evidence contracts/development/common.md#meaningful-documentation

Routes to capture record evaluation and, when configured for an explicit run, capture refresh.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.record

## @evidence contracts/development/common.md#meaningful-documentation

Project-relative capture record path. The checker uses its directory to find retained stills and verifies refreshed record bytes.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.subject

## @evidence contracts/development/common.md#meaningful-documentation

Exact subject identity recorded by the capture. A different capture subject cannot satisfy this criterion.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.capture

## @evidence contracts/development/common.md#meaningful-documentation

Optional tokens for refreshing the record through the capture command on an explicit run. Omission reads the existing record.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.inputs

## @evidence contracts/development/common.md#meaningful-documentation

An explicit refresh requires at least one scoped input and binds its bytes and the capture record in a receipt. With inputs omitted, legacy status can use an exact recorded revision from the current checkout root.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.view

## @evidence contracts/development/common.md#meaningful-documentation

Required view identity on every captured cell at the selected time scope.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.pass

## @evidence contracts/development/common.md#meaningful-documentation

Required pass identity on every captured cell at the selected time scope.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.occurrence

## @evidence contracts/development/common.md#meaningful-documentation

Inspection continuity scope used to select coverage ranges and reported finding episodes.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.diagnostic

## @evidence contracts/development/common.md#meaningful-documentation

Exact diagnostic check and checker-owned key to match against coverage, episodes and unmatched audit entries.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture.at

## @evidence contracts/development/common.md#meaningful-documentation

Choose an exact continuous instant or a half-open interval of output frame ordinals. Each requested sample needs a drawn cell, checked coverage and matching still bytes.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureDiagnostic

## @evidence contracts/development/common.md#meaningful-documentation

Two identifiers used together to select one capture diagnostic observation.

## @evidence contracts/development/design.md#principled-representation

Capture checking matches both the diagnostic name and its own subject key within the selected occurrence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pair preserves diagnostic identity while time scope, view and pass remain with the enclosing capture criterion.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureDiagnostic.check

## @evidence contracts/development/common.md#meaningful-documentation

Diagnostic check name emitted by the inspection owner.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureDiagnostic.key

## @evidence contracts/development/common.md#meaningful-documentation

Checker-defined subject identity for that diagnostic within the selected occurrence.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureTime

## @evidence contracts/development/common.md#meaningful-documentation

Discriminated capture time selection for exactly one continuous second value or one frame interval.

## @evidence contracts/development/design.md#principled-representation

Runtime admission selects one mode, and capture verification interprets its values against stored diagnostic and cell times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A time selection stores only one clock representation. Capture and diagnostic identities remain in the criterion.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureSecond

## @evidence contracts/development/common.md#meaningful-documentation

Select one finite instant on the capture subject's continuous seconds clock.

## @evidence contracts/development/design.md#principled-representation

Capture filtering compares the stored seconds exactly and expects one checked witnessed sample at that instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The instant identifies one sample independently of an output frame sequence.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureSecond.type

## @evidence contracts/development/common.md#meaningful-documentation

Choose exact equality on the capture subject's continuous clock.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureSecond.second

## @evidence contracts/development/common.md#meaningful-documentation

Finite nonnegative subject seconds. An off-grid still can address this instant.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureSecond.fromFrame

## @evidence contracts/development/common.md#meaningful-documentation

Leave the output frame start unset for a seconds selection.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureSecond.endFrame

## @evidence contracts/development/common.md#meaningful-documentation

Leave the output frame end unset for a seconds selection.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureFrames

## @evidence contracts/development/common.md#meaningful-documentation

Select every consecutive output frame within a nonempty half-open interval.

## @evidence contracts/development/design.md#principled-representation

Frame mode compares output-frame identities and expects one checked, drawn sample for each requested index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two output-frame ordinals delimit the selection. Captured seconds remain available on the owning observation.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureFrames.type

## @evidence contracts/development/common.md#meaningful-documentation

Choose a range of output-frame ordinals with inclusive start and exclusive end.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureFrames.fromFrame

## @evidence contracts/development/common.md#meaningful-documentation

First required output frame, a nonnegative safe integer.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureFrames.endFrame

## @evidence contracts/development/common.md#meaningful-documentation

Exclusive output frame end, a safe integer strictly greater than the start.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICaptureFrames.second

## @evidence contracts/development/common.md#meaningful-documentation

Leave the continuous seconds field unset for a frame interval.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery

## @evidence contracts/development/common.md#meaningful-documentation

Criterion binding the latest published movie to its render report and optional control receipts.

## @evidence contracts/development/design.md#principled-representation

The checker reads the current movie digest and compares it with the published report. Requested controls also require the same film identity, clock and complete ordered frame metadata.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This input specifies the recipient artifact and required channels. The render owner supplies bytes, audit and control records.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery.kind

## @evidence contracts/development/common.md#meaningful-documentation

Routes to inspection of publication and retained control metadata.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery.subject

## @evidence contracts/development/common.md#meaningful-documentation

Expected render subject in both the latest render report and any required control record.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery.report

## @evidence contracts/development/common.md#meaningful-documentation

Project-relative latest render report. The checker finds the published video beside it using the video's recorded basename.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery.controls

## @evidence contracts/development/common.md#meaningful-documentation

Optional required control passes in the adjacent control record. The checker requires matching subject, movie digest, frame clock and per-pass ordered digest contents.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview

## @evidence contracts/development/common.md#meaningful-documentation

Criterion requiring a recorded observation of specific current delivered bytes over a frame interval.

## @evidence contracts/development/design.md#principled-representation

The checker verifies file identity and digest, the review activity, reviewer and decision, and whether observed frames and continuous span cover the request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The criterion names the required observation. The reviewer owns their stated activity and judgment and the receipt records both.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.kind

## @evidence contracts/development/common.md#meaningful-documentation

Routes to verification of an existing review receipt and its referenced video bytes.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.observation

## @evidence contracts/development/common.md#meaningful-documentation

Project-relative observation file to read for the named review.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.file

## @evidence contracts/development/common.md#meaningful-documentation

Project-relative video path whose current bytes must match the review receipt.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.subject

## @evidence contracts/development/common.md#meaningful-documentation

Expected render subject in the review observation.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.viewed

## @evidence contracts/development/common.md#meaningful-documentation

Required activity, matched exactly to still, playback or listening in the observation.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.frames

## @evidence contracts/development/common.md#meaningful-documentation

Required frame interval using zero-based start and exclusive end. Still review can satisfy one frame.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview.occurrence

## @evidence contracts/development/common.md#meaningful-documentation

Optional cut occurrence that must match the receipt's resolved edit entry ordinal and shot ID.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewFrames

## @evidence contracts/development/common.md#meaningful-documentation

Nonempty half-open interval of output frames for a review criterion.

## @evidence contracts/development/design.md#principled-representation

Admission checks safe frame ordinals, then the review checker requires that its recorded range contains the requested interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Integer endpoints express frame coverage. The observation owns its continuous time request and realized duration.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewFrames.fromFrame

## @evidence contracts/development/common.md#meaningful-documentation

Nonnegative safe-integer first required output frame, inclusive.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewFrames.endFrame

## @evidence contracts/development/common.md#meaningful-documentation

Safe-integer exclusive end greater than the first required frame.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewOccurrence

## @evidence contracts/development/common.md#meaningful-documentation

Exact edit entry and shot pair for a review tied to a source occurrence.

## @evidence contracts/development/design.md#principled-representation

The review verifier requires a resolved cut whose entry ordinal and shot ID both equal the supplied pair.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pair identifies one repeatable cut occurrence without retaining an entire edit plan.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewOccurrence.entry

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based edit entry ordinal the observation must identify.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReviewOccurrence.shot

## @evidence contracts/development/common.md#meaningful-documentation

Exact shot ID that must match the resolved cut occurrence.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.Check

## @evidence contracts/development/common.md#meaningful-documentation

Supported authored criterion union covering scalar measurement and three retained artifact observations.

## @evidence contracts/development/design.md#principled-representation

The kind selects the execution or record owner and determines the fields needed to evaluate the criterion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single union keeps shared identity and verdict vocabulary while each check variant owns its data source.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Current scoped criterion outcome with stage membership and an owning artifact link when available.

## @evidence contracts/development/design.md#principled-representation

The runner attaches target and authored scope to each observed outcome, including synthetic rows for missing required criteria.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The report row contains a factual current outcome. The authored callback and record bytes stay with their owners.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.target

## @evidence contracts/development/common.md#meaningful-documentation

ID of the production subject selected for this criterion.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.id

## @evidence contracts/development/common.md#meaningful-documentation

Criterion ID within the subject. A removed required check retains its requested ID.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.title

## @evidence contracts/development/common.md#meaningful-documentation

Authored expectation shown to the director. A removed required definition uses its ID.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.scope

## @evidence contracts/development/common.md#meaningful-documentation

Authored criterion scope for a part, view, time or case. A removed required definition carries the requested stage.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.state

## @evidence contracts/development/common.md#meaningful-documentation

Current result distinguished as passed, failed, not-run, unobserved, stale, disabled or awaiting-review.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.message

## @evidence contracts/development/common.md#meaningful-documentation

Observed value, decisive failure or next evidence action in the current scope.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.evidence

## @evidence contracts/development/common.md#meaningful-documentation

Optional project-relative receipt, capture, delivery or review record path supporting the reported state.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult.required

## @evidence contracts/development/common.md#meaningful-documentation

Whether the requested stage names this criterion as required.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport

## @evidence contracts/development/common.md#meaningful-documentation

Selection-ordered production check results and the current requested-stage verdict.

## @evidence contracts/development/design.md#principled-representation

The runner preserves the requested subject order, appends missing required rows and marks the report blocked when any required outcome fails to pass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A report publishes selection and observed status. Source criteria and receipts remain separately owned.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport.targets

## @evidence contracts/development/common.md#meaningful-documentation

Selected subject IDs in request order with repeated requests collapsed.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport.requiredStage

## @evidence contracts/development/common.md#meaningful-documentation

Requested stage name or null for an ordinary status or run.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport.items

## @evidence contracts/development/common.md#meaningful-documentation

Report rows in subject and check order, including all required rows even when filtered or missing.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport.blocked

## @evidence contracts/development/common.md#meaningful-documentation

True when any requested-stage criterion has a state other than passed. An ordinary status read has no blocking stage.
