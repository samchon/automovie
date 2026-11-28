# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.IPerson

## @evidence contracts/development/common.md#meaningful-documentation

The record contains the sex branch, metre stature and kilogram mass used by the stock torque model. When preparing the canonical body, the person mass is the same input used to distribute segment mass.

## @evidence contracts/development/design.md#principled-representation

The two sex-regression branches fit a boolean. Height and mass use the units of the published regressions. CanonicalBody.prepare resolves the sex and converts stature to metres while carrying the requested body mass through to both profile inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

CanonicalProfile.build forwards this one record to the existing strength model when building its drive axes. The record only carries the three model inputs that vary by person. The strength model owns its adult reference age and coefficients.

# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.IPerson.male

## @evidence contracts/development/common.md#meaningful-documentation

True selects the male Harbo coefficient row and false the female row. McNabb hip torque shares use the kilogram mass independently of the sex branch.

# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.IPerson.height

## @evidence contracts/development/common.md#meaningful-documentation

Metre stature enters the Harbo model's height term. CanonicalBody.prepare converts resolved stature from millimetres before it supplies the value.

# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.IPerson.mass

## @evidence contracts/development/common.md#meaningful-documentation

Kilogram body mass supplies the Harbo mass term and the multiplier for McNabb's per-kilogram hip torque shares.

# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.AGE

## @evidence contracts/development/common.md#meaningful-documentation

The fixed 40-year adult reference contributes only to the regressions that have an age term. It is a stock profile convention shared across prepared performers.

# src/skeleton/internal/AutoMovieHumanJointStrength.ts#AutoMovieHumanJointStrength.of

## @evidence contracts/development/common.md#meaningful-documentation

A person's sex branch, metre stature and kilogram mass feed the named clinical axis of a humanoid bone. The two return values are newton-metre peak magnitudes toward the clinical maximum and minimum. An unmeasured channel has no result.

## @evidence contracts/development/implementation.md#principled-implementation

The channel table determines which published movement supplies each direction. The side prefix shares the same movement rows across left and right. Harbo's sex-specific coefficients use age, height and mass and clip negative estimates at zero. McNabb's hip coefficients scale their per-kilogram values by body mass. The profile owns any fallback for an uncovered channel.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bone-and-channel lookup selects at most two constant-time coefficient calculations. A missing row returns immediately. The call builds a caller-owned result and retains no person or joint state.
