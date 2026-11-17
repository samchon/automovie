# Physical feedback

Choose and verify the scene's physical mode here. Installed actions already resolve their supports, contacts and forces from the composition's [forces and outcomes](compose/composition.md#forces-and-outcomes). Engine scheduling, camera evaluation and sampling remain ordinary composition operations.

## Physical mode

Add physical solving only for a response the kinematic performance cannot supply, or a body no package moves. The scene's composition comment names:

- the required response and why the existing performance cannot supply it;
- the affected bodies and time window;
- the mode the installed package supplies.

The documented modes are:

- the kinematic default, planned by the vocabulary;
- a simulated window, in which the engine's solver produces the bodies' response and hands back to the composed motion after it;
- a stated departure from the solved result when impulse, gravity or compliance is exaggerated.

Within that window, the solver realizes the [decided outcome](compose/composition.md#forces-and-outcomes). Report defective installed actions through [reuse](../development/reuse.md#a-defect-or-a-gap).

Record exaggerated impulse, gravity or compliance and its reason in the scene's comment. Check promised contacts, misses, falls and timing against actual receipts; proximity establishes no solved impulse.

Run [catalog checks](catalog-cases.md#capture-and-review) separately from playback and capture.

## Cached simulation

Simulate fixed numerical inputs once as a [stage cache](../production/stage-caches.md) and draw cached states by film time, so playback, seek and capture consume the same performance. A late edit may reuse only a verified unchanged input prefix with its complete solver and controller checkpoint.

Keep dimensions, mass or material assumptions, initial state, time sampling, transforms and constraints explicit where the chosen API needs them, with simple collision or control representations separate from display tessellation.

## A production law's goals

A law for [a body no package moves](laws/extension.md#what-is-not-a-person) realizes its [effector goals](laws/authoring.md) through the installed engine's public solvers. Follow [fit order](laws/authoring.md#fit-order) and solve coupled goals together where the API supports it.

A residual, refusal or range-limited pose marks an unreachable goal, repaired at its owner as [staging](staging.md#blocking) directs. A solver the engine lacks follows [a defect or a gap](../development/reuse.md#a-defect-or-a-gap).

## Review

Review the resolved performance and receipts against the decided outcome under [segment review](segment-review.md), including consecutive frames at contacts and both simulation hand-backs.

After changing detail, proportions or attachments, check that physical inputs and visible contacts still agree.
