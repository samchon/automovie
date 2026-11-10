# Time, transitions and redirection

## Pose as a function of time

A [law](laws.md#plan-once-evaluate-by-time) evaluates a pose from its plan and a time alone, which has two consequences specific to motion. A solver's reference pose comes from a fixed instant, such as the previous contact event of the plan (the events and windows an action resolves into), never from the frame before. A memo is keyed only by exact event times, never by sampled frames. Either way, playback, seeking and capture at different rates still agree.

## Declared cuts

Each action declares its interrupt table: the actions it may be cut into, the window of each cut (a share of the action, or one of its events), and the transition kind. Refuse a cut its interrupt table does not list at the moment the plan is built, so an impossible change of plan surfaces before the film renders.

The kind follows what changes. A change to a different action [inertializes](#changing-action). A change of target within one family of movement [redirects](#changing-target-within-an-action). A cyclic movement that continues into another, such as a walk into a run, joins on the matching foot event, so the gait keeps its phase.

A cut also names what it carries unchanged: the stance foot's plant, a guard, a grip. The action cut into [continues from that state](laws.md#continue-from-the-entry-state).

## Changing action

At a cut into a different action, inertialize (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War"). Each channel's offset x0 and velocity v0 are taken from both sides at the same instant and decayed together on Bollo's quintic polynomial. Where x0 and v0 have opposite signs, the decay time t1 is limited to t1 ≤ −5·x0/v0. Leaving out v0 keeps the pose continuous but breaks its velocity, which reads as a jerk at the cut.

Keep the offset off every limb that bears a contact. After the offset is applied, solve each planted foot and gripping hand onto its goal again, so the decay reaches only the free joints. A contact that takes part in the blend slides for as long as the blend lasts.

Blend angles in unwrapped form, along the shortest arc ((b − a + 180) mod 360 − 180), or blend in quaternions. A heading or twist that crosses ±180° and is differenced raw reports thousands of degrees per second where the limb barely moved.

## Changing target within an action

When the target of a reach or a strike moves mid-motion, superpose a second minimum-jerk unit from the old target to the new one on the running unit (Flash and Hogan 1985; Flash and Henis 1991), and let the solver follow the summed goal. Restarting the reach from rest discards the motion already under way.
