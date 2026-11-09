import { IAutoMovieTextureReference } from "./IAutoMovieTextureReference";

/**
 * Asset id with slot defaults, or an explicit texture sampling declaration.
 *
 * A bare id leaves color space to the material slot and makes no coordinate-source claim. Use the structured form to select transforms and samplers.
 *
 * @evidence contracts/development/design.md#principled-representation The union distinguishes an asset-only citation from a sampling record; `validateTextureBinding` accepts a nonblank id or validates the reference's UV0, slot colour space, transform and sampler fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing reference owns all sampling fields, while the string form carries only identity; viewer resolution dispatches on the same primitive distinction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A string does not pretend to declare physical texture scale: `validateTextureScale` skips its unstated coordinate units, and no asset name selects alternate validation.
 * @evidence contracts/development/common.md#meaningful-documentation Explains the defaults inherited by an asset-only binding, its absent coordinate-source claim and when the structured form is required.
 */
export type AutoMovieTextureBinding = string | IAutoMovieTextureReference;
