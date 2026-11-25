# src/posture/HumanLimbView.ts#HumanLimbView.IView

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content and ownership.

## @evidence contracts/development/design.md#principled-representation

The pose with only the read records, the caller's own objects in their order, and each one's index among the whole pose's joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by `merged` and the solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The indices rise, so the order is the whole pose's by construction.

# src/posture/HumanLimbView.ts#HumanLimbView.IAdmission

## @evidence contracts/development/common.md#meaningful-documentation

States what the flag says, who shares it and why later fits need no second admission.

## @evidence contracts/development/design.md#principled-representation

One boolean owned by the operation that fits one pose's limbs in turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member, written by `solveHumanLimbFit` and made by `refitHumanPosture` and `HumanLimbPair`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The premise that every pose passed with one flag differs only by solved limb records is its owner's; the flag does not check it.

# src/posture/HumanLimbView.ts#HumanLimbView

## @evidence contracts/development/common.md#meaningful-documentation

States which records are kept and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics composes a bone's frame from its parent's frame, its rest and its own record, so a bone's frame depends on the records of the bone and its ancestors alone; the kept set is closed under the rig's parent relation, so every bone the fit reads is placed as in the whole pose. The fit's contact step edits the toes' record in place, so a leg keeps it too.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The read bones, their closure under the parent relation, then one ordered selection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The read bones are the ones the fit itself demands (`HumanLimbFit`): its chain, its attachment, `HumanArmObstacleBones` and the toes. Duplicate records of a kept bone are all kept, in order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The read set closed under parents is the body's (`IHumanBody.reads`, made once with the rig); only an attached goal's bone is climbed, to its first kept ancestor, and the selection walks the pose's joints once: O(J) set tests.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rig-only read set is the body's value, made with it; each fit selects its own records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns caller-owned records and retains nothing.

# src/posture/HumanLimbView.ts#HumanLimbView.admitted

## @evidence contracts/development/common.md#meaningful-documentation

States what is admitted, when it is spared and what is thrown.

## @evidence contracts/development/implementation.md#principled-implementation

The body's forward kinematics with no bone demanded admits every record in order and composes no frame; a fit of the reduced pose would otherwise never read a malformed record outside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One flag test and one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The flag is set only after the admission returned, so a refused pose is refused again.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(J) admission per shared flag instead of one per fit; a fit with no flag pays it itself.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A later fit's pose differs from the admitted one only by records an earlier fit solved, which the fit's own forward kinematics admits when it reads them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads through a reader of its own that ends with the call.

# src/posture/HumanLimbView.ts#HumanLimbView.merged

## @evidence contracts/development/common.md#meaningful-documentation

States the fit's three kinds of edit, how each is replayed and the unchanged case.

## @evidence contracts/development/implementation.md#principled-implementation

The fit's edits are order-preserving filters, appends and one in-place replacement of its source's joints; an order-preserving selection commutes with them, so replaying them on the whole pose by each record's index gives the filters' and appends' result on the whole pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The kept set, the replaced and appended records, then one walk of the whole pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kept record is recognised by identity, never by its bone or its values; the one in-place replacement is the named bone's, matched in order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One walk of the whole pose's joints and two set builds over the reduced ones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each result is merged once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned pose sharing the unchanged records.
