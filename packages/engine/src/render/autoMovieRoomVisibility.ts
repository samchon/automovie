import { IAutoMovieBuiltSpace, IAutoMovieBuiltOpening, IAutoMovieConnectorLanding,
  IAutoMovieBuiltEnvironment,
  IAutoMovieRoomVisibility,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "../architecture/builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** The exterior, as a node of the portal graph rather than the absence of one. */
const EXTERIOR: string = " exterior";

/**
 * Decide which logical spaces a camera cannot possibly see.
 *
 * Cell-and-portal culling, run conservatively. Two spaces are joined when
 * anything the design declares lets sight pass between them: an opening cut
 * through a shared boundary, a connector such as a stair, lift, ramp or
 * skybridge at every space it stops at rather than only at its two ends, or,
 * for a space whose envelope carries an opening, the exterior itself. A space
 * is hidden only when no such chain reaches it from the space the camera
 * occupies.
 *
 * The exterior is a graph node, which is what makes the answer right in the
 * case that motivates the whole hint: from a sealed interior room, the other
 * windowed rooms of the same building are hidden, while from a windowed room
 * they are kept, because sight can leave one window and enter another. A culler
 * that treated "outside" as nothing would have hidden the second case and
 * produced a frame the film does not contain.
 *
 * Containment is decided over LEAF spaces. A storey containing a room contains
 * the camera too, and reading that as two candidate cells would make every
 * ordinary building ambiguous; the storeys and building spaces above the
 * camera's room are containers, and they are always kept.
 *
 * The cases that hide nothing are as important as the ones that hide something,
 * and each states its reason:
 *
 * - The camera is outside every declared leaf space, so it may see any facade;
 * - The camera lies in more than one leaf space, so which cell it occupies is not
 *   a fact the design settled;
 * - Some leaf space declares no cells, so its extent is unknown and a sight line
 *   through it cannot be ruled out. Placement and proof stay separate facts
 *   here: an unknown extent leaves the camera's own room reported when it is
 *   settled, and refuses to call the camera exterior when it is not, because a
 *   camera standing inside the one space nobody measured is exactly the case
 *   "outside every space" would get wrong;
 * - A boundary carrying an opening is a portal even when a door leaf fills it,
 *   because whether that leaf is shut is movable state this issue does not own.
 *   Proving a closed door would hide more, and proving it belongs to the
 *   openings issue rather than to a guess made here.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Build a conservative cell/portal graph from openings and every connector stop, include exterior connectivity and then add ancestors of reachable leaf cells. Outside, ambiguous or cell-less placement hides nothing; validated parent acyclicity is a premise.
 * @evidence contracts/common.md#clear-and-simple-design Leaf containment selects the camera cell and a separate closure owns reachability; container spaces are consequences of visible cells rather than routing shortcuts between sealed rooms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared openings stay portals regardless of movable door state because this owner has no closed-door proof; unknown extents produce an explicit inconclusive result instead of invented culling.
 * @evidence contracts/common.md#meaningful-documentation Docs describe world camera position, leaf/container distinction, exterior behavior and every conservative fallback; sorted ids make outputs independent of declaration order.
 * @evidence contracts/performance.md#efficient-algorithms Containment scans leaf geometry; boundary/connector cliques cost the sum of squared stop counts, and indexed-queue BFS costs O(V+E) without shift-induced queue copies. Parent closure and deterministic sorting add their own space/depth costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Parent, open-boundary and edge indices are built once per request; no graph cache assumes mutable environments, openings or camera position remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph/queue/indices are call-owned and returned id arrays contain only report values; no camera, scene object, handle or background culler is retained.
 */
export const autoMovieRoomVisibility: (props: { environment: IAutoMovieBuiltEnvironment; camera: IAutoMovieVector3; }) => IAutoMovieRoomVisibility = (props: {
  /** Building whose spaces are being culled. */
  environment: IAutoMovieBuiltEnvironment;
  /** World-space camera position. */
  camera: IAutoMovieVector3;
}): IAutoMovieRoomVisibility => {
  const { environment, camera }: { environment: IAutoMovieBuiltEnvironment; camera: IAutoMovieVector3; } = props;
  const all: string[] = environment.spaces
    .map((space: IAutoMovieBuiltSpace) : string => space.id)
    .sort(compareAutoMovieRenderIds);
  const parents: Set<string> = new Set(
    environment.spaces
      .map((space: IAutoMovieBuiltSpace) : string | null => space.parent)
      .filter((parent: string | null): parent is string => parent !== null),
  );
  const leaves: IAutoMovieBuiltSpace[] = environment.spaces.filter((space: IAutoMovieBuiltSpace) : boolean => !parents.has(space.id));

  const cellless: string[] = leaves
    .filter((space: IAutoMovieBuiltSpace) : boolean => builtSpaceStatesVolume(space) === false)
    .map((space: IAutoMovieBuiltSpace) : string => space.id)
    .sort(compareAutoMovieRenderIds);
  const containing: string[] = leaves
    .filter((space: IAutoMovieBuiltSpace) : boolean => builtSpaceContainsPoint(space, camera))
    .map((space: IAutoMovieBuiltSpace) : string => space.id)
    .sort(compareAutoMovieRenderIds);
  if (containing.length === 0)
    // With an unknown extent in the building the camera may be standing in it,
    // so "outside every space" is a claim the design does not support. Placement
    // and proof are separate facts and neither is guessed to fill the other in.
    return cellless.length === 0
      ? {
          version: 1,
          camera: null,
          cameraPlacement: "exterior",
          hidden: [],
          visible: all,
          inconclusive:
            "the camera is outside every declared leaf space, so no interior cell can be proved unseen",
        }
      : {
          version: 1,
          camera: null,
          cameraPlacement: "ambiguous",
          hidden: [],
          visible: all,
          inconclusive: `the camera lies in no celled leaf space while leaf space "${cellless[0]!}" declares no cells, so its placement is not determined`,
        };
  if (containing.length > 1)
    return {
      version: 1,
      camera: null,
      cameraPlacement: "ambiguous",
      hidden: [],
      visible: all,
      inconclusive: `the camera lies in ${containing.length} overlapping leaf spaces (${containing.join(", ")}), so its cell is not determined`,
    };

  const origin: string = containing[0]!;
  if (cellless.length !== 0)
    // Placement is settled, the proof is not: an unknown extent anywhere in the
    // building could carry a sight line into any cell.
    return {
      version: 1,
      camera: origin,
      cameraPlacement: "interior",
      hidden: [],
      visible: all,
      inconclusive: `leaf space "${cellless[0]!}" declares no cells, so its extent is unknown and no sight line through it can be ruled out`,
    };
  const reachable: Set<string> = reach(environment, origin);
  return {
    version: 1,
    camera: origin,
    cameraPlacement: "interior",
    hidden: all.filter((id: string) : boolean => !reachable.has(id)),
    visible: all.filter((id: string) : boolean => reachable.has(id)),
    inconclusive: null,
  };
};

/**
 * Every space kept visible from `origin`.
 *
 * The portal closure runs over cells only, and containers are added at the end.
 * A storey is not something the camera sees THROUGH, it is something a visible
 * room is INSIDE, so it is a consequence of the closure and never a route
 * through it: making a container a routing node would let sight pass between
 * two sealed rooms merely because they share a floor.
 */
const reach: (environment: IAutoMovieBuiltEnvironment, origin: string) => Set<string> = (
  environment: IAutoMovieBuiltEnvironment,
  origin: string,
): Set<string> => {
  const parentOf: Map<string, string | null> = new Map(
    environment.spaces.map((space: IAutoMovieBuiltSpace) : [string, string | null] => [space.id, space.parent]),
  );
  const edges: Map<string, Set<string>> = new Map<string, Set<string>>();
  const join: (from: string, to: string) => void = (from: string, to: string): void => {
    const bucket: Set<string> | undefined = edges.get(from);
    if (bucket === undefined) edges.set(from, new Set([to]));
    else bucket.add(to);
  };
  const openBoundaries: Set<string> = new Set(
    environment.openings.map((opening: IAutoMovieBuiltOpening) : string => opening.boundary),
  );
  for (const boundary of environment.boundaries) {
    if (!openBoundaries.has(boundary.id)) continue;
    // A boundary enclosing exactly one space is that space's envelope, so an
    // opening in it is a window or a door onto the outside.
    if (boundary.spaces.length === 1) {
      join(boundary.spaces[0]!, EXTERIOR);
      join(EXTERIOR, boundary.spaces[0]!);
    } else
      for (const from of boundary.spaces)
        for (const to of boundary.spaces) if (from !== to) join(from, to);
  }
  // A connector is a route between every space it stops at, so it is a portal
  // in both directions for sight even when traversal is declared one-way, and
  // between every pair of its stops rather than only its two ends. A lift
  // passing five floors is one shaft, not five relations, and the storeys it
  // serves in between reach the graph through its landings alone: joining ends
  // only would hide exactly the floors the run exists to serve, while the
  // adjacency query beside this one already answers with them.
  for (const connector of environment.connectors) {
    const stops: string[] = [
      connector.from,
      ...(connector.landings ?? []).map((landing: IAutoMovieConnectorLanding) : string => landing.space),
      connector.to,
    ];
    for (const from of stops)
      for (const to of stops) if (from !== to) join(from, to);
  }

  const reachable: Set<string> = new Set<string>();
  const queue: string[] = [];
  const seed: (id: string) => void = (id: string): void => {
    if (reachable.has(id)) return;
    reachable.add(id);
    queue.push(id);
  };
  seed(origin);
  for (let head: number = 0; head < queue.length; ++head) {
    const current: string = queue[head]!;
    for (const next of edges.get(current) ?? []) seed(next);
  }
  reachable.delete(EXTERIOR);
  // A container of a visible cell is visible. Hiding the storey that holds a
  // room the camera can see through a stair would delete the floor the shot
  // stands on, which is the opposite of conservative.
  for (const id of [...reachable]) {
    let ancestor: string | null = parentOf.get(id) ?? null;
    while (ancestor !== null && !reachable.has(ancestor)) {
      reachable.add(ancestor);
      ancestor = parentOf.get(ancestor) ?? null;
    }
  }
  return reachable;
};
