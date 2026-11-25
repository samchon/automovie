# src/handling/HumanGraspUse.ts#HumanGraspUse.place

## @evidence contracts/development/common.md#meaningful-documentation

States the place, its shares, who reads it and why once.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's length read off the bones, shoulder to elbow and elbow to wrist, and the place laid ahead along the heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three joints, one length, one point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shares are provisional and named here, the one place both readers take.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanGraspUse.ts#HumanGraspUse.presented

## @evidence contracts/development/common.md#meaningful-documentation

States the pose, each input and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The tool is rigid in the hand from the grasp on, so the hand's rotation there is the candidate grasp's rotation turned by the shortest turn that takes the tool's line, as it lies now, onto the asked line, or, laid along a surface, the working point's own face onto the surface; worn, the thing's own worn frame, the one `dress` puts it at (`HumanWorn.frame`), so the grasp is judged at the very pose it is put on in (`HumanGraspWorn`). Every key is judged in the unit of what it places, metres, read off the fitted hand (`HumanGrasp.IKey.judge`): a tool on a line by the measure the law presenting it judges a held tool by (`StrikingHeld.strayed`, its working point and its line a tool's length behind, so a grip that keeps the point and turns the line is counted), the tool read from the candidate grip as a held tool is read (`StrikingHeld.read`); a tool laid along a surface by its working point. The roll about that line, or the turn about the surface's normal, is free in a use that names only that much: the shared chooser takes it (`HumanFreedomChoice`, a wrapped freedom), the roll whose key the arm, fitted within its ranges, leaves the working point nearest, as a law presenting the tool takes it (`StrikingRoll`), so the grasp is judged at the roll the law will use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two contacts, the two lines, the turn between them, the place, the roll.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Lines that oppose each other turn about the body's left instead of an undefined axis. Given the closed hand's clearance, its depth inside the body adds to a roll's miss. The place's shares of the arm (0.6 ahead, 0.1 below) are provisional and named at the code.

## @evidence contracts/development/implementation.md#efficient-algorithms

The chooser's fits, each roll fitted once and kept in a map however often the search returns to it, its elbow placed by the fit's own sweep (`HumanPosture.IGoal.elbow`) and only the hand bone placed for the judge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the entry pose's needed bones once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The roll-score map lives for the call and is cleared before return; the key's judge holds its tool or contact geometry only.
