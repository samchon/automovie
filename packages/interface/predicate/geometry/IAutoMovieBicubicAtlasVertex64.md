# src/geometry/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJet

## @evidence contracts/development/common.md#meaningful-documentation

The callable describes its prepared plan and query coordinates, fresh result tuples, and failure at the requested sample.

## @evidence contracts/development/design.md#principled-representation

The vertex owner evaluates one prepared bicubic patch sample and computes a local normal from its analytic tangents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callable works on the prepared plan without embedding registry traversal or sharing policy in its result.

# src/geometry/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJetSample

## @evidence contracts/development/common.md#meaningful-documentation

The three fields distinguish physical position, the analytic normal and local regularity, including a zero normal for a singular sample.

## @evidence contracts/development/design.md#principled-representation

The vertex preparation result retains model millimetres and the analytic immersion status before owner substitution or metre conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result holds one local analytic observation. Shared corner or boundary authority and vertex indexing are handled later.

# src/geometry/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJetSample.position

## @evidence contracts/development/common.md#meaningful-documentation

The position uses millimetres on the original root grid before conversion or replacement by a shared vertex.

# src/geometry/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJetSample.normal

## @evidence contracts/development/common.md#meaningful-documentation

The documented normal is the normalized U-by-V cross product or an exact zero vector for a singular sample.

# src/geometry/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJetSample.regular

## @evidence contracts/development/common.md#meaningful-documentation

The flag reports local immersion and distinguishes a finite singular sample from a regular one.
