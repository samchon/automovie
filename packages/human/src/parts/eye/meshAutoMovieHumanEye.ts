import { IAutoMovieMesh } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_EYE_ATLAS } from "./AUTOMOVIE_HUMAN_EYE_ATLAS";
import { planAutoMovieHumanEye } from "./planAutoMovieHumanEye";

/**
 * Evaluate one eyeball's two surfaces from its plan: the opaque globe and the clear corneal cap over it.
 *
 * Both are surfaces of revolution about the line of sight, evaluated exactly rather than subdivided from a cage, because a cage's limit surface shrinks a sphere and the cornea's measured radius is what its bulge and its highlight depend on. Each meridian is written with its analytic normal and then stretched to the sclera's transverse and vertical semi-axes, the normal by the inverse stretch, so the globe is the measured oblate ellipsoid while the limbus stays one curve the two surfaces share exactly:
 *
 * - The globe runs from the pupil's centre over the flat iris to its root, up the limbal wall to the limbus, and back over the sclera's ellipse to the posterior pole. The pupil is the iris image's dark disc, not a hole.
 * - The cornea runs from its apex down its sphere to the limbus, where it meets the sclera's edge vertex for vertex.
 *
 * Normals split only where the meridian turns a corner, at the iris root and the limbus. Texture coordinates follow {@link AUTOMOVIE_HUMAN_EYE_ATLAS}, which has no seam. Vertex counts grow with `levels` only: the turn has 16·2^levels divisions, the iris 3·2^levels rings, the sclera 6·2^levels and the cornea 4·2^levels, so every identity shares one topology.
 *
 * @param props.plan The eye's plan
 * @param props.levels Resolution, an integer from 1 to 6, as the skin's subdivision levels
 * @returns Globe and cornea, model frame and millimetres at rest, without skin
 */
export function meshAutoMovieHumanEye(props: {
  plan: planAutoMovieHumanEye.IPlan;
  levels: number;
}): meshAutoMovieHumanEye.IOutput {
  const p: planAutoMovieHumanEye.IPlan = props.plan;
  const step: number = 2 ** props.levels;
  const atlas: typeof AUTOMOVIE_HUMAN_EYE_ATLAS = AUTOMOVIE_HUMAN_EYE_ATLAS;
  const mean: number = (p.transverse + p.vertical) / 2;

  // iris disc: centre to root, facing forward
  const iris: IStation[] = range(3 * step).map(
    (t: number): IStation => ({
      r: t * p.limbus,
      z: p.iris,
      nr: 0,
      nz: 1,
      rho: t * atlas.iris,
    }),
  );
  // limbal wall: iris root up to the limbus, facing the axis
  const wall: IStation[] = range(1).map(
    (t: number): IStation => ({
      r: p.limbus,
      z: p.iris + t * (p.limbusZ - p.iris),
      nr: -1,
      nz: 0,
      rho: atlas.iris + t * (atlas.limbus - atlas.iris),
    }),
  );
  // sclera: the ellipse of mean radius `mean` and depth `p.depth` from the limbus to the posterior pole
  const start: number = Math.asin(p.limbus / mean);
  const sclera: IStation[] = range(6 * step).map((t: number): IStation => {
    const a: number = start + t * (Math.PI - start);
    return {
      r: t === 1 ? 0 : mean * Math.sin(a),
      z: p.depth * Math.cos(a),
      nr: Math.sin(a) / mean,
      nz: Math.cos(a) / p.depth,
      rho: atlas.limbus + t * (atlas.pole - atlas.limbus),
    };
  });
  // cornea: apex to the limbus on its sphere
  const rim: number = Math.asin(p.limbus / p.cornea);
  const cornea: IStation[] = range(4 * step).map((t: number): IStation => {
    const a: number = t * rim;
    return {
      r: t === 1 ? p.limbus : p.cornea * Math.sin(a),
      z: t === 1 ? p.limbusZ : p.corneaZ + p.cornea * Math.cos(a),
      nr: Math.sin(a),
      nz: Math.cos(a),
      rho: (atlas.iris * (p.cornea * Math.sin(a))) / p.limbus,
    };
  });
  const around: number = 16 * step;
  return {
    globe: revolve([iris, wall, sclera], around, p, mean),
    cornea: revolve([cornea], around, p, mean),
  };
}
/** Output type of {@link meshAutoMovieHumanEye}. */
export namespace meshAutoMovieHumanEye {
  /**
   * The eyeball's two surfaces.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Sclera, limbal wall, iris and pupil: opaque, painted through the eye atlas. */
    globe: IAutoMovieMesh;

    /** The clear corneal cap over the iris, meeting the globe at the limbus. */
    cornea: IAutoMovieMesh;
  }
}

/** One point of a meridian: radius and depth in the eye frame, the unnormalized outward normal in the meridian plane, and the atlas radius. */
interface IStation {
  r: number;
  z: number;
  nr: number;
  nz: number;
  rho: number;
}

/**
 * `count + 1` evenly spaced parameters from 0 to 1.
 *
 * @param count Intervals
 * @returns The parameters, both ends included
 */
function range(count: number): number[] {
  return Array.from(
    { length: count + 1 },
    (_: unknown, i: number): number => i / count,
  );
}

/**
 * Turn meridian runs about the line of sight into one mesh, each run with its own vertices so normals split between runs, quads wound counterclockwise seen from outside.
 *
 * @param runs Meridian runs in order
 * @param around Divisions of the turn
 * @param plan The eye's plan, for the stretch and the placement
 * @param mean Radius the meridians were drawn at
 * @returns Mesh in the model frame, millimetres
 */
function revolve(
  runs: IStation[][],
  around: number,
  plan: planAutoMovieHumanEye.IPlan,
  mean: number,
): IAutoMovieMesh {
  const sx: number = plan.transverse / mean;
  const sy: number = plan.vertical / mean;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const run of runs) {
    const base: number = positions.length / 3;
    for (const s of run)
      for (let j: number = 0; j < around; ++j) {
        const phi: number = (2 * Math.PI * j) / around;
        const c: number = Math.cos(phi);
        const n: number = Math.sin(phi);
        positions.push(
          plan.centre.x + s.r * c * sx,
          plan.centre.y + s.r * n * sy,
          plan.centre.z + plan.offset + s.z,
        );
        const nx: number = (s.nr * c) / sx;
        const ny: number = (s.nr * n) / sy;
        const length: number = Math.hypot(nx, ny, s.nz);
        normals.push(nx / length, ny / length, s.nz / length);
        uvs.push(0.5 + s.rho * c, 0.5 + s.rho * n);
      }
    for (let i: number = 0; i + 1 < run.length; ++i)
      for (let j: number = 0; j < around; ++j) {
        const a: number = base + i * around + j;
        const b: number = base + (i + 1) * around + j;
        const c: number = base + (i + 1) * around + ((j + 1) % around);
        const d: number = base + i * around + ((j + 1) % around);
        indices.push(a, b, c, a, c, d);
      }
  }
  return { positions, normals, uvs, indices, skin: null };
}
