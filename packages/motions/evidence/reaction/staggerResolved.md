# src/reaction/staggerResolved.ts#staggerResolved

## @evidence contracts/development/common.md#meaningful-documentation

States the three readings of a sample, what is assembled once and what each later reading derives and takes.

## @evidence contracts/development/implementation.md#principled-implementation

Each reading is the cold resolve of its posture: `fit` of `assemble` is that resolve, `derive` gives the assembly `assemble` gives, and a completed fit is taken only where every leg's fit reads exactly the same records, root and goal, of which a limb fit is a function. The carriage is `HumanArmSwing.of` on that resolve and the centre `HumanBalance.centre` on it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record a sample holding its assembly and fit; two readers over it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pose or centre is kept for another posture: every reading resolves the posture it is given, and a posture whose legs read anything different is fitted in full.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each sample's fits start their bounded searches from the sample before's seeds (`HumanLimbIncumbent`). A sample's three readings cost one assembly, two derivations of the changed records and two leg-fit pairs (the carriage's, shared by the first balance pass, and the shifted pass's), in place of three assemblies and three pairs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A sample's assembly and completed fit are shared by its later readings; equivalence is decided inside `derive` (exact angles, root and heading) and `fit` (exact goals, root and the very records each leg reads).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one assembly and one seeded fit a sample until the plan's construction releases the reader.
