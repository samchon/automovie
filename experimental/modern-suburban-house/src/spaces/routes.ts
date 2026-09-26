/**
 * `room-route-network`: the two-storey route table and its check against the
 * built-environment record.
 *
 * Design owner: `docs/spaces/05-route-network.md#room-route-network`. Each
 * edge joins two logical spaces through exactly one authored passage: a door
 * or open void on the boundary between them, a connector, or the one wall-less
 * open connection between front-entry and service-access. The check reads only
 * the record's openings, boundaries, connectors and space cells, never
 * adjacency, so a shared wall or ceiling is not a route. It refuses:
 * - an edge whose opening is missing, or whose host boundary does not separate
 *   exactly the edge's two spaces;
 * - an edge whose connector is missing or joins other spaces;
 * - an open connection with a boundary between its spaces, or whose two sides
 *   are not the two spaces;
 * - a door or open void in the record that no edge uses (closet openings
 *   into storage excepted: storage is not a route node);
 * - any table space not reached from front-entry, and common room, garage or
 *   either bath reachable only through the pantry, powder room or a bedroom.
 * Doors are read in their operable state; the gate and garage door are opened
 * for the check, as 05 states.
 */
import { builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { openingAxis } from "./environment";

/** One route edge: two spaces and the passage that joins them. */
/**
 * @evidence spaces/05-route-network.md IRouteEdge models one named passage between exactly two logical space ids.
 * @evidence principles/core/source-units.md#source-scope-preservation The type carries route endpoints and a passage discriminant, without treating a shared wall as traversable.
 * @evidence principles/core/source-units.md#source-substantive-completion Its union distinguishes openings, connectors, and the one open gap with coordinates needed by the verifier.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent identifies all three passage forms, so the edge type needed no invented route kind.
 */
export interface IRouteEdge {
  /**
   * @evidence spaces/05-route-network.md The route's first endpoint is the space left of an authored table edge.
   * @evidence principles/core/source-units.md#source-scope-preservation `from` names one existing logical space rather than a wall or mesh part.
   * @evidence principles/core/source-units.md#source-substantive-completion Every edge has a required string source id for reachability and endpoint checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route table gives each first endpoint; this field needed no extra origin rule.
   */
  from: string;
  /**
   * @evidence spaces/05-route-network.md The route's second endpoint names the space reached through `via`.
   * @evidence principles/core/source-units.md#source-scope-preservation `to` is a space id and cannot stand in for the passage id held separately by `via`.
   * @evidence principles/core/source-units.md#source-substantive-completion A required string destination lets route checks compare both sides of the host boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent provides each destination; no implicit adjacent room is guessed.
   */
  to: string;
  /** How the edge passes: an opening id, a connector id, or the open connection. */
  /**
   * @evidence spaces/05-route-network.md `via` binds an edge to an opening id, connector id, or the measured wall-less gap.
   * @evidence principles/core/source-units.md#source-scope-preservation The discriminant prevents an arbitrary shared boundary from silently becoming a passage.
   * @evidence principles/core/source-units.md#source-substantive-completion Opening and connector ids or open-gap coordinates give the verifier a concrete host to test.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent distinguishes doors, connectors, and the service open gap; this union adds no fourth kind.
   */
  via: { kind: "opening"; id: string } | { kind: "connector"; id: string } | { kind: "open"; at: { x: number; y: number; z: number }; normal: "x" | "z" };
}

/** The 05 table in its order. */
/**
 * @evidence spaces/05-route-network.md ROUTE_NETWORK is the two-level passage table from the front approach through rooms and garden access.
 * @evidence spaces/05-route-network.md#room-route-network Each row records two space ids and its exact opening, connector, or service-side open-gap host.
 * @evidence principles/core/source-units.md#source-scope-preservation The table records authored circulation only; the checker refuses rather than fabricates missing passages.
 * @evidence principles/core/source-units.md#source-substantive-completion A fixed readonly sequence provides all edges for reachability, bypass, and unused-opening checks.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent names the passage endpoints and hosts, including the open service gap; no extra adjacency was added.
 */
export const ROUTE_NETWORK: readonly IRouteEdge[] = [
  { from: "front-walk", to: "front-porch", via: { kind: "connector", id: "porch-steps" } },
  { from: "driveway", to: "front-walk", via: { kind: "connector", id: "front-walk-connector" } },
  { from: "driveway", to: "garage", via: { kind: "opening", id: "garage-front-door" } },
  { from: "front-porch", to: "front-entry", via: { kind: "opening", id: "front-door" } },
  { from: "front-entry", to: "living-room", via: { kind: "opening", id: "entry-living-door" } },
  // The right open connection along X = 2.02 (service-access-plan): read at mid height of Z = [-3.41, -0.25].
  { from: "front-entry", to: "service-access", via: { kind: "open", at: { x: 2.02, y: 1.0, z: -1.83 }, normal: "x" } },
  { from: "living-room", to: "kitchen-dining-family", via: { kind: "opening", id: "living-common-opening" } },
  { from: "service-access", to: "kitchen-dining-family", via: { kind: "opening", id: "service-common-opening" } },
  { from: "service-access", to: "powder-room", via: { kind: "opening", id: "service-powder-door" } },
  { from: "service-access", to: "laundry-mudroom", via: { kind: "opening", id: "service-laundry-door" } },
  { from: "service-access", to: "pantry", via: { kind: "opening", id: "service-pantry-door" } },
  { from: "laundry-mudroom", to: "garage", via: { kind: "opening", id: "laundry-garage-door" } },
  { from: "kitchen-dining-family", to: "garden-terrace", via: { kind: "opening", id: "garden-door" } },
  { from: "garden-terrace", to: "garden-lower-landing", via: { kind: "connector", id: "garden-steps" } },
  { from: "driveway", to: "side-front-access", via: { kind: "connector", id: "side-front-path" } },
  { from: "side-front-access", to: "side-rear-access", via: { kind: "connector", id: "side-yard-gate-passage" } },
  { from: "side-rear-access", to: "garden-lower-landing", via: { kind: "connector", id: "side-rear-path" } },
  { from: "front-entry", to: "upper-hall", via: { kind: "connector", id: "main-stair-connection" } },
  { from: "upper-hall", to: "bedroom-two", via: { kind: "opening", id: "hall-bedroom-two-door" } },
  { from: "upper-hall", to: "bedroom-three", via: { kind: "opening", id: "hall-bedroom-three-door" } },
  { from: "upper-hall", to: "primary-bedroom", via: { kind: "opening", id: "hall-primary-door" } },
  { from: "upper-hall", to: "shower-bathroom", via: { kind: "opening", id: "hall-shower-door" } },
  { from: "upper-hall", to: "tub-bathroom", via: { kind: "opening", id: "hall-tub-door" } },
  { from: "primary-bedroom", to: "primary-wardrobe", via: { kind: "opening", id: "primary-wardrobe-door" } },
];

/** Rooms a route to the common room, garage or a bath must not pass through (05). */
const NOT_THROUGH = ["pantry", "powder-room", "bedroom-two", "bedroom-three", "primary-bedroom"];
/** Destinations that must be reached without passing a `NOT_THROUGH` room. */
const DIRECT = ["kitchen-dining-family", "garage", "shower-bathroom", "tub-bathroom"];

const order = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const same = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort(order).join("|") === [...b].sort(order).join("|");

/** Spaces reachable from `start`, never entering a space in `avoid` (the start itself excepted). */
const reach = (start: string, avoid: readonly string[]): Set<string> => {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const here = queue.shift()!;
    for (const e of ROUTE_NETWORK)
      for (const [a, b] of [
        [e.from, e.to],
        [e.to, e.from],
      ] as const)
        if (a === here && !seen.has(b)) {
          seen.add(b);
          if (!avoid.includes(b)) queue.push(b);
        }
  }
  return seen;
};

/** Check the route network against a built environment; throws with every failed edge. */
/**
 * @evidence spaces/05-route-network.md This verifier tests the route table against built spaces, openings, connectors, and boundary records.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads actual passage hosts and rejects mismatches; it cannot repair a missing door or change the authored route.
 * @evidence principles/core/source-units.md#source-substantive-completion It reports absent/wrong hosts, unused passage openings, unreachable spaces, and forbidden through-room dependence in one diagnostic.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology A missing edge host or disconnected required room adds an explicit failure and throws instead of guessing geometry.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent already specifies required passages and through-room prohibitions; this checker needed no new connection.
 */
export const checkRouteNetwork = (environment: IAutoMovieBuiltEnvironment): void => {
  const failures: string[] = [];
  const boundaries = new Map(environment.boundaries.map((b) => [b.id, b]));
  const spaces = new Map(environment.spaces.map((s) => [s.id, s]));
  const used = new Set<string>();
  for (const e of ROUTE_NETWORK) {
    const label = `${e.from} → ${e.to}`;
    for (const id of [e.from, e.to]) if (!spaces.has(id)) failures.push(`${label}: space "${id}" is not in the record`);
    if (e.via.kind === "opening") {
      const id = e.via.id;
      used.add(id);
      const opening = environment.openings.find((o) => o.id === id);
      const host = opening === undefined ? undefined : boundaries.get(opening.boundary);
      const outside = [e.from, e.to].find((s) => spaces.get(s)?.kind === "exterior");
      if (opening === undefined || host === undefined) failures.push(`${label}: opening "${id}" is missing`);
      else if (outside === undefined) {
        if (!same(host.spaces, [e.from, e.to])) failures.push(`${label}: opening "${id}" joins ${host.spaces.join(" and ")}`);
      } else {
        // An envelope opening: its boundary encloses the inside space alone, and the
        // point 0.05 m beyond the wall at the void centre stands in the outside zone.
        const inside = outside === e.from ? e.to : e.from;
        const zone = spaces.get(outside)!;
        if (!same(host.spaces, [inside])) failures.push(`${label}: envelope opening "${id}" encloses ${host.spaces.join(" and ")}, not ${inside}`);
        else {
          const { centre, normal, reach } = openingAxis(environment, id);
          const beyond = (s: number) => ({ x: centre.x + normal.x * reach * s, y: centre.y + normal.y * reach * s, z: centre.z + normal.z * reach * s });
          if (!builtSpaceContainsPoint(zone, beyond(1)) && !builtSpaceContainsPoint(zone, beyond(-1)))
            failures.push(`${label}: envelope opening "${id}" does not open on to "${outside}"`);
        }
      }
    } else if (e.via.kind === "connector") {
      const id = e.via.id;
      const c = environment.connectors.find((k) => k.id === id);
      if (c === undefined) failures.push(`${label}: connector "${id}" is missing`);
      else if (!same([c.from, c.to], [e.from, e.to])) failures.push(`${label}: connector "${id}" joins ${c.from} and ${c.to}`);
    } else {
      const { at, normal } = e.via;
      const wall = environment.boundaries.find((b) => same(b.spaces, [e.from, e.to]));
      if (wall !== undefined) failures.push(`${label}: open connection has boundary "${wall.id}" between its spaces`);
      const step = (d: number) => (normal === "x" ? { ...at, x: at.x + d } : { ...at, z: at.z + d });
      const a = spaces.get(e.from);
      const b = spaces.get(e.to);
      const sides = [step(-0.05), step(0.05)];
      const joins = a !== undefined && b !== undefined && ((builtSpaceContainsPoint(a, sides[0]!) && builtSpaceContainsPoint(b, sides[1]!)) || (builtSpaceContainsPoint(a, sides[1]!) && builtSpaceContainsPoint(b, sides[0]!)));
      if (!joins) failures.push(`${label}: the open connection at (${at.x}, ${at.y}, ${at.z}) does not lie between the two spaces`);
    }
  }
  for (const o of environment.openings) {
    if (o.kind === "window" || used.has(o.id)) continue;
    const host = boundaries.get(o.boundary);
    if (host !== undefined && host.spaces.some((s) => spaces.get(s)?.kind === "storage")) continue;
    failures.push(`opening "${o.id}" (${o.kind}) is a passage no route edge uses`);
  }
  const all = reach("front-entry", []);
  for (const e of ROUTE_NETWORK) for (const id of [e.from, e.to]) if (!all.has(id)) failures.push(`"${id}" is not reached from front-entry`);
  const direct = reach("front-entry", NOT_THROUGH);
  for (const id of DIRECT) if (!direct.has(id)) failures.push(`"${id}" is reached only through ${NOT_THROUGH.join(", ")}`);
  if (failures.length > 0) throw new Error(`route network (05) fails:\n  ${failures.join("\n  ")}`);
};
