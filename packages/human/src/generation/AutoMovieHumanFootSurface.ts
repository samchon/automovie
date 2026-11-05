import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanFootSurfaceCourse } from "./AutoMovieHumanFootSurfaceCourse";

/**
 * Source courses for the original rigid polygon foot, sampled from the same
 * final calibrated FootConstruction law as the skin. No skin mesh is built.
 * The source fan carries the ankle around the calcaneus to the ball. Its
 * course at the existing Midfoot joint's longitudinal coordinate belongs to
 * both rigid modules; the forefoot continues on that same source fan to the
 * web ring. Rigid articulation can open this seam, as in the original display.
 * Named plantar samples identify anatomy, not guaranteed floor contacts.
 */
export namespace AutoMovieHumanFootSurface {
  /** Registered bind-body metres, or a dimensionless direction. */
  export type Vector = [number, number, number];

  /** Anatomical side, independent of a production's actor identity. */
  export type Side = "left" | "right";

  /** Canonical ankle-to-web fan, excluding independently articulated toes. */
  export type Chain = `foot.${Side}`;

  /** The three anatomical plantar samples the original renderer retains. */
  export type Landmark = "plantarHeel" | "medialBall" | "lateralBall";

  /** One actual source ring; scalar extents do not resize its points. */
  export interface ICourse {
    /** Canonical chain owning every sample. */ chain: Chain;

    /** Material station in calibration mm, not world Y. */ stationMm: number;

    /** Phase-mean source centre in registered bind metres. */ centre: Vector;

    /** Full source extent along its section's first axis, metres. */ depth: number;

    /** Full source extent along its section's second axis, metres. */ breadth: number;

    /** Actual evaluated source points, retained without projection. */ points: Vector[];

    /** Corresponding material phases in radians. */ sourcePhases: number[];

    /** Monotone cyclic polygon arclength coordinates, for joining only. */ displayCoordinates: number[];
  }

  /** Courses belonging to one existing rigid joint. */
  export interface IModule {
    /** Exact existing evaluator joint; not a new pivot. */ bone:
      | `${Side}Subtalar`
      | `${Side}Midfoot`;

    /** Direction of the ordered module courses, dimensionless. */ axis: Vector;

    /** Same number of source points in every course. */ courses: ICourse[];
  }

  /** Address of a source point that must also be an emitted polygon vertex. */
  export interface ILandmark {
    /** Existing rigid module carrying the point. */ module:
      | "hindfoot"
      | "forefoot";

    /** Zero-based course index in that module. */ course: number;

    /** Zero-based source point, giving ring-major emitted identity. */ point: number;
  }

  /** One person's source foot; its seam has one geometry owner. */
  export interface ISide {
    /** Ankle and calcaneal envelope driven by Subtalar. */ hindfoot: IModule;

    /** Continuation from the shared course, driven by Midfoot. */ forefoot: IModule;

    /** Source addresses of actual plantar anatomical samples. */ landmarks: Record<
      Landmark,
      ILandmark
    >;

    /** Sampled heights, not a weight-bearing or full-foot clearance claim. */ support: {
      /** Minimum of these source course points only, metres. */ minimumHeight: number;

      /** Bind-body Y of each named source point, metres. */ landmarkHeights: Record<
        Landmark,
        number
      >;
    };
  }

  /** Deeply frozen bilateral display data, shared by evaluations of one fixed body. */
  export interface IOutput {
    /** All coordinates and extents use physical metres. */ units: "metres";

    /** Left source foot. */ left: ISide;

    /** Right source foot. */ right: ISide;
  }

  /**
   * Sample final calibrated curves once without retaining body/input state.
   * Every principal foot station survives, with a shared source
   * course at Midfoot and eight uniform phases plus named and footprint-extremum phases.
   * Source extrema use 64 phase brackets and 40 bounded golden-section steps;
   * the landmark definition is limited to these retained source courses.
   * No point is lowered to a floor, fitted to a target or inferred from girth.
   */
  export function derive(
    body: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IOutput {
    if (!(Number.isFinite(scale) && scale > 0) || body.skeleton === undefined)
      throw new Error(
        "Foot exterior requires a calibrated skeleton and positive metre scale",
      );
    const output: IOutput = {
      units: "metres",
      left: side(body, scale, "left"),
      right: side(body, scale, "right"),
    };
    return freeze(output);
  }
}

/** Exact source chain and material address used before a display ring exists. */
interface IAddress {
  /** Source chain. */ chain: IAutoMovieHumanLoftChain;

  /** Calibration-mm station. */ station: number;
}

/** A bounded phase search result on one actual source course. */
interface IMinimum {
  /** Material phase, radians. */ phase: number;

  /** Actual source point, calibration mm. */ point: AutoMovieHumanFootSurface.Vector;

  /** Value of the anatomical site objective. */ score: number;
}

/** Prepare one foot using its own measured input, never the other side's mesh. */
function side(
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  own: AutoMovieHumanFootSurface.Side,
): AutoMovieHumanFootSurface.ISide {
  const joint: (
    name: "Foot" | "Midfoot" | "HalluxProximal" | "Toe5Proximal",
  ) => AutoMovieHumanSkeletonLaw.IBone = (
    name: "Foot" | "Midfoot" | "HalluxProximal" | "Toe5Proximal",
  ): AutoMovieHumanSkeletonLaw.IBone => {
    const found: AutoMovieHumanSkeletonLaw.IBone | undefined =
      body.skeleton!.find(
        (bone: AutoMovieHumanSkeletonLaw.IBone): boolean =>
          bone.bone === `${own}${name}`,
      );
    if (found === undefined)
      throw new Error(`Foot exterior lacks ${own}${name}`);
    return found;
  };
  const chain: (
    name: AutoMovieHumanFootSurface.Chain,
  ) => IAutoMovieHumanLoftChain = (
    name: AutoMovieHumanFootSurface.Chain,
  ): IAutoMovieHumanLoftChain => {
    const found: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (item: IAutoMovieHumanLoftChain): boolean => item.name === name,
    );
    if (found === undefined) throw new Error(`Foot exterior lacks ${name}`);
    return found;
  };
  const foot: IAutoMovieHumanLoftChain = chain(`foot.${own}`);
  const ankle: AutoMovieHumanFootSurface.Vector = joint("Foot").position;
  const ball: AutoMovieHumanFootSurface.Vector = joint("Foot").toward;
  const forward: AutoMovieHumanFootSurface.Vector = unit([
    ball[0] - ankle[0],
    0,
    ball[2] - ankle[2],
  ]);
  const along: (point: AutoMovieHumanFootSurface.Vector) => number = (
    point: AutoMovieHumanFootSurface.Vector,
  ): number => dot(sub(point, ankle), forward);
  const split: number = crossing(foot, along, along(joint("Midfoot").position));
  const hind: IAddress[] = foot.layers
    .filter(
      (layer: IAutoMovieHumanLoftChain.ILayer): boolean => layer.y > split,
    )
    .map(
      (layer: IAutoMovieHumanLoftChain.ILayer): IAddress => ({
        chain: foot,
        station: layer.y,
      }),
    )
    .reverse();
  const seam: IAddress = { chain: foot, station: split };
  hind.push(seam);
  const front: IAddress[] = [
    seam,
    ...foot.layers
      .filter(
        (layer: IAutoMovieHumanLoftChain.ILayer): boolean => layer.y < split,
      )
      .map(
        (layer: IAutoMovieHumanLoftChain.ILayer): IAddress => ({
          chain: foot,
          station: layer.y,
        }),
      )
      .reverse(),
  ];

  // The heel is plantar skin posterior to the ankle, not an ankle-tube vertex.
  let heel: { course: number; result: IMinimum } | undefined;
  for (let course: number = 0; course < hind.length; course++) {
    const address: IAddress = hind[course]!;
    const result: IMinimum = minimum(
      address,
      (point: AutoMovieHumanFootSurface.Vector): number =>
        along(point) <= 0 ? point[1] : Infinity,
    );
    if (
      Number.isFinite(result.score) &&
      (heel === undefined || result.score < heel.result.score)
    )
      heel = { course, result };
  }
  if (heel === undefined)
    throw new Error(`Canonical ${own} foot has no posterior plantar sample`);

  // The fan reaches beyond both metatarsal heads to the oblique web ring.
  // Each ball belongs to the plantar course nearest its own MTP, not an end.
  const plantar: (
    centre: AutoMovieHumanFootSurface.Vector,
  ) => { course: number; result: IMinimum } = (
    centre: AutoMovieHumanFootSurface.Vector,
  ): { course: number; result: IMinimum } => {
    let best: { course: number; result: IMinimum } | undefined;
    for (let course: number = 0; course < front.length; course++) {
      const result: IMinimum = minimum(
        front[course]!,
        (point: AutoMovieHumanFootSurface.Vector): number =>
          point[1] <= centre[1]
            ? dot(sub(point, centre), sub(point, centre))
            : Infinity,
      );
      if (Number.isFinite(result.score) &&
          (best === undefined || result.score < best.result.score))
        best = { course, result };
    }
    if (best === undefined)
      throw new Error(`Canonical ${own} foot lacks plantar metatarsal samples`);
    return best;
  };
  const medial: { course: number; result: IMinimum } = plantar(joint("HalluxProximal").position);
  const lateral: { course: number; result: IMinimum } = plantar(joint("Toe5Proximal").position);
  const heelResult: { course: number; result: IMinimum } = heel;

  // Retain the canonical posterior/lateral footprint extrema as real vertices;
  // coarse phase spacing must not silently shorten or narrow the source foot.
  const extrema: IMinimum[] = [];
  for (const objective of [
    along,
    (point: AutoMovieHumanFootSurface.Vector): number => point[2],
    (point: AutoMovieHumanFootSurface.Vector): number => -point[2],
  ]) {
    let best: IMinimum | undefined;
    for (const address of [...hind, ...front]) {
      const candidate: IMinimum = minimum(address, objective);
      if (best === undefined || candidate.score < best.score) best = candidate;
    }
    extrema.push(best!);
  }
  const phases: number[] = [
    ...Array.from(
      { length: 8 },
      (_: unknown, index: number): number => (Math.PI * index) / 4,
    ),
    heelResult.result.phase,
    medial.result.phase,
    lateral.result.phase,
    ...extrema.map((item: IMinimum): number => item.phase),
  ]
    .map(
      (phase: number): number =>
        ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    )
    .sort((a: number, b: number): number => a - b)
    .filter(
      (phase: number, index: number, all: number[]): boolean =>
        index === 0 || phase - all[index - 1]! > 1e-12,
    );
  const indexOf: (phase: number) => number = (phase: number): number => {
    const normalized: number =
      ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const found: number = phases.findIndex(
      (item: number): boolean => Math.abs(item - normalized) <= 1e-12,
    );
    if (found < 0)
      throw new Error("Foot landmark phase is absent from its emitted course");
    return found;
  };
  const hindCourses: AutoMovieHumanFootSurface.ICourse[] = hind.map(
    (address: IAddress): AutoMovieHumanFootSurface.ICourse =>
      AutoMovieHumanFootSurfaceCourse(address.chain, address.station, phases, scale),
  );
  const frontCourses: AutoMovieHumanFootSurface.ICourse[] = front.map(
    (address: IAddress): AutoMovieHumanFootSurface.ICourse =>
      AutoMovieHumanFootSurfaceCourse(address.chain, address.station, phases, scale),
  );
  frontCourses[0] = structuredClone(hindCourses[hindCourses.length - 1]!);
  const landmarks: Record<
    AutoMovieHumanFootSurface.Landmark,
    AutoMovieHumanFootSurface.ILandmark
  > = {
    plantarHeel: {
      module: "hindfoot",
      course: heelResult.course,
      point: indexOf(heelResult.result.phase),
    },
    medialBall: {
      module: "forefoot",
      course: medial.course,
      point: indexOf(medial.result.phase),
    },
    lateralBall: {
      module: "forefoot",
      course: lateral.course,
      point: indexOf(lateral.result.phase),
    },
  };
  const modules: Record<
    "hindfoot" | "forefoot",
    AutoMovieHumanFootSurface.IModule
  > = {
    hindfoot: {
      bone: `${own}Subtalar`,
      axis: unit(sub(hindCourses.at(-1)!.centre, hindCourses[0]!.centre)),
      courses: hindCourses,
    },
    forefoot: {
      bone: `${own}Midfoot`,
      axis: unit(sub(frontCourses.at(-1)!.centre, frontCourses[0]!.centre)),
      courses: frontCourses,
    },
  };
  const heights: Record<AutoMovieHumanFootSurface.Landmark, number> = {
    plantarHeel: 0,
    medialBall: 0,
    lateralBall: 0,
  };
  for (const name of ["plantarHeel", "medialBall", "lateralBall"] as const) {
    const address: AutoMovieHumanFootSurface.ILandmark = landmarks[name];
    heights[name] =
      modules[address.module].courses[address.course]!.points[
        address.point
      ]![1];
  }
  return {
    ...modules,
    landmarks,
    support: {
      minimumHeight: Math.min(
        ...[...hindCourses, ...frontCourses].flatMap(
          (item: AutoMovieHumanFootSurface.ICourse): number[] =>
            item.points.map(
              (point: AutoMovieHumanFootSurface.Vector): number => point[1],
            ),
        ),
      ),
      landmarkHeights: heights,
    },
  };
}

/** First source-axis crossing from the ball toward the ankle; no surface is moved. */
function crossing(
  chain: IAutoMovieHumanLoftChain,
  along: (point: AutoMovieHumanFootSurface.Vector) => number,
  target: number,
): number {
  for (let index: number = 0; index + 1 < chain.layers.length; index++) {
    let low: number = chain.layers[index]!.y;
    let high: number = chain.layers[index + 1]!.y;
    const left: number = along(Loft.axis(chain, low)) - target;
    const right: number = along(Loft.axis(chain, high)) - target;
    if (left === 0) return low;
    if (left * right > 0) continue;
    for (let step: number = 0; step < 48; step++) {
      const middle: number = (low + high) / 2;
      if ((along(Loft.axis(chain, middle)) - target) * left > 0) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  throw new Error("Canonical foot axis does not cross its own Midfoot joint");
}

/** Sample a source objective globally in phase, then refine its best bracket. */
function minimum(
  address: IAddress,
  score: (point: AutoMovieHumanFootSurface.Vector) => number,
): IMinimum {
  const sample: (phase: number) => AutoMovieHumanFootSurface.Vector =
    Loft.sampler(address.chain, address.station);
  const at: (phase: number) => IMinimum = (phase: number): IMinimum => {
    const point: AutoMovieHumanFootSurface.Vector = sample(phase);
    return { phase, point, score: score(point) };
  };
  const pitch: number = (2 * Math.PI) / 64;
  let best: IMinimum = at(0);
  for (let index: number = 1; index < 64; index++) {
    const candidate: IMinimum = at(index * pitch);
    if (candidate.score < best.score) best = candidate;
  }
  let low: number = best.phase - pitch;
  let high: number = best.phase + pitch;
  for (let step: number = 0; step < 40; step++) {
    const a: IMinimum = at(low + ((high - low) * (3 - Math.sqrt(5))) / 2);
    const b: IMinimum = at(low + ((high - low) * (Math.sqrt(5) - 1)) / 2);
    if (a.score < best.score) best = a;
    if (b.score < best.score) best = b;
    if (a.score < b.score) high = b.phase;
    else low = a.phase;
  }
  return best;
}

/** Registered Euclidean vector difference. */
function sub(
  a: AutoMovieHumanFootSurface.Vector,
  b: AutoMovieHumanFootSurface.Vector,
): AutoMovieHumanFootSurface.Vector {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Registered Euclidean dot product. */
function dot(
  a: AutoMovieHumanFootSurface.Vector,
  b: AutoMovieHumanFootSurface.Vector,
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Refuse a collapsed anatomical axis rather than inventing a direction. */
function unit(
  vector: AutoMovieHumanFootSurface.Vector,
): AutoMovieHumanFootSurface.Vector {
  const length: number = Math.hypot(...vector);
  if (!(length > 1e-12))
    throw new Error("Foot exterior requires a nondegenerate anatomical axis");
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

/** Freeze the small source descriptor once so every FK result may borrow it safely. */
function freeze<T extends object>(value: T): T {
  const children: unknown[] = Object.values(value);
  for (const child of children)
    if (child !== null && typeof child === "object") freeze(child);
  Object.freeze(value);
  return value;
}
