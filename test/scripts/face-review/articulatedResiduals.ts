/**
 * Rewrite a basis's expression endpoints and correctives as rest-space
 * residuals over its articulation.
 *
 * An authored expression endpoint `E` describes the full pose `neutral + E`
 * at weight one. Once the same channel also drives a joint, the builder poses
 * the rest surface through the attachments, so the endpoint that reproduces
 * the authored pose is `unpose(neutral + E) - neutral`: what the pose leaves
 * over the joint motion, carried back into rest space by the exact inverse
 * of each vertex's blend. A corrective solved at its drivers' peaks is
 * rewritten the same way against the full authored pose at that state,
 * minus the drivers' new residuals. A surface wholly bound to a joint (teeth,
 * globes) publishes no residual: bone does not deform under expression, and
 * what an endpoint or corrective would have done to it is reported as
 * dropped with its magnitude, which is how a corrective that had lifted the
 * teeth to dodge a lip is retired rather than hidden.
 *
 * A carrier is a channel the source folded another channel into (the tongue
 * protrusion carried the jaw opening whole): its authored rows are the pose
 * with both channels at one. Its residual is therefore taken at the carried
 * channel's joint state and minus the carried residual, exactly as a
 * corrective's is, so carrier plus carried replays the authored pose while
 * the joint moves under its own channel alone; the carrier by itself keeps
 * the same rest-space rows, which is the combination the source never
 * authored and the contact census reports. The correctives the carrier
 * drove compensated the double count and are removed.
 *
 * `prepareArticulatedBasis` owns the order of these calls; analytic unit
 * scenarios call them on small point sets with known answers.
 */
import {
  type IAutoMovieHumanFaceBasis,
  evaluateHumanFaceRest,
  resolveHumanFaceArticulation,
  unposeHumanFaceSurface,
} from "@automovie/human";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];

/** Dense displacement of sparse rows over `count` vertices. */
export function denseRows(
  count: number,
  rows: readonly number[] | undefined,
): Float64Array {
  const dense = new Float64Array(count * 3);
  if (rows !== undefined)
    for (let i = 0; i < rows.length; i += 4)
      for (let axis = 0; axis < 3; axis++)
        dense[rows[i] * 3 + axis] = rows[i + axis + 1];
  return dense;
}

/** Sparse rows of a dense displacement, rounded, zero rows omitted. */
export function sparseRows(
  dense: ArrayLike<number>,
  decimals: number,
): number[] {
  const factor = 10 ** decimals;
  const rows: number[] = [];
  for (let v = 0; v * 3 < dense.length; v++) {
    const d = [0, 1, 2].map(
      (axis) => Math.round(dense[3 * v + axis] * factor) / factor,
    );
    if (d.some((value) => value !== 0)) rows.push(v, ...d);
  }
  return rows;
}

const worst = (dense: ArrayLike<number>): number => {
  let max = 0;
  for (let v = 0; v * 3 < dense.length; v++)
    max = Math.max(
      max,
      Math.hypot(dense[3 * v], dense[3 * v + 1], dense[3 * v + 2]),
    );
  return max;
};

/**
 * Residual of one authored pose over the articulation state `weights`, on
 * one surface, in rest space, minus the rows already attributed to `others`.
 */
export function residualOf(props: {
  basis: IAutoMovieHumanFaceBasis;
  surface: Surface;
  posed: Float64Array;
  weights: Map<string, number>;
  landmarks: ReturnType<typeof evaluateHumanFaceRest>["landmarks"];
  subtract: Float64Array[];
}): Float64Array {
  const { surface } = props;
  const posed = Array.from(props.posed);
  const attachments = surface.attachments ?? [];
  const rest =
    attachments.length === 0 || props.basis.articulation === undefined
      ? posed
      : unposeHumanFaceSurface(
          posed,
          attachments,
          resolveHumanFaceArticulation(
            props.basis.articulation,
            props.weights,
            props.landmarks,
          ).motions,
        );
  const residual = new Float64Array(rest.length);
  for (let i = 0; i < rest.length; i++) {
    let value = rest[i] - surface.positions[i];
    for (const other of props.subtract) value -= other[i];
    residual[i] = value;
  }
  return residual;
}

export function decomposeExpressionResiduals(props: {
  basis: IAutoMovieHumanFaceBasis;
  boneSurfaces: ReadonlySet<string>;
  carriers: { channel: string; carried: string }[];
  decimals: number;
}): {
  dropped: { surface: string; endpoint: string; maxMetres: number }[];
  residuals: { endpoint: string; maxMetres: number }[];
  removedCorrectives: string[];
} {
  const { basis } = props;
  const landmarks = evaluateHumanFaceRest(basis, {
    weights: new Map(),
    activations: [],
  }).landmarks;
  const expression = basis.channels.filter(
    (channel) => channel.kind === "expression",
  );
  const dropped: { surface: string; endpoint: string; maxMetres: number }[] =
    [];
  const residuals: { endpoint: string; maxMetres: number }[] = [];
  // Source rows are read before any rewrite so a corrective sees its drivers'
  // authored endpoints, not their residuals.
  const source = new Map(
    basis.surfaces.map((surface) => [
      surface.id,
      structuredClone(surface.targets),
    ]),
  );
  const count = (surface: Surface): number => surface.positions.length / 3;
  const authored = (surface: Surface, endpoint: string): Float64Array =>
    denseRows(count(surface), source.get(surface.id)![endpoint]);
  const carried = new Map(
    props.carriers.map((carrier) => {
      const from = basis.channels.find((one) => one.id === carrier.channel);
      const to = basis.channels.find((one) => one.id === carrier.carried);
      if (from === undefined || to === undefined)
        throw new Error(
          "A carrier names channels the basis lacks: " + carrier.channel,
        );
      return [from.id, to] as const;
    }),
  );
  const published = new Map<string, Map<string, Float64Array>>();
  const publish = (
    surface: Surface,
    endpoint: string,
    dense: Float64Array,
  ): void => {
    published.get(surface.id)!.set(endpoint, dense);
    const rows = sparseRows(dense, props.decimals);
    if (rows.length === 0) delete surface.targets[endpoint];
    else surface.targets[endpoint] = rows;
  };
  for (const surface of basis.surfaces) published.set(surface.id, new Map());
  // Carried channels are decomposed before their carriers, whose residual
  // subtracts theirs.
  const ordered = [
    ...expression.filter((channel) => !carried.has(channel.id)),
    ...expression.filter((channel) => carried.has(channel.id)),
  ];
  for (const channel of ordered) {
    const carries = carried.get(channel.id);
    let max = 0;
    for (const surface of basis.surfaces) {
      const e = authored(surface, channel.positive);
      if (props.boneSurfaces.has(surface.id)) {
        const magnitude =
          carries === undefined
            ? worst(e)
            : worst(
                e.map(
                  (value, i) => value - authored(surface, carries.positive)[i],
                ),
              );
        if (magnitude > 0)
          dropped.push({
            surface: surface.id,
            endpoint: channel.positive,
            maxMetres: magnitude,
          });
        delete surface.targets[channel.positive];
        published
          .get(surface.id)!
          .set(channel.positive, new Float64Array(e.length));
        continue;
      }
      const posed = new Float64Array(e.length);
      for (let i = 0; i < e.length; i++) posed[i] = surface.positions[i] + e[i];
      const residual = residualOf({
        basis,
        surface,
        posed,
        weights: new Map(
          carries === undefined ? [[channel.id, 1]] : [[carries.id, 1]],
        ),
        landmarks,
        subtract:
          carries === undefined
            ? []
            : [published.get(surface.id)!.get(carries.positive)!],
      });
      max = Math.max(max, worst(residual));
      publish(surface, channel.positive, residual);
    }
    residuals.push({ endpoint: channel.positive, maxMetres: max });
  }
  const removedCorrectives: string[] = [];
  const carrierChannels = new Set(
    props.carriers.map((carrier) => carrier.channel),
  );
  basis.correctives = (basis.correctives ?? []).filter((corrective) => {
    if (corrective.inputs.some((input) => carrierChannels.has(input.channel))) {
      removedCorrectives.push(corrective.id);
      for (const surface of basis.surfaces)
        delete surface.targets[corrective.target];
      return false;
    }
    return true;
  });
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  for (const corrective of basis.correctives) {
    const weights = new Map<string, number>();
    const drivers: { endpoint: string; gain: number }[] = [];
    for (const input of corrective.inputs) {
      const channel = channels.get(input.channel)!;
      const peak = input.peak ?? 1;
      weights.set(input.channel, input.side === "negative" ? -peak : peak);
      drivers.push({
        endpoint:
          input.side === "negative" ? channel.negative! : channel.positive,
        gain: peak,
      });
    }
    let max = 0;
    for (const surface of basis.surfaces) {
      const c = denseRows(
        count(surface),
        source.get(surface.id)![corrective.target],
      );
      if (props.boneSurfaces.has(surface.id)) {
        const magnitude = worst(c);
        if (magnitude > 0)
          dropped.push({
            surface: surface.id,
            endpoint: corrective.target,
            maxMetres: magnitude,
          });
        delete surface.targets[corrective.target];
        continue;
      }
      const posed = new Float64Array(c.length);
      for (let i = 0; i < c.length; i++)
        posed[i] = surface.positions[i] + corrective.weight * c[i];
      const subtract: Float64Array[] = [];
      for (const driver of drivers) {
        const e = authored(surface, driver.endpoint);
        for (let i = 0; i < e.length; i++) posed[i] += driver.gain * e[i];
        const rewritten = published.get(surface.id)!.get(driver.endpoint);
        const rows =
          rewritten ??
          denseRows(count(surface), surface.targets[driver.endpoint]);
        const scaled = new Float64Array(rows.length);
        for (let i = 0; i < rows.length; i++) scaled[i] = driver.gain * rows[i];
        subtract.push(scaled);
      }
      const residual = residualOf({
        basis,
        surface,
        posed,
        weights,
        landmarks,
        subtract,
      });
      for (let i = 0; i < residual.length; i++)
        residual[i] /= corrective.weight;
      max = Math.max(max, worst(residual));
      const rows = sparseRows(residual, props.decimals);
      if (rows.length === 0) delete surface.targets[corrective.target];
      else surface.targets[corrective.target] = rows;
    }
    residuals.push({ endpoint: corrective.target, maxMetres: max });
  }
  return { dropped, residuals, removedCorrectives };
}
