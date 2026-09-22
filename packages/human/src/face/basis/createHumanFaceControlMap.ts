import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceControlMap } from "../structures/IAutoMovieHumanFaceControlMap";

/**
 * Compile a reversible simple-coordinate view of admitted fine shape weights.
 * A member's negative and positive endpoints normalize to -1 and +1. A group's
 * coordinate is their arithmetic mean; each member retains its residual from
 * that mean. Resolving a new mean adds those same residuals before decoding.
 * The available interval is the intersection of the members' residual-shifted
 * intervals. Out-of-range requests refuse instead of erasing detail by clamping.
 *
 * Each projection owns an origin. All resolves start from that origin, so slider
 * updates do not accumulate deltas. Saving needs only the resolved fine weights;
 * projecting them again recovers the mean and residuals to floating precision.
 * Neither the map nor any shape supplied by a caller is mutated.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Converts simple edits into the canonical fine representation while retaining asymmetric and unlisted detail.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Implements explicit endpoint normalization, mean/residual projection, bounded lowering and origin-based replay.
 */
export function createHumanFaceControlMap(props: {
  basis: Pick<IAutoMovieHumanFaceBasis, "id" | "channels">;
  map: IAutoMovieHumanFaceControlMap;
}) {
  const map = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceControlMap>(props.map),
  );
  if (map.basis !== props.basis.id)
    throw new Error("Simple facial controls require their exact basis.");
  const channels = new Map(
    props.basis.channels
      .filter((channel) => channel.kind === "shape")
      .map((channel) => [channel.id, { ...channel }]),
  );
  for (const channel of channels.values())
    if (
      !Number.isFinite(channel.minimum) ||
      !Number.isFinite(channel.maximum) ||
      channel.minimum > 0 ||
      channel.maximum <= 0
    )
      throw new Error(
        "Fine shape coordinates need finite neutral-containing domains.",
      );
  const identities = new Set<string>();
  const members = new Set<string>();
  const groups = map.groups.map((group) => {
    if (
      group.id.trim() === "" ||
      group.label.trim() === "" ||
      group.description.trim() === "" ||
      identities.has(group.id) ||
      group.channels.length === 0
    )
      throw new Error(
        "Simple facial groups need unique identities, descriptions and members.",
      );
    identities.add(group.id);
    return {
      ...group,
      members: group.channels.map((id) => {
        const channel = channels.get(id);
        if (channel === undefined || members.has(id))
          throw new Error(
            "Simple facial groups require disjoint resident shape channels: " +
              id,
          );
        members.add(id);
        return channel;
      }),
    };
  });
  return (input: Record<string, number>) => {
    const origin = new Map(Object.entries(input));
    for (const [id, value] of origin) {
      const channel = channels.get(id);
      if (
        channel === undefined ||
        !Number.isFinite(value) ||
        value < channel.minimum ||
        value > channel.maximum
      )
        throw new Error(
          "Unsupported or out-of-domain fine shape coordinate: " + id,
        );
    }
    const projections = groups.map((group) => {
      const normalized = group.members.map((channel) => {
        const value = origin.get(channel.id) ?? 0;
        return value / (value < 0 ? -channel.minimum : channel.maximum);
      });
      // Divide before summing: the mean stays bounded for large groups too.
      const value = normalized.reduce(
        (sum, item) => sum + item / normalized.length,
        0,
      );
      const residuals = normalized.map((item) => item - value);
      return {
        group,
        value,
        residuals,
        // The admitted origin belongs to the intersection in real arithmetic.
        // Subtracting a rounded residual (for example 1 - 1/3) can exclude it
        // by one floating step. Include that known valid anchor explicitly.
        minimum: Math.min(
          value,
          group.members.reduce(
            (minimum, channel, index) =>
              Math.max(
                minimum,
                (channel.minimum < 0 ? -1 : 0) - residuals[index],
              ),
            -Infinity,
          ),
        ),
        maximum: Math.max(
          value,
          residuals.reduce(
            (maximum, residual) => Math.min(maximum, 1 - residual),
            Infinity,
          ),
        ),
      };
    });
    const byId = new Map(projections.map((entry) => [entry.group.id, entry]));
    return {
      controls: projections.map(({ group, value, minimum, maximum }) => ({
        id: group.id,
        label: group.label,
        description: group.description,
        value,
        minimum,
        maximum,
      })),
      resolve: (values: Record<string, number>): Record<string, number> => {
        const result = new Map(origin);
        for (const [id, value] of Object.entries(values)) {
          const entry = byId.get(id);
          if (
            entry === undefined ||
            !Number.isFinite(value) ||
            value < entry.minimum ||
            value > entry.maximum
          )
            throw new Error(
              "Unsupported or out-of-domain simple facial coordinate: " + id,
            );
          // Preserve omitted coordinates and exact stored values for a no-op.
          if (value === entry.value) continue;
          entry.group.members.forEach((channel, index) => {
            // Admission above preserves the residual exactly in real arithmetic;
            // only floating addition at an endpoint can stray outside its domain.
            const normalized = Math.min(
              1,
              Math.max(
                channel.minimum < 0 ? -1 : 0,
                value + entry.residuals[index],
              ),
            );
            result.set(
              channel.id,
              normalized *
                (normalized < 0 ? -channel.minimum : channel.maximum),
            );
          });
        }
        return Object.fromEntries(result);
      },
    };
  };
}
