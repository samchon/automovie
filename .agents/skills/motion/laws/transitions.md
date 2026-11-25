# Time, transitions and layers

## Pose by time

Build every law, primitive and transition as a preparation that runs once from bound inputs, and a pose function `f(plan, t)`.

### Preparation

Compute only the knots and branch points the motion needs. Make every contact change, impact and touchdown a branch knot. Place the other knots adaptively until the path stays within a tolerance taken from the requirement bound at the call site (AutoKnots, Vitenti et al. 2024). Locate a one-dimensional extremum with Brent's method (Brent 1973), not on a sampling grid.

Each knot carries its position and velocity, and may carry its own acceleration and dwell. Join neighboring knots with a minimum-jerk segment that matches both knots' position, velocity and acceleration (Flash and Hogan 1985). Time the segments with TOPP-RA against the velocity and acceleration limits (Pham and Pham 2018).

Run physics only at a branch point, for the short response there, and resolve it during preparation. Use closed-form paths and fits where they satisfy the constraints. Limit coupled search to the interval and degrees of freedom that need it. Retain event states, curves or solver trajectories that preserve the checked result between events. Carry the resolved boundary state through dependent phases, cuts and layers.

### Sampling

Keep `f(plan, t)` pure, so any `t` in any order gives the same pose. Evaluate only what the caller reads at that instant, from the prepared segments, carrier-relative transforms and closed-form limb solutions. Run no search, re-solve or fit, and keep no cache or memo. Pass the evaluated pose to its consumers. When a sample seems to need a memo, move its time-independent work into preparation.

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
