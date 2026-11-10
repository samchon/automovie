# Frame evaluation

The installed engine and render planners own frame schedules, trims, transitions and shot-local time; use them rather than reproducing their arithmetic in the host. A deterministic schedule does not make a stateful animation independent of its evaluation history.

## Map output time to performance

Keep output frame, output time, shot-local time and simulation time distinct, and give each shot in a transition its own local time and state.

Compose action instances by their phase markers, carrying the exit pose, velocity, support and interaction state into the successor, and synchronize interacting participants and their sound to the same resolved contact event.

Verify the first and last frames, both sides of cuts and trim boundaries against the plan; a duration in seconds does not fix the encoded frame count.

## Separate sampling from retained state

A law evaluates from its plan and the requested time, as [laws](laws.md#plan-once-evaluate-by-time) requires.

Before allowing seeking, retries or split renders, identify state the host still carries in springs, physics, callbacks, random draws or imported runtimes: seeded randomness draws from [identity-keyed streams](variation.md#draws-that-do-not-disturb-each-other), and retained state needs a repeatable update from a defined initial state or a supported cache, recovered before capturing a later frame.

Choose simulation steps for solver stability, independent of display refresh, and sample results onto output times. Use supported lifecycle operations, never private-field resets.

## Verify the actual evaluation path

Compare poses, transforms, contacts and pictures at matching times across sequential capture, a fresh restart, and seeking or split capture where promised, including settling and cut boundaries, through [testing](../development/testing.md) and [visual debugging](../3d-modeling/visual-debugging.md). Record unsupported paths instead of claiming them.

[Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) explains separating simulation from display time.
