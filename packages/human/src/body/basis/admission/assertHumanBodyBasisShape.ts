import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyUniqueIds } from "./assertHumanBodyUniqueIds";

/**
 * Admit named, bounded channel sides and corrective activation data.
 *
 * Shape control weights are dimensionless, while the endpoint rows they name live on shared skin or joint landmarks in metres. A mirror is an explicit reciprocal authoring relation rather than a naming guess. Channel ramps have nonnegative onset and a larger full endpoint no more than 1e-9 beyond their side's authored envelope, so the admitted envelope need not reach exactly full activation. Joint-driven ramps are checked by the rig stage. This function returns the complete record-safe endpoint name population for later surface and landmark correspondence. It does not certify muscle physiology or collision-free combinations. Source-unavailable target IDs must name this same declared population once; a renamed or removed target invalidates its old dependency token. This admission never fills a missing field or declares an absent status complete.
 *
 * @evidence contracts/common.md#principled-implementation Neutral-containing finite channel envelopes, reciprocal same-group mirrors and distinct corrective drivers with the existing 1e-9 full-endpoint allowance establish the declared endpoint population, including explicit unavailable source dependencies.
 * @evidence contracts/common.md#clear-and-simple-design Shape admission owns channel-side/corrective relationships while rig admission handles joint and shoulder driver reach.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable targets must remain declared identities; missing endpoints are not filled and source response bounds do not certify physiology or collision-free combinations.
 * @evidence contracts/common.md#meaningful-documentation The prose gives dimensionless channels, meter endpoint rows, reciprocal mirroring and the limits of this admission.
 * @evidence contracts/performance.md#efficient-algorithms Channel maps give O(1) expected driver/mirror lookups; total work scans C channels, all D corrective drivers and U unavailable names with O(C+D+E) transient/set storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One channel map serves all mirror and driver checks; the returned endpoint set feeds later surface/landmark admission without recomputing this population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps and driver-key sets expire after admission; only at most E endpoint names escape, with the source basis unchanged on failure.
 */
export function assertHumanBodyBasisShape(
  basis: IAutoMovieHumanBodyBasis,
): Set<string> {
  const channels: Map<string, IAutoMovieHumanBodyBasis["channels"][number]> = new Map(
    basis.channels.map((channel: IAutoMovieHumanBodyBasis["channels"][number]): [string, IAutoMovieHumanBodyBasis["channels"][number]] => [channel.id, channel]),
  );
  const endpoints: Set<string> = new Set<string>();
  for (const channel of basis.channels) {
    if (
      ![channel.minimum, channel.maximum].every(Number.isFinite) ||
      channel.minimum > 0 ||
      channel.maximum <= 0 ||
      channel.positive.trim() === "" ||
      (channel.minimum < 0 &&
        (channel.negative === null || channel.negative.trim() === "")) ||
      (channel.minimum === 0 && channel.negative !== null)
    )
      throw new Error(
        "Body channels need a finite neutral-containing envelope and named endpoints.",
      );
    // A mirror is a claim both channels make about each other, in the same
    // group; a one-sided mirror would let an editor pair a control with one
    // that does not pair back.
    if (channel.mirror !== null) {
      const mate: IAutoMovieHumanBodyBasis["channels"][number] | undefined = channels.get(channel.mirror);
      if (
        mate === undefined ||
        mate.id === channel.id ||
        mate.mirror !== channel.id ||
        mate.group !== channel.group
      )
        throw new Error(
          "Body channel mirrors must be reciprocal within one group: " +
            channel.id,
        );
    }
    endpoints.add(channel.positive);
    if (channel.negative !== null) endpoints.add(channel.negative);
  }
  const correctives: NonNullable<IAutoMovieHumanBodyBasis["correctives"]> = basis.correctives ?? [];
  assertHumanBodyUniqueIds(
    [
      ...basis.channels.map((channel: IAutoMovieHumanBodyBasis["channels"][number]): string => channel.id),
      ...correctives.map((corrective: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number]): string => corrective.id),
    ],
    "channel and corrective identities",
  );
  for (const corrective of correctives) {
    if (
      corrective.inputs.length === 0 ||
      !Number.isFinite(corrective.weight) ||
      corrective.weight <= 0 ||
      corrective.weight > 1 ||
      corrective.target.trim() === "" ||
      new Set(
        corrective.inputs.map((input: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number]["inputs"][number]): string =>
          "bone" in input
            ? input.bone + "." + input.axis + "/" + input.side
            : "shoulder" in input
              ? input.shoulder +
                "/orientation/" +
                input.orientation.plane +
                "/" +
                input.orientation.elevation +
                "/" +
                input.orientation.axialRotation
              : input.channel + "/" + input.side,
        ),
      ).size !== corrective.inputs.length
    )
      throw new Error(
        "A body corrective needs distinct drivers, a gain in (0,1] and a named endpoint.",
      );
    for (const input of corrective.inputs) {
      if (!("channel" in input)) continue; // joint and shoulder drivers are admitted with the rig
      const channel: IAutoMovieHumanBodyBasis["channels"][number] | undefined = channels.get(input.channel);
      if (channel === undefined || channel[input.side] === null)
        throw new Error(
          "A body corrective drives off a side no channel carries: " +
            input.channel +
            "." +
            input.side,
        );
      // The full endpoint may exceed this side's envelope by a nanounit;
      // metadata admission therefore need not permit exactly full activation.
      const onset: number = input.onset ?? 0;
      const full: number = input.full ?? 1;
      const extent: number =
        input.side === "positive" ? channel.maximum : -channel.minimum;
      if (
        !Number.isFinite(onset) ||
        !Number.isFinite(full) ||
        onset < 0 ||
        full <= onset ||
        full > extent + 1e-9
      )
        throw new Error(
          "A body channel driver needs a ramp inside its envelope: " +
            corrective.id +
            " " +
            input.channel +
            `.${input.side} onset ${onset} full ${full} extent ${extent}`,
        );
    }
    endpoints.add(corrective.target);
  }
  assertHumanBodyUniqueIds([...endpoints], "endpoint identities");
  const unavailable: string[] = basis.unavailableTargets ?? [];
  assertHumanBodyUniqueIds(unavailable, "unavailable source target identities");
  for (const target of unavailable)
    if (!endpoints.has(target))
      throw new Error(
        "Unavailable body source target is not declared: " + target,
      );
  return endpoints;
}
