import { IPortraitEarShape } from "./IPortraitEarShape";

/**
 * The pinna's default tessellation: 112 angular columns, 60 anterior rows and
 * 40 posterior rows.
 *
 * Sampling is independent of the anatomical dimensions and is documented on
 * `IPortraitEarShape.sampling`; it is the single owner of that default, so the
 * document resolver and the validator cannot disagree about it. Callers that
 * change it receive a copy, never this object.
 */
export const portraitEarSampling: Readonly<
  NonNullable<IPortraitEarShape["sampling"]>
> = Object.freeze({ columns: 112, frontRows: 60, backRows: 40 });
