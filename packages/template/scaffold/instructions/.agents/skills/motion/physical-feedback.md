# Physical feedback

Author the performance with the installed vocabulary's [supports, contacts and forces](compose/composition.md#forces-and-outcomes). Use [effector goals](laws/authoring.md) for an action or moving body that needs its own law.

## Simulation

### When to simulate

Use a closed form when it meets the requirement. Simulate the short response at a contact change, impact or touchdown only when kinematic motion cannot supply it. Include the bodies and degrees of freedom the response needs.

In the scene's composition comment, name the required response, why it needs simulation, and the bodies and interval it affects. State any departure from the solved result.

### Simulated windows

Initialize the engine's solver from the displayed entry state. Hand the resolved exit pose, velocity and retained contacts back to the composition.

For Human standing on the floor, pass displayed segment frames and floor height to `fitHumanPhysicalStandingPose` from `@automovie/human`. Use its fitted targets and inspect foot bearing, hull clearance and both joins. Route an infeasible outcome under [refusals](compose/refusals.md).

Record the value and reason for any deliberately exaggerated impulse, gravity or compliance.

Verify contact, misses, falls and timing in the solver's output.

### Preparing simulation

Run the interval before frame sampling. Choose integration steps for stability and accuracy independently of display refresh. Keep the events and trajectory needed to reproduce the checked response. Precompute an adopted response with the README physics command and sample its archive as the README describes.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them. Keep simple collision or control representations separate from display tessellation.

## Review

Review the resolved performance against the scripted outcome under [segment review](segment-review.md). Inspect consecutive frames at both joins of the simulated window.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
