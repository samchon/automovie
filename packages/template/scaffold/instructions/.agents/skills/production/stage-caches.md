# Stage caches

Every expensive stage saves its result and resumes from it: figure or scene preparation, schedule resolution, physics bakes, frame capture, encoding, decoding and audits.

## Stage keys

Keep each stage's result as a content-addressed artifact in an ignored folder under `.cache/`, keyed by a digest of every input that affects its output:

- its declared source, data, parameters and seeds;
- the digests of the artifacts it consumes;
- its own implementation version and the installed package versions;
- the toolchain and renderer environment, such as browser build, graphics backend, fonts and encoder.

Nothing outside the key may reach the stage, because a key that misses an input returns a result made for other source or another machine, and the hit still looks successful, as [Bazel's hermeticity guide](https://bazel.build/basics/hermeticity) describes.

Record each stage's input and output digests. A rerun reuses a stage whose key is unchanged once its stored artifact matches the recorded output digest, and recomputes only the stages whose key changed; a recomputed output with an unchanged digest stops recomputation of the stages after it.

A captured frame is reusable only as a pure function of the resolved state and frame index under [frame evaluation](../motion/frame-evaluation.md#sampling-and-retained-state), and a physics bake resumes only as the motion skill's physical feedback allows.

Use the caches the installed packages provide rather than writing one in the production.

## Cache checks and cleanup

A second run with unchanged inputs recomputes nothing. Before the delivery render, recompute a sample of cached results with the cache bypassed and compare their digests. A mismatch is a missing key input or nondeterminism: repair its cause and delete the affected entries rather than keeping whichever result was written first.

Caches are derived state, unlike the run records and other working files under `.cache/`, so never commit one or cite it as the source of truth. Let the installed packages' caches collect unreferenced entries, and delete any stage's cache when in doubt, since deletion costs only recomputation.

## One whole-film render

Iterate on stills of the affected interval under [segment review](../motion/segment-review.md). Make the whole-film render exactly once per delivery, after every review segment is clean.
