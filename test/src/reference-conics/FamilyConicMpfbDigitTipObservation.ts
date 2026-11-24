import {
  AutoMovieViewOutline as Outline,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanCourseRuns as CourseRuns,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewPart,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** Exact indexed distal ownership and transverse cut observations. */
export namespace FamilyConicMpfbDigitTipObservation {
  /** Borrow the exact section cutter and expose both transverse directions. */
  export function observeExtents(
    family: IAutoMovieHumanConicLoft.IFamily,
    view: IAutoMovieViewPart,
    from: number,
    tip: number,
    held: boolean,
    cut: (frame: IAutoMovieLoftSectionFrame) => P2[],
  ): NonNullable<Tips.ICap["extents"]> {
    const joints: number[] = CourseRuns.joints(family.centres, family.halves);
    const joint: number = joints.at(-2)!;
    const blendEnd: number = held ? tip : Math.min(joint, from);
    const protectedStation: number = family.rootSectionMark ?? family.knots[0]!;
    const previous: number = joints.at(-3) ?? protectedStation;
    const transition: number = Math.min(blendEnd, (joint + previous) / 2);
    const firstOwned: number | undefined = family.knots.find(
      (station): boolean => station > protectedStation,
    );
    const start: number = held
      ? from
      : Math.max(
          firstOwned ?? Infinity,
          ...family.knots.filter((station): boolean => station <= transition),
        );
    if (!(start > protectedStation && start < blendEnd && blendEnd <= tip))
      throw new Error(
        "No independent toe transition after its protected section",
      );
    // The regular conic wall and cap already observe neighbouring lengths one
    // millimetre apart. Use that source spacing here as well.
    const intervals: number = Math.ceil(tip - start);
    const bounds = outlineBounds(view, tip);
    const resolve = Conic.prepare(family.layout);
    return {
      joint,
      from: start,
      blendEnd,
      rows: Array.from({ length: intervals + 1 }, (_, i): Tips.IExtent => {
        const station: number =
          i === intervals ? tip : start + ((tip - start) * i) / intervals;
        let stock: Tips.IExtent["stock"] = null;
        let angular: Tips.IExtent["angular"];
        if (station === tip) stock = [0, 0, 0, 0];
        else {
          try {
            const loop: P2[] = cut(view.axis.at(station));
            const u: number[] = loop.map((point): number => point[0]);
            const v: number[] = loop.map((point): number => point[1]);
            stock = [
              Math.min(...u),
              Math.max(...u),
              Math.min(...v),
              Math.max(...v),
            ];
            const centred = Families.centred(loop, false);
            const { input, guides } = resolve(
              Families.fields(centred.points, false),
            );
            angular = {
              touch: guides.map((guide, phase): number => {
                const axis: number = (phase + 1) % 2;
                const low: number = stock![2 * axis]!;
                const high: number = stock![2 * axis + 1]!;
                return (
                  (2 * (input.points[guide]![axis]! + centred.origin[axis]!) -
                    low -
                    high) /
                  (high - low)
                );
              }),
              shoulder: guides.map((guide): number => input.shoulders[guide]!),
            };
          } catch {
            // The cut owner declines open contours or loops with a foreign ray.
          }
        }
        return {
          station,
          stock,
          original: bounds(station),
          ...(angular === undefined ? {} : { angular }),
        };
      }),
    };
  }

  /** Read the exact four scalar guides in their declared parameter. */
  export function outlineBounds(
    view: IAutoMovieViewPart,
    tip: number,
  ): (station: number) => Tips.IExtent["original"] {
    const original = [
      view.front.negative,
      view.front.positive,
      view.side.negative,
      view.side.positive,
    ].map((guide) => {
      const source = Outline.create(guide, { top: tip });
      if ("contract" in source) throw new Error(source.detail);
      return source;
    });
    return (station) =>
      original.map((guide): number => {
        const value: number | string = Outline.value(guide, station);
        if (typeof value === "string") throw new Error(value);
        return value;
      }) as Tips.IExtent["original"];
  }

  /**
   * Flood the part of the indexed skin on the distal side of the actual loop.
   * Every clipped triangle with positive area has an original distal vertex.
   * Those vertices connect along the original edges without crossing the cut.
   */
  export function distalComponent(
    source: Mpfb.IGeometry,
  ): (
    frame: IAutoMovieLoftSectionFrame,
    witness: P2,
    tipDirection?: P3,
  ) => { pole: P3; indices: number[] } {
    const points: P3[] = Array.from(
      { length: source.body.positions.length / 3 },
      (_, i): P3 => [
        source.body.positions[3 * i]!,
        source.body.positions[3 * i + 1]!,
        source.body.positions[3 * i + 2]!,
      ],
    );
    const faces: number[][] = Array.from(
      { length: source.body.indices.length / 3 },
      (_, i): number[] => [
        source.body.indices[3 * i]!,
        source.body.indices[3 * i + 1]!,
        source.body.indices[3 * i + 2]!,
      ],
    );
    const incident: number[][] = points.map((): number[] => []);
    faces.forEach((face, i): void => {
      for (const v of face) incident[v]!.push(i);
    });
    return ({ origin, u, v }, witness, tipDirection) => {
      const normal: P3 = Vec.cross(v, u);
      const target: P3 = Vec.add(
        origin,
        Vec.add(Vec.scale(u, witness[0]), Vec.scale(v, witness[1])),
      );
      const offsets: number[] = points.map((p): number =>
        Vec.dot(Vec.sub(p, origin), normal),
      );
      let seed: number = -1;
      let best: number = Infinity;
      for (const face of faces) {
        for (let k: number = 0; k < face.length; ++k) {
          const a: number = face[k]!,
            b: number = face[(k + 1) % face.length]!;
          const da: number = offsets[a]!,
            db: number = offsets[b]!;
          if (da > 0 === db > 0) continue;
          const p: P3 = Vec.add(
            points[a]!,
            Vec.scale(Vec.sub(points[b]!, points[a]!), da / (da - db)),
          );
          const distance: number = Math.hypot(...Vec.sub(p, target));
          if (distance >= best) continue;
          best = distance;
          seed = da > 0 ? a : b;
        }
      }
      // Rounding guard for recovering the same plane/edge intersection in mm.
      const tolerance: number =
        64 * Number.EPSILON * Math.max(1, Math.hypot(...target));
      if (seed < 0 || best > tolerance)
        throw new Error(
          `No indexed continuation of the distal cut (${best} mm)`,
        );
      let tip: number = seed;
      const todo: number[] = [seed];
      const seen: Set<number> = new Set(todo);
      const retained: Set<number> = new Set();
      for (let i: number = 0; i < todo.length; ++i) {
        const vertex: number = todo[i]!;
        if (
          tipDirection === undefined
            ? offsets[vertex]! > offsets[tip]!
            : Vec.dot(points[vertex]!, tipDirection) >
              Vec.dot(points[tip]!, tipDirection)
        )
          tip = vertex;
        for (const f of incident[vertex]!) {
          retained.add(f);
          for (const next of faces[f]!) {
            if (offsets[next]! <= 0 || seen.has(next)) continue;
            seen.add(next);
            todo.push(next);
          }
        }
      }
      return {
        pole: points[tip]!,
        indices: [...retained].flatMap((f): number[] => faces[f]!),
      };
    };
  }
}
