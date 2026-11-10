# Time, transitions and redirection

## Pose as a function of time

A displayed pose is a pure function of its time, its inputs and its seed. Playback, seeking and capture sample the same performance at different instants and rates, and they agree only when no pose reads the previous frame or a state accumulated over a sampling grid. A solver's reference pose is likewise taken from a fixed instant, such as the plan's previous contact event, never from the frame before. Memoize only at exact event times.

Seeded variation draws from a smooth noise of the seed, and proficiency scales timing and accuracy, so two takes differ believably and the same take replays exactly.

## Declared cuts

Each action declares the actions it may be cut into, the window of each cut (a share of the action, or one of its events), and the transition kind. A cut the table does not list is refused when the chain is built, so an impossible change of plan surfaces before the film renders.

## Changing action

At a cut into a different action, inertialize (Bollo 2018, "Inertialization: High-Performance Animation Transitions in Gears of War"). Each channel's offset x0 and velocity v0 are taken from both sides at the same instant and decayed together on the quintic. Where x0 and v0 have opposite signs, the decay time is limited by t1 ≤ −5·x0/v0. Leaving out v0 keeps the pose continuous but breaks its velocity, which reads as a jerk at the cut.

Blend angles in unwrapped form, along the shortest arc ((b − a + 180) mod 360 − 180), or blend in quaternions. A heading or twist that crosses ±180° and is differenced raw reports thousands of degrees per second where the limb barely moved.

## Changing target within an action

When the target of a reach or a strike moves mid-motion, superpose a second minimum-jerk unit from the old target to the new one on the running unit (Flash and Hogan 1985; Flash and Henis 1991), and let the solver follow the summed goal. Restarting the reach from rest discards the motion already under way.
