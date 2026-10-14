import {
  type IAutoMovieMeshTransform,
  createAutoMovieMeshDepthSampler,
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3 as Point,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { catmullRomPoint as interpolate } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { extractTriangleRegion } from "../../mesh/extractTriangleRegion";
import { linearInterpolate as mix } from "../../mesh/linearInterpolate";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { sweepEightSidedTube as tube } from "../../mesh/sweepEightSidedTube";
import { triangulateSurfaceLattice as patch } from "../../mesh/triangulateSurfaceLattice";
import { portraitDirectionalSurfaceTargets } from "../../surface/portraitDirectionalSurfaceTargets";
import { portraitEyeSphereHeight } from "../../surface/portraitEyeSphereHeight";
import { portraitEyeSphereIntersection } from "../../surface/portraitEyeSphereIntersection";
import { type IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitEyebrow } from "../brow/buildPortraitEyebrow";
import { buildPortraitEyelash } from "../lash/buildPortraitEyelash";
import type { buildPortraitCanthalMesh } from "./buildPortraitCanthalMesh";
import { buildPortraitEyeCornea } from "./buildPortraitEyeCornea";
import { buildPortraitPerformanceGlobe } from "./buildPortraitPerformanceGlobe";
import type { createPortraitOcularTissues } from "./createPortraitOcularTissues";
import { createPortraitOpticalFrame } from "./createPortraitOpticalFrame";
import { posePortraitOpticalMesh } from "./posePortraitOpticalMesh";
import { type IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";
import type { IPortraitOcularTissueMeshes } from "./structures/IPortraitOcularTissueMeshes";

const pi: number = Math.PI,
  tau: number = pi * 2;

/**
 * Build the sclera, gaze, iris, lashes and brow against this eye's refined rim.
 * The component supplies head-millimetre lid vertices, fixed optical identity
 * and an optional canthal hull after common skin refinement and contact.
 * Exact canthal endpoints bound interpolated wet tissue; sclera and connective
 * support partition one external hull. Iris, pupil and cornea rotate together
 * with gaze. Only createMetricMeshPart crosses to model metres. The caller
 * retains its source and refined cage; returned parts own published geometry.
 * A changed support or refined margin requires rebuilding every emitted part.
 *
 * @evidence contracts/common.md#principled-implementation The refined actual lid rim, shared sphere/canthal support and one gaze centre drive emitted optics, wet tissues, lashes and brow attachment.
 * @evidence contracts/common.md#clear-and-simple-design Actual drawing/contact support shares canonical cornea/globe owners; construction millimetres cross to model metres only through createMetricMeshPart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored fibre/pigment/sampling constants do not infer individual anatomy; finite bisection assumes ordered rim-X and full tissue contact remains directional.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies caller ownership, refined-margin dependence, head frame, unit conversion and optical/support invalidation.
 * @evidence contracts/performance.md#efficient-algorithms Two 257-sample lid tables use eighteen-step interpolation searches; emitted iris grids, support queries, requested lashes and brow fibres drive remaining work.
 * @evidence contracts/performance.md#reuse-equivalent-work One sampled lid table per margin and one actual support depth sampler serve repeated optical/tissue queries; angular extents are solved once per column.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned metric parts own emitted meshes; lid tables/support samplers and intermediate construction arrays expire without retained background resources.
 */
export function buildPortraitEye(
  source: number[][],
  refined: IControlMesh,
  eyeMargins: ReadonlyMap<number, number>,
  viewRay: number[],
  socket: IPortraitEyeSocket,
  shape: IPortraitEyeShape,
  sphere: IPortraitEyeSphere,
  tissues?: ReturnType<typeof createPortraitOcularTissues>,
  performance?: IPortraitEyePerformance,
  lashMotion?: (at: number) => Parameters<typeof buildPortraitEyelash>[5],
  canthal?: ReturnType<typeof buildPortraitCanthalMesh>,
): IAutoMovieModelPart[] {
  const parts: IAutoMovieModelPart[] = [];
  const add: (
    id: string,
    mesh: Parameters<typeof createMetricMeshPart>[1],
    finish: string,
  ) => void = (
    id: string,
    mesh: Parameters<typeof createMetricMeshPart>[1],
    finish: string,
  ): void => {
    parts.push(createMetricMeshPart(id, mesh, finish));
  };
  const landmark: (id: number) => Point = (id: number): Point =>
    p(source[id][0], source[id][1], source[id][2]);
  const white: string = "sclera" as const,
    pupil: string = "pupil" as const,
    brow: string = "brows" as const;
  const eye: IPortraitEyeSocket = socket;
  {
    const margin: (id: number) => Point = (id: number): Point => {
      const point: number[] = refined.positions[eyeMargins.get(id)!];
      return p(point[0], point[1], point[2]);
    };
    const upper: Point[] = eye.top.map(margin),
      lower: Point[] = eye.bottom.map(margin);
    const lidSamples: Point[][] = [lower, upper].map(
      (points: Point[]): Point[] =>
        Array.from({ length: 257 }, (_: unknown, i: number): Point => {
          // The closed interval already supplies exact endpoint roots. A finite
          // bisection midpoint would pair endpoint X with an interior Y/Z and
          // leave a canthal apex's support, even though the actual rim meets it.
          if (i === 0 || i === 256)
            return { ...points[i === 0 ? 0 : points.length - 1] };
          const x: number = mix(
            points[0].x,
            points[points.length - 1].x,
            i / 256,
          );
          let low: number = 0,
            high: number = 1;
          for (let iteration: number = 0; iteration < 18; iteration++) {
            const t: number = (low + high) / 2;
            if (interpolate(points, t).x < x) low = t;
            else high = t;
          }
          return interpolate(points, (low + high) / 2);
        }),
    );
    const lidAt: (x: number, points: Point[]) => Point = (
      x: number,
      points: Point[],
    ): Point => {
      const samples: Point[] = lidSamples[points === lower ? 0 : 1];
      const t: number = Math.max(
        0,
        Math.min(
          256,
          (256 * (x - points[0].x)) /
            (points[points.length - 1].x - points[0].x),
        ),
      );
      const i: number = Math.min(255, Math.floor(t));
      return p(
        x,
        mix(samples[i].y, samples[i + 1].y, t - i),
        mix(samples[i].z, samples[i + 1].z, t - i),
      );
    };
    // Spherical curvature is independent of aperture height and gaze. The
    // fitted lid alone determines how much of that surface remains visible.
    const canthalDepth:
      | ((u: number, v: number) => { minimum: number; maximum: number } | null)
      | undefined =
      canthal === undefined
        ? undefined
        : createAutoMovieMeshDepthSampler(
            createMetricMeshPart("canthal-height", canthal.surface, white)
              .geometry.mesh,
            "z",
          );
    const eyeZ: (x: number, y: number) => number = (
      x: number,
      y: number,
    ): number => {
      if (canthalDepth === undefined)
        return portraitEyeSphereHeight(sphere, x, y);
      const hit: { minimum: number; maximum: number } | null = canthalDepth(
        x * 0.001,
        y * 0.001,
      );
      if (hit === null)
        throw new Error(
          `Ocular tissue at (${x}, ${y}) must stay on its canthal support.`,
        );
      return hit.maximum * 1000;
    };
    const sclera: IAutoMovieMesh =
      canthal?.exposed ??
      (performance === undefined && shape.opticalFrame !== "radial"
        ? patch(
            (u: number, v: number): Point => {
              const top: Point = interpolate(upper, u),
                bottom: Point = interpolate(lower, u);
              const x: number = mix(bottom.x, top.x, v),
                y: number = mix(bottom.y, top.y, v);
              return p(x, y, eyeZ(x, y));
            },
            shape.sampling.eyeColumns,
            shape.sampling.eyeRows,
          )
        : buildPortraitPerformanceGlobe(
            sphere,
            Math.max(3, shape.sampling.eyeColumns),
            Math.max(2, shape.sampling.eyeRows),
          ));
    // The sclera owns an exact spherical surface: grad(|p-c|^2-r^2)
    // points along p-c, and |p-c|=r. Divide construction millimetres by
    // radius millimetres to obtain dimensionless outward unit normals. This
    // remains defined at a collapsed canthal row where triangle-area averaging
    // has no direction, and avoids a sampling-dependent optical normal field.
    const sphereCenter: number[] = [
      sphere.center.x,
      sphere.center.y,
      sphere.center.z,
    ];
    if (canthal === undefined)
      sclera.normals = sclera.positions.map(
        (value: number, index: number): number =>
          (value - sphereCenter[index % 3]) / sphere.radius,
      );
    add(`${eye.name}-sclera`, sclera, white);
    // The exposed connective support shares the optical boundary vertices.
    // Existing medial tissue still owns its pink caruncle; the remaining
    // conjunctival lining uses the light ocular finish of this blocking model.
    if (canthal !== undefined && canthal.extension.indices!.length !== 0)
      add(`${eye.name}-canthal-conjunctiva`, canthal.extension, white);
    // One gaze centre feeds drawing and tissue support. Full-limbus contact
    // includes the actual optical shell, whose anterior surface is above the
    // basic globe; following the latter buried the wet margin in the cornea.
    const center: Point = portraitEyeSphereIntersection(
      sphere,
      landmark(eye.iris),
      p(viewRay[0], viewRay[1], viewRay[2]),
    );
    const radial:
      | { sphere: IPortraitEyeSphere; transform: IAutoMovieMeshTransform }
      | undefined =
      shape.opticalFrame === "radial"
        ? createPortraitOpticalFrame(sphere, center)
        : undefined;
    const opticalCenter: Point =
      radial === undefined ? center : radial.sphere.center;
    const support: IAutoMovieMesh = createMetricMeshPart(
      "ocular-tissue-support",
      mergeAutoMovieMeshes([
        sclera,
        ...(canthal === undefined ? [] : [canthal.extension]),
        ...(shape.lidContact === "cornea"
          ? [buildPortraitEyeCornea(center, sphere, shape, [], performance)]
          : []),
      ]),
      white,
    ).geometry.mesh;
    const surface: (
      u: number,
      v: number,
    ) => { minimum: number; maximum: number } | null =
      createAutoMovieMeshDepthSampler(support, "z");
    if (tissues !== undefined && performance?.blink !== 1) {
      const surfaces: IPortraitOcularTissueMeshes = tissues({
        side: eye.name,
        minimumX: lower[0].x,
        maximumX: lower[lower.length - 1].x,
        lower: (x: number): Point => lidAt(x, lower),
        upper: (x: number): Point => lidAt(x, upper),
        globe: (x: number, y: number): number =>
          Math.max(
            eyeZ(x, y),
            (surface(x / 1000, y / 1000)?.maximum ?? -Infinity) * 1000,
          ),
      });
      // A strip's vertices may clear a curved support while its straight
      // triangles cut it. Resolve the emitted faces in metres, then return to
      // construction mm before add() crosses the common model-unit boundary.
      for (const mesh of [surfaces.corner, surfaces.lowerMargin]) {
        if (mesh === null) continue;
        const metric: IAutoMovieMesh = createMetricMeshPart(
          "ocular-tissue-contact",
          mesh,
          white,
        ).geometry.mesh;
        const targets: { vertex: number; target: Point }[] =
          portraitDirectionalSurfaceTargets(
            metric,
            support,
            p(0, 0, 1),
            0.00002,
          );
        for (const { vertex, target } of targets)
          mesh.positions.splice(
            vertex * 3,
            3,
            target.x * 1000,
            target.y * 1000,
            target.z * 1000,
          );
        mesh.normals = areaWeightedNormals(mesh.positions, mesh.indices!);
      }
      if (surfaces.corner !== null)
        add(`${eye.name}-medial-conjunctiva`, surfaces.corner, "ocular-corner");
      if (surfaces.lowerMargin !== null)
        add(
          `${eye.name}-lower-lid-margin`,
          surfaces.lowerMargin,
          "ocular-margin",
        );
    }
    // The detector's iris depth differs from the eye surface depth. Simply
    // replacing Z moves the apparent gaze in the reference camera. Intersect
    // its measured ray instead, retaining the photographed iris centre in XY.
    for (const [name, radius] of [
      ["iris", shape.irisRadius],
      ["pupil", shape.pupilRadius],
    ] as const) {
      // All radial samples on one ray share the same clipped endpoint. Solve
      // it once per angular column, retaining the exact same ray and bisection.
      const extents: number[] = Array.from(
        { length: shape.sampling.irisColumns + 1 },
        (_: unknown, column: number): number => {
          if (performance !== undefined || radial !== undefined) return radius;
          const angle: number = tau * (column / shape.sampling.irisColumns);
          const inside: (r: number) => boolean = (r: number): boolean => {
            const x: number = center.x + r * Math.cos(angle),
              y: number = center.y - r * Math.sin(angle);
            return (
              y >= lidAt(x, lower).y + 0.15 && y <= lidAt(x, upper).y - 0.15
            );
          };
          let extent: number = radius;
          if (!inside(radius)) {
            let low: number = 0,
              high: number = radius;
            for (let i: number = 0; i < 24; i++) {
              const r: number = (low + high) / 2;
              if (inside(r)) low = r;
              else high = r;
            }
            extent = (low + high) / 2;
          }
          return extent;
        },
      );
      let mesh: IAutoMovieMesh = patch(
        (u: number, v: number): Point => {
          const angle: number = tau * u;
          const extent: number =
            extents[Math.round(u * shape.sampling.irisColumns)];
          const x: number =
              opticalCenter.x +
              extent * (0.0001 + 0.9999 * v) * Math.cos(angle),
            y: number =
              opticalCenter.y -
              extent * (0.0001 + 0.9999 * v) * Math.sin(angle);
          const z: number =
            radial === undefined
              ? eyeZ(x, y)
              : portraitEyeSphereHeight(radial.sphere, x, y);
          return p(x, y, z + (name === "pupil" ? 0.09 : 0.055));
        },
        shape.sampling.irisColumns,
        shape.sampling.irisRows,
      );
      if (radial !== undefined)
        mesh = transformAutoMovieMesh(mesh, radial.transform);
      if (performance !== undefined)
        mesh = posePortraitOpticalMesh(mesh, sphere.center, performance);
      if (name === "pupil") add(`${eye.name}-pupil`, mesh, pupil);
      else {
        add(
          `${eye.name}-cornea`,
          buildPortraitEyeCornea(
            center,
            sphere,
            shape,
            extents.slice(0, -1),
            performance,
          ),
          eye.name + "-cornea",
        );
        // Pigment follows radial fibres. The outer 13 percent forms a dark
        // limbal ring; the inner bands vary in brown. All regions retain the
        // exact same positions and normals, so this edit cannot enlarge an eye.
        const regions: number[][] = Array.from(
          { length: 8 },
          (): number[] => [] as number[],
        );
        for (let i: number = 0; i < mesh.indices!.length; i += 6) {
          const cell: number = i / 6;
          const angle: number =
            (tau * ((cell % shape.sampling.irisColumns) + 0.5)) /
            shape.sampling.irisColumns;
          const radius: number =
            (Math.floor(cell / shape.sampling.irisColumns) + 0.5) /
            shape.sampling.irisRows;
          const fiber: number =
            0.48 +
            0.23 * Math.sin(angle * 37 + radius * 7) +
            0.17 * Math.sin(angle * 71 - radius * 11) +
            0.12 * Math.cos(angle * 13);
          const group: number =
            radius > 0.87 ? 0 : Math.max(0, Math.min(7, Math.floor(fiber * 8)));
          regions[group].push(...mesh.indices!.slice(i, i + 6));
        }
        regions.forEach((indices: number[], group: number): void => {
          if (indices.length === 0) return;
          add(
            `${eye.name}-iris-${group}`,
            extractTriangleRegion(mesh.positions, mesh.normals!, indices),
            `${shape.irisPigment === undefined ? "iris" : eye.name + "-iris"}-${group}`,
          );
        });
      }
    }
    add(
      `${eye.name}-lash-line`,
      tube(
        (t: number): Point => {
          const point: Point = interpolate(upper, t);
          return p(point.x, point.y, point.z + 0.04);
        },
        (t: number): number => 0.06 + 0.16 * Math.sin(pi * t),
        70,
      ),
      brow,
    );
    // Short curled upper lashes belong to the eyelid, not the deferred scalp
    // hairstyle. They project in front of the measured rim, so their shadows
    // affect the eye without changing the opening's geometric silhouette.
    const outward: 1 | -1 = eye.name === "left" ? 1 : -1;
    for (let i: number = 0; i < shape.upperLashes; i++) {
      const u: number = 0.04 + (0.92 * (i + 0.5)) / shape.upperLashes;
      const origin: Point = interpolate(upper, u);
      const length: number = 0.5 + (eye.name === "left" ? u : 1 - u);
      add(
        `${eye.name}-upper-lash-${i}`,
        shape.upperLashProfile === undefined
          ? tube(
              (t: number): Point =>
                p(
                  origin.x + outward * 0.25 * length * t,
                  origin.y + 0.45 * length * t * t,
                  origin.z + 0.05 + length * t,
                ),
              (t: number): number => 0.055 * (1 - 0.9 * t),
              6,
            )
          : buildPortraitEyelash(
              p(origin.x, origin.y, origin.z + 0.05),
              shape.upperLashProfile,
              eye.name,
              eye.name === "left" ? u : 1 - u,
              i,
              lashMotion?.(u),
            ),
        brow,
      );
    }
    parts.push(
      ...buildPortraitEyebrow(
        refined,
        { side: eye.name, upper: eye.browTop, lower: eye.browBottom },
        shape.browFibres,
        shape.browProfile,
      ),
    );
  }
  return parts;
}
