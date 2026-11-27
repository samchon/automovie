import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryCurveBundle,
} from "@automovie/interface";

import { rebindRecoveryCurveAuthorities } from "./rebindRecoveryCurveAuthorities";
import { convertRecoveryCurve } from "./convertRecoveryCurve";

/*
 * Copy a saved recovery record into the selected cubic coefficient basis. Every
 * cubic at the record's declared curve places is converted by
 * `convertRecoveryCurve`: a fit's or override's curve, each closed
 * loop of its loft or sections, each open arc of its reports, and each curve
 * override. Original phase widths, directions, names and metadata survive
 * unchanged, and the returned record is a copy that shares nothing with the
 * input. Surface nets keep their own representation; their controls bound to a
 * converted curve are reissued from it (`rebindRecoveryCurveAuthorities`).
 * Parameter input: The saved record.
 * Parameter format: The basis to express its cubics in.
 * Returns: The record with every cubic in that basis.
 * When a cubic lacks one positive phase width per span, or a
 * bound surface control disagrees with its curve authority.
 */
export function convertRecoveryCurves<
  T extends IAutoMovieRecoveryCurveBundle,
  Format extends AutoMovieRecoveryCurveFormat,
>(input: T, format: Format): AutoMovieRecoveryCurveData<T, Format>;

/*
 * The implementation: the record with each declared cubic converted.
 */
export function convertRecoveryCurves(
  input: IAutoMovieRecoveryCurveBundle,
  format: AutoMovieRecoveryCurveFormat,
): IAutoMovieRecoveryCurveBundle {
  const owned: IAutoMovieRecoveryCurveBundle = structuredClone(input);
  const curve = (
    value: IAutoMovieRecoveryCurveBundle.Curve,
  ): IAutoMovieRecoveryCurveBundle.Curve =>
    convertRecoveryCurve(value, format);
  const sections = (
    list: readonly IAutoMovieRecoveryCurveBundle.ISection[],
  ): IAutoMovieRecoveryCurveBundle.ISection[] =>
    list.map(
      (
        section: IAutoMovieRecoveryCurveBundle.ISection,
      ): IAutoMovieRecoveryCurveBundle.ISection => ({
        ...section,
        loops: section.loops.map(
          (loop: { curve: IAutoMovieRecoveryCurveBundle.Curve }) => ({
            ...loop,
            curve: curve(loop.curve),
          }),
        ),
      }),
    );
  const result: IAutoMovieRecoveryCurveBundle = {
    ...owned,
    ...(owned.curve === undefined ? {} : { curve: curve(owned.curve) }),
    ...(owned.loft === undefined
      ? {}
      : { loft: { ...owned.loft, sections: sections(owned.loft.sections) } }),
    ...(owned.sections === undefined
      ? {}
      : { sections: sections(owned.sections) }),
    ...(owned.reports === undefined
      ? {}
      : {
          reports: owned.reports.map(
            (report: {
              open: readonly { curve: IAutoMovieRecoveryCurveBundle.Curve }[];
            }) => ({
              ...report,
              open: report.open.map(
                (arc: { curve: IAutoMovieRecoveryCurveBundle.Curve }) => ({
                  ...arc,
                  curve: curve(arc.curve),
                }),
              ),
            }),
          ),
        }),
    ...(owned.curveOverrides === undefined
      ? {}
      : {
          curveOverrides: owned.curveOverrides.map(
            (override: { curve: IAutoMovieRecoveryCurveBundle.Curve }) => ({
              ...override,
              curve: curve(override.curve),
            }),
          ),
        }),
  };
  rebindRecoveryCurveAuthorities(input, result);

  // The result is the input's record with each declared curve place in the
  // requested basis, which is what the mapped type of the overload states.
  return result;
}
