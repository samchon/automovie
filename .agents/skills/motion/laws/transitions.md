# Time, transitions and layers

## Pose by time

Prepare the path, events, active constraints and required physical response once. Carry resolved entry state through cuts and layers. Sample poses as a light `f(plan, t)` in any order: evaluate only what the caller reads at that instant, from time curves, carrier-relative transforms and any direct fit needed there. Pass an evaluated pose to its consumers; never cache or memoize samples. Move the time-independent work of a slow sample into preparation.

Use closed-form paths and fits where they satisfy the constraints. Limit coupled search to the interval and degrees of freedom that need it and resolve it during preparation. Retain event states, curves or solver trajectories that preserve the checked result between events.

## Transitions

### Declared cuts

Declare each cut's target action, legal window, target entry and transition kind. Reject undeclared cuts when building the plan.

Inertialize action changes. Redirect target changes within a movement family. Join cyclic movements at the matching foot event.

Declare the state each cut preserves. Plan the target action from that entry state.

If the vocabulary runs transitions, the law declares its cuts and delegates blending.

### Changing action

At a cut into a different action, inertialize: carry the difference in pose and velocity at the cut and let it decay (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War").

Derive each channel's pose offset x0 and velocity offset v0 at the cut. Decay both with Bollo's quintic. If their signs differ, limit the decay time to t1 ≤ −5·x0/v0.

Prepare the transition so planted feet and gripping hands retain their goals and only the free joints retain the decay. Use the displayed state on each side of the cut for verification.

Blend unwrapped angles on the shortest arc ((b − a + 180) mod 360 − 180), or use quaternions.

### Changing target within an action

When a reach target changes, one studied model adds a minimum-jerk submovement from the old target to the new target (Flash and Hogan 1985; Flash and Henis 1991). Keep the ongoing path and the correction on the same clock, then fit the summed goal within the action's reach and contact rules.

## Layers

Add gaze, breathing and expression as pose layers. Preserve the action's timing, transitions and contact goals. Use free joints or small trunk offsets that [contact fits](authoring.md#fit-order) absorb.

Blend from the layer's current state when it starts, ends or changes target. Take timing and amplitude from its study and vary them by [skill and seed](variation.md).
