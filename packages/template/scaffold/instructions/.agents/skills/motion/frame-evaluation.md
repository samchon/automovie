# Frame evaluation

Use the installed engine and renderer to map film time to frame schedules, trims, transitions and shot-local time.

## Output time and performance

Keep output frame, output time, shot-local time and simulation time distinct, and give each shot in a transition its own local time and state.

Schedule participants, camera and sound from the same resolved events. A contact or interruption can fall between output frames. Keep the event's time and sample on either side when verifying the join.

Verify the first and last frames and both sides of cuts and trims against the plan.

## Sampling and retained state

Sample the film's resolved schedule at output time under [pose by time](laws/transitions.md#pose-by-time). Share the resolved state and schedule across picture and control channels. Follow [deterministic evaluation](../contracts/development/behaviors.md#deterministic-evaluation) for production behavior.

Before enabling seeks, retries or split renders, identify any state carried between frames. Recreate it from a defined initial state or read the result through supported playback.

## Verification

At matched times, compare pose, transforms, contacts and stills after sequential capture, restart and promised seeks or splits. Cover settling and cuts. Use [tests](../development/testing.md) and [still comparison](../visual-debugging/comparison.md). Report unsupported paths.
