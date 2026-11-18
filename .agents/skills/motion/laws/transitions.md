# Time, transitions and layers

## Pose by time

Evaluate each pose from its plan and time. Read the solver reference pose at a fixed planned instant. Key caches by exact event times so playback, seeking and captures agree.

## Transitions

### Declared cuts

Declare each cut's target action, legal window, target entry and transition kind. Reject undeclared cuts when building the plan.

Inertialize action changes. Redirect target changes within a movement family. Join cyclic movements at the matching foot event.

Declare the state each cut preserves. Plan the target action from that entry state.

If the vocabulary runs transitions, the law declares its cuts and delegates blending.

### Changing action

At a cut into a different action, inertialize: carry the difference in pose and velocity at the cut and let it decay (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War").

Derive each channel's pose offset x0 and velocity offset v0 at the cut. Decay both with Bollo's quintic. If their signs differ, limit the decay time to t1 ≤ −5·x0/v0.

After applying offsets, solve planted feet and gripping hands back onto their goals so only free joints retain the decay.

Blend unwrapped angles on the shortest arc ((b − a + 180) mod 360 − 180), or use quaternions.

### Changing target within an action

When a reach or strike target moves, add a second minimum-jerk unit from its old target to its new target to the running unit (Flash and Hogan 1985; Flash and Henis 1991). Solve the summed goal.

## Layers

Add gaze, breathing and expression as pose layers. Preserve the action's timing, transitions and contact goals. Use free joints or small trunk offsets that [contact fits](authoring.md#fit-order) absorb.

Blend from the layer's current state when it starts, ends or changes target. Take timing and amplitude from its study and vary them by [skill and seed](variation.md).
