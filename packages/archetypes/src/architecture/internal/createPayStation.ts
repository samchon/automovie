import type { AutoMovieArchetypePayStation } from "../AutoMovieArchetypePayStation";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { ServiceCabinet } from "./ServiceCabinet";

/**
 * A parking pay station with a raised control head, a front contact and a side
 * contact.
 *
 * The measured StradaPAL cabinet, spacer and head preserve the installation's
 * dimensions. The measured contact set covers its exterior faces. The cabinet
 * rests on the floor at the origin and faces +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createPayStation(
  params: AutoMovieArchetypePayStation.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePayStation.Affordance, AutoMovieArchetypePayStation.Dimension> {
  const cabinet: ServiceCabinet.ICabinet<AutoMovieArchetypePayStation.Affordance> =
    ServiceCabinet.begin("payStation", "pay station", "#2b5797", params, seed);
  const {
    builder,
    width,
    height,
    depth,
  }: ServiceCabinet.ICabinet<AutoMovieArchetypePayStation.Affordance> = cabinet;
  const v: typeof Vector3.create = Vector3.create;
  builder.box(
    "spacer",
    v(width, HEAD.spacer, depth),
    v(0, height + HEAD.spacer / 2, 0),
    { color: "#2b5797" },
  );
  builder.box(
    "head",
    v(HEAD.width, HEAD.height, HEAD.depth),
    v(0, height + HEAD.spacer + HEAD.height / 2, 0),
    { color: "#2b5797" },
  );
  ServiceCabinet.faces(cabinet);
  return cabinet.builder.build(cabinet.mass);
}

/**
 * A pay station's head on its body, metres: the StradaPAL's 90 mm spacer and
 * its 475 x 226 x 379 mm top.
 */
const HEAD: Readonly<{
  spacer: number;
  width: number;
  height: number;
  depth: number;
}> = { spacer: 0.09, width: 0.475, height: 0.226, depth: 0.379 };
