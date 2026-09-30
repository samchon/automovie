import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyUniqueIds } from "./assertHumanBodyUniqueIds";

/**
 * Admit named, bounded channel sides and corrective activation data.
 *
 * Shape control weights are dimensionless, while the endpoint rows they
 * name live on shared skin or joint landmarks in metres. A mirror is an
 * explicit reciprocal authoring relation rather than a naming guess.
 * Channel ramps must lie inside the authored envelope; joint-driven
 * ramps are checked by the rig stage. This function returns the complete
 * record-safe endpoint name population for later surface and landmark
 * correspondence.
 * It does not certify muscle physiology or collision-free combinations.
 */
export function assertHumanBodyBasisShape(
  basis: IAutoMovieHumanBodyBasis,
): Set<string> {
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  const endpoints = new Set<string>();
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
      const mate = channels.get(channel.mirror);
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
  const correctives = basis.correctives ?? [];
  assertHumanBodyUniqueIds(
    [
      ...basis.channels.map((channel) => channel.id),
      ...correctives.map((corrective) => corrective.id),
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
        corrective.inputs.map((input) =>
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
      const channel = channels.get(input.channel);
      if (channel === undefined || channel[input.side] === null)
        throw new Error(
          "A body corrective drives off a side no channel carries: " +
            input.channel +
            "." +
            input.side,
        );
      // a weight ramp lies inside the envelope on its side, so no admitted
      // weight arms a corrective past its end and every ramp can reach one
      const onset = input.onset ?? 0;
      const full = input.full ?? 1;
      const extent =
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
  return endpoints;
}
