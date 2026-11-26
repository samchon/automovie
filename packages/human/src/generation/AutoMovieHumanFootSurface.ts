import { AutoMovieLoftChain as Loft } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanFootCourse,
  IAutoMovieHumanFootSurface,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanFootCourse } from "./AutoMovieHumanFootCourse";

/**
 * Source courses for the original rigid polygon foot, sampled from the same
 * published construction curves as the skin. No skin mesh is built. The foot's
 * material stations run from the heel toward the toes. Its course at the
 * existing Midfoot joint's longitudinal coordinate belongs to both rigid
 * modules; the forefoot continues on that same source chain. Rigid articulation
 * can open this seam, as in the original display. Named plantar samples
 * identify anatomy, not guaranteed floor contacts.
 */
export namespace AutoMovieHumanFootSurface {
  /**
   * Sample final calibrated curves once without retaining body/input state.
   * Every principal foot station survives, with a shared source course at
   * Midfoot and eight uniform phases plus named and footprint-extremum phases.
   * Source extrema use 64 phase brackets and 40 bounded golden-section steps;
   * the landmark definition is limited to these retained source courses. No
   * point is lowered to a floor, fitted to a target or inferred from girth.
   *
   * @evidence contracts/common.md#principled-implementation Reads the published heel-to-toe foot curve and skeleton; source stations and phases survive the one physical-unit conversion.
   * @evidence contracts/common.md#clear-and-simple-design Partitions one source chain at the existing Midfoot joint; bounded sampling belongs to FootCourse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No old forefoot assembly, projected point, synthetic floor contact or skin readback defines construction.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes sampled support from a whole-foot clearance claim and states retained source identity.
   * @evidence contracts/performance.md#efficient-algorithms Uses bounded phase queries over source courses and emits small rings rather than a dense skin.
   * @evidence contracts/performance.md#reuse-equivalent-work One frozen bilateral descriptor is shared by the prepared skeleton's evaluations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only frozen samples and addresses, without retaining the calibration or query closures.
   */
  export function derive(
    body: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IAutoMovieHumanFootSurface.IOutput {
    if (!(Number.isFinite(scale) && scale > 0) || body.skeleton === undefined)
      throw new Error(
        "Foot exterior requires a calibrated skeleton and positive metre scale",
      );
    const output: IAutoMovieHumanFootSurface.IOutput = {
      units: "metres",
      left: side(body, scale, "left"),
      right: side(body, scale, "right"),
    };
    return freeze(output);
  }
}

/** Exact source chain and material address used before a display ring exists. */
type IAddress = IAutoMovieHumanFootCourse.IAddress;

/** A bounded phase search result on one actual source course. */
type IMinimum = IAutoMovieHumanFootCourse.IMinimum;

/** The display reader shares bounded searches and source ring evaluation. */
const { minimum, course }: typeof AutoMovieHumanFootCourse =
  AutoMovieHumanFootCourse;

/**
 * Prepare rising source stations; each ball is the closest retained plantar
 * sample below its own MTP.
 */
function side(
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  own: AutoMovieHumanSide,
): IAutoMovieHumanFootSurface.ISide {
  function joint(
    name: "Foot" | "Midfoot" | "HalluxProximal" | "Toe5Proximal",
  ): IAutoMovieHumanCalibrationBone {
    const found: IAutoMovieHumanCalibrationBone | undefined =
      body.skeleton!.find(
        (bone: IAutoMovieHumanCalibrationBone): boolean =>
          bone.bone === `${own}${name}`,
      );
    if (found === undefined)
      throw new Error(`Foot exterior lacks ${own}${name}`);
    return found;
  }
  function chain(name: IAutoMovieHumanFootSurface.Chain): IAutoMovieLoftChain {
    const found: IAutoMovieLoftChain | undefined = body.chains.find(
      (item: IAutoMovieLoftChain): boolean => item.name === name,
    );
    if (found === undefined) throw new Error(`Foot exterior lacks ${name}`);
    return found;
  }
  const foot: IAutoMovieLoftChain = chain(`foot.${own}`);
  const ankle: AutoMovieVector3Tuple = joint("Foot").position;
  const ball: AutoMovieVector3Tuple = joint("Foot").toward;
  const forward: AutoMovieVector3Tuple = unit([
    ball[0] - ankle[0],
    0,
    ball[2] - ankle[2],
  ]);
  function along(point: AutoMovieVector3Tuple): number {
    return dot(sub(point, ankle), forward);
  }
  const split: number = crossing(foot, along, along(joint("Midfoot").position));
  const hind: IAddress[] = foot.layers
    .filter((layer: IAutoMovieLoftChain.ILayer): boolean => layer.y < split)
    .map(
      (layer: IAutoMovieLoftChain.ILayer): IAddress => ({
        chain: foot,
        station: layer.y,
      }),
    );
  const seam: IAddress = { chain: foot, station: split };
  hind.push(seam);
  const front: IAddress[] = [
    seam,
    ...foot.layers
      .filter((layer: IAutoMovieLoftChain.ILayer): boolean => layer.y > split)
      .map(
        (layer: IAutoMovieLoftChain.ILayer): IAddress => ({
          chain: foot,
          station: layer.y,
        }),
      ),
  ];

  // The heel is plantar skin posterior to the ankle, not an ankle-tube vertex.
  let heel: { course: number; result: IMinimum } | undefined;
  for (let course: number = 0; course < hind.length; course++) {
    const address: IAddress = hind[course]!;
    const result: IMinimum = minimum(
      address,
      (point: AutoMovieVector3Tuple): number =>
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
  // A ball belongs to the nearest retained plantar source point beneath its
  // own MTP, not to an obsolete forefoot chain ordinal or reversed end ring.
  const plantar = (
    centre: AutoMovieVector3Tuple,
  ): { course: number; result: IMinimum } => {
    let best: { course: number; result: IMinimum } | undefined;
    for (let index: number = 0; index < front.length; index++) {
      const result: IMinimum = minimum(
        front[index]!,
        (point: AutoMovieVector3Tuple): number =>
          point[1] <= centre[1]
            ? dot(sub(point, centre), sub(point, centre))
            : Infinity,
      );
      if (best === undefined || result.score < best.result.score)
        best = { course: index, result };
    }
    if (best === undefined)
      throw new Error(`Canonical ${own} foot has no forefoot courses`);
    return best;
  };
  const medialPoint: { course: number; result: IMinimum } = plantar(
    joint("HalluxProximal").position,
  );
  const lateralPoint: { course: number; result: IMinimum } = plantar(
    joint("Toe5Proximal").position,
  );
  const medialCourse: number = medialPoint.course;
  const lateralCourse: number = lateralPoint.course;
  const medial: IMinimum = medialPoint.result;
  const lateral: IMinimum = lateralPoint.result;
  if (!Number.isFinite(medial.score) || !Number.isFinite(lateral.score))
    throw new Error(`Canonical ${own} foot lacks plantar metatarsal samples`);
  const heelResult: { course: number; result: IMinimum } = heel;

  // Retain the canonical posterior/lateral footprint extrema as real vertices;
  // coarse phase spacing must not silently shorten or narrow the source foot.
  const extrema: IMinimum[] = [];
  for (const objective of [
    along,
    (point: AutoMovieVector3Tuple): number => point[2],
    (point: AutoMovieVector3Tuple): number => -point[2],
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
    medial.phase,
    lateral.phase,
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
  function indexOf(phase: number): number {
    const normalized: number =
      ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const found: number = phases.findIndex(
      (item: number): boolean => Math.abs(item - normalized) <= 1e-12,
    );
    if (found < 0)
      throw new Error("Foot landmark phase is absent from its emitted course");
    return found;
  }
  const hindCourses: IAutoMovieHumanFootSurface.ICourse[] = hind.map(
    (address: IAddress): IAutoMovieHumanFootSurface.ICourse =>
      course(address, phases, scale),
  );
  const frontCourses: IAutoMovieHumanFootSurface.ICourse[] = front.map(
    (address: IAddress): IAutoMovieHumanFootSurface.ICourse =>
      course(address, phases, scale),
  );
  frontCourses[0] = structuredClone(hindCourses[hindCourses.length - 1]!);
  const landmarks: Record<
    IAutoMovieHumanFootSurface.Landmark,
    IAutoMovieHumanFootSurface.ILandmark
  > = {
    plantarHeel: {
      module: "hindfoot",
      course: heelResult.course,
      point: indexOf(heelResult.result.phase),
    },
    medialBall: {
      module: "forefoot",
      course: medialCourse,
      point: indexOf(medial.phase),
    },
    lateralBall: {
      module: "forefoot",
      course: lateralCourse,
      point: indexOf(lateral.phase),
    },
  };
  const modules: Record<
    "hindfoot" | "forefoot",
    IAutoMovieHumanFootSurface.IModule
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
  const heights: Record<IAutoMovieHumanFootSurface.Landmark, number> = {
    plantarHeel: 0,
    medialBall: 0,
    lateralBall: 0,
  };
  for (const name of ["plantarHeel", "medialBall", "lateralBall"] as const) {
    const address: IAutoMovieHumanFootSurface.ILandmark = landmarks[name];
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
          (item: IAutoMovieHumanFootSurface.ICourse): number[] =>
            item.points.map((point: AutoMovieVector3Tuple): number => point[1]),
        ),
      ),
      landmarkHeights: heights,
    },
  };
}

/** First source-axis crossing from heel toward toes; no surface is moved. */
function crossing(
  chain: IAutoMovieLoftChain,
  along: (point: AutoMovieVector3Tuple) => number,
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

/** Registered Euclidean vector difference. */
function sub(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Registered Euclidean dot product. */
function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Refuse a collapsed anatomical axis rather than inventing a direction. */
function unit(vector: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
  const length: number = Math.hypot(...vector);
  if (!(length > 1e-12))
    throw new Error("Foot exterior requires a nondegenerate anatomical axis");
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

/**
 * Freeze the small source descriptor once so every FK result may borrow it
 * safely.
 */
function freeze<T extends object>(value: T): T {
  const children: unknown[] = Object.values(value);
  for (const child of children)
    if (child !== null && typeof child === "object") freeze(child);
  Object.freeze(value);
  return value;
}
