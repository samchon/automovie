import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedEquipmentBearing } from "./quadruped/QuadrupedEquipmentBearing";
import { QuadrupedEquipmentPlan } from "./quadruped/QuadrupedEquipmentPlan";

/**
 * A yoke and a pack frame laid on a quadruped's rest landmarks, every dimension
 * authored in metres.
 *
 * The model faces `+Z` with its left on `+X`. The yoke is a crossbeam ahead of
 * the neck root with a U hook, `hitch`; the pack frame is two side pads on
 * rails joined by over-back crossbars, with a U hook on each side, `leftLoad`
 * and `rightLoad`. Bearing rails touch the neck or the flanks and carry each
 * frame, which otherwise keeps its authored clearance from the body and from
 * any extra body spheres the producer emits (`ISphere`). The geometry and the
 * hook contacts come from the same plan.
 *
 * The assemblies claim no maker specification, measured fit, padding, pressure
 * distribution or load rating, and the caller supplies the body-plus-equipment
 * mass.
 */
export namespace AutoMovieArchetypeQuadrupedEquipment {
  /**
   * One extra spherical body part the producer emits, in model metres; the
   * equipment keeps its clearance from it.
   */
  export interface ISphere {
    /** Identity of the emitted body sphere. */
    readonly id: string;
    /** Primitive sphere radius, positive finite metres. */
    readonly radius: number;
    /** Primitive centre in the neutral model frame, metres. */
    readonly centre: Readonly<IAutoMovieVector3>;
  }

  /**
   * Contact vocabulary shared with the producer; lead belongs to
   * AutoMovieArchetypeQuadrupedLead.
   */
  export type Affordance =
    | "lead"
    | "leftLoad"
    | "rightLoad"
    | "hitch"
    | "head"
    | "horns"
    | "hind";

  /** An open-up U hook made from three real circular bars, all lengths metres. */
  export interface IHook {
    /** Circular bar radius, positive finite metres. */
    radius: number;

    /** Clear fore-aft opening between the two upright bars, metres. */
    opening: number;

    /**
     * Vertical clear depth from the inner bearing surface to the open ends,
     * metres.
     */
    depth: number;
  }

  /** Optional assemblies, with every dimension explicitly authored. */
  export interface IParams {
    /** Crossbeam in front of the neck root, with a connected hitch hook. */
    yoke?: IYoke;

    /**
     * Two side pads, longitudinal rails and over-back crossbars, with two load
     * hooks.
     */
    pack?: IPack;
  }

  /**
   * A yoke's authored dimensions, metres: a lateral crossbeam at a distance
   * along the neck axis, kept a clearance off neck and trunk, with its hitch
   * hook.
   */
  export interface IYoke {
    /** Complete lateral beam length; must span neck, beam radius and clearance. */
    width: number;

    /** Circular crossbeam radius, metres. */
    radius: number;

    /**
     * Distance along the neck axis from its root, metres, inside the neck's
     * positive span.
     */
    neckAt: number;

    /**
     * Free beam/hitch separation from neck and trunk, metres, zero allowed; the
     * separate visible bearing rail touches the neck.
     */
    clearance: number;

    /** Authored hitch geometry; its radius cannot exceed the beam's. */
    hook: IHook;
  }

  /**
   * A pack frame's authored dimensions, metres: two side pads on rails, kept a
   * clearance off the body, with one shared load hook shape.
   */
  export interface IPack {
    /**
     * Fore-aft pad/rail length; its crossbars fit the trunk behind the
     * neck-root footprint.
     */
    length: number;

    /**
     * Each side pad's vertical width, metres; must fit the barrel and stay
     * above ground.
     */
    width: number;

    /** Each side pad's lateral thickness, metres. */
    thickness: number;

    /** Supporting rail radius, metres; its diameter must fit the pad thickness. */
    railRadius: number;

    /**
     * Free pad/frame separation from the body, metres, zero allowed; separate
     * visible bearing rails touch its upper flanks.
     */
    clearance: number;

    /**
     * Both load hooks share these explicit dimensions; each fits within the
     * pad's length.
     */
    hook: IHook;
  }

  /** Authored coarse wood/pad color, not a physical material declaration. */
  const WOOD: string = "#70543b";

  /** Metal display color; no friction/restitution is inferred from it. */
  const METAL: string = "#575851";

  /**
   * Add admitted yoke/pack geometry and their three possible real hook sites.
   *
   * @param builder The animal builder, whose caller supplies total
   *   equipment-inclusive mass.
   * @param rig Canonical +Z-forward rest landmarks of that animal.
   * @param params Complete authored metre dimensions for each requested
   *   assembly.
   * @param archetype The producer identity reported by a parameter refusal.
   * @param spheres Additional emitted body spheres, in neutral model metres;
   *   defaults to an empty list and is copied during planning.
   * @throws {AutoMovieArchetypeRefusal} For invalid dimensions, nonfinite
   *   derived geometry, ordinary rig fit failure or insufficient authored
   *   clearance from an additional sphere.
   * @throws {RangeError} If an additional sphere has a nonpositive/nonfinite
   *   radius or nonfinite centre.
   * @throws {Error} If the producer already used one of this equipment's part
   *   identities.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    params: IParams,
    archetype: string,
    spheres: readonly ISphere[] = [],
  ): void {
    prepare(rig, params, archetype, spheres).emit(builder);
  }

  /**
   * Admit and plan complete authored equipment without mutating a builder.
   *
   * @param rig Neutral body landmarks and dimensions, metres.
   * @param params Complete authored assemblies; absence plans no parts.
   * @param archetype Producer identity used by actionable refusals.
   * @param spheres Additional body spheres in neutral model metres; defaults to
   *   an empty list, distinct from the ordinary rig envelope.
   * @returns A fixed-size equipment plan with independent additional-sphere
   *   copies, ready for one or more independent emissions.
   * @throws {AutoMovieArchetypeRefusal} For invalid assembly dimensions,
   *   nonfinite derived geometry or insufficient body clearance.
   * @throws {RangeError} For nonpositive/nonfinite additional sphere radii or
   *   nonfinite sphere centres.
   */
  export function prepare(
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    params: IParams,
    archetype: string,
    spheres: readonly ISphere[] = [],
  ): QuadrupedEquipmentPlan {
    const plan: QuadrupedEquipmentPlan = new QuadrupedEquipmentPlan(
      archetype,
      spheres,
    );
    if (params.yoke !== undefined) planYoke(plan, rig, params.yoke);
    if (params.pack !== undefined) planPack(plan, rig, params.pack);
    return plan;
  }

  /**
   * Plan the beam above the neck/trunk envelope and connect its forward U
   * hitch.
   */
  function planYoke(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    yoke: IYoke,
  ): void {
    for (const key of ["width", "radius", "neckAt"] as const)
      plan.positive(`yoke.${key}`, yoke[key]);
    plan.nonnegative("yoke.clearance", yoke.clearance);
    plan.admitHook("yoke.hook", yoke.hook);
    plan.positive("rig.neckRadius", rig.neckRadius);
    plan.positive("rig.back", rig.back);
    const axis: IAutoMovieVector3 = Vector3.subtract(rig.poll, rig.neck);
    const length: number = Vector3.length(axis);
    plan.positive("rig.neck.length", length);
    if (axis.x !== 0 || !(axis.z > 0))
      plan.refuse(
        "rig.neckAxis",
        axis,
        "a rest neck must lie in its +Z-forward sagittal plane",
        "use the actual canonical rest rig",
      );
    plan.atMost("yoke.neckAt", yoke.neckAt, length);
    plan.atMost("yoke.hook.radius", yoke.hook.radius, yoke.radius);
    const minimum: number = 2 * (rig.neckRadius + yoke.radius + yoke.clearance);
    if (yoke.width < minimum)
      plan.refuse(
        "yoke.width",
        yoke.width,
        `beam width must span at least ${minimum} m of neck and clearance`,
        "increase width or reduce the authored beam radius/clearance",
      );
    const az: number = axis.z / length;
    const ay: number = axis.y / length;
    if (yoke.neckAt * az < yoke.radius + yoke.clearance)
      plan.refuse(
        "yoke.neckAt",
        yoke.neckAt,
        "the beam's rear edge would pass behind the neck root",
        "move the beam farther along the actual neck or reduce its radius/clearance",
      );
    const anchor: IAutoMovieVector3 = Vector3.add(
      rig.neck,
      Vector3.scale(axis, yoke.neckAt / length),
    );
    const front: number =
      yoke.radius + yoke.hook.opening + 4 * yoke.hook.radius;
    const lift: number =
      (rig.neckRadius + yoke.clearance + Math.abs(ay) * front) / az +
      yoke.radius;
    const centre: IAutoMovieVector3 = {
      ...anchor,
      y: Math.max(anchor.y + lift, rig.back + yoke.radius + yoke.clearance),
    };
    plan.rod(
      "yoke-beam",
      yoke.radius,
      { ...centre, x: centre.x - yoke.width / 2 },
      { ...centre, x: centre.x + yoke.width / 2 },
      WOOD,
      yoke.clearance,
    );
    const hook: IAutoMovieVector3 = {
      ...centre,
      z: centre.z + yoke.radius + yoke.hook.opening / 2 + 2 * yoke.hook.radius,
    };
    plan.rod(
      "yoke-hitch-link",
      yoke.hook.radius,
      centre,
      hook,
      METAL,
      yoke.clearance,
    );
    plan.hook("yoke-hitch", "hitch", hook, yoke.hook, METAL, yoke.clearance);
    QuadrupedEquipmentBearing.yoke(plan, rig, yoke, centre, WOOD);
  }

  /**
   * Fit pads to the side planes; their rails and over-back bridges share those
   * endpoints.
   */
  function planPack(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    pack: IPack,
  ): void {
    for (const key of ["length", "width", "thickness", "railRadius"] as const)
      plan.positive(`pack.${key}`, pack[key]);
    plan.nonnegative("pack.clearance", pack.clearance);
    plan.admitHook("pack.hook", pack.hook);
    plan.positive("rig.barrel", rig.barrel);
    plan.positive("rig.trunk", rig.trunk);
    plan.positive("rig.back", rig.back);
    plan.positive("rig.neckRadius", rig.neckRadius);
    const middle: number = rig.back - rig.barrel;
    plan.atMost("pack.width", pack.width, Math.min(2 * rig.barrel, 2 * middle));
    const span: number = Math.min(rig.trunk, 2 * (rig.neck.z - rig.neckRadius));
    plan.atMost("pack.length", pack.length, span - 2 * pack.railRadius);
    plan.atMost("pack.railRadius", pack.railRadius, pack.thickness / 2);
    plan.atMost("pack.hook.radius", pack.hook.radius, pack.railRadius);
    plan.atMost(
      "pack.hook.opening",
      pack.hook.opening,
      pack.length - 4 * pack.hook.radius,
    );
    const x: number = rig.barrel + pack.clearance + pack.thickness / 2;
    const rail: number = middle + pack.width / 2 + pack.railRadius;
    const minimum: number = rig.back + pack.railRadius + pack.clearance;
    const bridge: number = Math.max(
      plan.bridgeHeight(
        minimum,
        x,
        -pack.length / 2,
        pack.railRadius,
        pack.clearance,
      ),
      plan.bridgeHeight(
        minimum,
        x,
        pack.length / 2,
        pack.railRadius,
        pack.clearance,
      ),
    );
    for (const [side, sign, id] of [
      ["left", 1, "leftLoad"],
      ["right", -1, "rightLoad"],
    ] as const) {
      const at: IAutoMovieVector3 = { x: sign * x, y: middle, z: 0 };
      const size: IAutoMovieVector3 = {
        x: pack.thickness,
        y: pack.width,
        z: pack.length,
      };
      plan.box(`pack-${side}-pad`, size, at, WOOD, pack.clearance);
      plan.rod(
        `pack-${side}-rail`,
        pack.railRadius,
        { x: at.x, y: rail, z: -pack.length / 2 },
        { x: at.x, y: rail, z: pack.length / 2 },
        WOOD,
        pack.clearance,
      );
      QuadrupedEquipmentBearing.pack(
        plan,
        rig,
        pack,
        side,
        { x: at.x, y: rail, z: 0 },
        WOOD,
      );
      for (const end of [-1, 1] as const)
        if (bridge > rail)
          plan.rod(
            `pack-${side}-post-${end}`,
            pack.railRadius,
            { x: at.x, y: rail, z: (end * pack.length) / 2 },
            { x: at.x, y: bridge, z: (end * pack.length) / 2 },
            WOOD,
            pack.clearance,
          );
      const hook: IAutoMovieVector3 = {
        x: sign * (x + pack.thickness / 2 + pack.hook.radius),
        y: rail,
        z: 0,
      };
      plan.rod(
        `pack-${side}-hook-link`,
        pack.hook.radius,
        { x: at.x, y: rail, z: 0 },
        hook,
        METAL,
        pack.clearance,
      );
      plan.hook(
        `pack-${side}-hook`,
        id,
        hook,
        pack.hook,
        METAL,
        pack.clearance,
      );
    }
    for (const end of [-1, 1] as const)
      plan.rod(
        `pack-bridge-${end}`,
        pack.railRadius,
        { x: -x, y: bridge, z: (end * pack.length) / 2 },
        { x, y: bridge, z: (end * pack.length) / 2 },
        WOOD,
        pack.clearance,
      );
  }
}
