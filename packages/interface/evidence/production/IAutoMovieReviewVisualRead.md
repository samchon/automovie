# src/production/IAutoMovieReviewVisualRead.ts#IAutoMovieReviewVisualRead.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Engine-computed visual-read metrics for one compiled shot, filed as advisory `tier: "visual"` review notes after any film-grammar findings passed in. They never fail a gate; they give the review backlog measurable facts about whether the action reads. Member documentation states the supplied records, units and absence meanings used by reviewVisualRead.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input keeps grammar diagnostics advisory and makes sampling/radius policies explicit; root-point and angular-disc approximations do not claim full-body visibility or contact.

## @evidence contracts/development/design.md#principled-representation

scene, shot and motions share compiled world placement and shot-local seconds; sampleRate is hertz, aspect is dimensionless and contact/silhouette radii are metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieReviewVisualRead.IProps, used by reviewVisualRead. Its beat, scene, shot, motions, sampleRate, aspect, contactRadius, silhouetteRadius, grammarDiagnostics members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
