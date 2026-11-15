# Law design

A law takes a body, its parameters, the performer's skill, the state it is entered from and its targets. Give every law the parts below, because cuts, partners, sound and checks all rely on them.

## Plan and time

Decide everything an instance needs when it starts: its duration, its footprints, a flight path, a strike path. Each pose is then computed from that plan and a time alone. A law that decides while it plays gives playback one motion and a seek another. [Transitions](transitions.md#pose-by-time) gives what this demands of solvers and caches.

## Entry state

Plan from where the body is when the action starts: the displayed pose and its velocity, the feet on the floor, what the hands hold. The root, the planted feet and the effectors continue from there by the law's own planning, and [the transition](transitions.md#changing-action) carries only the joint offsets the law cannot plan from. A law that always starts from its own rest pose turns every transition into a visible correction.

## Events and the decisive instant

Name the instants other work depends on: the phases of the movement, the start and end of each contact, and the decisive instant when the action has one. The decisive instant is the frame the action exists for, such as an impact, a release, a catch or a landing. Cuts, a partner's timing, sound and review address the action through these names. Without them an action can only be cut or matched at a guessed fraction of its length, and the guess breaks when the duration changes with the body.

## Outcome as input

When an action can end in different outcomes, such as a strike that lands, is blocked or misses, or a shove that is absorbed, stepped out or ends in a fall, the outcome is decided before the geometry and the forces: by the caller who authored the scene, or by a declared rule over the participants' intents that the caller selects. Geometry and forces then realize that outcome and are checked against it, and an outcome they cannot produce is refused with the range that would produce it. An outcome left to wherever the geometry happens to arrive changes when a body, a distance or a mass changes, and nobody chose the change.

## Time scale

Take durations and speeds from the body, as distances already are. Bodies of different size move alike at equal Froude number, v²/(g·l) with l the leg length (Alexander 1984), so a pace is a Froude number and not a speed in meters per second. A fixed speed makes a small body run where a tall one strolls.
