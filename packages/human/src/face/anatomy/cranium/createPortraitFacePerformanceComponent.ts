import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { resolveHumanFaceExpression } from "../../document/resolveHumanFaceExpression";
import type { IAutoMovieHumanFaceBindings } from "../../structures/IAutoMovieHumanFaceBindings";
import type { IAutoMovieHumanFaceExpression } from "../../structures/IAutoMovieHumanFaceExpression";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { portraitJawSkinWeight } from "../mouth/portraitJawSkinWeight";
import { portraitLipTriangles } from "../mouth/portraitLipTriangles";
import { posePortraitJawPoint } from "../mouth/posePortraitJawPoint";

/**
 * Attach brow elevation and mandibular skin movement to the same source host
 * as the optical and oral components. The mouth owns its entire vermilion
 * population; this component never applies a second jaw transform to that band.
 * The maxilla, eye markers and skin above the oral transition remain stationary.
 *
 * This is explicit weighted kinematics, not a simulated muscle or skull. The
 * perioral transition spans the observed central opening, with a four-mm
 * minimum for a closed observation; lower facial tissue follows the hinge.
 * Brow movement adapts neighbouring skin over twelve mm and the resident brow
 * fibres subsequently read the final shared skin instead of a detached offset.
 *
 * @evidence contracts/common.md#principled-implementation Observed-to-current jaw and brow differences produce explicit weighted constraints on the same source host, excluding the mouth-owned vermilion population from a second jaw transform.
 * @evidence contracts/common.md#clear-and-simple-design A cloned binding/expression boundary returns one component whose fit builds per-resident constraints; the shared host blend owns downstream deformation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four-mm oral-transition minimum and twelve-mm brow reach are authored kinematic conventions, not acquired muscle weights, skull dynamics or a clinical motion proof.
 * @evidence contracts/common.md#meaningful-documentation The prose explains stationary ownership, separate mouth tissue, transition support and attached brow fibres reading final shared skin.
 * @evidence contracts/performance.md#efficient-algorithms Each fit builds lip membership from actual triangles, then scans resident indexed vertices for jaw constraints and the two brow boundaries; maps bound accumulated constraints to one per resident ID.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolved observed/current expressions and cloned bindings are retained by the component, while each changed host deliberately receives a fresh constraint population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the component closure and its copied bindings/expressions; per-fit maps/sets expire and returned constraints grow only with supplied resident/brow populations.
 */
export function createPortraitFacePerformanceComponent(
  inputBindings: IAutoMovieHumanFaceBindings,
  inputObservation: IAutoMovieHumanFaceExpression,
  inputExpression: IAutoMovieHumanFaceExpression,
): IPortraitComponent {
  const bindings: IAutoMovieHumanFaceBindings = structuredClone(inputBindings);
  const observation: ReturnType<typeof resolveHumanFaceExpression> = resolveHumanFaceExpression(inputObservation);
  const expression: ReturnType<typeof resolveHumanFaceExpression> = resolveHumanFaceExpression(inputExpression);
  const jaw: number = expression.jawOpen - observation.jawOpen;
  if (expression.jawOpen !== 0 || observation.jawOpen !== 0) {
    if (bindings.jawHinge === undefined)
      throw new Error(
        "Mandibular performance requires an authored transverse hinge.",
      );
    posePortraitJawPoint(bindings.jawHinge, bindings.jawHinge, jaw, 0);
  }
  return {
    id: "facial-performance",
    fit: (host: IPortraitComponentHost): { constraints: { vertex: number; target: number[]; reach: number; }[]; cutFaces: never[]; attach: () => { openings: never[]; finish: () => never[]; }; }  => {
      const constraints: Map<number, { vertex: number; target: number[]; reach: number; }> = new Map<
        number,
        { vertex: number; target: number[]; reach: number }
      >();
      if (jaw !== 0) {
        const lipVertices: Set<number> = new Set(
          [...portraitLipTriangles(host.indices, bindings.mouth)].flatMap(
            (face: number): number[]  => host.indices.slice(3 * face, 3 * face + 3),
          ),
        );
        const middle: (curve: number[]) => number[] = (curve: number[]): number[]  =>
          host.positions[curve[Math.floor(curve.length / 2)]];
        const upperY: number = middle(bindings.mouth.upper)[1];
        const lowerY: number = middle(bindings.mouth.lower)[1];
        for (const id of new Set(host.indices)) {
          if (lipVertices.has(id)) continue;
          const point: number[] = host.positions[id];
          const weight: number = portraitJawSkinWeight(point[1], upperY, lowerY);
          if (weight === 0) continue;
          const moved: IAutoMovieVector3 = posePortraitJawPoint(
            { x: point[0], y: point[1], z: point[2] },
            bindings.jawHinge!,
            jaw,
            weight,
          );
          constraints.set(id, {
            vertex: id,
            target: [moved.x, moved.y, moved.z],
            reach: 0,
          });
        }
      }
      for (const side of ["right", "left"] as const) {
        const delta: number = expression.browRaise[side] - observation.browRaise[side];
        if (delta === 0) continue;
        for (const id of new Set([
          ...bindings.eyes[side].browTop,
          ...bindings.eyes[side].browBottom,
        ])) {
          const source: number[] = constraints.get(id)?.target ?? host.positions[id];
          if (
            source === undefined ||
            source.length !== 3 ||
            !source.every(Number.isFinite)
          )
            throw new Error(
              "Brow performance requires resident finite brow attachments.",
            );
          constraints.set(id, {
            vertex: id,
            target: [source[0], source[1] + delta, source[2]],
            reach: 12,
          });
        }
      }
      return {
        constraints: [...constraints.values()],
        cutFaces: [],
        attach: (): { openings: never[]; finish: () => never[]; }  => ({ openings: [], finish: (): never[]  => [] }),
      };
    },
  };
}
