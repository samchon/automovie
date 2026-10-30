# Frame evaluation and assembly

Use the installed engine and render planners for the selected timeline and capture path. They own frame schedules, trims, transitions and shot-local times. Keep the host's actual behavior visible: a deterministic schedule does not make a stateful animation independent of its evaluation history.

## Map output time to performance

Keep output frame identity, output time, shot-local time and simulation time distinct. Resolve them through the admitted plan instead of accumulating elapsed wall time or reproducing trim and overlap arithmetic in the host. Where a transition evaluates two shots, apply each shot's own local time and state. Keep captions and accepted sound on the same assembled timeline; a repeated shot or trimmed entry does not necessarily restart its source performance.

Use the installed schedule's endpoint and rounding rules. Verify the first and last included frames, both sides of cuts, trim boundaries and transition overlaps against the actual plan. A duration in seconds alone does not establish the encoded frame count or preserve the final action.

## Separate sampling from retained state

Prefer evaluation from fixed inputs and the requested time where the installed API supports it. Identify state carried by springs, physics, callbacks, random draws or imported animation runtimes before allowing seeking, retries or split renders. Seeded randomness must retain stable inputs and consumption order, or derive choices from stable identities; a seed cannot repair a different call history.

For retained state, use a repeatable update schedule from a defined initial state, or a supported baked/cache representation. Recover the required history before capturing a later frame; jumping directly to its timestamp or replacing a clip need not reset a player. Use supported lifecycle operations, not private-field mutation or an invented reset/checkpoint API. Choose simulation steps from the solver's stability and accuracy requirements, independently of display refresh, then sample its results onto output times. A bounded timestep or successful solve alone establishes neither random access nor identical results on every platform.

## Verify the actual evaluation path

Compare affected poses, object transforms, contacts and visible output at matching times across the paths the host uses: normal sequential capture, a fresh restart, and seeking, retry or split capture when supported or promised. Include stateful settling and cut/transition boundaries. Check numerical state through [testing](../development/testing.md) where it protects a measurable promise, and inspect the actual rendered sequence through [rendered-use inspection](../3d-modeling/inspection.md). Record unsupported paths and observed platform limits rather than claiming they passed. These checks do not replace watching the complete commissioned video under [delivery review](../review/delivery.md).

[Remotion's frame-driven animation](https://www.remotion.dev/docs/animating-properties), [sequence-local time](https://www.remotion.dev/docs/sequence) and [seeded randomness](https://www.remotion.dev/docs/random) illustrate these host concerns; they require no Remotion dependency. [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) explains separating simulation updates from display time. Read current installed contracts for the actual implementation and its limits.
