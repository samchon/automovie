# Physical feedback

Author the performance with the installed vocabulary's [supports, contacts and forces](compose/composition.md#forces-and-outcomes). Use [effector goals](laws/authoring.md) for an action or moving body that needs its own law.

## Simulation

### When to simulate

Use an analytic result when available, such as free flight with specified initial conditions. Simulate only at a branch point, such as a contact change, impact or touchdown, and only the bodies, degrees of freedom and short response the beat requires and the composed performance cannot supply.

In the scene's composition comment, name the required response, why it needs simulation, and the bodies and interval it affects. State any departure from the solved result.

### Simulated windows

Initialize the engine's solver from the displayed entry state. Hand the resolved exit pose, velocity and retained contacts back to the composition.

A Human that enters standing on the floor starts from `fitHumanPhysicalStandingPose` in `@automovie/human`: pass its displayed segment frames and floor height, and use the returned targets. The Human's drawn heel sits above the sole sockets the motion stands on, so the fit turns each foot about 16 degrees until heel and forefoot both touch, and lowers the body about 40 mm. Without it the body stands on its forefoot and falls. It also opens an arm whose forearm rests on the waist by the least shoulder abduction that clears the rigid hulls, since the display admits that rest as the skin's give. Expect that difference at the window's joins. A refusal means the displayed stance does not bear on the floor. Judge whether the result realizes the scripted outcome and route an infeasible outcome through [refusals](compose/refusals.md).

Record the value and reason for any deliberately exaggerated impulse, gravity or compliance.

Check the window's promised contacts, misses, falls and timing on the contacts the solver reports. Two bodies drawn close together prove no contact.

### Preparing simulation

Run the interval before frame sampling. Choose integration steps for stability and accuracy independently of display refresh. Keep the events and trajectory needed to reproduce the checked response. Precompute an adopted response with the README physics command and sample its archive as the README describes.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them. Keep simple collision or control representations separate from display tessellation.

## Review

Review the resolved performance against the scripted outcome under [segment review](segment-review.md). Inspect consecutive frames at both joins of the simulated window.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
