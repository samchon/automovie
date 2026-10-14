import { type Bounds, MeshWriter } from "./orthogonal-mesh";
import { lathedShell } from "./lathedShell";

/**
 * Draft constant-radius concentric ring or shell.
 *
 * r supplies centre X/Z and inner/outer radii in metres. Only b's Y endpoints are used; lathedShell receives two outer and two inner rings with through=true, leaving the central opening clear. Finite ordered Y bounds and 0 < inner < outer are caller premises.
 *
 * Work includes lathedShell's 24-sample ring emission and repeated arc/UV scans. The four ring tuples are local, the caller's writer owns emitted arrays, and no result is cached.
 */
export function radialShell(
  w: MeshWriter,
  b: Bounds,
  r: [number, number, number, number],
): void {
  const [cx, cz, inner, outer]: [number, number, number, number] = r;
  lathedShell(
    w,
    cx,
    cz,
    [
      [b.y[0], outer, outer],
      [b.y[1], outer, outer],
    ],
    [
      [b.y[0], inner, inner],
      [b.y[1], inner, inner],
    ],
    true,
  );
}
