import { AutoMovieHumanNasalConstruction as N } from "./AutoMovieHumanNasalConstruction";
import { AutoMovieHumanNasalRim as R } from "./AutoMovieHumanNasalRim";
import { AutoMovieHumanAlarAttachment as A } from "./AutoMovieHumanAlarAttachment";
import { AutoMovieHumanSurfaceSections as S } from "./AutoMovieHumanSurfaceSections";

/** Head consumer adapter: shared physical aperture, actual face, full sections. */
export namespace AutoMovieHumanAlarHeadSections {

  /** Physical source geometry and numerical sampling for this construction. */
  export interface Input {

    /** The shared physical aperture curve, or planar forward/lateral samples for the planar owner. */
    rim: R.Curve;

    /** The source frame locating the rim and its positive lateral direction. */
    frame: N.Frame;

    /** The requested positive lateral skin extent, in source-frame millimetres. */
    outerHalfWidth: number;

    /** The adjacent non-nasal face geometry owning the attachment boundary. */
    face: (y: number, z: number) => number;

    /** Physical numerical derivative step, supplied by the owning head. */
    derivativeStep: number;

    /** Samples around the shared physical aperture, before emitting cross spans. */
    rows: number;

    /** Cross-span subdivisions used when emitting the physical hood mesh. */
    columns: number;
  }

  /** The alar surface and its full-path adapter for existing head sections. */
  export interface Owner {

    /** The emitted skin owner retained across this consumer's section queries. */
    hood: A.Hood;

    /** Cut and splice the complete physical face path, retaining unmatched components and seam gaps. */
    section: (base: readonly N.Point[], station: number, tilt: number) => {

      /** Ordered physical surface vertices; paths retain their actual world heights. */
    points: N.Point[];

      /** Distances from physical attachment endpoints to the actual base segments, in millimetres. */
    rootGaps: number[];

      /** All open components whose two endpoints belong to the facial attachment. */
    facePaths: S.Path[];

      /** Every additional inner-ended or closed component requiring aperture-domain ownership. */
    remaining: S.Path[];

      /** Number of intersection graph vertices with more than two neighbours. */
    branching: number;

      /** Triangles lying in the cutting plane, reported as unresolved section ambiguity. */
    coplanarTriangles: number;
      /** Geometry disposition; outside means the plane has no section components or ambiguity. */
      admission: "outside" | "spliced" | "unaccepted";

      /** Observed causes preventing this physical section from being admitted. */
      rejectionReasons: string[];

    };
  }

  /** Build the physical owner from its source boundaries; invalid clearance or degenerate frames fail explicitly. */
  export function create(input: Input): Owner {
    if (!(input.derivativeStep > 0) || input.rows < 8 || !Number.isInteger(input.rows)) throw new Error("Invalid physical head adapter sampling.");
    const raw: N.Point[] = Array.from({ length: input.rows }, (_, i): N.Point => input.rim.point(2 * Math.PI * i / input.rows));
    const area: N.Point = raw.reduce((sum, p, i): N.Point => N.add(sum, N.cross(N.sub(p, input.frame.origin), N.sub(raw[(i + 1) % raw.length]!, input.frame.origin))), [0, 0, 0]);
    const winding: number = N.dot(area, input.frame.normal) >= 0 ? 1 : -1;
    const rimWorld: N.Point[] = raw.map((_, i): N.Point => input.rim.point(winding * 2 * Math.PI * i / input.rows));
    const rimTangents: N.Point[] = raw.map((_, i): N.Point => N.scale(input.rim.first(winding * 2 * Math.PI * i / input.rows), winding));
    const face: A.Jet[] = rimWorld.map((p, i): A.Jet => {
      const h: number = input.derivativeStep;
      const f = (dy: number, dz: number): number => input.face(p[1] + dy, p[2] + dz);
      const value: number = f(0, 0);
      // These nine physical samples own both derivative orders. Reusing a
      // sample changes no arithmetic expression or source-face coordinate.
      const above: number = f(h, 0);
      const below: number = f(-h, 0);
      const lateral: number = f(0, h);
      const medial: number = f(0, -h);
      const fy: number = (above - below) / (2 * h);
      const fz: number = (lateral - medial) / (2 * h);
      const fyy: number = (above - 2 * value + below) / (h * h);
      const fzz: number = (lateral - 2 * value + medial) / (h * h);
      const fyz: number = (f(h, h) - f(h, -h) - f(-h, h) + f(-h, -h)) / (4 * h * h);
      const derivative: N.Point = rimTangents[i]!;
      const boundaryTangent: N.Point = N.normalized([fy * derivative[1] + fz * derivative[2], derivative[1], derivative[2]]);
      const normal: N.Point = N.normalized([1, -fy, -fz]);
      let tangent: N.Point = N.normalized(N.cross(boundaryTangent, normal));
      const rimTangent: N.Point = N.normalized(derivative);
      const director: N.Point = N.normalized(N.sub(input.frame.normal, N.scale(rimTangent, N.dot(input.frame.normal, rimTangent))));
      const outward: N.Point = N.normalized(N.cross(rimTangent, director));
      if (N.dot(tangent, outward) < 0) tangent = N.scale(tangent, -1);
      const acceleration: N.Point = [fyy * tangent[1] ** 2 + 2 * fyz * tangent[1] * tangent[2] + fzz * tangent[2] ** 2, 0, 0];
      return { point: [value, p[1], p[2]], tangent, curvature: N.sub(acceleration, N.scale(tangent, N.dot(acceleration, tangent))) };
    });
    const hood: A.Hood = A.create({ frame: input.frame, rimWorld, rimTangents, outerHalfWidth: input.outerHalfWidth, face, columns: input.columns });
    return { hood, section: (base, station, tilt) => {
      const stride: number = 2 * input.columns + 1;
      const result: S.Result = S.cut(hood.mesh, S.headPlane(station, tilt), (a, b): string | undefined => {
        if (a % stride === 0 && b % stride === 0) return "inner";
        if (a % stride === stride - 1 && b % stride === stride - 1) return "face";
        return undefined;
      });
      const facePaths: S.Path[] = result.paths.filter((p): boolean => !p.closed && p.startBoundary === "face" && p.endBoundary === "face");
      const remaining: S.Path[] = result.paths.filter((p): boolean => !facePaths.includes(p));

      const rejectionReasons: string[] = [];
      if (facePaths.length > 1) rejectionReasons.push("Multiple physical face-to-face paths require a topology decision.");
      if (facePaths.length === 0 && result.paths.length > 0) rejectionReasons.push("Physical section components have no face-to-face attachment path.");
      if (remaining.length > 0) rejectionReasons.push("Additional physical section components require nostril-domain ownership.");
      if (result.branching > 0) rejectionReasons.push("The physical section graph has branching vertices.");
      if (result.coplanarTriangles > 0) rejectionReasons.push("Coplanar skin triangles leave the section topology unresolved.");
      const admission: "outside" | "spliced" | "unaccepted" = rejectionReasons.length > 0 ? "unaccepted" : facePaths.length === 1 ? "spliced" : "outside";
      if (facePaths.length !== 1) return { points: [...base], rootGaps: [], facePaths, remaining, branching: result.branching, coplanarTriangles: result.coplanarTriangles, admission, rejectionReasons };
      const path: S.Path = facePaths[0]!;
      const roots = [path.points[0]!, path.points[path.points.length - 1]!].map((point) => {
        let best = { segment: -1, parameter: 0, gap: Infinity };
        for (let i: number = 0; i + 1 < base.length; i++) {
          const delta: N.Point = N.sub(base[i + 1]!, base[i]!);
          const squared: number = N.dot(delta, delta);
          const parameter: number = squared > 0 ? Math.max(0, Math.min(1, N.dot(N.sub(point, base[i]!), delta) / squared)) : 0;
          const gap: number = Math.hypot(...N.sub(point, N.add(base[i]!, N.scale(delta, parameter))));
          if (gap < best.gap) best = { segment: i, parameter, gap };
        }
        return best;
      });
      if (roots.some((r): boolean => r.segment < 0)) throw new Error("A physical base face path is required.");
      const forward: boolean = roots[0]!.segment + roots[0]!.parameter <= roots[1]!.segment + roots[1]!.parameter;
      const points: N.Point[] = forward ? path.points : [...path.points].reverse();
      const a = roots[forward ? 0 : 1]!; const b = roots[forward ? 1 : 0]!;
      return { points: [...base.slice(0, a.segment + 1), ...points, ...base.slice(b.segment + 1)], rootGaps: [a.gap, b.gap], facePaths, remaining, branching: result.branching, coplanarTriangles: result.coplanarTriangles, admission, rejectionReasons };
    } };
  }
}
