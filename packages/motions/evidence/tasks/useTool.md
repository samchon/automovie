# src/tasks/useTool.ts#useTool.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace states the tool's frames, the working goals, the cycle timing and the sources; the parameters and the refusals name each admitted input.

## @evidence contracts/development/implementation.md#principled-implementation

The goal is the held tool's working point on the work: the hand's rotation is the least turn that lays the tool's line on the work's (`HumanHand.prepareAlignment`), the grip follows rigidly from it, each cycle moves that pose by its kind's periodic law, and the face's offset from the wrist is the limb's contact, so a wrist that cannot reach the asked attitude is re-aimed to keep the face on the work.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Hold and work, the working pose, the clock, the cycle law, then the arm stroke with the kept grip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tool's reach is its own contacts and the work point the author's target; the saw's slope is chosen by the arm's own strain.

## @evidence contracts/development/implementation.md#efficient-algorithms

One alignment preparation, one strain-ranked elbow solve per saw slope tried (five), one entry hand read; per second one cycle pose and one elbow hint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The working pose, the turn's axis and the pose at a contact's half cycle are computed once for the plan, since none depends on the second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the tool's geometry, the clock and the kept fingers for its lifetime; nothing grows with the seconds evaluated.

# src/tasks/useTool.ts#useTool.IWork

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `useTool.plan` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `IWork` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useTool.plan` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.
