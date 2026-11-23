# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls

## @evidence contracts/development/common.md#meaningful-documentation

Describes pose-derived channel paths, degree/millimetre bounds and side-qualified anatomical chain selections; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Pose-derived channel paths, degree/millimetre bounds and side-qualified anatomical chain selections. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanRigControls; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing RigControls contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls.Template

## @evidence contracts/development/common.md#meaningful-documentation

Resolve either public side spelling into one canonical row template.

## @evidence contracts/development/design.md#principled-representation

Resolve either public side spelling into one canonical row template.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanRigControls.Template is the canonical exchange used by AutoMovieHumanPoseChannelTemplate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPoseChannelTemplate for resolve either public side spelling into one canonical row template.

# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls.NumericPath

## @evidence contracts/development/common.md#meaningful-documentation

Public numeric leaves remain the sole channel-schema authority.

## @evidence contracts/development/design.md#principled-representation

Public numeric leaves remain the sole channel-schema authority. This projection keeps { [K in keyof T & string]-?: NonNullable<T[K]> extends number ? K : NonNullable<T[K]> extends object ? `${K}.${NumericPath<NonNullable<T[K]>>}` : never; }[keyof T & string] tied to its canonical owner instead of copying its field shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanRigControls.NumericPath is the canonical exchange used by AutoMovieHumanPoseChannel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPoseChannel for public numeric leaves remain the sole channel-schema authority.

# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls.Expand

## @evidence contracts/development/common.md#meaningful-documentation

Resolve the canonical table's side placeholder to the public own-side union.

## @evidence contracts/development/design.md#principled-representation

Resolve the canonical table's side placeholder to the public own-side union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanRigControls.Expand is the canonical exchange used by AutoMovieHumanJointName.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanJointName for resolve the canonical table's side placeholder to the public own-side union.

# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls.IBoundsResult

## @evidence contracts/development/common.md#meaningful-documentation

Inclusive clinical lower and upper bounds in degrees for an angular pose channel. A supplied current pose lets the runtime owner apply the flexion-dependent tibial interval.

## @evidence contracts/development/design.md#principled-representation

Inclusive clinical lower and upper bounds in degrees for an angular pose channel. A supplied current pose lets the runtime owner apply the flexion-dependent tibial interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanRigControls.IBoundsResult is the canonical exchange used by AutoMovieHumanRigControls.bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanRigControls input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/skeleton/IAutoMovieHumanRigControls.ts#IAutoMovieHumanRigControls.IMillimetreBoundsResult

## @evidence contracts/development/common.md#meaningful-documentation

Inclusive lower and upper bounds in millimetres for a jaw translation or opening channel. This result does not admit a jaw channel into the angular degree API.

## @evidence contracts/development/design.md#principled-representation

Inclusive lower and upper bounds in millimetres for a jaw translation or opening channel. This result does not admit a jaw channel into the angular degree API.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanRigControls.IMillimetreBoundsResult is the canonical exchange used by AutoMovieHumanRigControls.millimetreBounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanRigControls input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
