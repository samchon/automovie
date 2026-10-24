import { AutoMovieHumanEyeGlobe } from "./AutoMovieHumanEyeGlobe";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";

/** Transverse eyelid profiles constrained by their generating skin boundary jets. */
export namespace AutoMovieHumanEyelidProfile {
  /**
   * Reach of the lid's tuck under the lid from the posterior edge, mm.
   * The tuck stands for the conjunctiva lining the lid; any line of sight
   * past the posterior edge meets the globe first, so the tuck only has to
   * reach inside it.
   */
  const TUCK: number = 1.5;

  /**
   * Anterior-surface rows of the lid band, as fractions of the way from
   * the band's outer edge to the start of the rim's rounding.
   */
  const ROWS: readonly number[] = [0.18, 0.36, 0.52, 0.66, 0.78, 0.88, 1];

  /**
   * Radius of the anterior edge's rounding as a fraction of the margin
   * depth: a rounded lid edge, not a knife cut.
   */
  const ROUNDING: number = 0.4;

  /**
   * One column of the lid band, outer edge excluded: anterior surface,
   * rounded anterior edge, margin face, posterior edge and tuck.
   *
   * @param s Lid sample
   * @param g Seated globe
   * @param band Band width, mm
   * @param skin Skin depth relative to the globe centre at the band's
   *   outer edge, and its slope per mm outward
   * @returns Row points in mm
   */
  export function generate(
    s: AutoMovieHumanEyelid.ISample,
    g: AutoMovieHumanEyelid.IGlobe,
    band: number,
    skin: { x: number; k: number },
  ): AutoMovieHumanEyelid.Point[] {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const contact: number = E.dot(E.sub(s.contact, g.centre), g.forward);

    // Points of the column's plane: `u` outward from the contact point in
    // projection, `x` depth from the globe centre.
    /** Lift the regular profile coordinates into the globe's physical frame. */
    const place: (u: number, x: number) => AutoMovieHumanEyelid.Point = (
      u: number,
      x: number,
    ): AutoMovieHumanEyelid.Point =>
      E.add(
        E.add(s.contact, E.scale(s.outward, u)),
        E.scale(g.forward, x - contact),
      );
    /** Globe depth at the same physical transverse position, in millimetres. */
    const globe: (u: number) => number = (u: number): number =>
      E.surface(g, E.add(s.contact, E.scale(s.outward, u)));

    // Anterior edge, and the start of its rounding on the anterior surface.
    const edgeU: number = E.rule.offset;
    const edgeX: number = contact + s.thickness;
    const r: number = ROUNDING * s.thickness;
    const span: number = band - edgeU;
    const h: number = Math.min(0.9 * span, r);
    const endU: number = edgeU + h;

    // Use a regular planar curve, rather than x(u). Near a vertical skin
    // fold dx/du can be arbitrarily large while its unit tangent is finite.
    // Giving that derivative a fixed u span amplifies it into a protrusion;
    // physical chord-length handles preserve its plane without that premise.
    const x0: number = skin.x;
    const m0: number = skin.k;
    const x1: number = edgeX + ((x0 - edgeX) * h) / span;
    const m1: number = (x0 - edgeX) / span;
    const length: number = Math.hypot(band - endU, x0 - x1);
    const start: number = length / (3 * Math.hypot(1, m0));
    const finish: number = length / (3 * Math.hypot(1, m1));
    const controls: [number, number][] = [
      [band, x0],
      [band - start, x0 - start * m0],
      [endU + finish, x1 + finish * m1],
      [endU, x1],
    ];
    const surface: [number, number][] = ROWS.map(
      (f: number): [number, number] => {
        const t: number = f;
        const weights: number[] = [
          (1 - t) ** 3,
          3 * (1 - t) ** 2 * t,
          3 * (1 - t) * t * t,
          t ** 3,
        ];
        const u: number = controls.reduce(
          (sum: number, p: [number, number], i: number): number =>
            sum + weights[i]! * p[0],
          0,
        );
        let x: number = controls.reduce(
          (sum: number, p: [number, number], i: number): number =>
            sum + weights[i]! * p[1],
          0,
        );

        // Lid thickness over the globe, never less than the clearance.
        const under: number = globe(u);
        if (Number.isFinite(under))
          x += positive(under + E.rule.clearance - x, 0.3);
        return [u, x];
      },
    );

    // Rounded anterior edge: quadratic Bezier from the surface's end,
    // through the edge as control, to the margin face's start.
    const inU: number = surface[surface.length - 1]![0];
    const inX: number = surface[surface.length - 1]![1];
    const faceU: number = -edgeU;
    const faceX: number = -s.thickness;
    const faceLength: number = Math.hypot(faceU, faceX) || 1;
    const outU: number = edgeU + (faceU * r) / faceLength;
    const outX: number = edgeX + (faceX * r) / faceLength;
    const rounded: [number, number][] = [0.25, 0.5, 0.75, 1].map(
      (t: number): [number, number] => [
        (1 - t) ** 2 * inU + 2 * t * (1 - t) * edgeU + t * t * outU,
        (1 - t) ** 2 * inX + 2 * t * (1 - t) * edgeX + t * t * outX,
      ],
    );

    // Margin face to the posterior edge, then the tuck.
    const face: [number, number][] = [
      [(outU + 0) / 2, (outX + contact) / 2],
      [0, contact],
    ];
    // The tuck runs from the posterior edge under the lid, just inside the
    // globe's surface, as the conjunctiva lining the lid lies on the eye;
    // where the margin passes the globe, toward its silhouette behind its
    // centre.
    const radial: number = AutoMovieHumanEyeGlobe.dimensions.radial;
    const into: number = E.smoothstep(0.75 * radial, 0.95 * radial, s.rho);
    const under: number = Math.min(s.rho + TUCK, 0.97 * radial);
    const tuckRho: number =
      (1 - into) * under + into * Math.min(s.rho, 0.97 * radial);
    const tuckX: number =
      (1 - into) * (AutoMovieHumanEyeGlobe.anterior(under) - 0.15) +
      into * -TUCK;
    const points: AutoMovieHumanEyelid.Point[] = [
      ...surface,
      ...rounded,
      ...face,
    ].map(
      ([u, x]: [number, number]): AutoMovieHumanEyelid.Point => place(u, x),
    );

    // The tuck end lies on the contact point's radial line from the axis.
    const offset: AutoMovieHumanEyelid.Point = E.sub(s.contact, g.centre);
    const across: AutoMovieHumanEyelid.Point = E.sub(
      offset,
      E.scale(g.forward, E.dot(offset, g.forward)),
    );
    const unit: AutoMovieHumanEyelid.Point = E.normalize(across);
    points.push(
      E.add(E.add(g.centre, E.scale(unit, tuckRho)), E.scale(g.forward, tuckX)),
    );
    return points;
  }

  /**
   * C1 nonnegative obstacle correction, exactly zero on a clear profile.
   * Unlike an everywhere-positive smooth maximum it leaves a clear outer
   * boundary and its transverse jet unchanged. Its compact quadratic blend
   * majorizes max(0,x), so the correction also preserves the clearance.
   */
  function positive(x: number, width: number): number {
    if (x <= -width) return 0;
    if (x >= width) return x;
    return (x + width) ** 2 / (4 * width);
  }
}
