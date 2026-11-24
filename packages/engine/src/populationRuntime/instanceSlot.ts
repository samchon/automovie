import type {
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieInstanceSetLayout,
  IAutoMovieInstanceSetPlacement,
  IAutoMovieInstanceSlot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMovieWorldRoute,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { seededValue } from "../math/seededValue";
import { surfaceHeightAt } from "../space/surfaceHeightAt";
import { selectInstancePrototype } from "./selectInstancePrototype";

/**
 * Regenerate one member from the compact instance set's deterministic laws.
 *
 * A grid, lattice, scatter or explicit member is laid out in the set's local
 * frame and turned by the set's heading about its anchor. A route member takes
 * its ground-plan point from the route snapshot, spaced by arc length and
 * pushed sideways by its seeded jitter, and stands at the anchor's height. A
 * scatter disk with a ground rule reads the placed world's height at each slot
 * and adds the authored anchor Y offset. Scale, palette, traits, prototype,
 * rotation and visibility are drawn from the set seed and the slot, each under
 * its own salt, and an explicit block overrides what it states. A set that
 * declares no prototype table, no lattice or explicit layout, no per-axis
 * scale, no rotation range and no visibility probability keeps its original
 * output, which names no prototype.
 *
 * The compiled instance-set kernel measures chunk bounds through this function,
 * the shot-source oracle answers `instanceSlot` through it, and a subject
 * description and the viewer regenerate members through it, so a member asked
 * for while a shot compiles, described in a review, or drawn is the member the
 * compiled set regenerates. The input is the compiled shape for that reason:
 * reading a compiled set as a design once counted its default prototype twice.
 *
 * It throws for a slot outside the set, a missing or mismatched route snapshot,
 * a route without finite positive length, an explicit block missing the slot,
 * an explicit prototype no choice names, and a non-finite derived value or an
 * empty palette. Compilation regenerates every slot through here; consumers
 * preserving the compiled laws and route snapshot reproduce that admitted
 * state. Route placement uses temporary storage proportional to waypoint
 * count.
 */
export const instanceSlot: (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
) => IAutoMovieInstanceSlot = (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
): IAutoMovieInstanceSlot => {
  if (slot < 0 || slot >= instanceSet.count)
    throw new RangeError(
      `Instance set "${instanceSet.id}" slot ${slot} is outside 0..${instanceSet.count - 1}.`,
    );
  const point: { x: number; y: number; z: number } = localInstancePoint(
    instanceSet,
    slot,
  );
  const radians: number = (instanceSet.facingDeg * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  const scaleSample: number = seededValue(instanceSet.seed, slot, 0x7363616c);
  const scale: number = stableInterpolate(
    instanceSet.variation.scale.min,
    instanceSet.variation.scale.max,
    scaleSample,
  );
  const paletteIndex: number = Math.min(
    instanceSet.variation.palette.length - 1,
    Math.floor(
      seededValue(instanceSet.seed, slot, 0x70616c65) *
        instanceSet.variation.palette.length,
    ),
  );
  const position: { x: number; y: number; z: number } =
    instanceSet.layout.kind === "along-route"
      ? {
          x: point.x,
          y: instanceSet.anchor.y,
          z: point.z,
        }
      : {
          x: instanceSet.anchor.x + point.x * cosine + point.z * sine,
          y: instanceSet.anchor.y + point.y,
          z: instanceSet.anchor.z - point.x * sine + point.z * cosine,
        };
  if (
    instanceSet.layout.kind === "scatter" &&
    instanceSet.layout.ground !== undefined
  )
    position.y += surfaceHeightAt(
      { height: instanceSet.layout.ground },
      position.x,
      position.z,
    );
  const traits: { [k: string]: number } = Object.fromEntries(
    instanceSet.variation.traits.map(
      (
        trait: { name: string; min: number; max: number },
        index: number,
      ): [string, number] => [
        trait.name,
        stableInterpolate(
          trait.min,
          trait.max,
          seededValue(instanceSet.seed, slot, index, 0x74726169),
        ),
      ],
    ),
  );
  const explicit: IAutoMovieExplicitInstanceTransform | undefined =
    instanceSet.layout.kind === "explicit"
      ? instanceSet.layout.transforms[slot]
      : undefined;
  const palette: string =
    explicit?.palette ?? instanceSet.variation.palette[paletteIndex];
  if (palette === undefined)
    throw new RangeError(
      `Instance set "${instanceSet.id}" slot ${slot} derived non-finite variation or an empty palette.`,
    );
  const legacy: boolean =
    instanceSet.prototypes === undefined &&
    instanceSet.layout.kind !== "lattice" &&
    instanceSet.layout.kind !== "explicit" &&
    instanceSet.variation.scale3 === undefined &&
    instanceSet.variation.rotationDeg === undefined &&
    instanceSet.variation.visibleProbability === undefined;
  const selected: Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  > = selectInstancePrototype(instanceSet, slot, explicit?.prototype);
  const base: {
    slot: number;
    node: string;
    model: string;
    position: { x: number; y: number; z: number };
    facingDeg: number;
    scale: number;
    palette: string;
    traits: { [x: string]: number };
  } = {
    slot,
    node:
      explicit === undefined
        ? `instance:${instanceSet.id}:slot:${String(slot).padStart(6, "0")}`
        : `instance:${instanceSet.id}:${explicit.id}`,
    model: selected.model,
    position,
    facingDeg: instanceSet.facingDeg,
    scale,
    palette,
    traits: { ...traits, ...explicit?.traits },
  };
  if (legacy) return base;
  const scale3: IAutoMovieVector3 =
    explicit?.scale ??
    (instanceSet.variation.scale3 === undefined
      ? { x: scale, y: scale, z: scale }
      : {
          x: stableInterpolate(
            instanceSet.variation.scale3.min.x,
            instanceSet.variation.scale3.max.x,
            seededValue(instanceSet.seed, slot, 0x73637878),
          ),
          y: stableInterpolate(
            instanceSet.variation.scale3.min.y,
            instanceSet.variation.scale3.max.y,
            seededValue(instanceSet.seed, slot, 0x73637979),
          ),
          z: stableInterpolate(
            instanceSet.variation.scale3.min.z,
            instanceSet.variation.scale3.max.z,
            seededValue(instanceSet.seed, slot, 0x73637a7a),
          ),
        });
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, instanceSet.facingDeg),
      explicit?.rotation ?? seededInstanceRotation(instanceSet, slot),
    ),
  );
  return {
    ...base,
    prototype: selected.id,
    rotation,
    scale3,
    visible:
      explicit?.visible ??
      (instanceSet.variation.visibleProbability === undefined ||
        seededValue(instanceSet.seed, slot, 0x76697369) <
          instanceSet.variation.visibleProbability),
  };
};

/** Seeded XYZ Euler offset applied after the set heading, or identity. */
const seededInstanceRotation: (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
) => IAutoMovieQuaternion = (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
): IAutoMovieQuaternion => {
  const ranges:
    | {
        x: { min: number; max: number };
        y: { min: number; max: number };
        z: { min: number; max: number };
      }
    | undefined = instanceSet.variation.rotationDeg;
  return ranges === undefined
    ? Quaternion.identity()
    : Quaternion.fromEuler({
        x: stableInterpolate(
          ranges.x.min,
          ranges.x.max,
          seededValue(instanceSet.seed, slot, 0x726f7478),
        ),
        y: stableInterpolate(
          ranges.y.min,
          ranges.y.max,
          seededValue(instanceSet.seed, slot, 0x726f7479),
        ),
        z: stableInterpolate(
          ranges.z.min,
          ranges.z.max,
          seededValue(instanceSet.seed, slot, 0x726f747a),
        ),
        order: "XYZ",
      });
};

/**
 * One member's point before the set heading is applied.
 *
 * Local layouts answer in the set frame. A route answers in the world ground
 * plan, because the route snapshot is already there, so its heading and anchor
 * translation are skipped by the caller.
 */
const localInstancePoint: (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
) => { x: number; y: number; z: number } = (
  instanceSet: IAutoMovieInstanceSetPlacement,
  slot: number,
): { x: number; y: number; z: number } => {
  const layout: IAutoMovieInstanceSetLayout = instanceSet.layout;
  if (layout.kind === "grid") {
    const row: number = Math.floor(slot / layout.columns);
    const column: number = slot % layout.columns;
    return {
      x: (column - (layout.columns - 1) / 2) * layout.spacing.x,
      y: 0,
      z: row * layout.spacing.z,
    };
  }
  if (layout.kind === "scatter") {
    const radius: number =
      Math.sqrt(seededValue(instanceSet.seed, slot, 0x72616469)) *
      layout.radius;
    const angle: number =
      seededValue(instanceSet.seed, slot, 0x616e676c) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    };
  }
  if (layout.kind === "lattice") {
    const perLayer: number = layout.rows * layout.columns;
    const layer: number = Math.floor(slot / perLayer);
    const within: number = slot % perLayer;
    const row: number = Math.floor(within / layout.columns);
    const column: number = within % layout.columns;
    return {
      x: (column - (layout.columns - 1) / 2) * layout.spacing.x,
      y: layer * layout.spacing.y,
      z: row * layout.spacing.z,
    };
  }
  if (layout.kind === "explicit") {
    const transform: IAutoMovieExplicitInstanceTransform =
      layout.transforms[slot];
    if (transform === undefined)
      throw new Error(
        `Instance set "${instanceSet.id}" slot ${slot} has no explicit transform.`,
      );
    return transform.translation;
  }
  const route: IAutoMovieWorldRoute | null = instanceSet.route;
  if (route === null || route.id !== layout.route || route.waypoints.length < 2)
    throw new Error(
      `Instance set "${instanceSet.id}" references unavailable route "${layout.route}".`,
    );
  const segments: {
    left: { x: number; z: number };
    right: { x: number; z: number };
    length: number;
  }[] = route.waypoints.slice(1).map(
    (
      right: { x: number; z: number },
      index: number,
    ): {
      left: { x: number; z: number };
      right: { x: number; z: number };
      length: number;
    } => {
      const left: { x: number; z: number } = route.waypoints[index]!;
      return {
        left,
        right,
        length: Math.hypot(right.x - left.x, right.z - left.z),
      };
    },
  );
  const total: number = segments.reduce(
    (
      sum: number,
      segment: {
        left: { x: number; z: number };
        right: { x: number; z: number };
        length: number;
      },
    ): number => sum + segment.length,
    0,
  );
  if (total <= 0)
    throw new RangeError(
      `Instance set "${instanceSet.id}" route "${layout.route}" must have finite non-zero length.`,
    );
  let remaining: number = ((slot + 0.5) / instanceSet.count) * total;
  let segment: {
    left: { x: number; z: number };
    right: { x: number; z: number };
    length: number;
  } = segments.at(-1)!;
  for (const candidate of segments.slice(0, -1)) {
    if (remaining <= candidate.length) {
      segment = candidate;
      break;
    }
    remaining -= candidate.length;
  }
  const ratio: number = Math.min(1, remaining / segment.length);
  const tangent: { x: number; z: number } = {
    x: segment.right.x - segment.left.x,
    z: segment.right.z - segment.left.z,
  };
  const tangentLength: number = Math.hypot(tangent.x, tangent.z);
  const jitter: number =
    (seededValue(instanceSet.seed, slot, 0x6a697474) * 2 - 1) *
    layout.lateralJitter;
  return {
    x:
      segment.left.x + tangent.x * ratio - (tangent.z / tangentLength) * jitter,
    y: 0,
    z:
      segment.left.z + tangent.z * ratio + (tangent.x / tangentLength) * jitter,
  };
};

/** Interpolate one seeded sample between an authored range's ends. */
const stableInterpolate: (from: number, to: number, ratio: number) => number = (
  from: number,
  to: number,
  ratio: number,
): number => from * (1 - ratio) + to * ratio;
