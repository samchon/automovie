# src/pose/IAutoMovieArmChainFault.ts#IAutoMovieArmChainFault

## @evidence contracts/development/design.md#principled-representation

Records the outcome of `armChainFault`'s first-principles test, the sine between the unit hinge and the unit forearm rest offset below `1e-6`, so a fault names a geometric impossibility rather than a rig naming convention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Side, bone and message are the three facts the shot gate prints and a correction round acts on; the absence of a fault is `null` at the producer rather than a flag here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fault is reported only where an arm-IK question is asked, so a quadruped whose front legs ride the arm chains is not refused at authoring time.

## @evidence contracts/development/common.md#meaningful-documentation

States the condition that produces it, what it means for reach, and how the solver and the shot gate use it.
