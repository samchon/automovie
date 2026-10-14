import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceControlMap } from "../structures/IAutoMovieHumanFaceControlMap";
import type { IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported } from "../../index";

/** A copied authored group with its admitted resident channel records. */
type CompiledGroup = IAutoMovieHumanFaceControlMap["groups"][number] & {
  members: IAutoMovieHumanFaceBasisChannelImported[];
};

/** One origin's normalized mean, residuals and represented feasible interval. */
type Projection = {
  group: CompiledGroup;
  value: number;
  residuals: number[];
  minimum: number;
  maximum: number;
};

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
 * @evidence contracts/common.md#principled-implementation Piecewise normalization uses each admitted shape channel's signed domain, then preserves residuals while changing a group's mean within the intersection of its shifted domains. Disjoint resident groups and a fixed origin make the editor's repeated resolves independent; floating arithmetic limits exact round trips.
 * @evidence contracts/common.md#clear-and-simple-design Compilation owns copied channel/group admission; each projection owns its origin, displayed intervals and one resolver. Fine weights remain the replay representation rather than adding another basis evaluation layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown, repeated, expression or out-of-domain coordinates refuse. Including the already admitted origin and clamping only decoded floating endpoint roundoff do not admit an out-of-range slider request; group names establish no measured biological trait.
 * @evidence contracts/common.md#meaningful-documentation Prose explains asymmetric normalization, residual preservation, shifted-domain intersection, nonaccumulating updates, caller ownership and floating precision.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans channels and group members with maps/sets; a projection costs O(C+M) for supplied fine coordinates and M grouped members. Resolving copies the origin and visits requested groups' members once, avoiding recomputing every group.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled channels and groups are reused for every projection; a projection's residuals and by-id index are reused across slider updates. Every resolve starts from its captured origin, and a changed fine origin requires another projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiler retains one copied map/channel population; each caller-held projection retains its origin, residuals and paths until release. No history or task is stored, though callers can retain arbitrarily many projections.
 */
export function createHumanFaceControlMap(props: {
  basis: Pick<IAutoMovieHumanFaceBasis, "id" | "channels">;
  map: IAutoMovieHumanFaceControlMap;
}): (input: Record<string, number>) => { controls: { id: string; label: string; description: string; value: number; minimum: number; maximum: number; }[]; resolve: (values: Record<string, number>) => Record<string, number>; }  {
  const map: IAutoMovieHumanFaceControlMap = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceControlMap>(props.map),
  );
  if (map.basis !== props.basis.id)
    throw new Error("Simple facial controls require their exact basis.");
  const channels: Map<string, IAutoMovieHumanFaceBasisChannelImported> = new Map(
    props.basis.channels
      .filter((channel: IAutoMovieHumanFaceBasisChannelImported): boolean  => channel.kind === "shape")
      .map((channel: IAutoMovieHumanFaceBasisChannelImported): [string, IAutoMovieHumanFaceBasisChannelImported]  => [channel.id, { ...channel }]),
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
  const identities: Set<string> = new Set<string>();
  const members: Set<string> = new Set<string>();
  const groups: CompiledGroup[] = map.groups.map((group: { id: string; label: string; description: string; channels: string[]; }): CompiledGroup  => {
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
      members: group.channels.map((id: string): IAutoMovieHumanFaceBasisChannelImported  => {
        const channel: IAutoMovieHumanFaceBasisChannelImported | undefined = channels.get(id);
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
  return (input: Record<string, number>): { controls: { id: string; label: string; description: string; value: number; minimum: number; maximum: number; }[]; resolve: (values: Record<string, number>) => Record<string, number>; }  => {
    const origin: Map<string, number> = new Map(Object.entries(input));
    for (const [id, value] of origin) {
      const channel: IAutoMovieHumanFaceBasisChannelImported | undefined = channels.get(id);
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
    const projections: Projection[] = groups.map((group: CompiledGroup): Projection  => {
      const normalized: number[] = group.members.map((channel: IAutoMovieHumanFaceBasisChannelImported): number  => {
        const value: number = origin.get(channel.id) ?? 0;
        return value / (value < 0 ? -channel.minimum : channel.maximum);
      });
      // Divide before summing: the mean stays bounded for large groups too.
      const value: number = normalized.reduce(
        (sum: number, item: number): number  => sum + item / normalized.length,
        0,
      );
      const residuals: number[] = normalized.map((item: number): number  => item - value);
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
            (minimum: number, channel: IAutoMovieHumanFaceBasisChannelImported, index: number): number  =>
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
            (maximum: number, residual: number): number  => Math.min(maximum, 1 - residual),
            Infinity,
          ),
        ),
      };
    });
    const byId: Map<string, Projection> = new Map(projections.map((entry: Projection): [string, Projection]  => [entry.group.id, entry]));
    return {
      controls: projections.map(({ group, value, minimum, maximum }: Projection): { id: string; label: string; description: string; value: number; minimum: number; maximum: number; }  => ({
        id: group.id,
        label: group.label,
        description: group.description,
        value,
        minimum,
        maximum,
      })),
      resolve: (values: Record<string, number>): Record<string, number> => {
        const result: Map<string, number> = new Map(origin);
        for (const [id, value] of Object.entries(values)) {
          const entry: Projection | undefined = byId.get(id);
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
          entry.group.members.forEach((channel: IAutoMovieHumanFaceBasisChannelImported, index: number): void  => {
            // Admission above preserves the residual exactly in real arithmetic;
            // only floating addition at an endpoint can stray outside its domain.
            const normalized: number = Math.min(
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
