import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieContactReceipt,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../../film/internal/unionSubjectBoxes";
import { physicalShapeBoundsImplementation } from "../../physics/internal/physicalShapeBoundsImplementation";

/*
 * Measure external interpenetration from the film owner's evaluated parts.
 *
 * Same-layer paths and explicit group ownership govern comparisons. The widest
 * candidate search sorts world group bounds on X and stops at a separating
 * frontier. Optional region bounds are built and compared only for groups that
 * overlap another group. The initialized convex query measures surviving
 * supported pairs without resampling the film. Tangency, native-precision
 * uncertainty and any overlap involving an enclosing or proxy solid are
 * candidates; separation of an enclosing solid proves clearance.
 * Parameter props: Current world parts, local time, supplied convex query and work
 * budget.
 * Returns: Stable measured findings, comparison counts and remaining coverage.
 */
export function measureSceneCollision(
  props: Collision.IProps,
): Collision.IResult {
  if (props.maxComparisons < 0)
    throw new Error("Invalid scene collision time or comparison budget");

  const allowances: Map<string, number> = activeAllowances(
    props.allowances ?? [],
    props.seconds,
  );
  const unboundedParts: string[] = [];
  const proxyParts: string[] = [];
  const internalGroups: Map<string, Collision.IGroup> = new Map();
  const groups: IGroup[] = prepareGroups(
    props.parts,
    props.refinement === "region",
    unboundedParts,
    proxyParts,
    internalGroups,
  );
  const findings: Collision.IFinding[] = [];
  const unavailablePairs: { first: string; second: string }[] = [];
  const compared: {
    groups: number;
    regions: number;
    parts: number;
    shapes: number;
  } = { groups: 0, regions: 0, parts: 0, shapes: 0 };
  let remaining: number = props.maxComparisons;
  let budgetExhausted: boolean = false;

  /*
   * Account for an actual attempted comparison, before reading its result.
   */
  const spend = (kind: keyof typeof compared): boolean => {
    if (remaining === 0) {
      budgetExhausted = true;
      return false;
    }
    --remaining;
    ++compared[kind];
    return true;
  };

  /*
   * Refine a surviving group or region with the common leaf predicate.
   */
  const visitParts = (left: IRegion, right: IRegion): void => {
    for (const a of left.parts)
      for (const b of right.parts) {
        if (!spend("parts")) return;
        if (!overlaps(a.bounds, b.bounds)) continue;
        const [first, second]: [IPreparedPart, IPreparedPart] =
          comparePaths(a.source.id, b.source.id) < 0 ? [a, b] : [b, a];
        const allowance: number | null =
          allowances.get(pairKey(first.source.id, second.source.id)) ?? null;
        const firstShape: Collision.IPart["geometry"] = first.source.geometry;
        const secondShape: Collision.IPart["geometry"] = second.source.geometry;
        if (firstShape?.kind !== "shape" || secondShape?.kind !== "shape") {
          findings.push({
            first: first.source.id,
            second: second.source.id,
            seconds: props.seconds,
            basis: "envelope",
            status: "candidate",
            separation: null,
            point: null,
            allowance,
          });
          continue;
        }
        if (!spend("shapes")) return;
        const margin: number = Math.max(first.margin, second.margin);
        const pair: { first: string; second: string } = {
          first: first.source.id,
          second: second.source.id,
        };
        let contact: IAutoMovieContactReceipt | null;
        try {
          contact = props.geometry.contact(
            firstShape.collider,
            secondShape.collider,
            props.seconds,
            margin,
          );
        } catch (_error) {
          unavailablePairs.push(pair);
          continue;
        }
        if (contact === null) continue;

        if (contact.separation > margin) continue;
        const basis: "displayed" | "proxy" =
          firstShape.basis === "displayed" && secondShape.basis === "displayed"
            ? "displayed"
            : "proxy";
        const penetration: number = -contact.separation;
        const limit: number = allowance ?? 0;
        let status: Collision.IFinding["status"] = "candidate";
        if (basis === "proxy") {
          if (penetration > margin) status = "proxy";
        } else if (penetration - margin > limit) status = "confirmed";
        else if (
          allowance !== null &&
          penetration > margin &&
          penetration + margin <= limit
        )
          status = "permitted";
        findings.push({
          ...pair,
          seconds: props.seconds,
          basis,
          status,
          separation: contact.separation,
          point: { ...contact.point },
          allowance,
        });
      }
  };

  /*
   * Visit region pairs only when refinement was requested, building them on
   * first overlap.
   */
  const visitGroupPair = (left: IGroup, right: IGroup): void => {
    if (left.regions === null || right.regions === null) {
      visitParts(left, right);
      return;
    }
    const leftRegions: IRegion[] = (left.regions ??= regionsOf(left.parts));
    const rightRegions: IRegion[] = (right.regions ??= regionsOf(right.parts));
    for (const a of leftRegions)
      for (const b of rightRegions) {
        if (!spend("regions")) return;
        if (overlaps(a.bounds, b.bounds)) visitParts(a, b);
        if (budgetExhausted) return;
      }
  };

  for (const [index, left] of groups.entries()) {
    for (let other: number = index + 1; other < groups.length; ++other) {
      const right: IGroup = groups[other]!;
      if (!spend("groups")) break;
      if (right.bounds.min.x > left.bounds.max.x) break;
      if (overlaps(left.bounds, right.bounds)) visitGroupPair(left, right);
      if (budgetExhausted) break;
    }
    if (budgetExhausted) break;
  }

  return {
    findings: findings.sort(comparePairs),
    unboundedParts: unboundedParts.sort(comparePaths),
    proxyParts: proxyParts.sort(comparePaths),
    unavailablePairs: unavailablePairs.sort(comparePairs),
    internalGroups: [...internalGroups.values()].sort(
      (a: Collision.IGroup, b: Collision.IGroup): number =>
        comparePaths(a.id, b.id) || comparePaths(a.kind, b.kind),
    ),
    budgetExhausted,
    compared,
  };
}

/*
 * A finite world box prepared once for this part.
 */
interface IPreparedPart {
  /*
   * Borrowed evaluated geometry and stable path.
   */
  source: Collision.IPart;
  /*
   * Conservative box used only to reject candidate pairs.
   */
  bounds: IAutoMovieSubjectBox;
  /*
   * Native-query precision margin in metres at this coordinate scale.
   */
  margin: number;
}

/*
 * Candidate refinement over parts that share a world envelope.
 */
interface IRegion {
  /*
   * Stable key used to order deterministic refinement.
   */
  id: string;
  /*
   * Union of all conservative part bounds.
   */
  bounds: IAutoMovieSubjectBox;
  /*
   * Prepared members in stable path order.
   */
  parts: IPreparedPart[];
}

/*
 * One independent part or an explicitly managed group.
 */
interface IGroup extends IRegion {
  /*
   * Narrower envelopes inside this group: null without refinement, undefined
   * until an external overlap needs them.
   */
  regions: IRegion[] | null | undefined;
}

/*
 * Prepare one reusable envelope per admitted leaf and group.
 */
function prepareGroups(
  parts: readonly Collision.IPart[],
  refine: boolean,
  unbounded: string[],
  proxyParts: string[],
  internal: Map<string, Collision.IGroup>,
): IGroup[] {
  const byGroup: Map<string, IPreparedPart[]> = new Map();
  const ids: Set<string> = new Set();
  for (const part of parts) {
    if (ids.has(part.id))
      throw new Error("Scene collision parts need distinct paths");
    ids.add(part.id);
    if (part.region !== undefined && part.group === undefined)
      throw new Error("Scene collision regions need a managed group");

    const group: Collision.IGroup | undefined = part.group;
    const id: string = JSON.stringify(
      group === undefined ? ["part", part.id] : [group.kind, group.id],
    );
    if (group !== undefined && !internal.has(id))
      internal.set(id, { ...group });

    if (part.geometry?.kind === "shape" && part.geometry.basis === "proxy")
      proxyParts.push(part.id);
    const prepared: IPreparedPart | null = preparePart(part);
    if (prepared === null) {
      unbounded.push(part.id);
      continue;
    }
    const current: IPreparedPart[] | undefined = byGroup.get(id);
    if (current === undefined) byGroup.set(id, [prepared]);
    else current.push(prepared);
  }

  return Array.from(
    byGroup,
    ([id, group]: [string, IPreparedPart[]]): IGroup => {
      group.sort((a: IPreparedPart, b: IPreparedPart): number =>
        comparePaths(a.source.id, b.source.id),
      );
      const bounds: IAutoMovieSubjectBox = unionSubjectBoxes(
        group.map((part: IPreparedPart): IAutoMovieSubjectBox => part.bounds),
      )!;
      return {
        id,
        bounds,
        parts: group,
        regions: refine ? undefined : null,
      };
    },
  ).sort(
    (a: IGroup, b: IGroup): number =>
      a.bounds.min.x - b.bounds.min.x || comparePaths(a.id, b.id),
  );
}

/*
 * Fold per-part bounds into the source's named regions for a second broad
 * phase.
 */
function regionsOf(parts: IPreparedPart[]): IRegion[] {
  const regions: Map<string, IPreparedPart[]> = new Map();
  for (const part of parts) {
    const id: string = part.source.region ?? "";
    const region: IPreparedPart[] | undefined = regions.get(id);
    if (region === undefined) regions.set(id, [part]);
    else region.push(part);
  }
  return Array.from(
    regions,
    ([id, region]: [string, IPreparedPart[]]): IRegion => ({
      id,
      bounds: unionSubjectBoxes(
        region.map((part: IPreparedPart): IAutoMovieSubjectBox => part.bounds),
      )!,
      parts: region,
    }),
  ).sort((a: IRegion, b: IRegion): number => comparePaths(a.id, b.id));
}

/*
 * Apply the native query's coordinate-scale allowance before culling.
 */
function preparePart(part: Collision.IPart): IPreparedPart | null {
  const source: Collision.IPart["geometry"] = part.geometry;
  if (
    source === null ||
    (source.kind === "shape" &&
      source.basis !== "displayed" &&
      source.basis !== "enclosing" &&
      source.basis !== "proxy")
  )
    return null;
  let bounds: IAutoMovieSubjectBox;
  try {
    bounds =
      source.kind === "envelope"
        ? source.bounds
        : physicalShapeBoundsImplementation.physicalShapeBounds(source.collider.pose, source.collider.shape);
  } catch (_error) {
    return null;
  }
  if (
    bounds.min.x > bounds.max.x ||
    bounds.min.y > bounds.max.y ||
    bounds.min.z > bounds.max.z
  )
    return null;

  // The same coordinate-scale margin used by preparePhysicalGeometry before
  // its single-precision native query. Ambiguity around a limit stays visible.
  const margin: number =
    32 *
    2 ** -23 *
    Math.max(
      1,
      Math.abs(bounds.min.x),
      Math.abs(bounds.min.y),
      Math.abs(bounds.min.z),
      Math.abs(bounds.max.x),
      Math.abs(bounds.max.y),
      Math.abs(bounds.max.z),
    );
  const padded: IAutoMovieSubjectBox = {
    min: {
      x: bounds.min.x - margin,
      y: bounds.min.y - margin,
      z: bounds.min.z - margin,
    },
    max: {
      x: bounds.max.x + margin,
      y: bounds.max.y + margin,
      z: bounds.max.z + margin,
    },
  };
  return { source: part, bounds: padded, margin };
}

/*
 * Validate declared windows and retain the tightest active whole-part depth per
 * pair.
 */
function activeAllowances(
  entries: readonly Collision.IAllowance[],
  seconds: number,
): Map<string, number> {
  const active: Map<string, number> = new Map();
  for (const entry of entries) {
    if (
      entry.first === entry.second ||
      entry.startSeconds >= entry.endSeconds ||
      entry.maxPenetration < 0 ||
      [entry.firstJoints, entry.secondJoints].some(
        (joints: readonly string[] | undefined): boolean =>
          joints !== undefined && joints.length === 0,
      )
    )
      throw new Error("Invalid named scene collision allowance");
    if (seconds < entry.startSeconds || seconds >= entry.endSeconds) continue;
    // A joint-scoped window covers part of a drawn surface; whole-part shapes
    // cannot attribute their contact to joints, so it never relaxes them.
    if (entry.firstJoints !== undefined || entry.secondJoints !== undefined)
      continue;
    const key: string = pairKey(entry.first, entry.second);
    const previous: number | undefined = active.get(key);
    active.set(
      key,
      previous === undefined
        ? entry.maxPenetration
        : Math.min(previous, entry.maxPenetration),
    );
  }
  return active;
}

/*
 * Keep contact candidates at inclusive boundaries.
 */
function overlaps(a: IAutoMovieSubjectBox, b: IAutoMovieSubjectBox): boolean {
  return (
    a.min.x <= b.max.x &&
    b.min.x <= a.max.x &&
    a.min.y <= b.max.y &&
    b.min.y <= a.max.y &&
    a.min.z <= b.max.z &&
    b.min.z <= a.max.z
  );
}

/*
 * Compare paths without environment-specific collation.
 */
function comparePaths(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/*
 * Order pairs by their stable first and second paths.
 */
function comparePairs(
  a: { first: string; second: string },
  b: { first: string; second: string },
): number {
  return comparePaths(a.first, b.first) || comparePaths(a.second, b.second);
}

/*
 * Encode an unordered pair without ambiguity from path punctuation.
 */
function pairKey(first: string, second: string): string {
  return JSON.stringify(
    comparePaths(first, second) < 0 ? [first, second] : [second, first],
  );
}
