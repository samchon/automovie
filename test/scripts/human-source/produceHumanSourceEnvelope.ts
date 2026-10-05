import type { IAutoMovieHumanBodyBasisChannel } from "@automovie/human/body/structures/shape/IAutoMovieHumanBodyBasisChannel";

import { HUMAN_SOURCE_ENVELOPE_PRODUCER as P } from "./HUMAN_SOURCE_ENVELOPE_PRODUCER.ts";
import type { IHumanSourceFieldContext } from "./structures/IHumanSourceFieldContext.ts";
import type { IHumanSourceFieldResult } from "./structures/IHumanSourceFieldResult.ts";

/**
 * Produce the envelope detail correctives on the body view.
 *
 * For each extended side, the channel's endpoint at that side is low-passed as
 * a vector by heat diffusion over the motion length (its motion). The
 * residual's thickness along the symmetric normals is split by diffusion over
 * the thickness length into a smooth part and a detail part. The corrective
 * ramps from the node to the side's end and removes the detail's
 * extrapolation along the normal: its row is −(end − node)·detail·normal. Past
 * the node, the thickness detail therefore stays at the node's while the
 * smooth thickness and the tangential motion grow with the weight. Rows are
 * mirror-averaged. The readings beside each side are this run's detail
 * fraction (rms detail over rms thickness on the endpoint's support) and
 * largest removal at the end, next to the published receipt's values.
 */
export function produceHumanSourceEnvelope(context: IHumanSourceFieldContext, channels: readonly IAutoMovieHumanBodyBasisChannel[]): IHumanSourceFieldResult {
  const { mesh, twin, normals, diffuse, rows } = context;
  const n = mesh.positions.length / 3;
  const out: Record<string, Float64Array> = {};
  const readings: Record<string, unknown>[] = [];
  for (const side of P.sides) {
    const channel = channels.find((c) => c.id === side.channel);
    const endpoint = channel === undefined ? null : side.side === "positive" ? channel.positive : channel.negative;
    if (endpoint === null || endpoint === undefined) throw new Error(`Envelope ${side.id}: channel ${side.channel} has no ${side.side} endpoint.`);
    const e = rows(endpoint);
    const motion = [0, 1, 2].map((c) => diffuse(Float64Array.from({ length: n }, (_, v) => e[3 * v + c]), P.motionMetres));
    const thickness = new Float64Array(n);
    for (let v = 0; v < n; v++) for (let c = 0; c < 3; c++) thickness[v] += (e[3 * v + c] - motion[c][v]) * normals[3 * v + c];
    const smooth = diffuse(thickness, P.thicknessMetres);
    const detail = new Float64Array(n);
    for (let v = 0; v < n; v++) detail[v] = thickness[v] - smooth[v];
    const scale = -(side.end - P.node);
    const row = new Float64Array(3 * n);
    for (let v = 0; v < n; v++) {
      const m = twin[v];
      for (let c = 0; c < 3; c++) {
        const own = scale * detail[v] * normals[3 * v + c];
        const mirrored = scale * detail[m] * normals[3 * m + c] * (c === 0 ? -1 : 1);
        row[3 * v + c] = 0.5 * (own + mirrored);
      }
    }
    out[side.id] = row;
    let sd = 0;
    let st = 0;
    let support = 0;
    let worst = 0;
    for (let v = 0; v < n; v++) {
      if (e[3 * v] === 0 && e[3 * v + 1] === 0 && e[3 * v + 2] === 0) continue;
      support++;
      sd += detail[v] * detail[v];
      st += thickness[v] * thickness[v];
      worst = Math.max(worst, Math.hypot(row[3 * v], row[3 * v + 1], row[3 * v + 2]));
    }
    readings.push({
      id: side.id,
      endpoint,
      end: side.end,
      supportVertices: support,
      detailFraction: Math.sqrt(sd / Math.max(st, 1e-30)),
      worstRemovedAtEndMillimetres: worst * 1000,
      receiptDetailFraction: side.receiptDetailFraction,
      receiptWorstRemovedAtEndMillimetres: side.receiptWorstRemovedAtEndMillimetres,
    });
  }
  return {
    rows: out,
    receipt: {
      revision: P.revision,
      method:
        "per extended side: endpoint motion = implicit heat diffusion of the endpoint vector over the motion length; residual thickness along symmetric area-weighted normals; detail = thickness less its diffusion over the thickness length; corrective row = -(end - node) * detail * normal, ramped from the node to the end; mirror-averaged; nipple region refilled; stored at 10 micrometres",
      kept: "structure, cotangent Laplacian with lumped mass, diffusion lengths 150 and 40 mm, each side's end (envelope-detail-receipt.json)",
      chosen: {
        stepLength: "t = L^2 / 2, the heat kernel's variance 2t equal to a Gaussian's sigma^2 with sigma = L",
        heldBoundary: "Dirichlet: open-boundary vertices keep their input value",
        surface: "the body view's neutral and symmetric normals",
        symmetry: "mirror average of the corrective rows",
        detailFraction: "this run's reading is rms detail over rms thickness on the endpoint's support; the receipt's own definition is not recorded, so the two are listed side by side and not fitted",
      },
      parameters: { motionMetres: P.motionMetres, thicknessMetres: P.thicknessMetres, node: P.node, storageMetres: P.storageMetres },
      sides: readings,
    },
  };
}
