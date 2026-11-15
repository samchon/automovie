# Capture from footage

A capture model estimates a body and its world path from video. It serves a [performance study](../../story/planning/research.md#performance-study) as a way to measure footage of qualified practitioners: timing, ranges and paths, recorded as estimates with their method.

It assumes a static camera or estimates the camera's motion, so state which, because a wrong assumption bends the root path. Performers who cross or hide each other break it, and contacts come out floating or sliding, so a measured contact is read from the frames, not the estimate.

A captured clip used as motion rather than as a measurement passes [clips](clips.md) like any other.

Examples: [WHAM](https://github.com/yohanshin/WHAM), [GVHMR](https://github.com/zju3dv/GVHMR), which is research-only.
