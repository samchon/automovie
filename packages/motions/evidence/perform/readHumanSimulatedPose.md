# src/perform/readHumanSimulatedPose.ts#readHumanSimulatedPose

## @evidence contracts/development/common.md#meaningful-documentation

States which bones change, the composition inverted, the reduced readout of fewer-axis joints and its source, the chart difference, the welded bones kept on the kinematic articulation and its source, the root case and what is not displayed.

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the forward-kinematics composition bone by bone, parent first. Three-axis joints go through the codec ordinary display composes with. Fewer-axis joints are read in reduced coordinates, as a generalized-coordinate model keeps them (Featherstone 2008, Rigid Body Dynamics Algorithms, ch. 4, joint models: a joint's transform is a function of its own coordinates; MuJoCo derives body frames from `qpos`). One that declares a sequential chart takes the engine's own projection of its solved joint rotation (`projectPhysicalJointRotation`, called, not edited), laid on the displayed parent. Any other takes the solver's free coordinates and the profile's axis-to-clinical mapping. A bone welded into a solved carrier has no segment, so it keeps the kinematic pose's articulation on the displayed carrier, as Godot's physical bone simulator leaves a bone with no physical bone to the skeleton's own pose under its simulated parent (godotengine/godot `scene/3d/physics/physical_bone_simulator_3d.cpp`, `_process_modification`, lines 365-372 at eabb9a63d4bc70cd87e50d6af152f841ea549972, MIT, "Copyright (c) 2014-present Godot Engine contributors"); held at the window's first pose instead, a welded toe stepped 38 degrees back onto the kinematic pose at the hand-back. The solver's frames are world bone-origin frames (`bindPhysicalWorld` places each rigid body at its bone's origin). Predicted effects, which the next verification batch checks: the take verdict's elbow-abduction `range` findings go, since a locked axis now reads its rest; a displayed distal end may lie off its solved collider by up to the joint drift the readout drops; the simulation residual check, which reads the solver's raw frames, is unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk of the rig; conversions belong to the codec, the engine's projection and the profile's axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A three-axis joint is not clamped: a value outside its clinical range shows as solved. A fewer-axis joint shows its solved coordinates in its own admitted set, which is the joint's definition, not a correction. An unowned bone keeps the kinematic record itself, so a window the solver never takes over is the kinematic pose bit for bit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the rig's B bones with constant work each, plus one joint lookup per owned bone; an empty ownership returns at once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pose that shares the kinematic pose's unchanged joint records; retains nothing.