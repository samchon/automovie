import type { IAutoMovieMillimeterMesh } from "@automovie/interface";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

/**
 * The pinned MakeHuman HM08 rest skin and the rig's own joint markers.
 *
 * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.md
 * @see https://static.makehumancommunity.org/oldsite/uncategorized/background_and_technical_considerations.html
 * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/data/rigs/standard/rig.default.json
 */
export namespace FamilyConicMpfbSource {
  /** Millimetres, with +X anterior, +Y superior and +Z anatomical left. */
  export type Point = [number, number, number];

  /** Triangulated skin and original `joint-*` group centres in one frame. */
  export interface IGeometry {
    /** Indexed skin triangles in millimetres, without helper geometry. */
    body: IAutoMovieMillimeterMesh;
    /** Published rig markers by their original group names, in the skin frame. */
    joints: ReadonlyMap<string, Point>;
  }

  /** Source identity retained with the observations made on this skin. */
  export interface ISource extends IGeometry {
    /** The public asset's identity before any coordinate conversion. */
    source: {
      /** Exact Git revision selected for reproducible downloads. */
      revision: string;
      /** SHA-256 of the unmodified OBJ bytes. */
      sha256: string;
      /** SPDX identifier of the original asset licence. */
      license: string;
      /** Download URL pinned to the selected revision. */
      url: string;
    };
  }

  const REVISION: string = "650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a";
  const SHA256: string =
    "8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c";
  const URL: string = `https://raw.githubusercontent.com/makehumancommunity/mpfb2/${REVISION}/src/mpfb/data/3dobjs/base.obj`;

  /** Read an HM08 face's one-based position index, independently of its UV. */
  function index(token: string, count: number): number {
    const value: number = Number(token.split("/", 1)[0]) - 1;
    if (!Number.isInteger(value) || value < 0 || value >= count)
      throw new Error(`Invalid HM08 position index ${token}`);
    return value;
  }

  /** The centroid of the unique vertices of a rig joint cube. */
  function centre(
    vertices: readonly Point[],
    cube: ReadonlySet<number>,
  ): Point {
    const sum: Point = [0, 0, 0];
    for (const i of cube) {
      const point: Point = vertices[i]!;
      sum[0] += point[0];
      sum[1] += point[1];
      sum[2] += point[2];
    }
    return [sum[0] / cube.size, sum[1] / cube.size, sum[2] / cube.size];
  }

  /**
   * Read `g body` and use `g joint-*` only as landmarks. MPFB's standard rig
   * maps `upperarm01.L` to `joint-l-shoulder`, `lowerarm01.L` to
   * `joint-l-elbow` and `wrist.L` to `joint-l-hand` with its `CUBE` placement
   * strategy. The remaining helper groups are outside both outputs.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The pinned source's body group and rig markers own all observed geometry and landmarks.
   * @evidence contracts/development/implementation.md#efficient-algorithms Read the data and compact the body indices in linear passes.
   */
  export function parse(obj: string): IGeometry {
    const vertices: Point[] = [];
    const quads: number[][] = [];
    const cubes: Map<string, Set<number>> = new Map();
    let group: string = "";
    for (const line of obj.split(/\r?\n/)) {
      const [kind, ...fields] = line.trim().split(/\s+/);
      if (kind === "v") {
        const coordinates: number[] = fields.map(Number);
        if (coordinates.length !== 3 || !coordinates.every(Number.isFinite))
          throw new Error("Invalid HM08 vertex");
        vertices.push([coordinates[0]!, coordinates[1]!, coordinates[2]!]);
      } else if (kind === "g") group = fields[0] ?? "";
      else if (
        kind === "f" &&
        (group === "body" || group.startsWith("joint-"))
      ) {
        if (fields.length !== 4)
          throw new Error(`Expected an HM08 quad in ${group}`);
        const quad: number[] = fields.map((token) =>
          index(token, vertices.length),
        );
        if (group === "body") quads.push(quad);
        else {
          const points: Set<number> = cubes.get(group) ?? new Set();
          for (const i of quad) points.add(i);
          cubes.set(group, points);
        }
      }
    }

    const left: Set<number> | undefined = cubes.get("joint-l-shoulder");
    const right: Set<number> | undefined = cubes.get("joint-r-shoulder");
    if (quads.length === 0 || left === undefined || right === undefined)
      throw new Error("HM08 has no body or bilateral shoulder landmarks");
    const leftX: number = centre(vertices, left)[0];
    const rightX: number = centre(vertices, right)[0];
    if (leftX <= rightX)
      throw new Error("HM08 shoulder markers reverse the anatomical sides");
    const middle: number = (leftX + rightX) / 2;
    let floor: number = Infinity;
    for (const quad of quads)
      for (const i of quad) floor = Math.min(floor, vertices[i]![1]);

    // MakeHuman stores decimetres, with Y up and +Z facing forwards.
    // Swapping X and Z changes handedness, so reverse the face winding below.
    const world = ([x, y, z]: Point): Point => [
      100 * z,
      100 * (y - floor),
      100 * (x - middle),
    ];
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Int32Array = new Int32Array(vertices.length).fill(-1);
    const vertex = (i: number): number => {
      if (remap[i] === -1) {
        remap[i] = positions.length / 3;
        positions.push(...world(vertices[i]!));
      }
      return remap[i]!;
    };
    for (const quad of quads) {
      const [a, b, c, d] = quad.map(vertex);
      indices.push(a!, c!, b!, a!, d!, c!);
    }
    const joints: Map<string, Point> = new Map();
    for (const [name, cube] of cubes)
      joints.set(name, world(centre(vertices, cube)));
    return { body: { positions, indices }, joints };
  }

  /**
   * Load the CC0 asset from the pinned release or an exact local copy. The
   * source's SHA-256 applies to both paths, so the geometry stays
   * reproducible.
   */
  export async function load(file?: string): Promise<ISource> {
    let bytes: Buffer;
    if (file !== undefined) bytes = await readFile(file);
    else {
      const response: Response = await fetch(URL, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error(
          `Cannot read pinned HM08 asset: HTTP ${response.status}`,
        );
      bytes = Buffer.from(await response.arrayBuffer());
    }
    const sha256: string = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== SHA256)
      throw new Error(`Unexpected HM08 asset SHA-256 ${sha256}`);
    return {
      ...parse(bytes.toString("utf8")),
      source: { revision: REVISION, sha256, license: "CC0-1.0", url: URL },
    };
  }
}
