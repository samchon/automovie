# Frame evaluation

Use the installed engine and renderer to map film time to frame schedules, trims, transitions and shot-local time.

## Output time and performance

Keep output frame, output time, shot-local time and simulation time distinct, and give each shot in a transition its own local time and state.

Schedule participants, camera and sound from the same resolved events. A contact or interruption can fall between output frames. Keep the event's time and sample on either side when verifying the join.

Verify the first and last frames and both sides of cuts and trims against the plan.

## Sampling and retained state

Resolve the performance once for the shot or sequence. At output time sample its plan under [pose by time](laws/transitions.md#pose-by-time). All commissioned channels use the same resolved state and schedule. Follow [deterministic evaluation](../contracts/development/behaviors.md#deterministic-evaluation) for production behavior.

Before enabling seeks, retries or split renders, identify state retained across frames. Reset it to a defined initial state and update repeatably, or restore a supported cache before evaluating later frames.

## Verification

At matched times, compare pose, transforms, contacts and stills after sequential capture, restart and promised seeks or splits. Cover settling and cuts. Use [tests](../development/testing.md) and [still comparison](../visual-debugging/comparison.md). Report unsupported paths.
