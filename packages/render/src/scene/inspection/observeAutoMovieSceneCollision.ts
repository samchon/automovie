import {
  measureAutoMovieSceneCollision,
  measureAutoMovieSweptCapsuleCollision,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieVector3,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";
import * as THREE from "three";

import { collectAutoMovieCollisionParts } from "./collectAutoMovieCollisionParts.js";

/** One source-owned layer, after its exact placement and world-matrix update. */
interface ILayer extends collectAutoMovieCollisionParts.ILayer {
  id: string;
  localSeconds: number;
  shotPath?: string;
  /** Whether delivery requires every collision obligation of this layer to be resolved. */
  required?: boolean;
  /** Named permitted contact, applied alike to placed frames and motion cells. */
  allowances?: readonly Collision.IAllowance[];
  /** Source-certified motion cells, with filmSeconds = localSeconds + filmOffset. Their allowed depth comes from `allowances`. */
  sweeps?: readonly {
    paths: readonly [string, string];
    props: Omit<Sweep.IProps, "maxPenetration">;
    filmOffset: number;
  }[];
}

interface IProps {
  time: Diagnostic.ITime;
  layers: readonly ILayer[];
  geometry: Pick<Geometry.IQueries, "contact">;
  refinement?: Collision.IProps["refinement"];
  limits: {
    /** Group, region, part, shape and witness point comparisons. */
    comparisons: number;
    /** Posed surface vertices read for witnesses. */
    posedVertices: number;
    /** Triangle visits spent testing points against closed surfaces. */
    surfaceTriangles: number;
    /** Elementary motion intervals. */
    sweptCells: number;
  };
}

/** A solid a surface vertex can be tested against. */
interface ISolid {
  bounds: THREE.Box3 | null;
  error: number;
  cost: number;
  distance: (point: THREE.Vector3) => number;
}

const CHECK = "collision";
const FOUR_PI: number = 4 * Math.PI;

/**
 * Observe one already placed scene frame for external contact and certified
 * interval violations. The caller supplies its active world layers.
 *
 * Every drawn object of a layer is collected once: exact boxes, closed stock
 * meshes, stock skins, each drawn member of an instanced formation by its slot
 * and each solver segment of a cord. A candidate pair is confirmed by a drawn
 * surface vertex lying inside the other part's displayed solid or closed
 * surface beyond the active allowance. Every unresolved row inherits the
 * layer's delivery requirement, and motion cells use the same named allowances
 * as placed frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains how layer clocks, placed shapes, source groups, witnesses, allowances and each check's coverage determine world-space evidence.
 * @evidence contracts/development/implementation.md#principled-implementation Confirms only with a drawn vertex inside an exact box or a closed drawn surface, by signed distance and generalized winding number. Interval checks use the Engine sweep owner with the allowance active over the whole cell.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Collection, the Engine layer search, witness search and interval checks run in that order, each reporting into one coverage list.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No resampling, grouping by nesting or arbitrary-motion interpolation. An allowance knot inside a motion cell defers that cell. A missing witness leaves a candidate with its coverage unresolved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Surfaces are posed only for candidate pairs, and points outside the other solid's bounds skip its distance. Comparison, vertex, triangle and interval work each has its own limit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A posed surface and its closed-solid test are shared by every pair of the frame that needs them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the live placed scene and releases all temporary measurements at return. Only plain diagnostic values escape.
 */
export function observeAutoMovieSceneCollision(
  props: IProps,
): Pick<Diagnostic, "findings" | "coverage"> {
  const findings: Diagnostic.IFinding[] = [];
  const coverage: Diagnostic.ICoverage[] = [];
  const budget: IProps["limits"] = { ...props.limits };
  if (
    !Number.isFinite(props.time.filmSeconds) ||
    !Object.values(budget).every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    throw new Error("Invalid placed collision clock or work limit");
  const layers: Set<string> = new Set();
  for (const layer of props.layers) {
    if (!layer.id.trim() || layers.has(layer.id))
      throw new Error(
        "Placed collision layers need distinct nonempty identities",
      );
    layers.add(layer.id);
    const required: boolean = layer.required ?? false;
    const shotPath: string | undefined =
      layer.shotPath ??
      (props.layers.length === 1 ? props.time.shot?.path : undefined);
    const key = (...parts: string[]): string =>
      JSON.stringify([layer.id, ...parts]);
    const report = (
      identity: string,
      status: Diagnostic.ICoverage["status"],
      reason: string,
    ): void => {
      const common = { check: CHECK, key: identity, required };
      coverage.push(
        status === "checked"
          ? { ...common, status }
          : { ...common, status, reason },
      );
    };
    const collected: collectAutoMovieCollisionParts.IResult =
      collectAutoMovieCollisionParts(layer, props.time, budget);
    const byId: Map<string, Collision.IPart> = new Map(
      collected.parts.map((part) => [part.id, part]),
    );
    const result: Collision.IResult = measureAutoMovieSceneCollision({
      parts: collected.parts,
      geometry: props.geometry,
      seconds: layer.localSeconds,
      allowances: layer.allowances,
      refinement: props.refinement,
      maxComparisons: budget.comparisons,
    });
    budget.comparisons -= Object.values(result.compared).reduce(
      (a, b) => a + b,
      0,
    );
    report(
      key("layer"),
      result.budgetExhausted ? "deferred" : "checked",
      "comparison-limit",
    );
    for (const id of result.unboundedParts)
      report(
        key("part", id),
        "unsupported",
        collected.reasons.get(id) ?? "no-displayed-geometry",
      );
    for (const id of result.proxyParts)
      report(key("part", id, "proxy"), "deferred", "proxy-geometry-only");
    for (const group of result.internalGroups)
      report(key("group", group.kind, group.id), "excluded", group.kind);
    for (const pair of result.unavailablePairs)
      report(
        key("frame", pair.first, pair.second),
        "deferred",
        "native-query-unavailable",
      );
    const solids: Map<string, ISolid | null | "budget"> = new Map();
    const solidOf = (id: string): ISolid | null | "budget" => {
      if (!solids.has(id)) solids.set(id, readSolid(id));
      return solids.get(id)!;
    };
    const readSolid = (id: string): ISolid | null | "budget" => {
      const geometry: Collision.IPart["geometry"] | undefined =
        byId.get(id)?.geometry;
      if (geometry?.kind === "shape" && geometry.basis === "displayed") {
        const distance = physicalShapeSegmentDistance.prepare(
          geometry.collider.pose,
          geometry.collider.shape,
        );
        return {
          bounds: null,
          error: 0,
          cost: 0,
          distance: (point) => distance(point, point),
        };
      }
      const surface = collected.surfaces.get(id);
      if (surface === undefined || surface.owns !== undefined) return null;
      const posed = surface.read();
      if (posed === null || posed === "budget") return posed;
      if (!posed.closed) return null;
      return {
        bounds: posed.bounds,
        error: posed.error,
        cost: posed.triangles.length / 3,
        distance: (point) => closedDistance(posed, point),
      };
    };
    for (const hit of result.findings) {
      const identity: string = key("frame", hit.first, hit.second);
      if (hit.status === "permitted") {
        report(identity, "excluded", "named-contact-allowance");
        continue;
      }
      const witness =
        hit.status === "confirmed"
          ? null
          : findWitness(
              hit,
              collected.surfaces,
              solidOf,
              hit.allowance ?? 0,
              budget,
            );
      const sampled =
        witness !== null && typeof witness === "object" ? witness : null;
      const confirmed: boolean = hit.status === "confirmed" || sampled !== null;
      const separation: number | null = sampled?.separation ?? hit.separation;
      const point: IAutoMovieVector3 | null = sampled?.point ?? hit.point;
      if (confirmed) report(identity, "checked", "");
      else
        report(
          identity,
          "deferred",
          witness === "budget"
            ? "surface-witness-limit"
            : collected.surfaces.has(hit.first) ||
                collected.surfaces.has(hit.second)
              ? "surface-witness-absent"
              : hit.basis,
        );
      if (confirmed || separation === null || separation < 0)
        findings.push(
          createFinding(
            identity,
            [hit.first, hit.second],
            "frame",
            confirmed,
            separation,
            hit.allowance ?? 0,
            point,
            {
              time: {
                filmSeconds: props.time.filmSeconds,
                outputFrame: props.time.outputFrame,
                ...(shotPath === undefined
                  ? {}
                  : { shot: { path: shotPath, seconds: layer.localSeconds } }),
              },
            },
          ),
        );
    }
    if (layer.sweeps === undefined)
      report(key("sweeps"), "unsupported", "no-certified-motion-cells");
    const cells: Set<string> = new Set();
    for (const interval of layer.sweeps ?? []) {
      const paths: [string, string] =
        interval.paths[0] < interval.paths[1]
          ? [interval.paths[0], interval.paths[1]]
          : [interval.paths[1], interval.paths[0]];
      const { startSeconds, endSeconds } = interval.props;
      if (
        ![
          startSeconds + interval.filmOffset,
          endSeconds + interval.filmOffset,
        ].every(Number.isFinite)
      )
        throw new Error("Invalid collision interval clock");
      const identity: string = key("sweep", ...paths, String(startSeconds));
      if (cells.has(identity))
        throw new Error("Repeated collision motion cell");
      cells.add(identity);
      const group: Collision.IGroup | undefined = byId.get(paths[0])?.group;
      const other: Collision.IGroup | undefined = byId.get(paths[1])?.group;
      if (!paths[0].trim() || paths[0] === paths[1])
        throw new Error("Invalid collision motion pair");
      if (
        group !== undefined &&
        other !== undefined &&
        group.id === other.id &&
        group.kind === other.kind
      ) {
        report(identity, "excluded", group.kind);
        continue;
      }
      const allowance: number | "split" = cellAllowance(
        layer.allowances ?? [],
        paths,
        startSeconds,
        endSeconds,
      );
      if (allowance === "split") {
        report(identity, "deferred", "allowance-boundary-inside-cell");
        continue;
      }
      const sweep: Sweep.IResult = measureAutoMovieSweptCapsuleCollision({
        ...interval.props,
        maxPenetration: allowance,
        maxIntervals: Math.min(interval.props.maxIntervals, budget.sweptCells),
      });
      budget.sweptCells -= sweep.compared;
      if (sweep.status === "deferred") {
        report(identity, "deferred", sweep.reason);
        continue;
      }
      const proxy: boolean =
        sweep.status === "proxy" ||
        (sweep.status === "clear" && sweep.basis === "proxy");
      report(identity, proxy ? "deferred" : "checked", "proxy-motion-only");
      if (sweep.status === "clear") continue;
      const filmSeconds: number = sweep.seconds + interval.filmOffset;
      findings.push(
        createFinding(
          identity,
          paths,
          "sweep",
          !proxy,
          sweep.separation,
          allowance,
          sweep.point,
          {
            time: {
              filmSeconds,
              ...(shotPath === undefined
                ? {}
                : { shot: { path: shotPath, seconds: sweep.seconds } }),
            },
            interval: {
              from: sweep.startSeconds + interval.filmOffset,
              to: sweep.endSeconds + interval.filmOffset,
            },
          },
        ),
      );
    }
  }
  return { findings, coverage };
}

/**
 * The tightest named allowance active over a whole closed motion cell, zero
 * when none names the pair, or "split" when a window starts or ends inside it.
 */
function cellAllowance(
  allowances: readonly Collision.IAllowance[],
  [first, second]: readonly [string, string],
  start: number,
  end: number,
): number | "split" {
  let limit: number | null = null;
  for (const entry of allowances) {
    if (
      !(
        (entry.first === first && entry.second === second) ||
        (entry.first === second && entry.second === first)
      )
    )
      continue;
    if (entry.endSeconds <= start || entry.startSeconds > end) continue;
    if (entry.startSeconds > start || entry.endSeconds <= end) return "split";
    limit =
      limit === null
        ? entry.maxPenetration
        : Math.min(limit, entry.maxPenetration);
  }
  return limit ?? 0;
}

/** Search drawn vertices of either part for one inside the other's solid beyond the allowance. */
function findWitness(
  hit: Collision.IFinding,
  surfaces: collectAutoMovieCollisionParts.IResult["surfaces"],
  solidOf: (id: string) => ISolid | null | "budget",
  allowance: number,
  budget: IProps["limits"],
): { point: IAutoMovieVector3; separation: number } | null | "budget" {
  let limited: boolean = false;
  for (const [mover, holder] of [
    [hit.first, hit.second],
    [hit.second, hit.first],
  ] as const) {
    const source = surfaces.get(mover);
    if (source === undefined) continue;
    const solid: ISolid | null | "budget" = solidOf(holder);
    if (solid === "budget") {
      limited = true;
      continue;
    }
    if (solid === null) continue;
    const posed = source.read();
    if (posed === "budget") {
      limited = true;
      continue;
    }
    if (posed === null) continue;
    const reach: THREE.Box3 | null =
      solid.bounds === null
        ? null
        : solid.bounds.clone().expandByScalar(solid.error + posed.error);
    for (const vertex of posed.drawn) {
      const point: THREE.Vector3 = posed.values[vertex]!;
      if (reach !== null && !reach.containsPoint(point)) continue;
      if (source.owns !== undefined && !source.owns(point)) continue;
      if (budget.comparisons === 0 || budget.surfaceTriangles < solid.cost) {
        limited = true;
        break;
      }
      --budget.comparisons;
      budget.surfaceTriangles -= solid.cost;
      let separation: number;
      try {
        separation = solid.distance(point);
      } catch (_error) {
        continue;
      }
      const tolerance: number =
        posed.error +
        solid.error +
        32 *
          2 ** -23 *
          Math.max(1, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
      if (Number.isFinite(separation) && separation < -allowance - tolerance)
        return {
          point: { x: point.x, y: point.y, z: point.z },
          separation,
        };
    }
  }
  return limited ? "budget" : null;
}

/**
 * Signed distance to a closed drawn surface: the generalized winding number
 * decides inside, independent of triangle orientation, and the nearest drawn
 * triangle gives the magnitude.
 */
function closedDistance(
  surface: collectAutoMovieCollisionParts.ISurface,
  point: THREE.Vector3,
): number {
  const a: THREE.Vector3 = new THREE.Vector3();
  const b: THREE.Vector3 = new THREE.Vector3();
  const c: THREE.Vector3 = new THREE.Vector3();
  const triangle: THREE.Triangle = new THREE.Triangle();
  const closest: THREE.Vector3 = new THREE.Vector3();
  const cross: THREE.Vector3 = new THREE.Vector3();
  let solidAngle: number = 0;
  let nearest: number = Infinity;
  const { triangles, values } = surface;
  for (let i: number = 0; i < triangles.length; i += 3) {
    const pa: THREE.Vector3 = values[triangles[i]!]!;
    const pb: THREE.Vector3 = values[triangles[i + 1]!]!;
    const pc: THREE.Vector3 = values[triangles[i + 2]!]!;
    a.subVectors(pa, point);
    b.subVectors(pb, point);
    c.subVectors(pc, point);
    const la: number = a.length();
    const lb: number = b.length();
    const lc: number = c.length();
    const numerator: number = a.dot(cross.crossVectors(b, c));
    const denominator: number =
      la * lb * lc + a.dot(b) * lc + a.dot(c) * lb + b.dot(c) * la;
    solidAngle += 2 * Math.atan2(numerator, denominator);
    triangle.set(pa, pb, pc);
    nearest = Math.min(
      nearest,
      triangle.closestPointToPoint(point, closest).distanceTo(point),
    );
  }
  return Math.abs(solidAngle / FOUR_PI) > 0.5 ? -nearest : nearest;
}

/** Serialize one contact under the same confidence, depth and path rules. */
function createFinding(
  key: string,
  paths: readonly string[],
  mode: "frame" | "sweep",
  confirmed: boolean,
  separation: number | null,
  tolerance: number,
  point: IAutoMovieVector3 | null,
  time: Pick<Diagnostic.IWitness, "time" | "interval">,
): Diagnostic.IFinding {
  return {
    check: CHECK,
    key,
    paths,
    code: mode === "frame" ? "scene-penetration" : "swept-penetration",
    category: confirmed ? "error" : "warning",
    confidence: confirmed ? "confirmed" : "candidate",
    message: confirmed
      ? "Displayed geometry penetrates another part."
      : "The available geometry suggests overlap.",
    witness: {
      ...time,
      ...(point === null
        ? {}
        : { point: { x: point.x, y: point.y, z: point.z } }),
      ...(separation === null
        ? {}
        : {
            rank: Math.max(0, -separation),
            measurements: [
              {
                name: "separation",
                value: separation,
                unit: "m",
                limit: -tolerance,
              },
            ],
          }),
    },
  };
}
