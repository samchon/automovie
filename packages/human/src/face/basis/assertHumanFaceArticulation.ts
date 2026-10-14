import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisLandmarks as IAutoMovieHumanFaceBasisLandmarksImported } from "../structures/IAutoMovieHumanFaceBasisLandmarks";
import type { IAutoMovieHumanFaceBasisArticulation as IAutoMovieHumanFaceBasisArticulationImported } from "../structures/IAutoMovieHumanFaceBasisArticulation";
import type { IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported } from "../structures/IAutoMovieHumanFaceBasisChannel";
import type { IAutoMovieHumanFaceSurfaceAttachment as IAutoMovieHumanFaceSurfaceAttachmentImported } from "../structures/IAutoMovieHumanFaceSurfaceAttachment";


const unitAxis: (axis: readonly number[]) => boolean = (axis: readonly number[]): boolean =>
  axis.length === 3 &&
  axis.every(Number.isFinite) &&
  Math.abs(Math.hypot(axis[0], axis[1], axis[2]) - 1) <= 1e-6;
const finiteTriple: (values: readonly number[]) => boolean = (values: readonly number[]): boolean =>
  values.length === 3 && values.every(Number.isFinite);

/**
 * Admit the landmarks, articulation and attachments of a facial basis.
 *
 * Called by `assertHumanFaceBasis` once channels, correctives and surfaces are
 * known valid, with the set of endpoint names those declare. Landmarks need
 * unique names, one finite XYZ each and sparse rows on declared endpoints in
 * the surface row format, but only identity endpoints may move them. An
 * expression endpoint or a corrective with any expression driver cannot
 * supply joint-landmark rows. An articulation needs its pivot and centre
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
 * @evidence contracts/common.md#principled-implementation Declared identity-only endpoints admit finite sparse landmark deltas; expression endpoints and expression-driven correctives refuse landmark ownership, preserving shaped joint centres across performance. Resident pivots, near-unit axes, expression-only unique drives and increasing attachment weights retain their structural admission.
 * @evidence contracts/common.md#clear-and-simple-design Landmarks, joint owners/channel drives and per-surface attachment populations are checked together after immutable basis connectivity admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unit-axis and summed-weight 1e-6 tolerances admit numeric payload precision without rewriting it; declared full opening must respect its own translation limit, and structural checks prove no anatomical axis or weight.
 * @evidence contracts/common.md#meaningful-documentation Prose states caller admission order, finite/resident requirements, channel ownership, no-articulation meaning and publisher anatomy responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Landmark/endpoint, joint and attachment populations are scanned once with sets/maps for expected constant membership; channel-map construction and per-vertex sums retain their actual population costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing endpoints and one channel map serve every joint; one ownership/sum map per surface avoids repeated full attachment comparisons.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation maps are local and bounded by declared landmarks/channels/vertices; failure changes no basis and retains no task or external handle.
 */
export function assertHumanFaceArticulation(
  basis: IAutoMovieHumanFaceBasis,
  endpoints: ReadonlySet<string>,
): void {
  const landmarks: Set<string> = new Set<string>();
  if (basis.landmarks !== undefined) {
    const expressionChannels: Set<string> = new Set(
      basis.channels
        .filter((channel: IAutoMovieHumanFaceBasisChannelImported): boolean => channel.kind === "expression")
        .map((channel: IAutoMovieHumanFaceBasisChannelImported): string => channel.id),
    );
    const performanceEndpoints: Set<string> = new Set<string>();
    for (const channel of basis.channels)
      if (expressionChannels.has(channel.id)) {
        performanceEndpoints.add(channel.positive);
        if (channel.negative !== null)
          performanceEndpoints.add(channel.negative);
      }
    for (const corrective of basis.correctives ?? [])
      if (corrective.inputs.some((input: { channel: string }): boolean => expressionChannels.has(input.channel)))
        performanceEndpoints.add(corrective.target);
    const { ids, positions, targets }: IAutoMovieHumanFaceBasisLandmarksImported = basis.landmarks;
    if (
      ids.length === 0 ||
      ids.some((id: string): boolean  => id.trim() === "") ||
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
        performanceEndpoints.has(name) ||
        rows.length === 0 ||
        rows.length % 4 !== 0 ||
        !rows.every(Number.isFinite)
      )
        throw new Error(
          "Facial landmark rows need a declared identity-only endpoint and finite sparse XYZ rows.",
        );
      let previous: number = -1;
      for (let i: number = 0; i < rows.length; i += 4) {
        const landmark: number = rows[i];
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
  const owners: Set<string> = new Set<string>();
  const articulation: IAutoMovieHumanFaceBasisArticulationImported | undefined = basis.articulation;
  if (articulation !== undefined) {
    const channels: Map<string, "shape" | "expression"> = new Map(
      basis.channels.map((channel: IAutoMovieHumanFaceBasisChannelImported): [string, "shape" | "expression"]  => [channel.id, channel.kind]),
    );
    const driven: Set<string> = new Set<string>();
    const drive: (channel: string) => void = (channel: string): void => {
      if (channels.get(channel) !== "expression" || driven.has(channel))
        throw new Error(
          "An articulation channel must be one expression channel driving one joint: " +
            channel,
        );
      driven.add(channel);
    };
    const { jaw }: IAutoMovieHumanFaceBasisArticulationImported = articulation;
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
    const attachments: IAutoMovieHumanFaceSurfaceAttachmentImported[] = surface.attachments ?? [];
    const vertices: number = surface.positions.length / 3;
    const sums: Map<number, number> = new Map<number, number>();
    const seen: Set<string> = new Set<string>();
    for (const attachment of attachments) {
      if (!owners.has(attachment.owner) || seen.has(attachment.owner))
        throw new Error(
          "A facial attachment must name a declared articulation owner once per surface: " +
            surface.id +
            "/" +
            attachment.owner,
        );
      seen.add(attachment.owner);
      const rows: number[] = attachment.rows;
      if (rows.length === 0 || rows.length % 2 !== 0)
        throw new Error(
          "Facial attachment rows are nonempty [vertex, weight] pairs: " +
            surface.id,
        );
      let previous: number = -1;
      for (let i: number = 0; i < rows.length; i += 2) {
        const vertex: number = rows[i];
        const weight: number = rows[i + 1];
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
        const total: number = (sums.get(vertex) ?? 0) + weight;
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
