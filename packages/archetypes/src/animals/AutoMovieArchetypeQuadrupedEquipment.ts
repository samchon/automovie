import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedEquipmentBearing } from "./QuadrupedEquipmentBearing";
import { QuadrupedEquipmentPlan } from "./QuadrupedEquipmentPlan";

/**
 * Authored yokes and pack frames on the actual rest quadruped's landmarks.
 *
 * The model faces +Z and its left is +X. Every equipment length is supplied
 * in metres; no maker specification, load rating or measured animal fit is
 * implied. Geometry and hook contacts use the same planned dimensions.
 * Additional producer spheres describe actual emitted body solids, not fit
 * proxies; an omitted sphere list is empty. Their centres and radii use this
 * same neutral model frame and metres.
 * Visible tangent bearing rails and connecting rods support each clear frame
 * on the actual body. Their coarse line contacts do not claim padding,
 * restraint, pressure distribution or rated working capacity.
 * The caller supplies total body-plus-equipment mass to the existing builder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the rest frame, authored SI dimensions, actual-rig fit, common geometry/contact ownership and physical limits.
 * @evidence contracts/development/design.md#principled-representation Two independently optional equipment assemblies carry closed contact identities and explicit positive physical lengths; no invented material coefficient or segment mass share is required.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This owner only adds yoke/pack parts and their hook sites to the actual builder. The existing lead/collar owner and the producer's total mass remain separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source anatomy, maker compliance and load-bearing capacity are not inferred from authored coarse equipment. No horse geometry, weight law or implicit dimensional default is copied.
 */
export namespace AutoMovieArchetypeQuadrupedEquipment {
  /**
   * One real additional spherical body part, in canonical model metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the actual emitted part identity, centre and positive primitive sphere radius, distinct from the ordinary rig envelope.
   * @evidence contracts/development/design.md#principled-representation The same producer record supplies actual sphere emission and physical equipment admission; this is actual geometry rather than a species-specific fit proxy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Represents the live additional spherical body solid consumed by shared equipment support and collision checks; ordinary rig geometry keeps its existing owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No guessed anatomical radius, renderer-only obstacle or hardcoded species clearance enters the contract.
   */
  export interface ISphere {
    /** Identity of the actual emitted body sphere. */
    readonly id: string;
    /** Actual primitive sphere radius, positive finite metres. */
    readonly radius: number;
    /** Actual primitive centre in the neutral model frame, metres. */
    readonly centre: Readonly<IAutoMovieVector3>;
  }

  /**
   * Contact vocabulary shared with the producer; lead belongs to AutoMovieArchetypeQuadrupedLead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes this owner's three hooks from the existing lead contact.
   * @evidence contracts/development/design.md#principled-representation Closed identities distinguish left/right pack loads and the yoke's hitch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the single non-equid contact vocabulary imported by the cohort producer; its lead geometry remains with AutoMovieArchetypeQuadrupedLead.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown or free-text attachment identities cannot enter the builder through this contract.
   */
  export type Affordance =
    | "lead"
    | "leftLoad"
    | "rightLoad"
    | "hitch"
    | "head"
    | "horns"
    | "hind";

  /**
   * An open-up U hook made from three real circular bars, all lengths metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines tube radius and the clear opening/depth that the physical bars leave around their bearing point.
   * @evidence contracts/development/design.md#principled-representation Three independent positive lengths define the coarse U; its lower inside surface has outward normal +Y.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same hook construction serves hitch and both pack loads; no separate contact-only geometry is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These are authored dimensions rather than a claimed rated commercial fitting; a point-only hook cannot replace the real bearing bars.
   */
  export interface IHook {
    /** Circular bar radius, positive finite metres. */
    radius: number;

    /** Clear fore-aft opening between the two upright bars, metres. */
    opening: number;

    /** Vertical clear depth from the inner bearing surface to the open ends, metres. */
    depth: number;
  }

  /**
   * Actual optional assemblies, with every dimension explicitly authored.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every member names a physical metre length or clearance and the actual neck/trunk limit that admits it; pack width is explicitly vertical pad width.
   * @evidence contracts/development/design.md#principled-representation An absent assembly adds nothing; a present one requires its complete geometry and hook. Clearances are nonnegative and other dimensions positive, checked before any builder mutation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two requested equipment assemblies are represented. Lead, total mass, material coefficients and species anatomy stay with their current owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No dimension is guessed from a species name, no partial hook can be written and no manufacturer or safe-load promise is encoded.
   */
  export interface IParams {
    /** Crossbeam in front of the actual neck root, with a connected hitch hook. */
    yoke?: {
      /** Complete lateral beam length; must span neck, beam radius and clearance. */
      width: number;

      /** Circular crossbeam radius, metres. */
      radius: number;

      /** Distance along the actual neck axis from its root, metres, inside the neck's positive span. */
      neckAt: number;

      /** Free beam/hitch separation from neck and trunk, metres, zero allowed; the separate visible bearing rail touches the neck. */
      clearance: number;

      /** Authored hitch geometry; its radius cannot exceed the beam's. */
      hook: IHook;
    };

    /** Two side pads, longitudinal rails and over-back crossbars, with two load hooks. */
    pack?: {
      /** Fore-aft pad/rail length; its crossbars fit the trunk behind the neck-root footprint. */
      length: number;

      /** Each side pad's vertical width, metres; must fit the actual barrel and stay above ground. */
      width: number;

      /** Each side pad's lateral thickness, metres. */
      thickness: number;

      /** Supporting rail radius, metres; its diameter must fit the pad thickness. */
      railRadius: number;

      /** Free pad/frame separation from the body, metres, zero allowed; separate visible bearing rails touch its upper flanks. */
      clearance: number;

      /** Both load hooks share these explicit dimensions; each fits within the pad's length. */
      hook: IHook;
    };
  }

  /** Authored coarse wood/pad color, not a physical material declaration. */
  const WOOD: string = "#70543b";

  /** Metal display color; no friction/restitution is inferred from it. */
  const METAL: string = "#575851";

  /**
   * Add admitted yoke/pack geometry and their three possible real hook sites.
   *
   * @param builder The actual animal builder, whose caller supplies total equipment-inclusive mass.
   * @param rig Canonical +Z-forward rest landmarks of that animal.
   * @param params Complete authored metre dimensions for each requested assembly.
   * @param archetype The producer identity reported by a parameter refusal.
   * @param spheres Actual additional emitted body spheres, in neutral model metres; defaults to an empty list and is copied during planning.
   * @throws {AutoMovieArchetypeRefusal} For invalid dimensions, nonfinite derived geometry, ordinary rig fit failure or insufficient authored clearance from an additional sphere.
   * @throws {RangeError} If an additional sphere has a nonpositive/nonfinite radius or nonfinite centre.
   * @throws {Error} If the producer already used one of this equipment's part identities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines assembly admission, no-op absence, rest-frame ownership, geometry/contact equivalence, all units and failure behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Plan the clear frame against the actual neck axis and circular barrel, then connect it to tangent body-bearing rails using the same body boundaries and actual frame endpoints. Additional spheres raise connected pack bridges; every rod/box retains authored clearance from those additional solids. Bearing rails touch their declared neck/trunk surface. U-hook contacts remain on the real bearing bar with outward normal +Y.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and plan both assemblies completely, then append their real primitives and contact records; one hook planner owns all three sites.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No guessed equipment size, floating contact, copied horse rig, patched builder, hidden mass share or contact coefficient is used. An invalid second assembly leaves no first assembly partially appended. A brace of exactly zero length is omitted because the crossbar already joins the rail there.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed assembly sizes require O(S) planning and copied-sphere storage for S additional body spheres, with O(1) equipment records. Append cost includes the builder's existing O(P) id scan per fixed part for P already-built parts; no fitting or mesh search occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One planned bearing point supplies each actual hook and its contact; both pack sides share their authored dimensions and the same hook owner. No species branch or duplicate lead implementation exists.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary plan owns fixed equipment records and O(S) independent sphere copies, released after appending. The builder owns emitted data; no producer sphere input, query, cache, process or external handle is retained.
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
   * @param rig Actual neutral body landmarks and dimensions, metres.
   * @param params Complete authored assemblies; absence plans no parts.
   * @param archetype Actual producer identity used by actionable refusals.
   * @param spheres Actual additional body spheres in neutral model metres; defaults to an empty list, distinct from the ordinary rig envelope.
   * @returns A fixed-size equipment plan with independent additional-sphere copies, ready for one or more independent emissions.
   * @throws {AutoMovieArchetypeRefusal} For invalid assembly dimensions, nonfinite derived geometry or insufficient actual-body clearance.
   * @throws {RangeError} For nonpositive/nonfinite additional sphere radii or nonfinite sphere centres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines non-emitting actual-rig admission, whole assembly inputs and the independent builder-emission boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Admit complete equipment against the actual rig and copied additional spheres before emission. Connected pack bridges use conservative sphere-top clearance. All cylinders/boxes retain authored clearance from additional spheres, while visible bearing rails touch only their declared neck/trunk course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Create one plan, populate requested assemblies through their existing owners and return that same admitted plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No probe builder, partial emitted model, guessed source dimensions or repeated random construction establishes eligibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two fixed assemblies require O(S) work and sphere-copy storage for S additional spheres, plus fixed equipment records. Repeating preflight for K candidate cohorts costs O(KS); no full model or mesh is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ordinary lay operation and whole-cohort preflight share these exact geometry/admission routines; the selected prepared plan is emitted without replanning.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fixed primitive/contact records and O(S) copied spheres until releasing the plan. No builder, producer sphere record, input model, cache or external handle is retained.
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

  /** Plan the beam above the neck/trunk envelope and connect its forward U hitch. */
  function planYoke(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    yoke: NonNullable<IParams["yoke"]>,
  ): void {
    for (const key of ["width", "radius", "neckAt"] as const)
      plan.positive(`yoke.${key}`, yoke[key]);
    plan.nonnegative("yoke.clearance", yoke.clearance);
    plan.admitHook("yoke.hook", yoke.hook);
    plan.positive("rig.neckRadius", rig.neckRadius);
    plan.positive("rig.back", rig.back);
    plan.point("rig.neck", rig.neck);
    plan.point("rig.poll", rig.poll);
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
    if (!Number.isFinite(minimum) || yoke.width < minimum)
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

  /** Fit pads to the actual side planes; their rails and over-back bridges share those endpoints. */
  function planPack(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    pack: NonNullable<IParams["pack"]>,
  ): void {
    for (const key of ["length", "width", "thickness", "railRadius"] as const)
      plan.positive(`pack.${key}`, pack[key]);
    plan.nonnegative("pack.clearance", pack.clearance);
    plan.admitHook("pack.hook", pack.hook);
    plan.positive("rig.barrel", rig.barrel);
    plan.positive("rig.trunk", rig.trunk);
    plan.positive("rig.back", rig.back);
    plan.positive("rig.neckRadius", rig.neckRadius);
    plan.point("rig.neck", rig.neck);
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
