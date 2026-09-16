<!--
@evidence discovery/core/common.md#canonical-realization Authored measurements must have one owner and an observable realization.
@evidenceReview discovery/core/common.md#canonical-realization #5a6e541 The measurement-truth contract assigns dimensions, ids, counts, locations, and bindings to authored or compiled geometry and preserves its own uncertainty boundary; the falsifier would be a measurement with no source owner.
@evidence discovery/core/settings.md#directive-promise-subject-requirements The supplied references are conceptual and do not authorize dimensional inference.
@evidenceReview discovery/core/settings.md#directive-promise-subject-requirements #1c99050 The measurement-truth contract answers the brief's explicit refusal to infer dimensions from reference pixels and keeps unsupported measurements unverified; the falsifier would be a reference number used as a production dimension.
@evidence discovery/design/spaces.md#work-specific-space-requirements Compiled topology is the authority for room and opening measurements.
@evidenceReview discovery/design/spaces.md#work-specific-space-requirements #a751db6 The measurement-truth contract makes compiled space and opening geometry the authority for spatial identities and measurements; the falsifier would be a room or opening dimension recovered from an image rather than the source result.
-->
# Measurement and reference boundary

This target records the production-specific boundary between visual reference, authored dimensions, and compiled measurements.

## Dimensions come from authored and compiled geometry {#dimensions-come-from-authored-and-compiled-geometry}

The five supplied images inform form, atmosphere, material, and spatial relationship only. They are not dimension drawings and their visible numbers are not facts. The source records coherent buildable dimensions in metres; counts, ids, locations, bindings, and final dimensions are read from its compiled output. Unsupported measurements remain `unverified` and are never replaced by a similar command.

Authority: the user's 2026-09-16 brief and the production settings owner.

Review question: can each reported dimension, identity, location, and count be traced to the authored or compiled result rather than to a reference pixel estimate?

Sources: user brief, 2026-09-16; [NIST metrology and measurement traceability](https://www.nist.gov/metrology)
