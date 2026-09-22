import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

const unitAxis = (axis: readonly number[]): boolean =>
  axis.length === 3 &&
  axis.every(Number.isFinite) &&
  Math.abs(Math.hypot(axis[0], axis[1], axis[2]) - 1) <= 1e-6;
const finiteTriple = (values: readonly number[]): boolean =>
  values.length === 3 && values.every(Number.isFinite);

/**
 * Admit the landmarks, articulation and attachments of a facial basis.
 *
 * Called by `assertHumanFaceBasis` once channels, correctives and surfaces are
 * known valid, with the set of endpoint names those declare. Landmarks need
 * unique names, one finite XYZ each and sparse rows on declared endpoints in
 * the surface row format. An articulation needs its pivot and centre
 * landmarks to exist, unit axes, finite offsets and translations, expression
 * channels that exist and drive one joint each, a positive opening angle,
 * finite gaze translations and a translation limit the authored full opening itself respects, or weight
 * one would be refused by its own basis. Attachments may name only the
 * owners the articulation declares, once per surface, with resident strictly
 * increasing vertices, weights in (0, 1] and a per-vertex sum of at most one
 * over all owners (a micro tolerance absorbs the payload's rounding). A basis
 * without articulation may carry no attachment, because a weight to nothing
 * would silently skin to the cranium and read as attached.
 *
 * This is structural admission. It does not judge the anatomy of an axis or
 * a weight; the preparation receipt that published them owns that evidence.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Refuses a rig whose joints, landmarks or attachment weights could not be evaluated as declared.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Checks landmark rows, unit axes, channel ownership, the translation limit against the authored opening and the unit-sum sparse attachments.
 */
export function assertHumanFaceArticulation(
  basis: IAutoMovieHumanFaceBasis,
  endpoints: ReadonlySet<string>,
): void {
  const landmarks = new Set<string>();
  if (basis.landmarks !== undefined) {
    const { ids, positions, targets } = basis.landmarks;
    if (
      ids.length === 0 ||
      ids.some((id) => id.trim() === "") ||
      new Set(ids).size !== ids.length ||
      positions.length !== ids.length * 3 ||
      !positions.every(Number.isFinite)
    )
      throw new Error(
        "Facial landmarks need unique names and one finite XYZ each.",
      );
    for (const id of ids) landmarks.add(id);
    for (const [name, rows] of Object.entries(targets)) {
      if (
        !endpoints.has(name) ||
        rows.length === 0 ||
        rows.length % 4 !== 0 ||
        !rows.every(Number.isFinite)
      )
        throw new Error(
          "Facial landmark rows need a declared endpoint and finite sparse XYZ rows.",
        );
      let previous = -1;
      for (let i = 0; i < rows.length; i += 4) {
        const landmark = rows[i];
        if (
          !Number.isInteger(landmark) ||
          landmark <= previous ||
          landmark >= ids.length ||
          (rows[i + 1] === 0 && rows[i + 2] === 0 && rows[i + 3] === 0)
        )
          throw new Error(
            "Sparse landmark rows must be resident, strictly increasing and nonzero.",
          );
        previous = landmark;
      }
    }
  }
  const owners = new Set<string>();
  const articulation = basis.articulation;
  if (articulation !== undefined) {
    const channels = new Map(
      basis.channels.map((channel) => [channel.id, channel.kind]),
    );
    const driven = new Set<string>();
    const drive = (channel: string): void => {
      if (channels.get(channel) !== "expression" || driven.has(channel))
        throw new Error(
          "An articulation channel must be one expression channel driving one joint: " +
            channel,
        );
      driven.add(channel);
    };
    const { jaw } = articulation;
    if (
      !landmarks.has(jaw.pivot) ||
      !finiteTriple(jaw.axisOffset) ||
      !unitAxis(jaw.axis) ||
      !Number.isFinite(jaw.opening.degrees) ||
      jaw.opening.degrees <= 0 ||
      !finiteTriple(jaw.opening.translation) ||
      !finiteTriple(jaw.protrusion.translation) ||
      !finiteTriple(jaw.laterotrusion.left.translation) ||
      !finiteTriple(jaw.laterotrusion.right.translation) ||
      !Number.isFinite(jaw.translationLimitMetres) ||
      jaw.translationLimitMetres <= 0 ||
      Math.hypot(...jaw.opening.translation) > jaw.translationLimitMetres
    )
      throw new Error(
        "The jaw articulation needs a resident pivot landmark, a unit axis, a positive opening, finite translations and a limit the full opening respects.",
      );
    for (const channel of [
      jaw.opening.channel,
      jaw.protrusion.channel,
      jaw.laterotrusion.left.channel,
      jaw.laterotrusion.right.channel,
    ])
      drive(channel);
    owners.add("jaw");
    for (const eye of articulation.eyes) {
      if (
        eye.id.trim() === "" ||
        owners.has(eye.id) ||
        !landmarks.has(eye.center) ||
        eye.gaze.length === 0
      )
        throw new Error(
          "An eye articulation needs a unique owner, a resident centre landmark and gaze channels.",
        );
      owners.add(eye.id);
      for (const gaze of eye.gaze) {
        if (
          !unitAxis(gaze.axis) ||
          !Number.isFinite(gaze.degrees) ||
          gaze.degrees === 0 ||
          !finiteTriple(gaze.translation)
        )
          throw new Error(
            "A gaze channel needs a unit axis, a nonzero angle and a finite translation: " +
              gaze.channel,
          );
        drive(gaze.channel);
      }
    }
  }
  for (const surface of basis.surfaces) {
    const attachments = surface.attachments ?? [];
    const vertices = surface.positions.length / 3;
    const sums = new Map<number, number>();
    const seen = new Set<string>();
    for (const attachment of attachments) {
      if (!owners.has(attachment.owner) || seen.has(attachment.owner))
        throw new Error(
          "A facial attachment must name a declared articulation owner once per surface: " +
            surface.id +
            "/" +
            attachment.owner,
        );
      seen.add(attachment.owner);
      const rows = attachment.rows;
      if (rows.length === 0 || rows.length % 2 !== 0)
        throw new Error(
          "Facial attachment rows are nonempty [vertex, weight] pairs: " +
            surface.id,
        );
      let previous = -1;
      for (let i = 0; i < rows.length; i += 2) {
        const vertex = rows[i];
        const weight = rows[i + 1];
        if (
          !Number.isInteger(vertex) ||
          vertex <= previous ||
          vertex >= vertices ||
          !Number.isFinite(weight) ||
          weight <= 0 ||
          weight > 1
        )
          throw new Error(
            "Facial attachment weights need resident increasing vertices and weights in (0, 1]: " +
              surface.id,
          );
        previous = vertex;
        const total = (sums.get(vertex) ?? 0) + weight;
        if (total > 1 + 1e-6)
          throw new Error(
            "A facial vertex cannot be attached by more than its whole weight: " +
              surface.id,
          );
        sums.set(vertex, total);
      }
    }
  }
}
