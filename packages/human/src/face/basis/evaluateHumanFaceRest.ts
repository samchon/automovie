import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../index";


/**
 * Evaluate the rest layer of a facial basis: every endpoint row, on surfaces
 * and landmarks alike, before any joint moves.
 *
 * For each vertex p the result is p + sum(|weight| * endpoint) over the
 * channels in basis order, then + sum(activation * corrective target). Shape
 * endpoints are identity; expression endpoints of an articulated basis are
 * rest-space residuals over the articulation, so adding them here and posing
 * afterwards is what makes a smile travel with an opening jaw. Landmarks
 * receive the same rows by endpoint name, which is how a joint follows the
 * shape that moves it; an expression carries no landmark row by admission,
 * so a joint's centre is identity and its motion is articulation.
 *
 * The returned buffers are fresh copies; the basis is never mutated. A
 * surface that carries no row for an endpoint is left where it is, which is
 * how the admission's "every endpoint moves something" rule and a per-surface
 * sparse payload coexist. Channels named in `except` are skipped, which is
 * how a contact basis holds its closure channel back for the aperture-scaled
 * pass; their correctives still activate on the raw weights.
 *
 * @evidence contracts/common.md#principled-implementation Basis-order signed endpoint selection accumulates absolute-weight sparse XYZ deltas, followed by positive corrective activations, into fresh surface and landmark copies. The builder supplies admitted connectivity and weights; identity-only landmark targets are an admission requirement, and except omits channels without suppressing their already computed correctives.
 * @evidence contracts/common.md#clear-and-simple-design Shared accumulate/shape operations apply the same sparse-row representation to each surface and the landmark table; articulation and contact remain downstream rather than being mixed into this rest sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent per-surface row contributes zero as the sparse contract permits, not a substituted endpoint. This affine rest layer adds authored residuals and is neither muscle mechanics nor a correction of unsupported combined poses.
 * @evidence contracts/common.md#meaningful-documentation Prose gives accumulation order, signed side selection, landmark identity premise, except/corrective distinction and fresh-buffer ownership without changing basis arrays.
 * @evidence contracts/performance.md#efficient-algorithms Copying costs the full V coordinate and L landmark populations; each surface visits C channels and A activations and reads their resident sparse rows. Cost is O(V+L+S(C+A)+R) for S surfaces and R visited row scalars, with no dense target expansion.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared sparse accumulator serves surfaces and landmarks, and already computed activation values are consumed rather than recomputed. Each changed state needs new sums; the outer pose cache owns reuse of completed evaluations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives fresh coordinate arrays and a named landmark object; local closures retain nothing after return. Allocation follows the admitted source population, with no rest history or external task.
 */
export function evaluateHumanFaceRest(
  basis: IAutoMovieHumanFaceBasis,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
  except: ReadonlySet<string> = new Set(),
): { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> } {
  const accumulate: (positions: number[], targets: Record<string, number[]>, name: string, gain: number) => void = (
    positions: number[],
    targets: Record<string, number[]>,
    name: string,
    gain: number,
  ): void => {
    const rows: number[] = targets[name];
    if (rows === undefined) return;
    for (let i: number = 0; i < rows.length; i += 4)
      for (let axis: number = 0; axis < 3; axis++)
        positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
  };
  const shape: (positions: number[], targets: Record<string, number[]>) => void = (
    positions: number[],
    targets: Record<string, number[]>,
  ): void => {
    for (const channel of basis.channels) {
      const weight: number = state.weights.get(channel.id) ?? 0;
      if (weight === 0 || except.has(channel.id)) continue;
      accumulate(
        positions,
        targets,
        weight < 0 ? channel.negative! : channel.positive,
        Math.abs(weight),
      );
    }
    for (const corrective of state.activations)
      if (corrective.activation > 0)
        accumulate(
          positions,
          targets,
          corrective.target,
          corrective.activation,
        );
  };
  const surfaces: number[][] = basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported): number[]  => {
    const positions: number[] = surface.positions.slice();
    shape(positions, surface.targets);
    return positions;
  });
  const landmarks: Record<string, IAutoMovieVector3> = {};
  if (basis.landmarks !== undefined) {
    const marks: number[] = basis.landmarks.positions.slice();
    shape(marks, basis.landmarks.targets);
    basis.landmarks.ids.forEach((id: string, i: number): void  => {
      landmarks[id] = {
        x: marks[i * 3],
        y: marks[i * 3 + 1],
        z: marks[i * 3 + 2],
      };
    });
  }
  return { surfaces, landmarks };
}
