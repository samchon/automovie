import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

/**
 * Bilateral symmetry of the pose correctives.
 *
 * The neutral surface, the landmarks and the skin weights of the body basis
 * are bilaterally symmetric, so the correction a left state needs is the exact
 * mirror of the right one: the vertex mirrored across the sagittal plane, its
 * x displacement negated, the driver names with their sides swapped. Solving a
 * left state and its right counterpart one at a time gave each the basis its
 * own solve had left, and two rounds later a symmetric body lowered its left
 * arm and its right to different angles, so a sided corrective is solved on
 * the left and published together with its mirror.
 *
 * Positions are metres in the body frame, `x` across the body. A vertex's
 * mirror is the vertex whose position is its own with `x` negated to within
 * `tolerance`; a midline vertex is its own mirror.
 */

type Corrective = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
type Channel = IAutoMovieHumanBodyBasis["channels"][number];

/** How far a mirrored position may be from its partner vertex, metres. */
export const MIRROR_TOLERANCE = 2e-5;

/**
 * For each vertex, the vertex at its mirrored position, or `-1` when none lies
 * within `tolerance`. A grid of tolerance-sized cells finds the partner in the
 * 27 cells around the mirrored position; among several the nearest wins, ties
 * to the lower index.
 */
export function mirrorBodyVertices(
  positions: number[],
  tolerance = MIRROR_TOLERANCE,
): number[] {
  const count = positions.length / 3;
  const cell = (value: number): number => Math.floor(value / tolerance);
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  for (let v = 0; v < count; v++) {
    const at = key(
      cell(positions[v * 3]),
      cell(positions[v * 3 + 1]),
      cell(positions[v * 3 + 2]),
    );
    const list = grid.get(at);
    if (list === undefined) grid.set(at, [v]);
    else list.push(v);
  }
  const partner: number[] = new Array<number>(count).fill(-1);
  for (let v = 0; v < count; v++) {
    const target = [-positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]];
    const middle = target.map(cell);
    let best = -1;
    let nearest = tolerance * tolerance;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
          for (const u of grid.get(
            key(middle[0] + dx, middle[1] + dy, middle[2] + dz),
          ) ?? []) {
            const apart =
              (positions[u * 3] - target[0]) ** 2 +
              (positions[u * 3 + 1] - target[1]) ** 2 +
              (positions[u * 3 + 2] - target[2]) ** 2;
            if (apart < nearest || (apart === nearest && u < best)) {
              nearest = apart;
              best = u;
            }
          }
    partner[v] = best;
  }
  return partner;
}

/** A name with its side swapped: `left` and `right`, `Left` and `Right`, wherever they occur. */
export function swapBodySide(name: string): string {
  return name.replace(/left|right|Left|Right/g, (side) => {
    switch (side) {
      case "left":
        return "right";
      case "right":
        return "left";
      case "Left":
        return "Right";
      default:
        return "Left";
    }
  });
}

/** One driver with its side swapped; a channel goes to the channel it mirrors. */
function mirrorDriver(
  driver: Corrective["inputs"][number],
  channels: Map<string, Channel>,
): Corrective["inputs"][number] {
  if ("channel" in driver)
    return {
      ...driver,
      channel: channels.get(driver.channel)?.mirror ?? driver.channel,
    };
  if ("bone" in driver)
    return { ...driver, bone: swapBodySide(driver.bone) as typeof driver.bone };
  return {
    ...driver,
    shoulder: swapBodySide(driver.shoulder) as typeof driver.shoulder,
  };
}

/**
 * Whether a corrective names a side: its drivers, taken as a set, mirror to a
 * different set. A midline corrective (a macro channel, the spine) names no
 * side, and so does a bilateral one whose left and right drivers swap into
 * each other (both thighs flexed together); both are symmetrized, not mirrored
 * into a partner.
 */
export function isSidedBodyCorrective(
  corrective: Corrective,
  channels: Map<string, Channel>,
): boolean {
  const canonical = (drivers: Corrective["inputs"]): string =>
    JSON.stringify(drivers.map((driver) => JSON.stringify(driver)).sort((a, b) => a.localeCompare(b)));
  return (
    canonical(corrective.inputs) !==
    canonical(corrective.inputs.map((driver) => mirrorDriver(driver, channels)))
  );
}

/**
 * The exact mirror of a sided corrective and of its rows.
 *
 * The id is the id with its sides swapped, the drivers are mirrored (a shoulder
 * kernel keeps its orientation, which reads the same on either arm), the target
 * is the new id, and every row moves to its vertex's mirror with `x` negated.
 * A row whose vertex has no mirror is refused. Rows are sorted by vertex. The
 * corrective must be sided and its id must name a side, or the mirror would
 * collide with it; both refusals throw.
 */
export function mirrorBodyCorrective(
  corrective: Corrective,
  rows: number[],
  partner: number[],
  channels: Map<string, Channel>,
): { corrective: Corrective; rows: number[] } {
  const id = swapBodySide(corrective.id);
  if (!isSidedBodyCorrective(corrective, channels) || id === corrective.id)
    throw new Error("Only a sided corrective with a sided id has a mirror.");
  const moved: [number, number, number, number][] = [];
  for (let at = 0; at < rows.length; at += 4) {
    const v = partner[rows[at]];
    if (v < 0) throw new Error("A corrective row's vertex has no mirror.");
    moved.push([v, -rows[at + 1], rows[at + 2], rows[at + 3]]);
  }
  moved.sort((a, b) => a[0] - b[0]);
  return {
    corrective: {
      ...corrective,
      id,
      target: id,
      inputs: corrective.inputs.map((driver) => mirrorDriver(driver, channels)),
    },
    rows: moved.flat(),
  };
}

/**
 * A midline corrective's field made symmetric: the mean of the field and its
 * mirror, so that a vertex and its partner receive mirrored displacements. A
 * vertex the field does not name is read as zero.
 */
export function symmetrizeBodyRows(
  rows: number[],
  partner: number[],
): number[] {
  const field = new Map<number, number[]>();
  for (let at = 0; at < rows.length; at += 4)
    field.set(rows[at], [rows[at + 1], rows[at + 2], rows[at + 3]]);
  const out = new Map<number, number[]>();
  const add = (v: number, d: number[]): void => {
    const held = out.get(v) ?? [0, 0, 0];
    out.set(
      v,
      held.map((one, k) => one + d[k]),
    );
  };
  for (const [v, d] of field) {
    if (partner[v] < 0) throw new Error("A corrective row's vertex has no mirror.");
    add(v, d.map((one) => one / 2));
    add(partner[v], [-d[0] / 2, d[1] / 2, d[2] / 2]);
  }
  return [...out.keys()]
    .sort((a, b) => a - b)
    .flatMap((v) => [v, ...out.get(v)!]);
}
