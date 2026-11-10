# Time, transitions and redirection

## Pose as a function of time

Evaluating a pose from its time alone has two consequences specific to motion. A solver's reference pose comes from a fixed instant, such as the plan's previous contact event, never from the frame before. A memo is keyed only by exact event times, never by sampled frames. Either way, playback, seeking and capture at different rates still agree.

## Declared cuts

Each action declares its interrupt table: the actions it may be cut into, the window of each cut (a share of the action, or one of its events), and the transition kind. Refuse a cut its interrupt table does not list where the chain or schedule is built, so an impossible change of plan surfaces before the film renders.

## Changing action

At a cut into a different action, inertialize (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War"). Each channel's offset x0 and velocity v0 are taken from both sides at the same instant and decayed together on the quintic. Where x0 and v0 have opposite signs, the decay time is limited by t1 ≤ −5·x0/v0. Leaving out v0 keeps the pose continuous but breaks its velocity, which reads as a jerk at the cut.

Blend angles in unwrapped form, along the shortest arc ((b − a + 180) mod 360 − 180), or blend in quaternions. A heading or twist that crosses ±180° and is differenced raw reports thousands of degrees per second where the limb barely moved.

## Changing target within an action

When the target of a reach or a strike moves mid-motion, superpose a second minimum-jerk unit from the old target to the new one on the running unit (Flash and Hogan 1985; Flash and Henis 1991), and let the solver follow the summed goal. Restarting the reach from rest discards the motion already under way.
