# src/production/IAutoMovieProductionRenderFrame.ts#IAutoMovieProductionRenderFrame

## @evidence contracts/development/design.md#principled-representation

Every field is derived from the timeline and one integer frame number, never accumulated: `timeSeconds` is the frame times the rational frame rate's denominator over its numerator, and the layers come from the segment that contains the frame, so a seek, a chunk and a full render produce the same record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the output index and the timeline frame as two fields because a proxy tier skips timeline frames: the output index names the encoded frame and the timeline frame names the sampled instant, and folding them into one would make a proxy chunk render the wrong instant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither producer special-cases a tier, a shot or a transition kind outside the timeline's own dissolve and fade rules, and the renumbering in `planProductionRenderJob` overwrites only the three numeric fields, leaving the sampled layers untouched.

## @evidence contracts/development/common.md#meaningful-documentation

States the two producers and the renumbering between them, the consumers, and for each field its numbering base, the timeline it indexes, its unit and that it is derived, and the layer count and order per transition.
