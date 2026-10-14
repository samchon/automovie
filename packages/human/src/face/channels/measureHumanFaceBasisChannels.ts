import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import { IAutoMovieHumanEndpointScale } from "../../common/structures/IAutoMovieHumanEndpointScale";
import type {
  IAutoMovieHumanFaceBasisArticulation as IAutoMovieHumanFaceBasisArticulationImported,
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisEyeGaze as IAutoMovieHumanFaceBasisEyeGazeImported,
  IAutoMovieHumanFaceBasisEye as IAutoMovieHumanFaceBasisEyeImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
  IAutoMovieHumanFaceRigidMotion as IAutoMovieHumanFaceRigidMotionImported,
} from "../../index";
import { evaluateHumanFaceRest } from "../basis/evaluateHumanFaceRest";
import { poseHumanFaceSurface } from "../basis/poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "../basis/resolveHumanFaceArticulation";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { IAutoMovieHumanFaceChannelScale } from "../structures/IAutoMovieHumanFaceChannelScale";

/**
 * Measure every channel's metric effect on an admitted connected facial basis.
 *
 * The connected editor calls this once per loaded basis and prints the result
 * beside each control. These distances quantify the endpoint's geometric
 * response; they do not turn its dimensionless weight into a named anatomical
 * measurement or establish a physiological editing range. Consumers compare
 * a channel's geometric endpoint effect rather than treating equal
 * dimensionless weights as equal displacements.
 *
 * A channel that drives a joint is measured as the builder poses it: its
 * endpoint rows are the rest-space residual, so the figure a reader needs is
 * the posed displacement, `pose(neutral + rows) - neutral` over the attached
 * surfaces at weight one. That is the same attachment posing the builder
 * runs, so the printed millimetres are what the render shows rather than a
 * second formula for them. Every other endpoint is its rows alone.
 *
 * The basis is read, never mutated. It is expected to have passed
 * `assertHumanFaceBasis`, which is what guarantees finite sparse rows and
 * resident vertex identities; an endpoint no surface carries a row for measures
 * as zero rather than throwing; this reader does not require every endpoint
 * to affect geometry. The one precondition it cannot leave implicit is a
 * resident vertex, because dividing by an empty population would publish NaN as
 * a measurement; the browser editor reads a fetched asset before any builder
 * has admitted it, so that case is refused here rather than displayed. Each
 * endpoint scans surfaces; articulated positives additionally copy and pose
 * attached resident populations. RMS divides by all resident vertices, whereas
 * vertices counts sparse rows or nonzero articulated responses respectively.
 *
 * @param basis Admitted immutable basis to measure.
 * @returns One record per channel, in the basis's own channel order.
 *
 * @evidence contracts/common.md#principled-implementation Endpoint squared metre displacements give whole-resident RMS/peak; registered positive joint endpoints also use shared rigid attachment posing around neutral landmarks. Full basis admission is a caller premise except the explicit nonempty resident guard; these are geometric scales, not physiological ranges.
 * @evidence contracts/common.md#clear-and-simple-design One endpoint helper reduces positive/negative responses and delegates rest/joint/attachment formulas, avoiding an editor-specific geometry approximation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rows give zero; negative endpoints keep their sparse-row path and only registered positive joint endpoints pose. Whole-resident RMS and path-specific affected counts are explicitly different populations, so equal weights need not imply equal anatomical effect.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre effects, resident denominator, sparse/articulated count, positive joint behavior, empty-population refusal and complete cost beyond sparse rows.
 * @evidence contracts/performance.md#efficient-algorithms C endpoints scan S surfaces and sparse rows; articulated positives additionally copy/pose V attached coordinates and scan attachment rows. Joint-map construction searches channel definitions, so total work is not linear only in sparse rows.
 * @evidence contracts/performance.md#reuse-equivalent-work Neutral shaped landmarks compute once and all endpoints use shared pose formulas; each channel's distinct response must be measured. The editor owns once-per-loaded-basis result reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(C) scales transfer; per-endpoint coordinate buffers and temporary maps/rest become collectible, with no retained asset cache or external handle.
 */
export function measureHumanFaceBasisChannels(
  basis: IAutoMovieHumanFaceBasis,
): IAutoMovieHumanFaceChannelScale[] {
  const resident: number = basis.surfaces.reduce(
    (total: number, surface: IAutoMovieHumanFaceBasisSurfaceImported): number =>
      total + surface.positions.length / 3,
    0,
  );
  if (resident === 0)
    throw new Error("A facial basis needs resident vertices to measure.");
  const articulated: Map<string, string> = new Map<string, string>();
  const articulation: IAutoMovieHumanFaceBasisArticulationImported | undefined =
    basis.articulation;
  if (articulation !== undefined) {
    const { jaw }: IAutoMovieHumanFaceBasisArticulationImported = articulation;
    for (const channel of [
      jaw.opening.channel,
      jaw.protrusion.channel,
      jaw.laterotrusion.left.channel,
      jaw.laterotrusion.right.channel,
      ...articulation.eyes.flatMap(
        (eye: IAutoMovieHumanFaceBasisEyeImported): string[] =>
          eye.gaze.map(
            (gaze: IAutoMovieHumanFaceBasisEyeGazeImported): string =>
              gaze.channel,
          ),
      ),
    ])
      articulated.set(
        basis.channels.find(
          (one: IAutoMovieHumanFaceBasisChannelImported): boolean =>
            one.id === channel,
        )!.positive,
        channel,
      );
  }
  const landmarks: Record<string, IAutoMovieVector3Imported> =
    articulation === undefined
      ? {}
      : evaluateHumanFaceRest(basis, { weights: new Map(), activations: [] })
          .landmarks;
  // Accumulate squared magnitudes and take the roots once at the end: both
  // reported figures are roots of the same per-row quantity, and squaring a
  // sparse row is cheaper than taking its length for every row. A joint's
  // channel is instead posed through the same attachment blend the builder
  // uses, and measured vertex by vertex against the neutral.
  const measure: (name: string) => IAutoMovieHumanEndpointScale = (
    name: string,
  ): IAutoMovieHumanEndpointScale => {
    let sumOfSquares: number = 0;
    let largestSquare: number = 0;
    let rowCount: number = 0;
    const channel: string | undefined = articulated.get(name);
    const motions:
      | Map<string, IAutoMovieHumanFaceRigidMotionImported>
      | undefined =
      channel === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            articulation!,
            new Map([[channel, 1]]),
            landmarks,
          ).motions;
    for (const surface of basis.surfaces) {
      const rows: number[] = surface.targets[name];
      if (motions !== undefined && (surface.attachments?.length ?? 0) > 0) {
        const rest: number[] = surface.positions.slice();
        if (rows !== undefined)
          for (let i: number = 0; i < rows.length; i += 4)
            for (let axis: number = 0; axis < 3; axis++)
              rest[rows[i] * 3 + axis] += rows[i + axis + 1];
        const posed: number[] = poseHumanFaceSurface(
          rest,
          surface.attachments!,
          motions,
        );
        for (let v: number = 0; v * 3 < posed.length; v++) {
          const square: number =
            (posed[3 * v] - surface.positions[3 * v]) ** 2 +
            (posed[3 * v + 1] - surface.positions[3 * v + 1]) ** 2 +
            (posed[3 * v + 2] - surface.positions[3 * v + 2]) ** 2;
          if (square === 0) continue;
          sumOfSquares += square;
          largestSquare = Math.max(largestSquare, square);
          rowCount++;
        }
        continue;
      }
      if (rows === undefined) continue;
      for (let i: number = 0; i < rows.length; i += 4) {
        const square: number =
          rows[i + 1] * rows[i + 1] +
          rows[i + 2] * rows[i + 2] +
          rows[i + 3] * rows[i + 3];
        sumOfSquares += square;
        largestSquare = Math.max(largestSquare, square);
        rowCount++;
      }
    }
    return {
      displacement: Math.sqrt(sumOfSquares / resident),
      peak: Math.sqrt(largestSquare),
      vertices: rowCount,
    };
  };
  return basis.channels.map(
    (
      channel: IAutoMovieHumanFaceBasisChannelImported,
    ): {
      id: string;
      kind: "shape" | "expression";
      positive: IAutoMovieHumanEndpointScale;
      negative: IAutoMovieHumanEndpointScale | null;
    } => ({
      id: channel.id,
      kind: channel.kind,
      positive: measure(channel.positive),
      negative: channel.negative === null ? null : measure(channel.negative),
    }),
  );
}
