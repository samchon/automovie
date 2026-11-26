import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidDrain,
  IAutoMovieFluidSource,
  type IAutoMovieLowerWetZoneDrainage,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
  IAutoMovieWetZone,
} from "@automovie/interface";

/** Media a floor drain is allowed to discharge into. */
const WASTE_MEDIUM: string = "waste-water";

/**
 * Compose a wet zone's plumbing into an independent fluid domain.
 *
 * This is the seam that keeps one model of moving water. The service graph
 * states where water is delivered and where it is taken away; the shallow-water
 * domain states how it then moves. Rather than inventing a second, weaker
 * account of flow inside the building record, the zone's supply ports become
 * the domain's declared sources and its drains become the domain's declared
 * drains, at the lattice cells they actually stand over. A basin that fills,
 * overflows and empties is then the fluid solver's ordinary business, and its
 * mass ledger is the same one every other domain is checked with.
 *
 * The sill of a derived drain is the bed elevation of its own cell, which is
 * what a plain floor gully is: it opens the moment water stands on the floor
 * above it. A weir with a raised sill is a different fixture and is authored on
 * the domain directly.
 *
 * Every supply inlet in the room becomes a source, including the inlet of a
 * fitting that merely passes the medium on. That is not a double count: such a
 * fitting declares `0`, so it lowers to a source that delivers nothing, and the
 * water is counted once where it is actually drawn. Dropping those inlets by
 * node kind would instead make `kind` decide a hydraulic quantity the port's
 * own `demand` already states.
 *
 * The network is expected to have been validated already; this lowering answers
 * only for the placement it performs, not for the graph it reads. Selected
 * plumbing inlet system and port units must both be cubic-meter-per-second;
 * other units throw because network admission permits nonvolumetric "other"
 * media, while this seam performs no physical unit conversion.
 *
 * Refuses rather than repairs. An unknown zone, an unknown drain node, a node
 * standing off the lattice and a derived id that collides with an authored one
 * each raise, because every one of them would otherwise produce a domain that
 * silently conserves the wrong amount of water. The returned domain shares
 * unchanged grid, bed and authored entry records; only source/drain arrays and
 * derived entries are new. There is currently no production caller for this
 * composition, only service drainage tests.
 */
export function lowerWetZoneDrainage(
  props: IAutoMovieLowerWetZoneDrainage.IProps,
): IAutoMovieFluidDomain {
  const { network, domain }: typeof props = props;
  const zone: IAutoMovieWetZone | undefined = network.zones.find(
    (candidate: IAutoMovieWetZone): boolean => candidate.id === props.zone,
  );
  if (zone === undefined)
    throw new Error(
      `service network "${network.id}" has no wet zone "${props.zone}"`,
    );
  const systems: Map<string, IAutoMovieServiceSystem> = new Map(
    network.systems.map(
      (
        system: IAutoMovieServiceSystem,
      ): readonly [string, IAutoMovieServiceSystem] =>
        [system.id, system] as const,
    ),
  );

  const sources: IAutoMovieFluidSource[] = [];
  for (const node of network.nodes) {
    if (node.space !== zone.space) continue;
    for (const port of node.ports) {
      if (port.direction !== "in") continue;
      const system: IAutoMovieServiceSystem | undefined = systems.get(
        port.system,
      );
      if (system === undefined || system.discipline !== "plumbing") continue;
      if (
        system.unit !== "cubic-meter-per-second" ||
        port.unit !== "cubic-meter-per-second"
      )
        throw new Error(
          `wet zone "${zone.id}" inlet "${port.id}" requires cubic-meter-per-second demand`,
        );
      const cell: { column: number; row: number } = cellOf(
        domain,
        node,
        zone.id,
      );
      sources.push({
        id: derivedId(zone.id, port.id, domain, "source"),
        column: cell.column,
        row: cell.row,
        flowRate: port.demand,
        start: 0,
        end: null,
      });
    }
  }

  const drains: IAutoMovieFluidDrain[] = [];
  for (const id of zone.drains) {
    const node: IAutoMovieServiceNode | undefined = network.nodes.find(
      (candidate: IAutoMovieServiceNode): boolean => candidate.id === id,
    );
    if (node === undefined)
      throw new Error(
        `wet zone "${zone.id}" cites drain node "${id}", which the network does not declare`,
      );
    const cell: { column: number; row: number } = cellOf(domain, node, zone.id);
    for (const port of wastePortsOf(node, systems))
      drains.push({
        id: derivedId(zone.id, port.id, domain, "drain"),
        column: cell.column,
        row: cell.row,
        flowRate: port.demand,
        sillLevel: domain.bed[cell.row * domain.grid.columns + cell.column]!,
        start: 0,
        end: null,
      });
  }

  return {
    ...domain,
    sources: [...domain.sources, ...sources],
    drains: [...domain.drains, ...drains],
  };
}

/** The outgoing waste-water ports a node carries, in declaration order. */
const wastePortsOf: (
  node: IAutoMovieServiceNode,
  systems: ReadonlyMap<string, IAutoMovieServiceSystem>,
) => IAutoMovieServicePort[] = (
  node: IAutoMovieServiceNode,
  systems: ReadonlyMap<string, IAutoMovieServiceSystem>,
): IAutoMovieServiceNode["ports"] =>
  node.ports.filter((port: IAutoMovieServicePort): boolean => {
    const system: IAutoMovieServiceSystem | undefined = systems.get(
      port.system,
    );
    return (
      port.direction === "out" &&
      system !== undefined &&
      system.discipline === "drainage" &&
      system.medium === WASTE_MEDIUM
    );
  });

/** Resolve the lattice cell a node stands over, refusing one that stands off it. */
const cellOf: (
  domain: IAutoMovieFluidDomain,
  node: IAutoMovieServiceNode,
  zone: string,
) => { column: number; row: number } = (
  domain: IAutoMovieFluidDomain,
  node: IAutoMovieServiceNode,
  zone: string,
): { column: number; row: number } => {
  const column: number = Math.floor(
    (node.position.x - domain.grid.origin.x) / domain.grid.cellX,
  );
  const row: number = Math.floor(
    (node.position.z - domain.grid.origin.z) / domain.grid.cellZ,
  );
  if (
    !(
      column >= 0 &&
      row >= 0 &&
      column < domain.grid.columns &&
      row < domain.grid.rows
    )
  )
    throw new Error(
      `wet zone "${zone}" node "${node.id}" stands off the lattice of fluid domain "${domain.id}"`,
    );
  return { column, row };
};

/** Name a derived inflow or outflow, refusing to shadow an authored one. */
const derivedId: (
  zone: string,
  port: string,
  domain: IAutoMovieFluidDomain,
  kind: "source" | "drain",
) => string = (
  zone: string,
  port: string,
  domain: IAutoMovieFluidDomain,
  kind: "source" | "drain",
): string => {
  const id: string = `${zone}/${port}`;
  const taken: boolean =
    kind === "source"
      ? domain.sources.some(
          (entry: IAutoMovieFluidSource): boolean => entry.id === id,
        )
      : domain.drains.some(
          (entry: IAutoMovieFluidDrain): boolean => entry.id === id,
        );
  if (taken)
    throw new Error(
      `fluid domain "${domain.id}" already declares a ${kind} named "${id}"`,
    );
  return id;
};
