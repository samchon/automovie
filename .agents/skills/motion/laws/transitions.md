# Time, transitions and layers

An action rarely plays alone from start to end: it is cut into another, joins one, has its target moved while it plays, or carries a layer.

## Pose by time

An action evaluates each pose from its plan and a time alone, as its law declares, and that binds its solvers and caches. A solver's reference pose comes from a fixed instant of the plan, such as the previous contact event, never from the frame before. A cached result is keyed only by exact event times, never by sampled frames. Playback, seeking and capture at different rates then agree.

## Transitions

### Declared cuts

Each action declares its cuts: the actions it may be cut into, the window of each cut (a share of the action, or one of its events), where the target action is entered, and the transition kind. Refuse a cut the action does not list when the plan is built, so an impossible change of plan surfaces before the film renders.

The kind follows what changes. A change to a different action inertializes instead of crossfading, and a change of target within one family of movement redirects. A cyclic movement that continues into another, such as a walk into a run, joins on the matching foot event, so the gait keeps its phase.

A cut also names what it carries unchanged, such as the stance foot's plant or a grip, and the action cut into plans from that state as its entry state.

Where the project's motion vocabulary runs the transitions below, a law only declares its cuts, because blending again inside the law applies the transition twice.

### Changing action

At a cut into a different action, inertialize: carry the difference in pose and velocity at the cut and let it decay (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War").

Take each channel's offset x0 and velocity v0 from both sides at the same instant and decay them together on Bollo's quintic polynomial. Where x0 and v0 have opposite signs, limit the decay time t1 to t1 ≤ −5·x0/v0. Leaving out v0 keeps the pose continuous but breaks its velocity, which reads as a jerk at the cut.

Keep the offset off every limb that bears a contact: after applying it, solve each planted foot and gripping hand onto its goal again, so the decay reaches only the free joints. A contact that takes part in the blend slides for as long as the blend lasts.

Blend angles in unwrapped form, along the shortest arc ((b − a + 180) mod 360 − 180), or in quaternions. A heading or twist that crosses ±180° and is differenced raw reports thousands of degrees per second where the limb barely moved.

### Changing target within an action

When the target of a reach or a strike moves mid-motion, superpose a second minimum-jerk unit from the old target to the new one on the running unit (Flash and Hogan 1985; Flash and Henis 1991), and let the solver follow the summed goal. Restarting the reach from rest discards the motion already under way.

## Layers

Gaze, breathing and displays of feeling are layers: they run on top of whatever action the body performs and add their contribution to its pose. A layer never starts, cuts or ends an action, so an action plays the same with or without it.

A layer leaves every contact goal untouched, so planted feet and gripping hands do not slide. It uses the joints the action leaves free, such as the eyes and the chest, or adds small offsets to the trunk that the [contact fits](authoring.md#fit-order) then absorb.

A layer that begins, ends or changes its target blends from where it is, never from neutral, so the head does not snap. Its timing and amplitude come from its own study and vary under [skill and seed](variation.md) like any action's.
