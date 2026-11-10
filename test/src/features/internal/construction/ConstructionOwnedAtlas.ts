import {
  AutoMovieSolidFoot,
  AutoMovieSolidIntersection,
  AutoMovieSolidRail,
  AutoMovieSolidTraceLaw,
  AutoMovieSolidTraceSolve,
  type IAutoMovieSolidAtlas,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";

import { nclose } from "../nclose";

/** Independent bounded trial graphs, flat host charts and cylindrical transverse loops; all expectations come from the explicit polynomial/circle equations. */
export function ConstructionOwnedAtlas(failures: string[]): void {
  boundedTrials(failures);

  let outside: number = 0;
  const borrowed: IAutoMovieSolidSurface.IJet = {
    p: [0, 0, 0],
    u: [0, 0, 0],
    v: [0, 0, 0],
    uu: [0, 0, 0],
    uv: [0, 0, 0],
    vv: [0, 0, 0],
  };
  const share: (
    value: IAutoMovieSolidSurface.IJet,
  ) => IAutoMovieSolidSurface.IJet = (
    value: IAutoMovieSolidSurface.IJet,
  ): IAutoMovieSolidSurface.IJet => {
    for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
      for (let index: number = 0; index < 3; index++)
        borrowed[key][index] = value[key][index]!;
    return borrowed;
  };
  const plane: (shift: number) => IAutoMovieSolidSurface = (
    shift: number,
  ): IAutoMovieSolidSurface => ({
    name: `owned.patch.${shift}`,
    domain: [0, 1],
    orientation: -1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      if (u < 0 || u > 1) {
        outside++;
        throw new Error("An exterior patch was evaluated.");
      }
      return share({
        p: [shift + u, 0, v],
        u: [1, 0, 0],
        v: [0, 0, 1],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      });
    },
  });
  const host: IAutoMovieSolidAtlas = {
    name: "owned.two-patches",
    faces: [plane(0), plane(1)],
    kept: (_: number, u: number): boolean => u >= 0 && u <= 1,
    across: (
      face: number,
      u: number,
      v: number,
    ): ReturnType<IAutoMovieSolidAtlas["across"]> =>
      face === 0 && u > 1
        ? { face: 1, u: 0, v }
        : face === 1 && u < 0
          ? { face: 0, u: 1, v }
          : null,
  };
  const part: IAutoMovieSolidSurface = {
    name: "owned.crossing-cylinder",
    period: 2 * Math.PI,
    domain: [-1, 1],
    orientation: 1,
    jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
      const c: number = Math.cos(phi);
      const t: number = Math.sin(phi);
      return share({
        p: [1 + 0.3 * c, s, 0.3 * t],
        u: [0, 1, 0],
        v: [-0.3 * t, 0, 0.3 * c],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-0.3 * c, 0, -0.3 * t],
      });
    },
  };
  const result: AutoMovieSolidIntersection.IResult =
    AutoMovieSolidIntersection.trace({
      part: { ...part, period: 2 * Math.PI },
      host,
      seed: { phi: 0, s: 0, y: 0.3, theta: 0, face: 1 },
      count: 32,
      tolerance: 1e-10,
      grazing: 0,
    });
  if (result.curve === null)
    failures.push(
      `Owned atlas crossing: ${JSON.stringify(result.diagnostics)}`,
    );
  else {
    const faces: Set<number> = new Set(
      result.curve.points.map(
        (p: AutoMovieSolidIntersection.IPoint): number => p.face,
      ),
    );
    if (faces.size !== 2)
      failures.push(
        "The actual transverse circle did not cross both owned patches.",
      );
    for (const p of result.curve.points)
      if (
        !nclose(
          Math.hypot(
            p.point[0] - 1 - 0.3 * Math.cos(p.phi),
            p.point[1],
            p.point[2] - 0.3 * Math.sin(p.phi),
          ),
          0,
          1e-9,
        )
      )
        failures.push(
          "An atlas boundary initialization was published as an unsolved meeting.",
        );
  }
  // A shifted circle's contact and outward rail cross the shared edge at
  // different phases. The plane's normal section gives radius 0.3 + 0.25
  // exactly, so neither a boundary foot nor an extrapolated patch is an oracle.
  for (const centre of [0.85, 1.15]) {
    const shifted: IAutoMovieSolidSurface = {
      ...part,
      name: `owned.rail-cylinder.${centre}`,
      jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
        const j: IAutoMovieSolidSurface.IJet = part.jet(s, phi);
        return { ...j, p: [j.p[0] + centre - 1, j.p[1], j.p[2]] };
      },
    };
    const contact: AutoMovieSolidIntersection.IResult =
      AutoMovieSolidIntersection.trace({
        part: shifted,
        host,
        seed: { phi: 0, s: 0, y: centre - 0.7, theta: 0, face: 1 },
        count: 32,
        tolerance: 1e-10,
        grazing: 0,
      });
    if (contact.curve === null) {
      failures.push(
        `Owned rail contact: ${JSON.stringify(contact.diagnostics)}`,
      );
      continue;
    }
    const boundary: number = Math.acos((1 - centre) / 0.55);
    for (const phi of [
      Math.acos(centre < 1 ? 0.4 : -0.4),
      boundary - 2 ** -20,
      boundary,
      boundary + 2 ** -20,
    ]) {
      const point: AutoMovieSolidIntersection.IPoint | null =
        contact.curve.at(phi);
      const rail: AutoMovieSolidRail.IRail | null =
        point === null
          ? null
          : AutoMovieSolidRail.at(shifted, host, point, "outside", 0.1, 0.25);
      if (rail === null) {
        failures.push(`No owned rail for centre ${centre}, phase ${phi}.`);
        continue;
      }
      const expected: [number, number, number] = [
        centre + 0.55 * Math.cos(phi),
        0,
        0.55 * Math.sin(phi),
      ];
      if (
        !nclose(
          Math.hypot(
            ...rail.hostPoint.map(
              (v: number, i: number): number => v - expected[i]!,
            ),
          ),
          0,
          1e-9,
        )
      )
        failures.push(
          "An owned rail published its initializer instead of its section solution.",
        );
      if (!host.kept(rail.hostFace, rail.host[0], rail.host[1]))
        failures.push(
          "An owned rail was published outside its retained chart.",
        );
    }
  }
  const arc: AutoMovieSolidIntersection.IResult =
    AutoMovieSolidIntersection.trace({
      part,
      host,
      seed: { phi: 0, s: 0, y: 0.3, theta: 0, face: 1 },
      parameter: { kind: "arc" },
      count: 32,
      tolerance: 1e-10,
      grazing: 0,
    });
  if (arc.curve === null)
    failures.push(`Borrowed-buffer arc: ${JSON.stringify(arc.diagnostics)}`);
  else {
    const before: number[] = [...arc.curve.points[0]!.point];
    part.jet(0.5, 1.25);
    host.faces[0]!.jet(0.25, 0.75);
    if (
      arc.curve.points[0]!.point.some(
        (value: number, index: number): boolean => value !== before[index],
      )
    )
      failures.push("Later producer queries overwrote a retained arc point.");
    for (const point of arc.curve.points)
      if (
        !nclose(
          Math.hypot(
            point.point[0] - 1 - 0.3 * Math.cos(point.phi),
            point.point[1],
            point.point[2] - 0.3 * Math.sin(point.phi),
          ),
          0,
          1e-9,
        )
      )
        failures.push(
          "A borrowed-buffer arc point lost its original preimage.",
        );
  }
  if (outside !== 0)
    failures.push(`${outside} unowned atlas callbacks were evaluated.`);
}

/** Same explicit Cartesian chart for bounded operator trials, with physical u=X and v=Z. */
function trialPlane(y: number): IAutoMovieSolidSurface {
  return {
    name: "horizontal-contact",
    orientation: -1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [u, y, v],
      u: [1, 0, 0],
      v: [0, 0, 1],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
}

/** Bounded graph cases expose every attempted outside producer callback. */
function boundedTrials(failures: string[]): void {
  let outside: number = 0;
  const original: Error = new Error("actual callback identity");
  const part: IAutoMovieSolidSurface = {
    name: "bounded-graph",
    domain: [0, 1],
    period: 2 * Math.PI,
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      if (u < 0 || u > 1) {
        outside++;
        throw original;
      }
      return {
        p: [u, u * u, v],
        u: [1, 2 * u, 0],
        v: [0, 0, 1],
        uu: [0, 2, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      };
    },
  };
  const law: AutoMovieSolidTraceLaw.ILaw | null = AutoMovieSolidTraceLaw.of({
    kind: "phase",
  });
  if (law === null) throw new Error("Unexpected phase-law failure.");
  const target: (
    height: number,
    guess: number,
  ) => AutoMovieSolidIntersection.IPoint | null = (
    height: number,
    guess: number,
  ): AutoMovieSolidIntersection.IPoint | null =>
    AutoMovieSolidTraceSolve.solve(
      part,
      AutoMovieSolidIntersection.atlas(trialPlane(height)),
      law,
      0,
      [guess, 0, guess, 0],
      0,
      1e-10,
    );
  const inside: AutoMovieSolidIntersection.IPoint | null = target(0.25, 0.05);
  if (inside === null || !nclose(inside.s, 0.5, 1e-8))
    failures.push(
      "A feasible Newton solve failed after an outside full trial.",
    );
  if (target(1.44, 0.5) !== null || target(0.25, -0.1) !== null)
    failures.push("An infeasible meeting was published.");
  const edge: AutoMovieSolidIntersection.IPoint | null = target(1 + 5e-11, 1);
  if (edge === null || edge.s !== 1)
    failures.push(
      "An infeasible polish displaced the accepted owned boundary point.",
    );
  const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(
    part,
    [0.5, 0.25, 0],
    [0.1, 0],
    1e-9,
  );
  if (foot === null || !nclose(foot.u, 0.5, 1e-7))
    failures.push("A feasible interior foot was lost.");
  AutoMovieSolidFoot.of(part, [2, 4, 0], [0.5, 0], 1e-9);
  AutoMovieSolidFoot.of(part, [0.5, 0.25, 0], [-0.1, 0], 1e-9);
  if (outside !== 0)
    failures.push(
      `${outside} outside callbacks were evaluated before admission.`,
    );
  const broken: IAutoMovieSolidSurface = {
    ...part,
    jet: (): never => {
      throw original;
    },
  };
  let caught: unknown;
  try {
    AutoMovieSolidFoot.of(broken, [0, 0, 0], [0.5, 0], 1e-8);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== original)
    failures.push("A genuine source callback exception lost its identity.");
}
