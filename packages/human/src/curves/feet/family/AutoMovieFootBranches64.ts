import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootFamily64 as F } from "./AutoMovieFootFamily64";
import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** Four shared web nodes and twenty actual toe support/full-distance-jet consumers. */
export namespace AutoMovieFootBranches64 {
  /**
   * Append four shared web courses and four root guides for each of five toes.
   * The actual main section supplies dorsal/plantar starts; neighbouring branches
   * reuse one saddle position and the toe operator supplies each terminal P/jet.
   * Parent jets use a symmetric 0.005 mm difference of the same section family.
   * The 0.22 saddle handle scale is a rounding convention, not measured anatomy.
   * Mutates model.curves; missing crossings or reversed web-to-root intervals throw.
   */
  export function construct(
    model: F.Model,
    side: string,
    params: D.Side,
  ): void {
    const dims: D.Side["dimensions"] = params.dimensions;
    const branch: D.Side["branches"] = params.branches;
    const frame: M.Frame = model.frame;
    const floor: number = dims.floorOffsetAlongLocalUp_mm;
    const width: number = dims.breadth_mm;
    const reach: number = dims.forefootWebReach_mm;
    const parentW: number = branch.parentLongitudinalRatio * reach;
    const parent: F.Section = F.section(model, "main", parentW);
    const prefix: string = side + ".foot";
    const nodes: Record<string, C.Vector> = {};
    const world: (u: number, y: number, w: number) => C.Vector = (
      u: number,
      y: number,
      w: number,
    ): C.Vector => M.world(frame, [u, y, w]);
    // Retain the source family's declared symmetric 0.005 mm derivative.
    const parentJet: (theta: number) => C.Vector = (theta: number): C.Vector =>
      M.mul(
        M.sub(
          F.point(model, "main", parentW + 0.005, theta),
          F.point(model, "main", parentW - 0.005, theta),
        ),
        100,
      );
    for (const [n, s] of Object.entries(branch.saddles)) {
      const point: C.Vector = world(
        s.outwardRatio * width,
        floor + s.heightAboveFloor_mm,
        s.longitudinalRatio * reach,
      );
      nodes["web" + n] = point;
      const upper: ReturnType<typeof M.crossing> = M.crossing(
        parent.spans,
        frame,
        s.outwardRatio * width,
        true,
      );
      const lower: ReturnType<typeof M.crossing> = M.crossing(
        parent.spans,
        frame,
        s.outwardRatio * width,
        false,
      );
      const delta: number = M.dot(M.sub(point, upper.point), frame.basis[2]);
      const h: number =
        0.22 *
        Math.min(
          M.norm(M.sub(point, upper.point)),
          M.norm(M.sub(point, lower.point)),
        );
      const tangent: C.Vector = M.mul(frame.basis[1], -1);
      model.curves.push({
        name: prefix + ".web" + n + ".sharedSaddleCourse",
        role: "sharedWebTopologyCourse",
        closed: false,
        intervals: [1, 1],
        spans: [
          [
            upper.point,
            M.add(upper.point, M.mul(parentJet(upper.theta), delta / 3)),
            M.sub(point, M.mul(tangent, h)),
            point,
          ],
          [
            point,
            M.add(point, M.mul(tangent, h)),
            M.add(lower.point, M.mul(parentJet(lower.theta), delta / 3)),
            lower.point,
          ],
        ],
      });
    }
    for (const number of Object.keys(params.toes)) {
      const family: Record<string, F.Operator[]> =
        model.families["toe" + number]!;
      const rootW: number = Math.min(
        ...Object.values(family)
          .flat()
          .map((op: F.Operator): number => op.knots[0]!),
      );
      const fan: D.Side["branches"]["fan"][string] = branch.fan[number]!;
      const middleW: number = fan.longitudinalRatio * reach;
      for (const semantic of ["dorsum", "sole", "outer", "inner"]) {
        const op: F.Operator = family[semantic]![0]!;
        const span: C.Span = op.spans[0]!;
        const root: C.Vector = span[0];
        const jet: C.Vector = M.mul(
          M.sub(span[1], span[0]),
          3 / (op.knots[1]! - op.knots[0]!),
        );
        let spans: C.Span[];
        let intervals: number[];
        if (semantic === "dorsum" || semantic === "sole") {
          const start: ReturnType<typeof M.crossing> = M.crossing(
            parent.spans,
            frame,
            fan.outwardRatio * width,
            semantic === "dorsum",
          );
          const height: number =
            semantic === "dorsum"
              ? fan.dorsalHeightAboveFloor_mm
              : fan.plantarHeightAboveFloor_mm;
          const mid: C.Vector = world(
            fan.outwardRatio * width,
            floor + height,
            middleW,
          );
          const midJet: C.Vector = M.mul(
            M.sub(root, start.point),
            1 / (rootW - parentW),
          );
          const a: number = middleW - parentW;
          const b: number = rootW - middleW;
          spans = [
            [
              start.point,
              M.add(start.point, M.mul(parentJet(start.theta), a / 3)),
              M.sub(mid, M.mul(midJet, a / 3)),
              mid,
            ],
            [
              mid,
              M.add(mid, M.mul(midJet, b / 3)),
              M.sub(root, M.mul(jet, b / 3)),
              root,
            ],
          ];
          intervals = [a, b];
        } else {
          const saddle: string = String(
            Number(number) - (semantic === "inner" ? 1 : 0),
          );
          let start: C.Vector;
          let startW: number;
          let startJet: C.Vector;
          if (branch.saddles[saddle]) {
            start = nodes["web" + saddle]!;
            startW = branch.saddles[saddle]!.longitudinalRatio * reach;
            startJet = M.mul(M.sub(root, start), 1 / (rootW - startW));
          } else {
            const theta: number = semantic === "outer" ? 0 : 0.5;
            start = F.point(model, "main", parentW, theta);
            startW = parentW;
            startJet = parentJet(theta);
          }
          const delta: number = rootW - startW;
          if (!(delta > 0))
            throw new Error("Web saddle must precede actual toe root");
          spans = [
            [
              start,
              M.add(start, M.mul(startJet, delta / 3)),
              M.sub(root, M.mul(jet, delta / 3)),
              root,
            ],
          ];
          intervals = [delta];
        }
        model.curves.push({
          name: prefix + ".toe" + number + ".branch." + semantic,
          role: "toeRootBranchGuide",
          closed: false,
          spans,
          intervals,
          phaseUnit: "mm",
        });
      }
    }
  }
}
