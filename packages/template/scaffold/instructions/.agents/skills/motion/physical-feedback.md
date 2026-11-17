# Physical feedback

A film's performance is kinematic: the installed actions already resolve their supports, contacts and forces from the composition's [forces and outcomes](compose/composition.md#forces-and-outcomes). This page serves the scene that needs a simulated response as well, or a law that moves a body no package moves.

## Simulation

### When to simulate

Simulate only a response the screenplay decides and the kinematic performance cannot show, such as a stack of boxes scattering.

The scene's composition comment names the response and why the composed performance cannot supply it, the bodies and time window it affects, and whether it is a simulated window or a stated departure from the solved result.

### Simulated windows

In a simulated window the engine's solver produces the bodies' response, then hands back to the composed motion. The solver realizes the decided outcome, so the window changes how the outcome looks and never which outcome happens.

Record an exaggerated impulse, gravity or compliance with its reason in the scene's comment, because an unstated departure can hide a failed outcome.

Check the window's promised contacts, misses, falls and timing on the contacts the solver reports. Two bodies drawn close together prove no contact.

### Cached simulation

Simulate fixed numerical inputs once as a [stage cache](../production/stage-caches.md) and draw cached states by film time, so playback, seek and capture consume the same performance. A late edit may reuse only a verified unchanged input prefix with its complete solver and controller checkpoint.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them. Keep simple collision or control representations separate from display tessellation.

## A production law's goals

A law for a body no package moves, written under vocabulary extension, realizes its [effector goals](laws/authoring.md) through the installed engine's public solvers. Follow [fit order](laws/authoring.md#fit-order) and solve coupled goals together where the API supports it. A solver the engine lacks goes to the user.

A residual, refusal or range-limited pose marks an unreachable goal, repaired at its owner as [staging](staging.md#blocking) directs.

## Review

Review the resolved performance against the decided outcome under [segment review](segment-review.md). Both hand-backs of a simulated window are joins, so they take the consecutive frames [times](../visual-debugging/capture.md#times) requires.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
