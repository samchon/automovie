# Motion

The user's instruction on how every movement is authored. It binds the settings that describe how people move and handle things, the screenplays that decide each contact, and the code that performs them.

## Bring each body part to its target {#effectors-to-targets}

Source: user instruction, verbatim intent:

> Hand-sculpting coordinates and angles one by one is fine, but make the most of the concept of *bringing a body part to its target* (가져다대기). A one-two punch built as logic that brings the fist to the opponent's struck region is far easier than hard-coded coordinates, and walking is easy as placing each foot onto the floor. Research it and you will find a lot. For the same reason the broom, Quidditch and every other scenario become easy once you think this way.

Adopted requirement: every interaction is authored as effectors brought to targets — hands to a wrist, a note, a crane or a broom handle; feet to the floor, a step or a footrest; the seat to a bench or a broom; a catching hand to the Snitch — and the rest of the body is solved from those contacts. Established techniques (inverse kinematics, foot planting, contact and reach targeting, motion warping) and the installed `@automovie/engine` and `@automovie/human` APIs are studied before joint values are chosen by hand ([effector-targeting study](../research/motion/effector-targeting.md)). For the settings this means that every person's movement and every handled object is described by its contact points, reach and support, so that a later author can name the effector and the target of each action.
