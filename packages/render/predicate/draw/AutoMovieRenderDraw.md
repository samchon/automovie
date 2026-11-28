# src/draw/AutoMovieRenderDraw.ts#AutoMovieRenderDraw.samplePlayedTrails

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the world-space origin measurement, assigns each sample to the displayed occurrence and states the placement, cancellation and size limits. It describes when per-sample authored evidence is available and how route and support identity, declared breaks and a measured compatible remount affect segments.

## @evidence contracts/development/implementation.md#principled-implementation

Solve the picture plan for each sample second. Use the actual displayed entry's own placement clock and separate lines across entry, object and ancestor changes or unmeasurable intervals. Use the existing playback classifier for declared shot-local breaks. An author-approved same-entry remount joins only after both observations agree on actual origin and the exact supported anchor. Resolve path selection at the requested current pose. The caller places the requested second again before presentation. Opted-in source records use the settled native node, real played entry and delivery camera. An authored route and selected support identity stay distinct from its sampled world positions.

## @evidence contracts/development/implementation.md#efficient-algorithms

An empty request takes no placements or selection work. A selected request plans at most 1,201 grid times and 64 paths from at most 16 patterns. Overlapping matches share their path and every path reads the same settled scene once per grid time. The sampler checks whether its caller still wants a pending result before using it or starting another seek. It validates each immutable route descriptor once per request. The source and projection run only inside opted-in trail samples without another placement or solve.

# src/draw/AutoMovieRenderDraw.ts#AutoMovieRenderDraw.describeAutoMovieDrawScene

## @evidence contracts/development/common.md#meaningful-documentation

Describes the declared and measured kinds available to Capture. An authored trail source makes its route kind selectable before any trail is sampled.

## @evidence contracts/development/implementation.md#principled-implementation

Retain ordinary kinds for every scene. Admit the authored route kind from the capability registered by the subject. The actual selected sample still owns any route geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read source presence while describing the scene. The availability check neither seeks the subject nor calls the trail provider.
