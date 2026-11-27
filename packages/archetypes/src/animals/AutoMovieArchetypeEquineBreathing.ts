import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { QuadrupedCarriage } from "./quadruped/QuadrupedCarriage";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * An equid's breathing, a layer over any of its rides: the barrel's displayed
 * girth swells and shrinks with each breath and the nostrils flare, the rider's
 * and harness's contacts riding the moving barrel.
 *
 * At the canter and gallop each breath is locked 1:1 to the stride (Lafortuna
 * et al. 1996, J Exp Biol 166:19): the girth is fullest at the left fore's
 * landing, as expiration runs through the forelimbs' stance, so the breath's
 * phase is that hoof's place between its landings, read from the ride's own
 * instants. At other gaits and at a halt the breath runs on its own clock at
 * the rest rate (MSD Veterinary Manual), raised after an authored effort: the
 * rate and the depth start at the effort's peak and fall monotonically on a
 * minimum-jerk curve to the rest values over the effort's recovery time, the
 * clock being the closed-form integral of that rate. The girth swing is a
 * radial growth of the barrel capsule; every part and contact the barrel
 * carries (saddle, girth, harness, rider contacts) moves out with its surface
 * by the same growth, so none separates from it or sinks into it. The nostrils,
 * where the head has them, widen on each breath in proportion to the rate. The
 * depths and the flare are authored.
 */
export namespace AutoMovieArchetypeEquineBreathing {
  /** An effort the horse recovers from. */
  export interface IEffort {
    /** Film second the recovery starts, when the effort ends. */
    from: number;

    /** Seconds the breathing takes to fall back to rest. */
    seconds: number;

    /**
     * The breathing rate at the recovery's start, breaths per minute, at least
     * the rest rate.
     */
    rate: number;

    /**
     * The girth swing at the recovery's start, metres of radius, at least the
     * rest depth.
     */
    depth: number;
  }

  /** What the layer is told about the ride. */
  export interface IOptions {
    /** The gait the ride starts in. */
    gait: AutoMovieArchetypeQuadrupedGait.Gait;

    /** The efforts recovered from, not overlapping; none breathes at rest. */
    efforts?: readonly IEffort[];
  }

  /** One second's breath. */
  export interface IBreath {
    /** The cycle's phase in [0, 1), zero at the girth's fullest. */
    phase: number;

    /** Breaths per minute. */
    rate: number;

    /** The girth swing, metres of radius. */
    depth: number;

    /** Whether the breath is locked to the stride. */
    locked: boolean;
  }

  /** The breathing ride. */
  export interface IRide<
    Id extends string,
    D extends string,
  > extends AutoMovieArchetypeRide.IRide<Id, D> {
    /** The breath at a film second. */
    breath(seconds: number): IBreath;
  }

  /**
   * Layer breathing over an equid's ride.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Any ride of it.
   * @param options The ride's first gait and the efforts.
   * @returns The breathing ride.
   * @throws {AutoMovieArchetypeRefusal} For an effort whose window is not
   *   finite and positive, whose rate or depth is below rest, or that overlaps
   *   another.
   */
  export function layer<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    options: IOptions,
  ): IRide<Id, D> {
    const efforts: readonly IEffort[] = admit(
      animal.archetype,
      options.efforts ?? [],
    );
    const carriers: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, AutoMovieArchetypeQuadruped.species(animal));
    const landings: readonly number[] = ride.instants
      .filter((instant: Instant): boolean => instant.label === "leftForeOn")
      .map((instant: Instant): number => instant.seconds);
    const changes: readonly Instant[] = ride.instants.filter(
      (instant: Instant): boolean => instant.label.startsWith("gait:"),
    );

    const breath = (seconds: number): IBreath => {
      let gait: string = options.gait;
      for (const change of changes)
        if (change.seconds <= seconds) gait = change.label.split("-")[1]!;
      const previous: number | undefined = [...landings]
        .reverse()
        .find((time: number): boolean => time <= seconds);
      const next: number | undefined = landings.find(
        (time: number): boolean => time > seconds,
      );
      const free: IBreath = clock(efforts, seconds);
      if (
        LOCKED.has(gait) &&
        previous !== undefined &&
        next !== undefined
      )
        return {
          phase: (seconds - previous) / (next - previous),
          rate: 60 / (next - previous),
          depth: Math.max(STRIDE_DEPTH, free.depth),
          locked: true,
        };
      return free;
    };

    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      const base: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const now: IBreath = breath(seconds);
      const full: number = (1 + Math.cos(2 * Math.PI * now.phase)) / 2;
      const growth: number = now.depth * full;
      const flare: number =
        FLARE.widen *
        full *
        Math.min(
          1,
          Math.max(0, (now.rate - REST_RATE) / (FLARE.rate - REST_RATE)),
        );
      const trunk: IAutoMovieModelPart | undefined = base.archetype.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "trunk",
      );
      if (trunk?.transform === undefined || trunk.transform === null)
        return base;
      const centre: IAutoMovieVector3 = trunk.transform.translation;
      const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        trunk.transform.rotation,
        { x: 0, y: 1, z: 0 },
      );
      const outward = (frame: IAutoMovieTransform): IAutoMovieTransform => {
        const from: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          frame.translation,
          centre,
        );
        const radial: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
          from,
          axis,
          -AutoMovieEngineVector3.dot(from, axis),
        );
        const length: number = AutoMovieEngineVector3.length(radial);
        return length < 1e-9
          ? AutoMovieArchetypeFrame.copy(frame)
          : {
              ...frame,
              translation: AutoMovieEngineVector3.addScaled(
                frame.translation,
                radial,
                growth / length,
              ),
            };
      };
      const parts: IAutoMovieModelPart[] = base.archetype.parts.map(
        (part: IAutoMovieModelPart): IAutoMovieModelPart => {
          if (part.id === "trunk") return widened(part, growth, 0);
          if (NOSTRILS.has(part.id)) return widened(part, 0, flare);
          if (
            carriers.parts[part.id] === "trunk" &&
            part.transform !== undefined &&
            part.transform !== null
          )
            return { ...part, transform: outward(part.transform) };
          return part;
        },
      );
      const frames: Map<string, IAutoMovieTransform> = new Map(
        base.archetype.affordances.map(
          (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
            contact.id,
            carriers.contacts[contact.id] === "trunk"
              ? outward(contact.frame)
              : AutoMovieArchetypeFrame.copy(contact.frame),
          ],
        ),
      );
      return {
        ...base,
        archetype: base.archetype.reposed(parts, frames),
      };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      breath,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /*
   * The free clock's breath: the rest rate raised by the active recovery, its
   * phase the closed-form integral of the rate.
   */
  function clock(efforts: readonly IEffort[], seconds: number): IBreath {
    let cycles: number = (REST_RATE * seconds) / 60;
    let rate: number = REST_RATE;
    let depth: number = REST_DEPTH;
    for (const effort of efforts) {
      if (seconds < effort.from) continue;
      const u: number = Math.min(1, (seconds - effort.from) / effort.seconds);

      // The integral of 1 - s(u), s the minimum-jerk share 10u³ - 15u⁴ + 6u⁵, is u - (2.5u⁴ - 3u⁵ + u⁶).
      const integral: number = u - (2.5 * u ** 4 - 3 * u ** 5 + u ** 6);
      cycles += ((effort.rate - REST_RATE) * effort.seconds * integral) / 60;
      if (u < 1) {
        const left: number = 1 - AutoMovieEngineMotionSampling.minimumJerkShare(u);
        rate = REST_RATE + (effort.rate - REST_RATE) * left;
        depth = REST_DEPTH + (effort.depth - REST_DEPTH) * left;
      }
    }
    return { phase: cycles - Math.floor(cycles), rate, depth, locked: false };
  }

  /*
   * A part with its capsule or cylinder radius grown by a length and by a
   * fraction, or a box's cross-section likewise.
   */
  function widened(
    part: IAutoMovieModelPart,
    by: number,
    fraction: number,
  ): IAutoMovieModelPart {
    if (part.geometry.type !== "primitive" || (by === 0 && fraction === 0))
      return part;
    const shape: IAutoMoviePrimitiveShape = part.geometry.shape;
    if (
      shape.type === "capsule" ||
      shape.type === "cylinder" ||
      shape.type === "sphere"
    )
      return {
        ...part,
        geometry: {
          ...part.geometry,
          shape: { ...shape, radius: shape.radius * (1 + fraction) + by },
        },
      };
    return part;
  }

  /*
   * Admit the efforts.
   */
  function admit(
    archetype: string,
    efforts: readonly IEffort[],
  ): readonly IEffort[] {
    const sorted: IEffort[] = [...efforts].sort(
      (p: IEffort, q: IEffort): number => p.from - q.from,
    );
    let last: number = -Infinity;
    for (const effort of sorted) {
      const fault: string | null = !(effort.seconds > 0)
        ? "a recovery needs a finite positive window"
        : !(effort.rate >= REST_RATE && effort.depth >= REST_DEPTH)
          ? `a recovery starts at or above the rest rate ${REST_RATE} per minute and depth ${REST_DEPTH} m`
          : effort.from < last
            ? "recoveries do not overlap"
            : null;
      if (fault !== null)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: "efforts",
          value: effort.from,
          feasible: null,
          reason: fault,
          fix: "Give each effort a finite positive recovery from at least rest rate and depth, one after another.",
        });
      last = effort.from + effort.seconds;
    }
    return sorted;
  }
}


/*
 * A resting adult horse's breathing rate, breaths per minute: the middle of the
 * 8 to 16 the MSD Veterinary Manual gives as normal at rest.
 */
const REST_RATE: number = 12;

/*
 * The barrel's girth swing at rest, metres of radius: authored.
 */
const REST_DEPTH: number = 0.004;

/*
 * The barrel's girth swing in a stride-locked breath, metres of radius:
 * authored.
 */
const STRIDE_DEPTH: number = 0.012;

/*
 * The gaits whose breaths lock 1:1 to the stride (Attenburrow 1982; Lafortuna
 * et al. 1996, J Exp Biol 166:19 on 1:1 coupling at the canter and gallop).
 */
const LOCKED: ReadonlySet<string> = new Set<string>(["canter", "gallop"]);

/*
 * The rate at which the nostrils flare fully on each breath, breaths per
 * minute, and how much a full flare widens them, a fraction of their radius:
 * authored.
 */
const FLARE: Readonly<IFlare> = { rate: 90, widen: 0.6 };

/*
 * The nostrils' part ids.
 */
const NOSTRILS: ReadonlySet<string> = new Set<string>([
  "leftNostril",
  "rightNostril",
]);

/*
 * The nostril flare's authored shape.
 */
interface IFlare {
  /*
   * Breaths per minute at which a breath flares the nostrils fully.
   */
  rate: number;

  /*
   * The widening of a full flare, a fraction of the nostril's radius.
   */
  widen: number;
}

/*
 * A named instant of a ride.
 */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
