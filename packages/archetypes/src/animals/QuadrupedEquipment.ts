import { Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame, ArchetypeRefusal } from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";

/**
 * Authored yokes and pack frames on the actual rest quadruped's landmarks.
 *
 * The model faces +Z and its left is +X. Every equipment length is supplied
 * in metres; no maker specification, load rating or measured animal fit is
 * implied. Geometry and hook contacts use the same planned dimensions.
 * The caller supplies total body-plus-equipment mass to the existing builder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the rest frame, authored SI dimensions, actual-rig fit, common geometry/contact ownership and physical limits.
 * @evidence contracts/development/design.md#principled-representation Two independently optional equipment assemblies carry closed contact identities and explicit positive physical lengths; no invented material coefficient or segment mass share is required.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This owner only adds yoke/pack parts and their hook sites to the actual builder. The existing lead/collar owner and the producer's total mass remain separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source anatomy, maker compliance and load-bearing capacity are not inferred from authored coarse equipment. No horse geometry, weight law or implicit dimensional default is copied.
 */
export namespace QuadrupedEquipment {
  /**
   * Contact vocabulary shared with the producer; lead belongs to QuadrupedLead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes this owner's three hooks from the existing lead contact.
   * @evidence contracts/development/design.md#principled-representation Closed identities distinguish left/right pack loads and the yoke's hitch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the producer's one contact vocabulary without implementing its lead twice.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown or free-text attachment identities cannot enter the builder through this contract.
   */
  export type Affordance = "lead" | "leftLoad" | "rightLoad" | "hitch";

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

      /** Circular crossbeam radius. */
      radius: number;

      /** Distance along the actual neck axis from root, inside its positive span. */
      neckAt: number;

      /** Minimum separation from the neck cylinder and trunk envelope, metres, zero allowed. */
      clearance: number;

      /** Authored hitch geometry; its radius cannot exceed the beam's. */
      hook: IHook;
    };

    /** Two side pads, longitudinal rails and over-back crossbars, with two load hooks. */
    pack?: {
      /** Fore-aft pad/rail length; its crossbars fit the trunk behind the neck-root footprint. */
      length: number;

      /** Each side pad's vertical width; must fit the actual barrel and stay above ground. */
      width: number;

      /** Each side pad's lateral thickness. */
      thickness: number;

      /** Supporting rail radius; its diameter must fit the pad thickness. */
      railRadius: number;

      /** Body-to-pad/crossbar separation, metres, zero allowed. */
      clearance: number;

      /** Both load hooks share these explicit dimensions; each fits within the pad's length. */
      hook: IHook;
    };
  }

  /** One planned real primitive, before the actual builder is mutated. */
  type Part =
    | { kind: "rod"; id: string; radius: number; from: IAutoMovieVector3; to: IAutoMovieVector3; color: string }
    | { kind: "box"; id: string; size: IAutoMovieVector3; at: IAutoMovieVector3; color: string };

  /** A declared contact on an actual planned hook's inner bearing surface. */
  type Contact = IAutoMovieAffordance & { id: Affordance };

  /** Authored coarse wood/pad and metal colors, not physical material declarations. */
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
   * @throws {ArchetypeRefusal} For invalid dimensions, nonfinite derived geometry or equipment that cannot fit the actual neck/trunk/barrel.
   * @throws {Error} If the producer already used one of this equipment's part identities.
   * @evidence contracts/development/common.md#meaningful-documentation Defines assembly admission, no-op absence, rest-frame ownership, geometry/contact equivalence, all units and failure behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Plan against the actual neck axis and circular barrel. All U-hook contacts are the top surface of the same horizontal bearing bar drawn below their open-up gap, with +Y outward. Pack side-span derives from barrel, clearance and pad thickness; crossbars clear the actual back.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and plan both assemblies completely, then append their real primitives and contact records; one hook planner owns all three sites.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No guessed equipment size, floating contact, copied horse rig, patched builder, hidden mass share or contact coefficient is used. An invalid second assembly leaves no first assembly partially appended. A brace of exactly zero length is omitted because the crossbar already joins the rail there.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most one yoke and one fixed two-sided pack are planned, O(1) geometry/contact storage. Actual append cost includes the builder's existing O(P) id scan per fixed part for P already-built parts; no fitting or mesh search occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One planned bearing point supplies each actual hook and its contact; both pack sides share their authored dimensions and the same hook owner. No species branch or duplicate lead implementation exists.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call-local plan is bounded by these fixed assemblies and is released after appending. The actual builder owns all emitted data; no query, cache, process or external handle is retained.
   */
  export function lay(
    builder: ArchetypeBuilder<Affordance, QuadrupedBody.Dimension>,
    rig: QuadrupedBody.IRig,
    params: IParams,
    archetype: string,
  ): void {
    const parts: Part[] = [];
    const contacts: Contact[] = [];
    if (params.yoke !== undefined) planYoke(parts, contacts, rig, params.yoke, archetype);
    if (params.pack !== undefined) planPack(parts, contacts, rig, params.pack, archetype);
    for (const part of parts)
      if (part.kind === "rod") builder.rod(part.id, part.radius, part.from, part.to, { color: part.color });
      else builder.box(part.id, part.size, part.at, { color: part.color });
    for (const contact of contacts) builder.affordance(contact);
  }

  /** Plan the beam above the neck/trunk envelope and connect its forward U hitch. */
  function planYoke(parts: Part[], sites: Contact[], rig: QuadrupedBody.IRig,
    yoke: NonNullable<IParams["yoke"]>, archetype: string): void {
    for (const key of ["width", "radius", "neckAt"] as const) positive(archetype, `yoke.${key}`, yoke[key]);
    nonnegative(archetype, "yoke.clearance", yoke.clearance);
    admitHook(archetype, "yoke.hook", yoke.hook);
    positive(archetype, "rig.neckRadius", rig.neckRadius);
    positive(archetype, "rig.back", rig.back);
    point(archetype, "rig.neck", rig.neck);
    point(archetype, "rig.poll", rig.poll);
    const axis: IAutoMovieVector3 = Vector3.subtract(rig.poll, rig.neck);
    const length: number = Vector3.length(axis);
    positive(archetype, "rig.neck.length", length);
    if (axis.x !== 0 || !(axis.z > 0))
      refuse(archetype, "rig.neckAxis", axis, "a rest neck must lie in its +Z-forward sagittal plane", "use the actual canonical rest rig");
    atMost(archetype, "yoke.neckAt", yoke.neckAt, length);
    atMost(archetype, "yoke.hook.radius", yoke.hook.radius, yoke.radius);
    const minimum: number = 2 * (rig.neckRadius + yoke.radius + yoke.clearance);
    if (!Number.isFinite(minimum) || yoke.width < minimum)
      refuse(archetype, "yoke.width", yoke.width, `beam width must span at least ${minimum} m of neck and clearance`, "increase width or reduce the authored beam radius/clearance");
    const az: number = axis.z / length;
    const ay: number = axis.y / length;
    if (yoke.neckAt * az < yoke.radius + yoke.clearance)
      refuse(archetype, "yoke.neckAt", yoke.neckAt, "the beam's rear edge would pass behind the neck root", "move the beam farther along the actual neck or reduce its radius/clearance");
    const anchor: IAutoMovieVector3 = Vector3.add(rig.neck, Vector3.scale(axis, yoke.neckAt / length));
    const front: number = yoke.radius + yoke.hook.opening + 4 * yoke.hook.radius;
    const lift: number = (rig.neckRadius + yoke.clearance + Math.abs(ay) * front) / az + yoke.radius;
    const centre: IAutoMovieVector3 = { ...anchor,
      y: Math.max(anchor.y + lift, rig.back + yoke.radius + yoke.clearance) };
    rod(parts, archetype, "yoke-beam", yoke.radius,
      { ...centre, x: centre.x - yoke.width / 2 }, { ...centre, x: centre.x + yoke.width / 2 }, WOOD);
    const hook: IAutoMovieVector3 = { ...centre,
      z: centre.z + yoke.radius + yoke.hook.opening / 2 + 2 * yoke.hook.radius };
    rod(parts, archetype, "yoke-hitch-link", yoke.hook.radius, centre, hook, METAL);
    planHook(parts, sites, archetype, "yoke-hitch", "hitch", hook, yoke.hook);
  }

  /** Fit pads to the actual side planes; their rails and over-back bridges share those endpoints. */
  function planPack(parts: Part[], sites: Contact[], rig: QuadrupedBody.IRig,
    pack: NonNullable<IParams["pack"]>, archetype: string): void {
    for (const key of ["length", "width", "thickness", "railRadius"] as const) positive(archetype, `pack.${key}`, pack[key]);
    nonnegative(archetype, "pack.clearance", pack.clearance);
    admitHook(archetype, "pack.hook", pack.hook);
    positive(archetype, "rig.barrel", rig.barrel);
    positive(archetype, "rig.trunk", rig.trunk);
    positive(archetype, "rig.back", rig.back);
    positive(archetype, "rig.neckRadius", rig.neckRadius);
    point(archetype, "rig.neck", rig.neck);
    const middle: number = rig.back - rig.barrel;
    atMost(archetype, "pack.width", pack.width, Math.min(2 * rig.barrel, 2 * middle));
    const span: number = Math.min(rig.trunk, 2 * (rig.neck.z - rig.neckRadius));
    atMost(archetype, "pack.length", pack.length, span - 2 * pack.railRadius);
    atMost(archetype, "pack.railRadius", pack.railRadius, pack.thickness / 2);
    atMost(archetype, "pack.hook.radius", pack.hook.radius, pack.railRadius);
    atMost(archetype, "pack.hook.opening", pack.hook.opening, pack.length - 4 * pack.hook.radius);
    const x: number = rig.barrel + pack.clearance + pack.thickness / 2;
    const rail: number = middle + pack.width / 2 + pack.railRadius;
    const bridge: number = rig.back + pack.railRadius + pack.clearance;
    for (const [side, sign, id] of [["left", 1, "leftLoad"], ["right", -1, "rightLoad"]] as const) {
      const at: IAutoMovieVector3 = { x: sign * x, y: middle, z: 0 };
      const size: IAutoMovieVector3 = { x: pack.thickness, y: pack.width, z: pack.length };
      point(archetype, `pack-${side}-pad.position`, at);
      point(archetype, `pack-${side}-pad.size`, size);
      parts.push({ kind: "box", id: `pack-${side}-pad`, size, at, color: WOOD });
      rod(parts, archetype, `pack-${side}-rail`, pack.railRadius,
        { x: at.x, y: rail, z: -pack.length / 2 }, { x: at.x, y: rail, z: pack.length / 2 }, WOOD);
      for (const end of [-1, 1] as const)
        if (bridge > rail) rod(parts, archetype, `pack-${side}-post-${end}`, pack.railRadius,
          { x: at.x, y: rail, z: end * pack.length / 2 }, { x: at.x, y: bridge, z: end * pack.length / 2 }, WOOD);
      const hook: IAutoMovieVector3 = { x: sign * (x + pack.thickness / 2 + pack.hook.radius), y: rail, z: 0 };
      rod(parts, archetype, `pack-${side}-hook-link`, pack.hook.radius, { x: at.x, y: rail, z: 0 }, hook, METAL);
      planHook(parts, sites, archetype, `pack-${side}-hook`, id, hook, pack.hook);
    }
    for (const end of [-1, 1] as const)
      rod(parts, archetype, `pack-bridge-${end}`, pack.railRadius,
        { x: -x, y: bridge, z: end * pack.length / 2 }, { x, y: bridge, z: end * pack.length / 2 }, WOOD);
  }

  /** Three actual U bars leave the declared opening and depth above this bearing point. */
  function planHook(parts: Part[], sites: Contact[], archetype: string,
    name: string, id: Affordance, base: IAutoMovieVector3, hook: IHook): void {
    const half: number = hook.opening / 2 + hook.radius;
    rod(parts, archetype, `${name}-base`, hook.radius,
      { ...base, z: base.z - half }, { ...base, z: base.z + half }, METAL);
    for (const end of [-1, 1] as const)
      rod(parts, archetype, `${name}-upright-${end}`, hook.radius,
        { ...base, z: base.z + end * half },
        { ...base, y: base.y + hook.radius + hook.depth, z: base.z + end * half }, METAL);
    const bearing: IAutoMovieVector3 = { ...base, y: base.y + hook.radius };
    point(archetype, `${name}.bearing`, bearing);
    sites.push({ id, kind: "hook", extent: null, frame: ArchetypeFrame.upright(bearing) });
  }

  /** Admit every physical hook dimension before laying any assembly. */
  function admitHook(archetype: string, name: string, hook: IHook): void {
    for (const key of ["radius", "opening", "depth"] as const) positive(archetype, `${name}.${key}`, hook[key]);
  }

  /** Validate a complete real rod before recording it in the uncommitted plan. */
  function rod(parts: Part[], archetype: string, id: string, radius: number,
    from: IAutoMovieVector3, to: IAutoMovieVector3, color: string): void {
    positive(archetype, `${id}.radius`, radius);
    point(archetype, `${id}.from`, from);
    point(archetype, `${id}.to`, to);
    positive(archetype, `${id}.length`, Vector3.length(Vector3.subtract(to, from)));
    parts.push({ kind: "rod", id, radius, from, to, color });
  }

  /** Every derived coordinate must remain finite before the builder receives it. */
  function point(archetype: string, axis: string, value: IAutoMovieVector3): void {
    if (![value.x, value.y, value.z].every(Number.isFinite))
      refuse(archetype, axis, value, "derived equipment coordinates must be finite", "reduce the authored dimensions or correct the rest rig");
  }

  /** Positive finite metres; no inclusive-zero range is falsely reported as feasible. */
  function positive(archetype: string, axis: string, value: number): void {
    if (!(Number.isFinite(value) && value > 0))
      refuse(archetype, axis, value, "the authored or actual length must be finite and strictly positive", "supply a positive finite length in metres");
  }

  /** Zero clearance is an admitted exact-contact construction. */
  function nonnegative(archetype: string, axis: string, value: number): void {
    if (!(Number.isFinite(value) && value >= 0))
      refuse(archetype, axis, value, "clearance must be finite and nonnegative", "supply zero or a positive finite clearance in metres");
  }

  /** Report the actual inclusive span limit after positivity has already been admitted. */
  function atMost(archetype: string, axis: string, value: number, maximum: number): void {
    if (!(Number.isFinite(value) && Number.isFinite(maximum) && maximum > 0 && value <= maximum))
      refuse(archetype, axis, value, `the complete occupied length must not exceed ${maximum} m`, "reduce the equipment dimensions to fit the actual rig");
  }

  /** A source-located parameter failure names the caller's real producer and physical axis. */
  function refuse(archetype: string, axis: string, value: unknown, reason: string, fix: string): never {
    throw new ArchetypeRefusal({ kind: "parameter", archetype, axis, value, feasible: null, reason, fix });
  }
}
