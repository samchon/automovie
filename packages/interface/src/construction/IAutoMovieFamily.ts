import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * A whole actual endpoint phase function, never a fitted Cartesian snapshot.
 *
 * @evidence contracts/development/design.md#principled-representation The alias preserves the endpoint's complete generating-field alternatives and their physical station/phase semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftSectionSource owns endpoint field identity; LoftSectionConnect uses this alias while capturing and orienting whole families.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The discriminated field remains a real native or basis function, not a sampled Cartesian endpoint substituted for that function.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the complete endpoint-family owner and excludes snapshot semantics.
 */
export type IAutoMovieFamily = IAutoMovieLoftSectionSource.IEndpoint["field"];
