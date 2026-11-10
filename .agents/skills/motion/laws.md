# Design an action as a law

An action is a law: given a body, its parameters, the performer's skill, the state it is entered from and its targets, it produces the same motion every time. Give every law the parts below, because cuts, partners, sound and checks all rely on them.

## Plan once, evaluate by time

Decide everything an instance needs when it starts: its duration, its footprints, a flight path, a strike path. Each pose is then a closed evaluation of that plan at a time, so playback, seeking and capture at any rate agree. A law that decides while it plays gives playback one motion and a seek another. [Transitions](transitions.md#pose-as-a-function-of-time) gives what this demands of solvers and memos.

## Continue from the entry state

Plan from where the body is when the action starts: the displayed pose and its velocity, the feet on the floor, what the hands hold. The root, the planted feet and the effectors continue from there by the law's own planning, and [the transition](transitions.md#changing-action) carries only the joint offsets the law cannot plan from. A law that always starts from its own rest pose turns every transition into a visible correction.

## Declare events and the decisive instant

Name the instants other work depends on: the phases of the movement, the start and end of each contact, and the decisive instant when the action has one, such as an impact, a landing or a grip closing. Cuts, a partner's timing, sound and review address the action through these names. Without them an action can only be cut or matched at a guessed fraction of its length, and the guess breaks when the duration changes with the body.

## Take the outcome as an input

When an action can end in different outcomes, such as a strike that lands, is blocked or misses, the outcome is decided before the geometry: by the caller who authored the scene, or by a declared rule over the participants' intents. Geometry then realizes that outcome and is checked against it. An outcome left to wherever the geometry happens to arrive changes when a body or a distance changes, and nobody chose the change.

## Scale time with the body

Take durations and speeds from the body, as distances already are. Bodies of different size move alike at equal Froude number, v²/(g·l) with l the leg length (Alexander 1984), so a pace is a Froude number and not a speed in metres per second. A fixed speed makes a small body run where a tall one strolls.
