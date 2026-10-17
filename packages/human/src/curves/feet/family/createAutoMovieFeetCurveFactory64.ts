import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { AutoMovieFootBoundary64 as A } from "./AutoMovieFootBoundary64";
import { AutoMovieFootBranches64 as B } from "./AutoMovieFootBranches64";
import { AutoMovieFootFamily64 as F } from "./AutoMovieFootFamily64";
import { AutoMovieFootFrame64 as G } from "./AutoMovieFootFrame64";
import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import { AutoMovieFootProfile64 as P } from "./AutoMovieFootProfile64";
import { AutoMovieFootToes64 as T } from "./AutoMovieFootToes64";
import { AutoMovieFootValidation64 as V } from "./AutoMovieFootValidation64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/**
 * Generate bilateral foot/toe curves from dimensional recipes and current leg ankles.
 *
 * Each four-span ankle supplies world-millimetre P and full J per proximal
 * millimetre, on an outer/front/inner/back quarter-turn chart. A proper bone-local
 * gauge resolves the cut centre before placement; anatomical chirality is separate.
 * Main courses and toe branches query the same registered longitudinal supports.
 *
 * Treat the supplied recipes as read-only for the factory's lifetime. Malformed
 * dimensions, incompatible ankle charts or unresolved transitions throw before a
 * result is returned. The region consumes both ankles and publishes no new boundary.
 * Controls describe construction only; they do not certify skin or global topology.
 */
export function createAutoMovieFeetCurveFactory64(
  parameters: D.Parameters,
): R.Factory & {
  /** Build the same operators used by construct, retaining physical section queries. */
  generate(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): Readonly<Record<"left" | "right", F.Model>>;
} {
  V.parameters(parameters);
  function generate(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): Record<"left" | "right", F.Model> {
    const result: Partial<Record<"left" | "right", F.Model>> = {};
    for (const side of ["left", "right"] as const) {
      const input: D.Side = parameters.sides[side];
      const binding: D.Binding = parameters.bindings[side];
      const ankle: C.Boundary | undefined = upstream.get(binding.boundaryId);
      if (
        !ankle ||
        ankle.id !== binding.boundaryId ||
        ankle.section.spans.length !== 4 ||
        ankle.fullJ.length !== 4 ||
        ankle.section.type !== "cubicBezier" ||
        !ankle.section.closed ||
        ankle.section.unit !== "mm" ||
        ankle.section.phaseIntervals.length !== 4 ||
        [...ankle.section.spans, ...ankle.fullJ].some(
          (span: C.Span): boolean =>
            span.length !== 4 ||
            span.some(
              (p: C.Vector): boolean =>
                p.length !== 3 ||
                p.some((v: number): boolean => !Number.isFinite(v)),
            ),
        ) ||
        ankle.longitudinalAxis.some(
          (v: number): boolean => !Number.isFinite(v),
        ) ||
        ankle.longitudinalUnit !== "mm" ||
        ankle.section.phaseUnit !== "turn" ||
        ankle.section.phaseIntervals.some((v: number): boolean => v !== 0.25)
      )
        throw new Error("Actual quarter-pole one-turn ankle P/full J required");
      const frame: M.Frame = G.construct(context, binding, input, ankle);
      const dims: D.Side["dimensions"] = input.dimensions;
      if (
        Object.values(dims).some((v: number): boolean => !Number.isFinite(v)) ||
        !(dims.collarDrop_mm > 0) ||
        !(dims.breadth_mm > 0) ||
        !(dims.forefootWebReach_mm > 0) ||
        !(dims.heelReach_mm > 0)
      )
        throw new Error(
          "Finite physical dimensions with positive reaches/drop required",
        );
      const drop: number = dims.collarDrop_mm;
      const tensor: A.Tensor = A.construct(ankle, drop);
      const collar: C.Span[] = A.section(tensor, 1);
      const model: F.Model = {
        frame,
        ankle,
        tensor,
        drop,
        collar,
        curves: [],
        families: {},
      };
      const curves: F.Curve[] = model.curves;
      const prefix: string = side + ".foot";
      curves.push(
        {
          name: prefix + ".sharedAnkle",
          role: "sharedBoundary",
          closed: true,
          spans: ankle.section.spans.slice(),
          phaseUnit: "turn",
          intervals: [0.25, 0.25, 0.25, 0.25],
        },
        {
          name: prefix + ".sharedCollar",
          role: "sharedBoundaryCollar",
          closed: true,
          spans: collar,
          phaseUnit: "turn",
          intervals: [0.25, 0.25, 0.25, 0.25],
        },
      );
      for (let i: number = 0; i < 4; i++)
        for (const t of [0, 0.5]) {
          const p: C.Vector = M.bezier(ankle.section.spans[i]!, t);
          const q: C.Vector = M.bezier(collar[i]!, t);
          curves.push({
            name: prefix + `.collarJet${i}_${t === 0 ? "0" : "0.5"}`,
            role: "sharedBoundaryDerivative",
            closed: false,
            spans: [
              [
                p,
                M.add(p, M.mul(M.sub(q, p), 1 / 3)),
                M.add(p, M.mul(M.sub(q, p), 2 / 3)),
                q,
              ],
            ],
          });
        }
      const floor: number = dims.floorOffsetAlongLocalUp_mm;
      const stations: F.Row[] = [];
      for (const [name, p] of Object.entries(input.courses)) {
        const w: number =
          p.longitudinalRatio *
          (p.longitudinalRatio >= 0
            ? dims.forefootWebReach_mm
            : dims.heelReach_mm);
        const width: number = dims.breadth_mm * p.breadthRatio;
        const center: number = dims.breadth_mm * p.centerOutwardRatio;
        const support: Record<string, C.Vector> = P.main(p, dims, w);
        const world: Record<string, C.Vector> = Object.fromEntries(
          Object.entries(support).map(
            ([key, v]: [string, C.Vector]): [string, C.Vector] => [
              key,
              M.world(frame, v),
            ],
          ),
        );
        const hits: [C.Vector, C.Vector][] = M.intersections(
          collar,
          ankle.fullJ,
          frame,
          w,
        );
        const opened: boolean = hits.length === 2;
        if (opened)
          for (const suffix of ["Outer", "Inner"] as const) {
            const key: "outer" | "inner" =
              suffix === "Outer" ? "outer" : "inner";
            const fraction: number =
              suffix === "Outer"
                ? p.ankleOuterShoulderOutwardFraction
                : p.ankleInnerShoulderOutwardFraction;
            const height: number =
              suffix === "Outer"
                ? p.ankleOuterShoulderHeightFraction
                : p.ankleInnerShoulderHeightFraction;
            world["ankle" + suffix + "Shoulder"] = M.world(frame, [
              center - width / 2 + width * fraction,
              support[key]![1] +
                height * (M.local(frame, collar[0]![0])[1] - support[key]![1]),
              w,
            ]);
          }
        // Named courses are emitted after registering the actual continuous family.
        curves.push({
          name: prefix + ".course." + name,
          role: opened
            ? "rearfootOpenGeneratingCourse"
            : "footGeneratingSection",
          closed: !opened,
          spans: [],
          familyKey: "main",
          station: w,
        });
        const keys: string[] = [
          "outer",
          "plantarOuter",
          "sole",
          "plantarInner",
          "inner",
          ...(opened
            ? ["ankleOuterShoulder", "ankleInnerShoulder"]
            : ["dorsum", "upperOuter", "upperInner"]),
        ];
        stations.push({
          distance: w,
          points: Object.fromEntries(
            keys.map((key: string): [string, C.Vector] => [key, world[key]!]),
          ),
        });
      }
      stations.sort((a: F.Row, b: F.Row): number => a.distance - b.distance);
      const forward: F.Row[] = stations.filter(
        (r: F.Row): boolean => r.distance > 0 && !!r.points.dorsum,
      );
      const rear: F.Row[] = stations.filter(
        (r: F.Row): boolean => r.distance < 0 && !!r.points.dorsum,
      );
      curves.push(
        ...F.rails(
          prefix + ".family",
          stations,
          ["outer", "plantarOuter", "sole", "plantarInner", "inner"],
          frame,
        ),
        ...F.rails(
          prefix + ".ankleWallFamily",
          stations,
          ["ankleOuterShoulder", "ankleInnerShoulder"],
          frame,
        ),
        ...F.rails(
          prefix + ".forefootFamily",
          forward,
          ["dorsum", "upperOuter", "upperInner"],
          frame,
        ),
        ...F.rails(
          prefix + ".heelFamily",
          rear,
          ["dorsum", "upperOuter", "upperInner"],
          frame,
        ),
      );
      const heelLocal: C.Vector = [
        input.heelPole.outwardRatio * dims.breadth_mm,
        floor + input.heelPole.heightAboveFloor_mm,
        -dims.heelReach_mm,
      ];
      const heel: C.Vector = M.world(frame, heelLocal);
      if (rear.length) {
        const center: C.Vector = M.mean(Object.values(rear[0]!.points));
        for (const curve of curves) {
          if (
            !(
              curve.name.startsWith(prefix + ".family.") ||
              curve.name.startsWith(prefix + ".heelFamily.")
            )
          )
            continue;
          const initial: C.Span = curve.spans[0]!;
          const point: C.Vector = initial[0];
          const step: number = stations[1]!.distance - stations[0]!.distance;
          const jet: C.Vector = M.mul(M.sub(initial[1], initial[0]), 3 / step);
          const delta: number = rear[0]!.distance - heelLocal[2];
          const r: C.Vector = M.sub(point, center);
          const radial: C.Vector = M.sub(
            r,
            M.mul(frame.basis[2], M.dot(r, frame.basis[2])),
          );
          // Common cap rounding uses 0.46 of the transverse radial vector;
          // the opposite handle keeps the first rail's physical-distance jet.
          curve.spans.unshift([
            heel,
            M.add(heel, M.mul(radial, 0.46)),
            M.sub(point, M.mul(jet, delta / 3)),
            point,
          ]);
          curve.heelCap = true;
        }
      }
      const transitions: {
        /** Support key to register with the main physical-distance family. */
        semantic: string;

        /** Actual emitted transition controls shared with the operator. */
        curve: F.Curve;

        /** Forward-millimetre endpoints for that transition span. */
        knots: number[];
      }[] = [];
      for (const name of ["instep", "Achilles"] as const) {
        const sign: number = name === "instep" ? 1 : -1;
        const rows: F.Row[] = sign > 0 ? forward : rear.slice().reverse();
        if (!rows.length) continue;
        let best: number = -Infinity;
        let spanIndex: number = 0;
        let time: number = 0;
        // Retain the family's 100-step search per angular span. This selects an
        // approximate front/back collar anchor, not an analytic extremum proof.
        for (let i: number = 0; i < 4; i++)
          for (let k: number = 0; k <= 100; k++) {
            const t: number = k / 100;
            const score: number =
              sign * M.local(frame, M.bezier(collar[i]!, t))[2];
            if (score > best) {
              best = score;
              spanIndex = i;
              time = t;
            }
          }
        const point: C.Vector = M.bezier(collar[spanIndex]!, time);
        const jet: C.Vector = M.bezier(ankle.fullJ[spanIndex]!, time);
        const anchorW: number = M.local(frame, point)[2];
        if (Math.abs(M.dot(jet, frame.basis[2])) < 1e-8)
          throw new Error("Unresolved physical-distance roof transition");
        for (const semantic of ["dorsum", "upperOuter", "upperInner"]) {
          const base: F.Curve = curves.find(
            (c: F.Curve): boolean =>
              c.name ===
              prefix +
                (sign > 0 ? ".forefootFamily." : ".heelFamily.") +
                semantic,
          )!;
          const q: C.Vector = rows[0]!.points[semantic]!;
          const qW: number = rows[0]!.distance;
          const source: C.Span =
            base.spans[sign > 0 ? 0 : base.spans.length - 1]!;
          const step: number =
            sign > 0 ? rows[1]!.distance - qW : qW - rows[1]!.distance;
          const qJet: C.Vector = M.mul(
            sign > 0
              ? M.sub(source[1], source[0])
              : M.sub(source[3], source[2]),
            3 / step,
          );
          let controls: C.Span;
          let knots: number[];
          // Owner jets use signed up-distance; guide jets use forward-distance.
          // These are the existing transition handle rules, with no refit here.
          if (sign > 0) {
            const delta: number = qW - anchorW;
            const ownerDelta: number = M.dot(M.sub(q, point), frame.basis[1]);
            controls = [
              point,
              M.add(point, M.mul(jet, ownerDelta / 3)),
              M.sub(q, M.mul(qJet, delta / 3)),
              q,
            ];
            knots = [anchorW, qW];
          } else {
            const delta: number = anchorW - qW;
            const ownerDelta: number = M.dot(M.sub(point, q), frame.basis[1]);
            controls = [
              q,
              M.add(q, M.mul(qJet, delta / 3)),
              M.sub(point, M.mul(jet, ownerDelta / 3)),
              point,
            ];
            knots = [qW, anchorW];
          }
          const curve: F.Curve = {
            name: prefix + "." + name + "Transition." + semantic,
            role: "sharedBoundaryTransition",
            closed: false,
            spans: [controls],
          };
          curves.push(curve);
          if (sign > 0) {
            curve.supportSemantic = semantic;
            transitions.push({ semantic, curve, knots });
          }
        }
      }
      T.construct(model, input, prefix);
      F.register(
        model,
        "main",
        curves.filter((c: F.Curve): boolean =>
          c.name.startsWith(prefix + ".family."),
        ),
        stations,
        heelLocal[2],
      );
      F.register(
        model,
        "main",
        curves.filter((c: F.Curve): boolean =>
          c.name.startsWith(prefix + ".ankleWallFamily."),
        ),
        stations,
      );
      F.register(
        model,
        "main",
        curves.filter((c: F.Curve): boolean =>
          c.name.startsWith(prefix + ".forefootFamily."),
        ),
        forward,
      );
      F.register(
        model,
        "main",
        curves.filter((c: F.Curve): boolean =>
          c.name.startsWith(prefix + ".heelFamily."),
        ),
        rear,
        heelLocal[2],
      );
      for (const t of transitions)
        (
          model.families.main![t.semantic] ??
          (model.families.main![t.semantic] = [])
        ).push({ knots: t.knots, spans: t.curve.spans, name: t.curve.name });
      for (const curve of curves)
        if (curve.familyKey !== undefined) {
          const evaluated: F.Section = F.section(
            model,
            curve.familyKey,
            curve.station!,
          );
          curve.spans = evaluated.spans;
          curve.closed = evaluated.closed;
        }
      B.construct(model, side, input);
      result[side] = model;
    }
    return result as Record<"left" | "right", F.Model>;
  }
  return {
    region: "feet",
    generate,
    construct(
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): R.Result {
      const models: Record<"left" | "right", F.Model> = generate(
        context,
        upstream,
      );
      return {
        groups: (["left", "right"] as const).map(
          (side: "left" | "right"): R.Result["groups"][number] => ({
            part: "foot",
            side,
            primitives: models[side].curves.map(F.primitive),
          }),
        ),
        boundaries: [],
      };
    },
  };
}
