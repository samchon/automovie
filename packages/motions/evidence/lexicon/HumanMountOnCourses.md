# src/lexicon/HumanMountOnCourses.ts#HumanMountOnCourses

## @evidence contracts/development/common.md#meaningful-documentation

States the two courses, why each is laid, the hands' landing region and when each hand lands.

## @evidence contracts/development/implementation.md#principled-implementation

Joint-space keys where a world course leaves the leg's range; one planned course per arm (TrajOpt, through `courseArmGoal`), the two laid beside each other on the shared base, on the thigh goals, clear of the turning trunk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The legs' keys, then the arms' course over them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The landing disc is a quarter thigh either side of the thigh's mid station; a hand rests from the climb's end, or from the instant its rising thigh meets it as it hangs where that comes first (`sitHandMeet`, the body's own geometry): a hand lands on the thigh as the thigh comes up under it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One swung-leg wrap, one meeting scan per hand and one arm course per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanSwungLeg` and `courseArmGoal`, the owners of each course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan retains what its two owners retain.
