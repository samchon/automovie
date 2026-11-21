import {
  measureAutoMovieSceneCollision,
  measureAutoMovieSweptCapsuleCollision,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/** One source-owned layer, after its exact placement and world-matrix update. */
interface ILayer {
  id: string;
  root: THREE.Object3D;
  localSeconds: number;
  shotPath?: string;
  required?: boolean;
  /** Named identities and exemptions given by a model or formation owner. */
  ownership?: ReadonlyMap<THREE.Object3D, Omit<Collision.IPart, "geometry">>;
  /** Roots whose source already supplied placed parts. Their descendants are not scanned. */
  opaque?: ReadonlyMap<THREE.Object3D, readonly Collision.IPart[]>;
  allowances?: readonly Collision.IAllowance[];
  /** Source-certified motion cells, with filmSeconds = localSeconds + filmOffset. */
  sweeps?: readonly {
    paths: readonly [string, string];
    props: Sweep.IProps;
    filmOffset: number;
  }[];
}

interface IProps {
  time: Diagnostic.ITime;
  layers: readonly ILayer[];
  geometry: Pick<Geometry.IQueries, "contact">;
  refinement?: Collision.IProps["refinement"];
  limits: { comparisons: number; posedVertices: number; sweptCells: number };
}

interface ISkin {
  mesh: AutoMovieSkinnedMesh;
  count: number;
  indices: THREE.BufferAttribute;
  points?: { values: THREE.Vector3[]; error: number } | null;
}

const CHECK = "collision";
const AXES = ["x", "y", "z"] as const;
/**
 * Observe one already placed scene frame for external contact and certified
 * interval violations. The caller supplies its active world layers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains how layer clocks, placed shapes, source groups, and each check's coverage determine world-space evidence.
 * @evidence contracts/development/implementation.md#principled-implementation Verifies stock box topology from drawn triangles and applies its original world matrix. Skin positives are drawn vertex witnesses with the skin owner's error margin. Closed-solid and affine interval comparisons use the existing Engine owners.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Scene extraction supplies one Engine layer search. The separate authored interval inputs and bounded skin checks add only evidence their sources support.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No resampling, grouping by nesting, arbitrary-motion interpolation or complete-clear claim from a missed skin vertex.
 * @evidence contracts/development/implementation.md#efficient-algorithms A visible traversal stops at declared opaque roots. Box admission examines constant-size topology; pose population and point comparisons have separate limits. No cross-layer pairs are generated.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A candidate skin reuses the existing pose owner and its measured world points throughout the current frame.
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
      obligation: boolean = required,
    ): void => {
      const common = { check: CHECK, key: identity, required: obligation };
      coverage.push(
        status === "checked"
          ? { ...common, status }
          : { ...common, status, reason },
      );
    };
    const parts: Collision.IPart[] = [];
    const skins: Map<string, ISkin> = new Map();
    collectParts(layer, props.time, budget, parts, skins);
    const byId: Map<string, Collision.IPart> = new Map(
      parts.map((part) => [part.id, part]),
    );
    const result: Collision.IResult = measureAutoMovieSceneCollision({
      parts,
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
      report(key("part", id), "unsupported", "no-displayed-geometry", false);
    for (const id of result.proxyParts)
      report(
        key("part", id, "proxy"),
        "deferred",
        "proxy-geometry-only",
        false,
      );
    for (const group of result.internalGroups)
      report(key("group", group.kind, group.id), "excluded", group.kind, false);
    for (const pair of result.unavailablePairs)
      report(
        key("frame", pair.first, pair.second),
        "deferred",
        "native-query-unavailable",
      );
    for (const hit of result.findings) {
      const identity: string = key("frame", hit.first, hit.second);
      const first: Collision.IPart | undefined = byId.get(hit.first);
      const second: Collision.IPart | undefined = byId.get(hit.second);
      const skin: ISkin | undefined =
        skins.get(hit.first) ?? skins.get(hit.second);
      const other = skins.has(hit.first) ? second?.geometry : first?.geometry;
      const sampled =
        skin !== undefined &&
        other?.kind === "shape" &&
        other.basis === "displayed"
          ? findVertex(skin, other.collider, hit.allowance ?? 0, budget)
          : null;
      if (hit.status === "permitted") {
        report(identity, "excluded", "named-contact-allowance");
        continue;
      }
      const confirmed: boolean = hit.status === "confirmed" || sampled !== null;
      const separation: number | null = sampled?.separation ?? hit.separation;
      const point = sampled?.point ?? hit.point;
      if (!confirmed)
        report(
          identity,
          "deferred",
          skin !== undefined ? "skin-vertex-sample-incomplete" : hit.basis,
          false,
        );
      else report(identity, "checked", "");
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
      report(key("sweeps"), "unsupported", "no-certified-motion-cells", false);
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
        report(identity, "excluded", group.kind, false);
        continue;
      }
      const sweep: Sweep.IResult = measureAutoMovieSweptCapsuleCollision({
        ...interval.props,
        maxIntervals: Math.min(interval.props.maxIntervals, budget.sweptCells),
      });
      budget.sweptCells -= sweep.compared;
      if (sweep.status === "deferred") {
        report(identity, "deferred", sweep.reason, false);
        continue;
      }
      const proxy: boolean =
        sweep.status === "proxy" ||
        (sweep.status === "clear" && sweep.basis === "proxy");
      report(
        identity,
        proxy ? "deferred" : "checked",
        "proxy-motion-only",
        false,
      );
      if (sweep.status === "clear") continue;
      const filmSeconds: number = sweep.seconds + interval.filmOffset;
      findings.push(
        createFinding(
          identity,
          paths,
          "sweep",
          !proxy,
          sweep.separation,
          interval.props.maxPenetration,
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

/** Collect visible meshes once. Anonymous or ambiguous paths have frame-only identities. */
function collectParts(
  layer: ILayer,
  time: Diagnostic.ITime,
  budget: IProps["limits"],
  parts: Collision.IPart[],
  skins: Map<string, ISkin>,
): void {
  const pending: THREE.Object3D[] = [layer.root];
  const meshes: { mesh: THREE.Mesh; id: string }[] = [];
  const counts: Map<string, number> = new Map();
  while (pending.length) {
    const object: THREE.Object3D = pending.pop()!;
    if (!object.visible) continue;
    const opaque: readonly Collision.IPart[] | undefined =
      layer.opaque?.get(object);
    if (opaque !== undefined) {
      for (const part of opaque) parts.push(part);
      continue;
    }
    if (object instanceof THREE.Mesh) {
      const id: string =
        layer.ownership?.get(object)?.id ??
        autoMovieInspectionPathOf(layer.root, object);
      counts.set(id, (counts.get(id) ?? 0) + 1);
      meshes.push({ mesh: object, id });
    }
    for (let i: number = object.children.length - 1; i >= 0; --i)
      pending.push(object.children[i]!);
  }
  const declared: Set<string> = new Set(parts.map((part) => part.id));
  const reserved: Set<string> = new Set([...counts.keys(), ...declared]);
  for (const [index, { mesh, id }] of meshes.entries()) {
    const ownership = layer.ownership?.get(mesh);
    let identity: string = id;
    if (
      ownership === undefined &&
      (!id.trim() || counts.get(id) !== 1 || declared.has(id))
    ) {
      identity = JSON.stringify(["scene-mesh", time.filmSeconds, index]);
      while (reserved.has(identity)) identity += "/";
      reserved.add(identity);
    }
    let geometry: Collision.IPart["geometry"] = null;
    if (readAutoMovieDisplayedBox.supportsStockMaterial(mesh)) {
      if (mesh instanceof AutoMovieSkinnedMesh) {
        const skin: ISkin | null = readSkin(mesh, budget);
        if (skin !== null) {
          const bounds: IAutoMovieSubjectBox | null =
            readAutoMovieDisplayedBox.skinEnvelope(mesh);
          if (bounds !== null) {
            geometry = { kind: "envelope", bounds };
            skins.set(identity, skin);
          }
        }
      } else if (mesh.constructor === THREE.Mesh) {
        const shape: Geometry.ICollider | null = readAutoMovieDisplayedBox(
          mesh,
          identity,
        );
        if (shape !== null)
          geometry = { kind: "shape", basis: "displayed", collider: shape };
      }
    }
    parts.push({ ...ownership, id: identity, geometry });
  }
}

/** Reserve the full current-pose workload before the skin owner can fill its cache. */
function readSkin(
  mesh: AutoMovieSkinnedMesh,
  budget: IProps["limits"],
): ISkin | null {
  const points = mesh.geometry.getAttribute("position");
  const index: THREE.BufferAttribute | null = mesh.geometry.getIndex();
  if (
    points === undefined ||
    index === null ||
    points.count <= 0 ||
    !Number.isSafeInteger(points.count) ||
    points.count > budget.posedVertices ||
    index.count > 6 * points.count ||
    index.count % 3 !== 0 ||
    mesh.geometry.drawRange.start !== 0 ||
    mesh.geometry.drawRange.count < index.count
  )
    return null;
  budget.posedVertices -= points.count;
  return { mesh, count: points.count, indices: index };
}

/** Reuse the original draw-method pose and discard vertices with no drawn triangle. */
function skinPoints(skin: ISkin): ISkin["points"] {
  const { mesh, count, indices } = skin;
  const e = mesh.matrixWorld.elements;
  const error: number =
    mesh.tolerance() *
    Math.max(
      Math.hypot(e[0], e[4], e[8]),
      Math.hypot(e[1], e[5], e[9]),
      Math.hypot(e[2], e[6], e[10]),
    ) *
    3;
  if (!Number.isFinite(error)) return undefined;
  const values: THREE.Vector3[] = Array.from({ length: count }, (_, i) =>
    mesh
      .getVertexPosition(i, new THREE.Vector3())
      .applyMatrix4(mesh.matrixWorld),
  );
  if (!values.every(finite)) return undefined;
  const drawn: Set<number> = new Set();
  const ab: THREE.Vector3 = new THREE.Vector3();
  const ac: THREE.Vector3 = new THREE.Vector3();
  const cross: THREE.Vector3 = new THREE.Vector3();
  for (let i: number = 0; i < indices.count; i += 3) {
    const a: number = indices.getX(i);
    const b: number = indices.getX(i + 1);
    const c: number = indices.getX(i + 2);
    if (!values[a] || !values[b] || !values[c]) return undefined;
    ab.subVectors(values[b], values[a]);
    ac.subVectors(values[c], values[a]);
    if (
      cross.crossVectors(ab, ac).length() <=
      2 * error * (ab.length() + ac.length() + 2 * error)
    )
      continue;
    drawn.add(a);
    drawn.add(b);
    drawn.add(c);
  }
  return { error, values: [...drawn].map((i) => values[i]!) };
}

/** Verify a real surface vertex lies further inside the solid than the allowed depth and error. */
function findVertex(
  skin: ISkin,
  solid: Geometry.ICollider,
  allowance: number,
  budget: IProps["limits"],
): { point: THREE.Vector3; separation: number } | null {
  try {
    const posed =
      skin.points === undefined
        ? (skin.points = skinPoints(skin) ?? null)
        : skin.points;
    if (posed === null) return null;
    const distance = physicalShapeSegmentDistance.prepare(
      solid.pose,
      solid.shape,
    );
    for (const point of posed.values) {
      if (budget.comparisons === 0) return null;
      --budget.comparisons;
      const separation: number = distance(point, point);
      const tolerance: number =
        posed.error +
        32 *
          2 ** -23 *
          Math.max(1, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
      if (Number.isFinite(separation) && separation < -allowance - tolerance)
        return { point, separation };
    }
  } catch (_error) {
    skin.points ??= null;
  }
  return null;
}

/** Check admission shared by geometry, bounds and live posed witnesses. */
function finite(point: THREE.Vector3): boolean {
  return AXES.every(
    (axis) =>
      Number.isFinite(point[axis]) && Number.isFinite(Math.fround(point[axis])),
  );
}
