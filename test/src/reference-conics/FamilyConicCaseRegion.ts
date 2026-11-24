import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import type { IAutoMovieHumanSegmentFrame } from "@automovie/interface";

/**
 * A close region of the baseline, carried onto a changed case by its bones.
 *
 * The capture's close zones are read on the baseline's reference, in the baseline's world. A changed case moves its segments: a shorter thigh raises the
 * foot, so a camera fitted on the baseline's toes frames the case's toes partly out of the picture. Each point of the zone is carried by the
 * segment whose frame origin (its joint) stands nearest it in the baseline: its coordinates in that frame are kept and read in the case's frame
 * of the same name. A point on the other side (z < 0) is carried as its +Z image and reflected back, since the frames are the stored
 * side's. The carried points frame the case's own region; the baseline's points keep framing the reference.
 */
export namespace FamilyConicCaseRegion {
  /**
   * Carry baseline points, metres, onto a case.
   *
   * @param points Zone points in the baseline's world, metres.
   * @param from the baseline's segment frames, millimetres.
   * @param to The case's segment frames of the same names, millimetres.
   * @returns The carried points in the case's world, metres; the baseline's own frames return the points unchanged.
   */
  export function carry(
    points: readonly N.Point[],
    from: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>,
    to: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>,
  ): N.Point[] {
    const pairs: [IAutoMovieHumanSegmentFrame, IAutoMovieHumanSegmentFrame][] = [...from].flatMap(([name, frame]) => {
      const moved: IAutoMovieHumanSegmentFrame | undefined = to.get(name);
      return moved === undefined ? [] : [[frame, moved] as [IAutoMovieHumanSegmentFrame, IAutoMovieHumanSegmentFrame]];
    });
    if (pairs.length === 0) throw new Error("the case shares no segment frame with the baseline");
    return points.map((p: N.Point): N.Point => {
      const side: number = p[2] < 0 ? -1 : 1;
      const q: [number, number, number] = [p[0] * 1000, p[1] * 1000, side * p[2] * 1000];
      let best: [IAutoMovieHumanSegmentFrame, IAutoMovieHumanSegmentFrame] = pairs[0]!;
      let least: number = Infinity;
      for (const pair of pairs) {
        const o = pair[0].origin;
        const d: number = Math.hypot(q[0] - o[0], q[1] - o[1], q[2] - o[2]);
        if (d < least) { least = d; best = pair; }
      }
      const [f, t] = best;
      const r: number[] = [0, 1, 2].map((k: number): number => q[k]! - f.origin[k]!);
      const local: number[] = f.axes.map((axis): number => axis[0] * r[0]! + axis[1] * r[1]! + axis[2] * r[2]!);
      const world: number[] = [0, 1, 2].map((k: number): number =>
        t.origin[k]! + local[0]! * t.axes[0][k]! + local[1]! * t.axes[1][k]! + local[2]! * t.axes[2][k]!);
      return [world[0]! / 1000, world[1]! / 1000, side * world[2]! / 1000];
    });
  }

  /** How many of a mesh's vertices inside the region's box project outside the camera's picture. */
  export function outside(
    meshes: readonly N.Mesh[],
    region: readonly N.Point[],
    camera: N.Camera,
  ): { inside: number; outside: number } {
    const low: number[] = [0, 1, 2].map((k: number): number => Math.min(...region.map((p): number => p[k])));
    const high: number[] = [0, 1, 2].map((k: number): number => Math.max(...region.map((p): number => p[k])));
    let inside: number = 0, out: number = 0;
    for (const mesh of meshes)
      for (let i: number = 0; i < mesh.positions.length; i += 3) {
        const p: number[] = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
        if (!p.every((x: number, k: number): boolean => x >= low[k]! && x <= high[k]!)) continue;
        ++inside;
        // The instrument's own projection, captions included (`NodeCanvasCamera.project`).
        const [x, y] = NodeCanvasCamera.project([p[0]!, p[1]!, p[2]!], camera);
        if (!(x >= 0 && x <= camera.width && y >= 0 && y <= camera.height)) ++out;
      }
    return { inside, outside: out };
  }
}
