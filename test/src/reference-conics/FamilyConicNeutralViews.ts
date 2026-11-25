import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type { buildHumanNeutralCapture } from "@automovie/human/capture";
import type {
  IAutoMovieSolidBody,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { mkdir } from "node:fs/promises";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicCaptureViews as Views } from "./FamilyConicCaptureViews";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster as Raster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Actual ordinary skin and its atlas, borrowed from the numerical gate. */
type Body = Pick<
  ReturnType<typeof buildHumanNeutralCapture.inspect>,
  "mesh" | "calibration" | "solidSurfaces" | "triangleGroups" | "diagnostics"
>;

/** Min/max coordinates of the selected actual vertices, in metres. */
type Bounds = [N.Point, N.Point];

/** An outside view direction and a screen-up direction. */
type View = readonly [name: string, back: N.Point, up: N.Point, focus?: Owner];

/** Membership in a named group of actual emitted surface owners. */
type Owner = (name: string) => boolean;

/** A named actual neighbourhood and its matched close cameras. */
type Region = {
  name: string;
  owns: Owner;
  views: readonly View[];
  /** Optional proximal skeletal landmark to include in the frame. */
  landmark?: N.Point;
};

/** One sampled atlas boundary and both incident owner identities. */
type Guide = { owners: Set<string>; curve: N.Curve };

/** The existing software clay used by the regional Human captures. */
const CLAY: N.Point = [0.64, 0.65, 0.67];

/** World vertical and anterior in the writer's neutral body frame. */
const UP: N.Point = [0, 1, 0];
const FRONT: N.Point = [1, 0, 0];

/**
 * Matched whole and regional views of the numerical gate's own case.
 *
 * @see https://github.com/samchon/automovie/issues/3151
 * @see https://github.com/Brooooooklyn/canvas
 */
export namespace FamilyConicNeutralViews {
  /**
   * Use the shared Camera and Frame implementations to draw the given indexed
   * skin with and without its atlas boundaries. Regional framing reads only the
   * named skin owners. A viewport rejection discards triangles that cannot
   * contribute at the chosen camera and keeps every other original triangle.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The numerical gate supplies the actual mesh, source charts and matched border guides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select bounds, prepare matching curves once and draw each identical camera's two passes in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing source geometry is reported. Cropping copies exact indexed points and normals for triangles in the viewport.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounds use a packed index scan. Each camera prepares its actual skin raster once and writes two images sequentially.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Frame and Camera own rasterization, framing, file hashes and receipt fields. Existing fan captures supply the view and depth compositions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body is borrowed. Only scalar receipts survive the draw.
   * @evidence contracts/development/common.md#meaningful-documentation Writes whole and close clay and guide pairs. The returned receipt names missing frames and preserves resolved cameras and hashes even on a partial capture.
   */
  export async function write(body: Body, directory: string, id: string) {
    const frames: (N.Frame & { directory: string })[] = [];
    const preparations: {
      scope: string;
      view: string;
      milliseconds: number;
    }[] = [];
    const unavailable: string[] = [];
    const { positions, indices, normals } = body.mesh;
    if (indices === null || indices.length === 0)
      return {
        frames,
        preparations,
        unavailable: ["No emitted indexed skin to capture"],
      };
    await mkdir(directory, { recursive: true });
    const { backend } = Raster.initialize();
    const subject: string = `ANSUR neutral ${id}`;
    const mesh: N.Mesh = {
      id: `${id}/skin`,
      positions,
      indices,
      colour: CLAY,
      ...(normals === null ? {} : { normals }),
    };
    const context = { input: { selected: { id: subject } }, frames };
    const curves: Guide[] = guideCurves(body, unavailable);

    /** The clay and overlay borrow the same resolved view and exact skin. */
    async function pair(
      scope: string,
      camera: N.Camera,
      shown: N.Mesh,
      guides: N.Curve[],
    ): Promise<void> {
      const meshes: N.Mesh[] = [shown];
      let prepared: ReturnType<typeof Frame.prepare>;
      try {
        prepared = Frame.prepare(camera, meshes);
      } catch (error: unknown) {
        unavailable.push(`${scope}/${camera.name}: ${reason(error)}`);
        return;
      }
      preparations.push({
        scope,
        view: camera.name,
        milliseconds: prepared.milliseconds,
      });
      if (prepared.clay.surface === 0)
        unavailable.push(`${scope}/${camera.name}: no original surface pixels`);
      for (const [pass, lines] of [
        ["clay", []],
        ["curves-over-clay", guides],
      ] as const) {
        try {
          await Frame.write(
            context,
            directory,
            `${scope}.${camera.name}.${pass}.png`,
            camera,
            meshes,
            [...lines],
            "depth",
            `${id} | ${scope} | ${camera.name}`,
            pass,
            scope,
            {
              stage: pass,
              realization: "mesh-returned",
              diagnosticCount: body.diagnostics.length,
            },
            undefined,
            prepared,
          );
        } catch (error: unknown) {
          unavailable.push(`${scope}/${camera.name}/${pass}: ${reason(error)}`);
        }
      }
    }

    const full: N.Point[] = corners(bounds(positions));
    const all: N.Curve[] = curves.map(({ curve }: Guide): N.Curve => curve);
    for (const view of Views.whole(false))
      await pair("body", Camera.fit(view, full), mesh, all);

    for (const plan of regions(body, unavailable)) {
      const owned: Bounds | null = ownerBounds(body, indices, plan.owns);
      if (owned === null) {
        unavailable.push(
          `${plan.name}: none of the required owners emitted a triangle`,
        );
        continue;
      }
      if (plan.landmark !== undefined) include(owned, ...plan.landmark);
      const points: N.Point[] = corners(owned);
      const guides: N.Curve[] = curves
        .filter(({ owners }: Guide): boolean => [...owners].some(plan.owns))
        .map(({ curve }: Guide): N.Curve => curve);
      if (guides.length === 0)
        unavailable.push(`${plan.name}: no published native boundary to draw`);
      for (const view of plan.views) {
        const focus: Bounds | null =
          view[3] === undefined ? owned : ownerBounds(body, indices, view[3]);
        if (focus === null) {
          unavailable.push(`${plan.name}/${view[0]}: no emitted focus surface`);
          continue;
        }
        const camera: N.Camera = closeCamera(
          view,
          focus === owned ? points : corners(focus),
        );
        const selection: N.Mesh = viewport(mesh, camera);
        if (selection.indices.length === 0) {
          unavailable.push(
            `${plan.name}/${camera.name}: no visible original triangles`,
          );
          continue;
        }
        await pair(plan.name, camera, selection, guides);
      }
    }
    return { backend, frames, preparations, unavailable };
  }
}

/** Select case-owned shoulder, hand, foot, pelvic and face neighbourhoods. */
function regions(body: Body, unavailable: string[]): Region[] {
  const frontBack: readonly View[] = [
    ["front", FRONT, UP],
    ["back", [-1, 0, 0], UP],
  ];
  const below: View = ["below", [0, -1, 0], FRONT];
  const out: Region[] = [
    {
      name: "pelvis-close",
      owns: (name: string): boolean =>
        name.startsWith("groin.leg.") || name.startsWith("gluteal."),
      views: [...frontBack, below, ["oblique", [1, -0.5, 1], UP]],
    },
    {
      name: "face-close",
      owns: (name: string): boolean =>
        name === "head.mass" ||
        /^(?:blend\.)?(?:nose|orbit|auricle)\b/u.test(name),
      views: [
        frontBack[0]!,
        ["oblique", [1, 0.2, 1], UP],
        ["under-nose", [1, -1, 0], UP],
      ],
    },
  ];
  for (const side of ["left", "right"] as const) {
    const lateral: number = side === "left" ? 1 : -1;
    const toeWeb: Owner = (name: string): boolean =>
      name.startsWith(`toe.${side}.`) && name.endsWith(".web");
    const handWeb: Owner = (name: string): boolean =>
      (name.startsWith(`finger.${side}.`) && name.endsWith(".web")) ||
      name === `thumb.${side}.thenar`;
    const fingertips: Owner = (name: string): boolean =>
      name.startsWith(`nail.finger.${side}.`) || name === `nail.thumb.${side}`;
    out.push(
      {
        name: `shoulder.${side}`,
        owns: (name: string): boolean => name === `blend.arm.${side}.trunk`,
        views: [...frontBack, below, ["axilla-close", [1, -1, lateral], UP]],
      },
      {
        name: `foot.${side}`,
        owns: (name: string): boolean =>
          name === `foot.${side}` ||
          name.startsWith(`toe.${side}.`) ||
          name.startsWith(`nail.toe.${side}.`),
        views: [
          ["dorsal", UP, FRONT],
          ["plantar", [0, -1, 0], FRONT],
          ["interdigital-close", [1, 0.5, 0], UP, toeWeb],
          ["lateral", [0, 0, lateral], UP],
        ],
      },
    );
    const frame = body.calibration.nailSources?.find(
      ({ original }): boolean =>
        original.source.name === `finger.${side}.middle`,
    )?.frame;
    if (frame === undefined) {
      unavailable.push(
        `hand.${side}: the actual middle finger's dorsal and distal directions are unavailable`,
      );
      continue;
    }
    const wrist = body.calibration.skeleton?.find(
      ({ bone }): boolean => bone === `${side}Hand`,
    )?.position;
    out.push({
      name: `hand.${side}`,
      owns: (name: string): boolean =>
        name.startsWith(`finger.${side}.`) ||
        name === `thumb.${side}` ||
        handWeb(name) ||
        fingertips(name),
      views: [
        ["dorsal", frame.dorsal, frame.distal],
        ["palmar", Vec.scale(frame.dorsal, -1), frame.distal],
        [
          "interdigital-close",
          Vec.add(frame.dorsal, frame.distal),
          frame.dorsal,
          handWeb,
        ],
        ["fingertips-close", frame.distal, frame.dorsal, fingertips],
      ],
      ...(wrist === undefined ? {} : { landmark: Vec.scale(wrist, 1 / 1000) }),
    });
  }
  return out;
}

/** Read each published common curve directly from its shared atlas sites. */
function guideCurves(body: Body, unavailable: string[]): Guide[] {
  const out: Guide[] = [];
  for (const [index, atlas] of (body.calibration.bodies ?? []).entries()) {
    const used: Set<number> = new Set();
    for (const { cycles } of atlas.faces)
      for (const cycle of cycles) for (const id of cycle.points) used.add(id);
    const points: (N.Point | undefined)[] = [];
    for (const id of used) {
      const { chain, chart } = atlas.points[id]!;
      const surface: IAutoMovieSolidSurface | undefined =
        body.solidSurfaces.get(chain);
      if (surface === undefined) continue;
      try {
        const point: N.Point =
          surface.point?.(...chart) ?? surface.jet(...chart).p;
        if (point.every(Number.isFinite))
          points[id] = Vec.scale(point, 1 / 1000);
      } catch (error: unknown) {
        unavailable.push(`${chain}: ${reason(error)}`);
      }
    }
    const cycles: Map<string, Guide> = new Map();
    for (const face of atlas.faces)
      face.cycles.forEach(
        (
          cycle: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number],
          i: number,
        ): void => {
          const key: string = [...cycle.points]
            .sort((a: number, b: number): number => a - b)
            .join(",");
          const known: Guide | undefined = cycles.get(key);
          if (known !== undefined) {
            known.owners.add(face.chain);
            return;
          }
          const line: (N.Point | undefined)[] = cycle.points.map(
            (id: number) => points[id],
          );
          if (
            line.length < 3 ||
            line.some((point): boolean => point === undefined)
          ) {
            unavailable.push(
              `${face.chain}/${cycle.kind}/${i}: incomplete published atlas curve`,
            );
            return;
          }
          const curve: N.Curve = {
            id: `atlas/${index}/${face.chain}/${cycle.kind}/${i}`,
            points: line as N.Point[],
            closed: true,
          };
          cycles.set(key, { owners: new Set([face.chain]), curve });
        },
      );
    out.push(...cycles.values());
  }
  if (out.length === 0)
    unavailable.push("No published atlas boundaries to draw");
  return out;
}

/** Bound only emitted triangles with the requested original owners. */
function ownerBounds(
  body: Body,
  indices: readonly number[],
  owns: Region["owns"],
): Bounds | null {
  const box: Bounds = [
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity],
  ];
  const xyz: readonly number[] = body.mesh.positions;
  for (const [i, group] of body.triangleGroups.entries()) {
    const separator: number = group.name.lastIndexOf("/");
    const name: string =
      separator === -1 ? group.name : group.name.slice(0, separator);
    if (!owns(name)) continue;
    const end: number = body.triangleGroups[i + 1]?.start ?? indices.length;
    for (let k: number = group.start; k < end; ++k) {
      const j: number = 3 * indices[k]!;
      include(box, xyz[j]!, xyz[j + 1]!, xyz[j + 2]!);
    }
  }
  return Number.isFinite(box[0][0]) ? box : null;
}

/** Whole-skin extent without constructing an array per vertex. */
function bounds(positions: readonly number[]): Bounds {
  const box: Bounds = [
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity],
  ];
  for (let i: number = 0; i < positions.length; i += 3)
    include(box, positions[i]!, positions[i + 1]!, positions[i + 2]!);
  return box;
}

/** Include the actual point, in metres. */
function include(box: Bounds, x: number, y: number, z: number): void {
  const [lo, hi] = box;
  lo[0] = Math.min(lo[0], x);
  lo[1] = Math.min(lo[1], y);
  lo[2] = Math.min(lo[2], z);
  hi[0] = Math.max(hi[0], x);
  hi[1] = Math.max(hi[1], y);
  hi[2] = Math.max(hi[2], z);
}

/** The box extrema bound every orthographic projection of the selected skin. */
function corners([lo, hi]: Bounds): N.Point[] {
  return [lo[0], hi[0]].flatMap((x: number): N.Point[] =>
    [lo[1], hi[1]].flatMap((y: number): N.Point[] =>
      [lo[2], hi[2]].map((z: number): N.Point => [x, y, z]),
    ),
  );
}

/**
 * Fit the same annotated viewport and half-depth context as the public fan
 * reader.
 */
function closeCamera([name, back, up]: View, points: N.Point[]): N.Camera {
  const camera: N.Camera = Camera.fitAnnotated(
    name,
    back,
    up,
    points,
    900,
    800,
  );
  const depths: number[] = points.map(
    (point: N.Point): number => Camera.project(point, camera)[2],
  );
  const lo: number = Math.min(...depths);
  const hi: number = Math.max(...depths);
  const depth: number = hi - lo;
  if (!(depth > 0)) return camera;
  const distance: number = hi + 1.5 * depth;
  return {
    ...camera,
    clipping: { distance, near: depth, far: distance - lo + depth / 2 },
  };
}

/** Reject only triangles wholly beyond the same raster clip plane. */
function viewport(mesh: N.Mesh, camera: N.Camera): N.Mesh {
  const { positions, indices, normals } = mesh;
  const outcode: Uint8Array = new Uint8Array(positions.length / 3);
  const clip: N.Camera["clipping"] = camera.clipping;
  for (let i: number = 0; i < outcode.length; ++i) {
    const k: number = 3 * i;
    const [x, y, z] = Camera.project(
      [positions[k]!, positions[k + 1]!, positions[k + 2]!],
      camera,
    );
    const depth: number = (clip?.distance ?? 0) - z;
    outcode[i] =
      (x < 0 ? 1 : 0) |
      (x > camera.width ? 2 : 0) |
      (y < 80 ? 4 : 0) |
      (y > camera.height - 25 ? 8 : 0) |
      (clip !== undefined && depth < clip.near ? 16 : 0) |
      (clip !== undefined && depth > clip.far ? 32 : 0);
  }
  const remap: Int32Array = new Int32Array(outcode.length).fill(-1);
  const vertices: number[] = [];
  const selectedIndices: number[] = [];
  const selectedNormals: number[] | undefined =
    normals === undefined ? undefined : [];
  const write = (id: number): void => {
    if (remap[id] === -1) {
      remap[id] = vertices.length / 3;
      const k: number = 3 * id;
      vertices.push(positions[k]!, positions[k + 1]!, positions[k + 2]!);
      selectedNormals?.push(normals![k]!, normals![k + 1]!, normals![k + 2]!);
    }
    selectedIndices.push(remap[id]!);
  };
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number = indices[i]!;
    const b: number = indices[i + 1]!;
    const c: number = indices[i + 2]!;
    if ((outcode[a]! & outcode[b]! & outcode[c]!) !== 0) continue;
    write(a);
    write(b);
    write(c);
  }
  return {
    ...mesh,
    positions: vertices,
    indices: selectedIndices,
    normals: selectedNormals,
  };
}

/** Keep the original rendering error in the case receipt. */
function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
