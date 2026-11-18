# Physical feedback

Use the installed vocabulary's kinematic [supports, contacts and forces](compose/composition.md#forces-and-outcomes) for performance. Use this page for added physical responses or a law for an unsupported body.

## Simulation

### When to simulate

Simulate only a scripted response that kinematic performance cannot show.

The scene's composition comment names the response and why the composed performance cannot supply it, the bodies and time window it affects, and whether it is a simulated window or a stated departure from the solved result.

### Simulated windows

In a simulated window the engine's solver produces the bodies' response, then hands back to the composed motion. The solver realizes the decided outcome, so the window changes how the outcome looks and never which outcome happens.

Record the value and reason for any deliberately exaggerated impulse, gravity or compliance.

Check the window's promised contacts, misses, falls and timing on the contacts the solver reports. Two bodies drawn close together prove no contact.

### Cached simulation

Bake fixed inputs once under [stage caches](../production/stage-caches.md) and read by film time. Reuse a prefix only after verifying unchanged inputs and a complete solver and controller checkpoint.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them. Keep simple collision or control representations separate from display tessellation.

## A production law's goals

Use the public engine solvers for [effector goals](laws/authoring.md). Follow [fit order](laws/authoring.md#fit-order) and solve coupled goals together where supported. Report a missing solver to the user.

A residual, refusal or range-limited pose marks an unreachable goal, repaired at its owner as [staging](staging.md#blocking) directs.

## Review

Review the resolved performance against the decided outcome under [segment review](segment-review.md). Both hand-backs of a simulated window are joins, so they take the consecutive frames [times](../visual-debugging/capture.md#times) requires.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
