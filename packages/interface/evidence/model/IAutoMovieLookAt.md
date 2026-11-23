# src/model/IAutoMovieLookAt.ts#IAutoMovieLookAt

## @evidence contracts/development/design.md#principled-representation

Follows the VRM 1.0 split between bone and expression gaze; a bone gaze writes clinical flexion and twist on each eye, read through the eye bone's declared axes like every other joint, and validateModel admits the ranges against the eye bones' range of motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed two-variant union where only the bone variant carries ranges, since an expression gaze drives morphs at the authored weight and has nothing to scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

VRM's `inputMaxValue` and `offsetFromHeadBone` are not carried: the first normalizes a gaze angle into the unit weight that automovie's channels already are, and the second serves a look-at target, which the head's gaze owns.

## @evidence contracts/development/common.md#meaningful-documentation

States which channels count as gaze, what each variant drives, why bone gaze exists, the VRM reference and the fields deliberately left out.

# src/model/IAutoMovieLookAt.ts#IAutoMovieLookAt.IBone

## @evidence contracts/development/design.md#principled-representation

Maps unit channel weights linearly onto per-direction degree ranges, VRM's range map at the normalized input, and writes them on the clinical axes the head's gaze already uses, so declared eye axes decide the geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four scalars, one per VRM range map, keep each direction's reach independent without a curve or a per-eye duplicate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ranges are admitted against the eye bones' range of motion rather than clamped at playback, so a gaze the rig cannot hold is refused when the model is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States the axis and sign each direction writes, the weight-to-angle law, inner and outer per eye, composition with authored eye angles, units and admission.

# src/model/IAutoMovieLookAt.ts#IAutoMovieLookAt.IExpression

## @evidence contracts/development/design.md#principled-representation

States VRM's expression gaze explicitly; the viewer drives the gaze channels as it does for a model without a lookAt record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the discriminant, because an expression gaze has nothing to scale or rotate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

VRM's expression weight caps are not modeled; the authored weights reach the morphs unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States what the variant drives and that it equals omitting the record.
