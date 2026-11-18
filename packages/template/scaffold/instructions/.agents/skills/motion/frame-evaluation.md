# Frame evaluation

Use the installed engine and renderer to map film time to frame schedules, trims, transitions and shot-local time.

## Output time and performance

Keep output frame, output time, shot-local time and simulation time distinct, and give each shot in a transition its own local time and state.

Use [operators](compose/composition.md#operators) at named instants to carry pose, velocity, support and held objects into the next action. Sync participants and sound to the resolved contact.

Verify the first and last frames and both sides of cuts and trims against the plan.

## Sampling and retained state

The installed packages evaluate every pose from the resolved plan and the requested time, and a production's own behavior does the same under the [deterministic evaluation](../contracts/development/behaviors.md#deterministic-evaluation) item.

Before enabling seeks, retries or split renders, identify state retained across frames. Reset it to a defined initial state and update repeatably, or restore a supported cache before evaluating later frames.

Choose simulation steps for solver stability, independent of display refresh, and sample results onto output times, as [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) explains. Use supported lifecycle operations, never private-field resets.

## Verification

At matched times, compare pose, transforms, contacts and stills after sequential capture, restart and promised seeks or splits. Cover settling and cuts. Use [tests](../development/testing.md) and [still comparison](../visual-debugging/comparison.md). Report unsupported paths.
