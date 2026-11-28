# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

The bind record names the bones, calibration stature, rear foot planes and neutral ear ray offset. Positions and the head-relative offset are measured in calibration millimetres.

## @evidence contracts/development/design.md#principled-representation

The skeleton law establishes parent-first order and the bind returns the calibration stature used for that geometry. The heel points use the same axes and millimetres as the skeleton. The ear ray offset comes from measured upper auricle height and the sagittal tragion station. Canonical preparation converts the values into its rest frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Canonical preparation reads the bones when creating rest joints, uses the returned stature to scale that geometry, and applies each sided heel point to its stock foot. It also converts the ear ray offset from the same bind frame for the stock head. The bind result carries all four inputs.

# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.IOutput.bones

## @evidence contracts/development/common.md#meaningful-documentation

The consumer may walk the bind bones in order and resolve each parent before its children. Origins and leaf tips are in Human calibration millimetres.

# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.IOutput.stature

## @evidence contracts/development/common.md#meaningful-documentation

Canonical preparation divides resolved stature by this calibration stature before converting the rest coordinates from millimetres to metres.

# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.IOutput.heels

## @evidence contracts/development/common.md#meaningful-documentation

Both values are floor-level points in the Human calibration frame. The normalized heel plane at longitudinal zero is sampled at the hallux prior's tip station and translated by the corresponding leg's transverse placement.

# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.of

## @evidence contracts/development/common.md#meaningful-documentation

The input is the stock performer's Human parameters. The result uses +X forward, +Y up and +Z left in calibration millimetres, with parents before children both rear-plane points and the head-relative ear ray offset.

## @evidence contracts/development/implementation.md#principled-implementation

The skeleton law places limbs, shoulder and head from their parameterized sources. The trunk heights are evaluated on the straight mid-hip–neck-base axis. Each heel comes from longitudinal zero of its normalized foot frame at the hallux-tip station. The corresponding leg translation and side sign put it in the bind frame. The ear's forward offset subtracts the pivot's forward position from the anatomical tragion. Its vertical offset uses the calibrated height of the upper auricle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation resolves the measurement and placement inputs once, builds one joint hierarchy and reads the two foot frames. Both heel reads use the same limb-rest owner as the skeleton. The upper ear station uses the same solved head layout as the bind pivot without solving a separate head or ear mesh. The result is plain caller-owned data.

# src/skeleton/AutoMovieHumanCanonicalBind.ts#AutoMovieHumanCanonicalBind.IOutput.earRayOffset

## @evidence contracts/development/common.md#meaningful-documentation

The offset is measured from the head pivot in Human calibration millimetres. The ray begins in the sagittal plane at the tragion's anterior position and upper auricle height.
