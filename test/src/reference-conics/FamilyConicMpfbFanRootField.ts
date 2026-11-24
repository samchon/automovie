import {
  AutoMovieLoftSectionNative as Native,
  AutoMovieNaturalSpline as Spline,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanConicLoft as Loft,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftViewRead,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { preserveFamilyConicDistalSection } from "./preserveFamilyConicDistalSection";

/** The exact fitted four-conic field under an independently measured digit root. */
export namespace FamilyConicMpfbFanRootField {
  /**
   * Use the actual fitted field through its synthetic departure. Above the
   * independently measured root, the existing closed child keeps ownership. The
   * last part of the declared departure copies its native 2-jet by the same
   * quintic as the distal source handoff.
   */
  export function close(
    family: IAutoMovieHumanConicLoft.IFamily,
    sites: readonly number[],
    closed: IAutoMovieViewPart,
  ): IAutoMovieViewPart {
    const mark: number = family.rootSectionMark!;
    const before: number | undefined = family.knots
      .filter((s): boolean => s < mark)
      .at(-2);
    const retained: IAutoMovieLoftSectionConnect.IOriginal | undefined =
      closed.originalSection;
    if (before === undefined || retained === undefined) return closed;
    const open: IAutoMovieViewPart = Loft.part(family, [...sites], false);
    const prefix: IAutoMovieLoftSectionConnect.IOriginal = prepare(
      family,
      mark,
    );
    const handoff: IAutoMovieLoftSectionConnect.IOriginal =
      preserveFamilyConicDistalSection(
        { ...open, originalSection: prefix },
        closed,
        before,
        mark,
      );
    return {
      ...closed,
      originalSection: {
        ...retained,
        point: (s, phase) =>
          s < mark ? handoff.point(s, phase) : retained.point(s, phase),
        phase: (s, phase) =>
          s < mark ? handoff.phase(s, phase) : retained.phase(s, phase),
        jet: (s, phase) =>
          s < mark ? handoff.jet(s, phase) : retained.jet(s, phase),
      },
    };
  }

  /**
   * Prepare the original degree-three fields without reinterpolating resolved
   * guides.
   */
  function prepare(
    family: IAutoMovieHumanConicLoft.IFamily,
    mark: number,
  ): IAutoMovieLoftSectionConnect.IOriginal {
    const fields = family.values.map((row) => Spline.create(family.knots, row));
    const { layout } = family;
    const shape = Conic.prepare(layout);
    const extents: number[] = Conic.extents(layout);
    const { at, shoulders } = Conic.offsets(layout);
    const touch: number[] = at.map((f, q): number => f + ((q + 1) % 2));
    const read = (s: number): IAutoMovieLoftViewRead.IJets => {
      const exact: [number, number, number][] = fields.map((field) =>
        Spline.read(field, s),
      );
      const { input } = shape(exact.map(([value]): number => value));
      return {
        extents: extents.map(
          (f, q): [number, number, number] =>
            exact[f]!.map((x): number => (q < 2 ? x : -x)) as [
              number,
              number,
              number,
            ],
        ),
        shoulders: input.shoulders.map((value, q): [number, number, number] => {
          const source: [number, number, number] = exact[shoulders + q]!;
          return value === source[0] ? source : [value, 0, 0];
        }),
        touch: touch.map((f, q): [number, number, number] => {
          const value: number = input.points[q]![(q + 1) % 2]!;
          const source: [number, number, number] = exact[f]!;
          if (value === source[0]) return source;

          // A clipped touch belongs to its adjacent extent, with the same
          // share selected by Conic.prepare. Apply that share to its 2-jet.
          const positiveAfter: boolean = q === 0 || q === 3;
          const next: number = (q + (value > 0 === positiveAfter ? 1 : 3)) % 4;
          const extent: [number, number, number] = exact[extents[next]!]!;
          const share: number = value / extent[0];
          return [value, share * extent[1], share * extent[2]];
        }),
      };
    };
    const values = (s: number): IAutoMovieLoftViewRead.IValues => {
      const exact: number[] = fields.map((field): number =>
        Spline.evaluate(field, s),
      );
      const { input } = shape(exact);
      return {
        extents: extents.map((f, q): number =>
          q < 2 ? exact[f]! : -exact[f]!,
        ),
        shoulders: input.shoulders,
        touch: input.points.map((p, q): number => p[(q + 1) % 2]!),
      };
    };
    return {
      name: family.name,
      domain: [family.knots[0]!, mark],
      point: (s, phase) => Native.point(values(s))(phase),
      phase: (s, phase) => Native.phase(values(s))(phase),
      jet: (s, phase) => Native.jet(read(s))(phase),
    };
  }
}
