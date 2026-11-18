# Stage caches

Cache and resume each expensive stage.

## Stage keys

Keep each stage's result as a content-addressed artifact in an ignored folder under `.cache/`, keyed by a digest of every input that affects its output:

- its declared source, data, parameters and seeds;
- the digests of the artifacts it consumes;
- its own implementation version and the installed package versions;
- the toolchain and renderer environment, such as browser build, graphics backend, fonts and encoder.

Read only inputs covered by the key. See [Bazel's hermeticity guide](https://bazel.build/basics/hermeticity).

Record input and output digests. Reuse a stage only if its own key and artifact digest still match, even after an upstream stage recomputes.

A captured frame is reusable only as a pure function of resolved state and frame index under [frame evaluation](../motion/frame-evaluation.md#sampling-and-retained-state). Resume a simulation under [preparing simulation](../motion/physical-feedback.md#preparing-simulation).

Use the caches the installed packages provide rather than writing one in the production.

## Cache checks and cleanup

An unchanged rerun recomputes nothing. Before delivery, bypass the cache for a sample and compare digests. Fix missing key inputs or nondeterminism and delete affected entries.

Keep caches untracked and reproducible. Leave collection of unreferenced package cache entries to their owners. Rebuild a cache when its validity is uncertain.
