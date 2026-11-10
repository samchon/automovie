# Stage caches

An expensive stage saves its result and resumes from it: figure or scene preparation, schedule resolution, physics bakes, frame capture, encoding, decoding and audits. This is mandatory, because a rerun that repeats unchanged work spends the time that inspection and repair need.

## Key each stage by its inputs

Keep each stage's result as a content-addressed artifact in an ignored folder under `.cache/`, keyed by a digest of every input that affects its output:

- its declared source, data, parameters and seeds;
- the digests of the artifacts it consumes;
- its own implementation version and the installed package versions;
- the toolchain and renderer environment, such as browser build, graphics backend, fonts and encoder.

Nothing outside the key may reach the stage: a key that misses an input returns a result made for other source or another machine, and the hit still looks successful. [Bazel's hermeticity guide](https://bazel.build/basics/hermeticity) describes these leaks.

Record each stage's input and output digests. A rerun reuses a stage whose key is unchanged once its stored artifact matches the recorded output digest, and recomputes only stages whose key changed; a recomputed output whose digest is unchanged stops recomputation of the stages after it, the early cutoff of [Build Systems à la Carte](https://www.microsoft.com/en-us/research/wp-content/uploads/2018/03/build-systems.pdf).

A captured frame is reusable only as a pure function of the resolved state and frame index under [frame evaluation](../motion/frame-evaluation.md#separate-sampling-from-retained-state), and a physics bake resumes only from a complete checkpoint under [physical feedback](../motion/physical-feedback.md).

Supply these digests through the caches the installed packages provide, as their READMEs document, rather than writing a cache in the production. A cache they lack is handled under [installed packages](../development/reuse.md#installed-packages).

## Check and clean the caches

A second run with unchanged inputs recomputes nothing. Before the delivery render, recapture a sample of frames with the cache bypassed and compare their digests; a mismatch is a missing key input or nondeterminism, so repair its cause and delete the affected entries instead of keeping whichever result was written first.

Caches are derived state: never commit one or cite it as the source of truth. Let the installed caches collect unreferenced entries, and delete any stage's cache when in doubt, since deletion costs only recomputation; run records and other working files under `.cache/` are not caches.

## Render the whole film once

Iteration runs on stills of the affected interval under [segment review](../motion/segment-review.md), so render time goes to delivery rather than to rechecking. Make the whole-film render exactly once per delivery, after every review segment is clean; the frame cache then recaptures only changed frames.
