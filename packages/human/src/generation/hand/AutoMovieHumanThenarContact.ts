import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieHumanHandAttachment,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
  IAutoMovieLoftViewFullSource as Source,
} from "@automovie/interface";

import { AutoMovieHumanHandParentRead as Parent } from "./AutoMovieHumanHandParentRead";

/** The continuing palm and first thumb segment own the thenar contact. */
export namespace AutoMovieHumanThenarContact {
  /** One transverse intersection of the native surfaces. */
  export interface IPoint {
    /** Original receiving station or its proximal continuation, millimetres. */
    s: number;
    /** Original palm station, millimetres. */
    hostStation: number;
    /** Original palm phase in radians. */
    hostPhase: number;
    /** Material phase on the native thumb, radians. */
    phase: number;
    /** Common world tangent per radian of the thumb's phase. */
    tangent: P3;
  }

  /** Read the crossed sheets and their bounded regular contact. */
  export function prepare(
    palm: IAutoMovieViewPart,
    thumb: IAutoMovieViewPart,
    attachment: IAutoMovieHumanHandAttachment.IConnection,
  ) {
    const host: Source.IReader = Full.create(palm);
    const part: Source.IReader = Full.create(thumb);
    const proximal: number = part.domain[0];
    const span: number =
      (thumb.stations.find((s): boolean => s > proximal) ?? proximal) -
      proximal;
    const shaft: number | undefined = thumb.side.positive.knots.find(
      ({ site }): boolean => site === "shaft 0",
    )?.station;
    if (
      !(span > 0) ||
      shaft === undefined ||
      !(shaft > proximal && shaft < part.domain[1])
    )
      return "The original first-metacarpal segment has no regular shaft bracket";
    const parent = Parent.prepare(attachment.parent);
    const start = part.pointAt(proximal);
    const end = part.pointAt(shaft);
    const count: number = Math.max(palm.samples, thumb.samples);
    const turn: number = 2 * Math.PI;
    // The parent-reader root already uses this numerical coordinate agreement.
    const tolerance: number = 1e-9;
    const project = (s: number, p: P3) => ({ s, p, parent: parent.read(p) });
    const points: (IPoint | string)[] = Array.from(
      { length: count },
      (_, k) => {
        const phase: number = (turn * k) / count;
        const latest = project(shaft, end(phase));
        let earliest = project(proximal, start(phase));
        if (latest.parent === null || earliest.parent === null)
          return "the first segment leaves the actual palm's normal-plane chart";
        if (!(latest.parent.margin < 0))
          return "the first shaft row is not outside the original palm";
        const root = part.jet(proximal, phase);
        // ESTIMATE. The first native tangent is the least-degree continuation
        // when the regular source begins just outside the original palm.
        const continuation = (s: number): P3 =>
          Vec.add(root.p, Vec.scale(root.u, s - proximal));
        if (!(earliest.parent.margin >= 0)) {
          for (let d: number = span; d < shaft - proximal; d *= 2) {
            earliest = project(proximal - d, continuation(proximal - d));
            if (earliest.parent === null || earliest.parent.margin >= 0) break;
          }
        }
        if (earliest.parent === null || earliest.parent.margin < 0)
          return "the proximal source does not meet the palm in the first segment's reach";
        const outside =
          earliest.s < proximal ? project(proximal, start(phase)) : latest;
        const hit = AutoMovieIllinois.select(
          (s) =>
            project(s, s >= proximal ? part.point(s, phase) : continuation(s)),
          ({ parent }): number => parent?.margin ?? NaN,
          [earliest.s, earliest],
          [outside.s, outside],
          tolerance,
          100,
        );
        if (
          hit === null ||
          hit.parent === null ||
          !(Math.abs(hit.parent.margin) <= tolerance)
        )
          return "the native intersections do not give a finite regular contact root";
        const own =
          hit.s >= proximal
            ? part.jet(hit.s, phase)
            : {
                u: root.u,
                v: Vec.add(root.v, Vec.scale(root.uv, hit.s - proximal)),
              };
        const hostPhase: number = Math.atan2(
          hit.parent.local[1],
          hit.parent.local[0],
        );
        const original = host.jet(hit.parent.station, hostPhase);
        const normal: P3 | null = Vec.unit(Vec.cross(original.u, original.v));
        if (normal === null)
          return "the parent's original tangent plane is singular";
        const radial: number = Vec.dot(
          normal,
          Vec.sub(original.p, hit.parent.frame.origin),
        );
        const speed: number = Vec.dot(normal, own.u);
        if (!(radial * speed > 0))
          return "a contact does not leave the parent transversely";
        const tangent: P3 = Vec.sub(
          own.v,
          Vec.scale(own.u, Vec.dot(normal, own.v) / speed),
        );
        const gap: number = Vec.norm(Vec.sub(original.p, hit.p));
        if (!(Vec.norm(tangent) > 0 && gap <= tolerance))
          return "the original surfaces disagree on the first web's contact jet";
        return {
          s: hit.s,
          hostStation: hit.parent.station,
          hostPhase,
          phase,
          tangent,
        };
      },
    );
    const refusals: string[] = points.filter(
      (p): p is string => typeof p === "string",
    );
    if (refusals.length !== 0)
      return [...new Set(refusals)]
        .map(
          (reason): string =>
            `${refusals.filter((r): boolean => r === reason).length}/${count}: ${reason}`,
        )
        .join(". ");
    return {
      host,
      part,
      span,
      shaft,
      points: points.filter((p): p is IPoint => typeof p !== "string"),
    };
  }
}
