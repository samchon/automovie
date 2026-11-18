# Law design

An action law takes a body, parameters, skill, entry state and targets.

## Plan and time

Compute the instance plan at entry, then evaluate poses from the plan and time. Follow [Pose by time](transitions.md#pose-by-time) for solvers and caches.

## Entry state

Start from displayed pose and velocity, planted feet and held objects. Plan root, supports and effectors from that state. Use [the transition](transitions.md#changing-action) for joint offsets the law cannot plan.

## Events and the decisive instant

Name phase boundaries, contact starts and ends, and the decisive instant if any. Use those events for cuts, partners, sound and review.

## Outcome as input

Take the outcome as input before resolving geometry and forces. The caller supplies it or selects a declared rule over participants' intents.

Check realized geometry and forces against the selected outcome. Refuse infeasible outcomes and report the feasible range.

## Time scale

Derive duration and speed from body size. Express pace as Froude number v²/(g·l), with l the leg length (Alexander 1984).
