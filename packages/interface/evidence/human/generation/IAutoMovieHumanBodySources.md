# src/human/generation/IAutoMovieHumanBodySources.ts#IAutoMovieHumanBodySources

## @evidence contracts/development/common.md#meaningful-documentation

Describes invocation-owned source factories, explicit raw requests and observed preparation state; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Invocation-owned source factories, explicit raw requests and observed preparation state. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanBodySources; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing BodySources contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanBodySources.ts#IAutoMovieHumanBodySources.IOriginal

## @evidence contracts/development/common.md#meaningful-documentation

Common direct boundary and explicit source factories, before tree assembly or any raw request.

## @evidence contracts/development/design.md#principled-representation `stature`: Shared source stature in calibration mm, without acquiring a head source. `frame`: Same aggregate skin-based placement convention directly consumed by S00 and the head inputs. `diagnostics`: Only actually requested common/placement/raw findings; missing stages are not passed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodySources.create. Also types AutoMovieHumanBodySources.milliseconds, AutoMovieHumanBodySources.common.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Prepared common inputs, receiver boundary, trunk constraints and rest can be passed directly to the operation that needs them. A completed production result belongs to its own scope. The independent source request has no mutable product or latest parent field.

# src/human/generation/IAutoMovieHumanBodySources.ts#IAutoMovieHumanBodySources.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Already resolved production inputs; their calibration units are unchanged.

## @evidence contracts/development/design.md#principled-representation `params`: Borrowed immutable public inputs. `limbs`: Identical resolved calibration-mm limb inputs. `headInputs`: Canonical head inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodySources.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Explicit genuine coupled-parent request supplied by the production owner.

# src/human/generation/IAutoMovieHumanBodySources.ts#IAutoMovieHumanBodySources.ICommon

## @evidence contracts/development/common.md#meaningful-documentation

Actual common neck definitions, requested before either adjoining part consumes them.

## @evidence contracts/development/design.md#principled-representation `neckSource`: Registered numerical neck inputs, before head curves or parts. `upperSupport`: Direct original centre/plane support for the legacy upper trunk scalar, without a head mass. `pose`: The identical placed numerical layout consumed by the head and body joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the common preparation and consumed by head, trunk and body-only placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `neckSource`, `upperSupport`, `pose`; callers supply the complete record.
