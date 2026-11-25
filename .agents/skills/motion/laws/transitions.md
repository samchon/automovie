# Time, transitions and layers

## Pose by time

Prepare a law once from its bound inputs and evaluate its pose by time.

### Preparation

Use a closed-form path or fit when it meets the bounds. Resolve contact changes, impacts and touchdowns at their event times. Restrict a coupled fit or physical solve to the interval and degrees of freedom required.

For a fitted path, retain knots at its branch times and add others only to meet the required error bound (AutoKnots, Vitenti et al. 2024). Use Brent's method for a bracketed one-dimensional extremum. Join minimum-jerk segments with matched position, rate and acceleration (Flash and Hogan 1985). Use TOPP-RA when the path needs retiming to meet rate and acceleration limits (Pham and Pham 2018).

Retain exact event states and any curves or solver trajectories needed between events. Carry the displayed predecessor state through dependent phases, cuts and layers.

### Sampling

Return the same pose for repeated and shuffled reads. Evaluate the requested channels from their prepared data and any current inputs they depend on, such as a moving support or tracked partner. Keep invariant work in preparation. Reuse the evaluated pose where consumers need the same sample.

## Transitions

### Declared cuts

Declare each cut's target action, legal window, target entry and transition kind. Reject undeclared cuts when building the plan.

Use inertialization for a change of action, redirection for a new target in the same family and phase alignment for a cyclic join. Preserve the gait phase in force at the boundary, including flight where admitted.

Plan the target action from the entry pose and rates. Preserve active supports and held objects in their owners' frames until the actual release or transfer. Check corresponding channels and contacts on both sides.

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
