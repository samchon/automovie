import { type AutoMovieLoftContract, AutoMovieSolidFoot, AutoMovieSolidIntersection, type AutoMovieSolidJoin, AutoMovieSolidMerge, AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cross, dot, scale, unit } = AutoMovieSolidVector;

/**
 * A body part merged onto its host along an anatomical fold (the axilla, the
 * groin and gluteal folds, the neck base, a breast's inframammary fold, a
 * digit's web): the solid merge seeded at the fold's landmark, its blend as
 * wide on each side as the fillet the soft tissue rolls into.
 *
 * Seed. The fold's landmark (the axilla vault, the inguinal fold's front
 * point, cervicale) is a world point on both skins near their meeting; its
 * foot on each surface (`AutoMovieSolidFoot`, from a guess in the
 * landmark's region) gives the trace's seed `(phi, s, y, theta)`, which the
 * trace refines by Newton onto the curve.
 *
 * Width. Two surfaces whose outward normals turn by `beta` across their
 * intersection curve meet a circle of radius `R` that touches both at the
 * distance `R tan(beta / 2)` from the curve on each (the fillet between two
 * faces at dihedral angle `pi - beta`: its tangent length is
 * `R / tan((pi - beta) / 2)`). `R` is the tissue that rolls into the fold,
 * the caller's law per phase (the subcutaneous layer at the site,
 * `IAutoMovieHumanSubcutaneousFat`, or a digit's half breadth at a web), so a
 * lean person's fold is narrow and a full one's wide, and a near-tangent
 * contact (the lateral hip, `beta` small) takes a narrow blend because the
 * two skins already nearly agree there. `beta` is read at the curve's point
 * of each phase from both surfaces' exact jets (`n = orientation (S_u x S_v)`
 * normalized), so the width is a smooth function of the phase wherever the
 * curve is. The caller's cap per phase bounds it (half the gap to a
 * neighbouring merge's host rail, the part's length to its first section
 * clear of the host), since a fillet wider than either folds the rail.
 *
 * Every failure is the operators' diagnostics and a null join: no foot for
 * the landmark, no closed transversal curve, a rail that crosses itself, a
 * folded blend.
 */
export namespace AutoMovieHumanFoldJoin {
  /** What a fold join needs. */
  export interface IInput {
    /** The part (periodic phase): the limb, digit, neck or mass whose station lines leave the host across the fold. */
    part: IAutoMovieSolidSurface;

    /** The host. */
    host: IAutoMovieSolidSurface;

    /** The fold's landmark, a world point near both skins at the fold, mm. */
    landmark: Vec3;

    /** Chart guesses `[u, v]` for the landmark's foot on the part and on the host, in the landmark's region. */
    guess: { part: [number, number]; host: [number, number] };

    /** The fold's radius per curve parameter, mm, positive: the tissue that rolls into it. */
    radius: (t: number) => number;

    /** The widest chord per curve parameter on either side, mm, positive. */
    cap: (t: number) => number;

    /**
     * The curve's parameter: absent, the part's phase (a limb or a mass whose
     * station lines leave the host across the fold); the angle about the
     * footprint's centre for a part lying along its host (a muscle head, a
     * groove), whose station lines cross the host twice or never
     * (`AutoMovieSolidIntersection.Parameter`). The radius and the cap
     * are functions of it.
     */
    parameter?: AutoMovieSolidIntersection.Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Largest gap accepted on the curve and on a foot, mm. */
    tolerance: number;

    /** Least angle between the tangent planes along the curve, radians. */
    grazing: number;
  }

  /**
   * Merge the part onto its host along the fold.
   *
   * @param input The surfaces, the landmark, the fold's radius and cap, the trace's limits.
   * @returns The join and the diagnostics of every broken premise.
   */
  export function create(input: IInput): AutoMovieSolidJoin.IResult {
    const producer: string = `fold.${input.part.name}.${input.host.name}`;
    const fail = (contract: string, detail: string, more: AutoMovieLoftContract.IDiagnostic[] = []): AutoMovieSolidJoin.IResult => ({
      join: null,
      diagnostics: [...more, { producer, level: 6, contract, detail }],
    });

    // The seed: the landmark's feet on both surfaces.
    const onPart: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(input.part, input.landmark, input.guess.part, input.tolerance);
    const onHost: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(input.host, input.landmark, input.guess.host, input.tolerance);
    if (onPart === null || onHost === null) return fail("seed", `no foot of the landmark [${input.landmark.join(", ")}] on the ${onPart === null ? "part" : "host"}`);
    const seed: AutoMovieSolidIntersection.IInput["seed"] = { phi: onPart.v, s: onPart.u, y: onHost.u, theta: onHost.v };

    // The curve first, so each phase's width reads both normals on it.
    const traced: AutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({
      part: input.part,
      host: input.host,
      seed,
      ...(input.parameter !== undefined ? { parameter: input.parameter } : {}),
      count: input.count,
      tolerance: input.tolerance,
      grazing: input.grazing,
    });
    if (traced.curve === null) return fail("curve", "the fold traces no closed curve", traced.diagnostics);
    const curve: AutoMovieSolidIntersection.ICurve = traced.curve;

    // The fillet's chord per phase, capped.
    const width = (t: number): number => {
      const p: AutoMovieSolidIntersection.IPoint | null = curve.at(t);
      if (p === null) return input.cap(t);
      const a: Vec3 | null = outward(input.part, p.s, p.phi);
      const b: Vec3 | null = outward(input.host, p.y, p.theta);
      if (a === null || b === null) return input.cap(t);
      const beta: number = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
      return Math.min(input.radius(t) * Math.tan(beta / 2), input.cap(t));
    };

    return AutoMovieSolidMerge.create({
      part: input.part,
      host: input.host,
      seed,
      ...(input.parameter !== undefined ? { parameter: input.parameter } : {}),
      count: input.count,
      tolerance: input.tolerance,
      grazing: input.grazing,
      width: { part: width, host: width },
    });
  }

  /**
   * A surface's outward unit normal at a chart point, or null where its
   * chart degenerates.
   *
   * @param surface The surface.
   * @param u First chart parameter.
   * @param v Second chart parameter.
   * @returns The normal.
   */
  function outward(surface: IAutoMovieSolidSurface, u: number, v: number): Vec3 | null {
    const j: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
    const n: Vec3 | null = unit(cross(j.u, j.v));
    return n === null ? null : scale(n, surface.orientation);
  }
}
