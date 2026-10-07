import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * Source-neutral anatomical exterior differences on a shared head generation.
 *
 * Every present value requests the generation's corresponding source trait,
 * including zero. Omission preserves that source's neutral. The generation
 * registration supplies units, actual authored support, bounds and the one
 * body channel that carries both skin partitions and their attached parts.
 * Raw clinical observations remain in their separate anatomical record.
 *
 * @evidence contracts/common.md#principled-implementation A closed trait map carries finite numerical differences independently of geometry-source coordinates and clinical observations.
 * @evidence contracts/common.md#clear-and-simple-design One named record contains only registered source-anatomical traits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No omitted source is substituted and zero does not bypass requested-field availability.
 * @evidence contracts/common.md#meaningful-documentation States omission, explicit zero, registration and the clinical separation.
 * @evidence contracts/modeling.md#parameter-channels The closed paths identify each paired trait; zero is its declared source neutral and the registration owns its sign and intentional coupling.
 * @evidence contracts/anatomy.md#parametric-authority A person supplies named anatomical displacement differences without vertices, curves or sculpt resources.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShape extends Partial<Record<AutoMovieHumanPersonHeadShapeField, number>> {}
