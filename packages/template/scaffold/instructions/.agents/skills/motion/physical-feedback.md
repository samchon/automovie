# Physical feedback

Author the performance with the installed vocabulary's [supports, contacts and forces](compose/composition.md#forces-and-outcomes). Use [effector goals](laws/authoring.md) for an action or moving body that needs its own law.

## Simulation

### When to simulate

Use an analytic result when available, such as free flight with specified initial conditions. Simulate only the bodies, degrees of freedom and interval whose physical response the beat requires and the composed performance cannot supply.

The scene's composition comment names the response and why the composed performance cannot supply it, the bodies and time window it affects, and whether it is a simulated window or a stated departure from the solved result.

### Simulated windows

Initialize the engine's solver from the displayed entry state. Hand the resolved exit pose, velocity and retained contacts back to the composition. Judge whether the result realizes the scripted outcome and route an infeasible outcome through [refusals](compose/refusals.md).

Record the value and reason for any deliberately exaggerated impulse, gravity or compliance.

Check the window's promised contacts, misses, falls and timing on the contacts the solver reports. Two bodies drawn close together prove no contact.

### Preparing simulation

Run the interval once before sampling frames. Choose integration steps for stability and accuracy independently of display refresh. Retain the events and trajectory representation needed to reproduce the checked response by film time. Store simulated samples only where the solver or delivery requires them. Reuse a prefix under [stage caches](../production/stage-caches.md) only with unchanged inputs and a complete solver and controller checkpoint.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them. Keep simple collision or control representations separate from display tessellation.

## Review

Review the resolved performance against the decided outcome under [segment review](segment-review.md). Both hand-backs of a simulated window are joins, so they take the consecutive frames [times](../visual-debugging/capture.md#times) requires.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
