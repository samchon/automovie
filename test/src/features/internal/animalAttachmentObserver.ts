import type {
  AutoMovieArchetype,
  AutoMovieArchetypeQuadrupedBody,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalReinObserver } from "./animalReinObserver";
import { animalTerminalSole } from "./animalTerminalSole";
import { nclose } from "./nclose";

/**
 * Observe real bar attachments and solid soles without reading the ride solver.
 *
 * @param source The actual independently built neutral model.
 * @param sample Actual current parts, contacts and complete root placement.
 * @param label Scenario and film time included in every finding.
 * @param findings Shared failure collector; a bad observation does not hide
 *   later limbs.
 * @param handContacts Explicit rein ids whose hand origins remain on the trunk
 *   while their rods follow a moving head.
 * @returns Actual distal cap centres and exact lowest terminal surface heights.
 * @evidence contracts/development/common.md#meaningful-documentation Defines model/world frames, metre observations, parent primitive-centre attachments, exact cylinder/capsule support, finite unit transforms and failure collection; no biological ROM or material no-slip claim is made.
 * @evidence contracts/development/implementation.md#principled-implementation Reads endpoints from actual primitive heights and rotations. Parent inverse transforms compare the same source/current attachment; Euclidean distances check every bar and adjacent joint. The shared independent support function gives the actual finite cylinder/capsule's lowest world Y. Real rein held runs fit the current rod; explicitly declared hands stay on the trunk while their far rod endpoints remain on the head. Hook and pack-surface contacts retain their own actual rigid carriers.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Index source/current parts, inspect all transforms, observe each closed limb chain and its parent attachment, then inspect axial attachments and actual carried contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species proportions, solver output, sampled fixture, terminal-centre floor substitute or foreign-method replacement supplies an expected answer; unsupported terminal geometry throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P+A) indexing and transform/contact inspection plus sixteen fixed bar observations; result storage is four feet and failure facts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One source/current part index serves attachments, endpoints and contact carriers; vector/quaternion arithmetic uses the engine's existing primitives without calling its limb or floor solvers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All maps and observed records belong to one call; only four fresh foot observations and caller-owned findings escape, with no cache, process or host.
 */
export function animalAttachmentObserver(
  source: animalAttachmentObserver.Model,
  sample: animalAttachmentObserver.Sample,
  label: string,
  findings: string[],
  handContacts: readonly string[] = [],
): ReadonlyMap<
  AutoMovieArchetypeQuadrupedBody.Limb,
  animalAttachmentObserver.IFoot
> {
  const original: Map<string, IAutoMovieModelPart> = index(source.parts);
  const current: Map<string, IAutoMovieModelPart> = index(
    sample.archetype.parts,
  );
  const contacts: Map<string, IAutoMovieAffordance> = new Map(
    sample.archetype.affordances.map(
      (contact: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [
        contact.id,
        contact,
      ],
    ),
  );
  const feet: Map<
    AutoMovieArchetypeQuadrupedBody.Limb,
    animalAttachmentObserver.IFoot
  > = new Map();
  rigid(sample.placement, "placement");
  truth("part count", current.size === original.size);
  for (const part of sample.archetype.parts) {
    truth(`${part.id} exists in source`, original.has(part.id));
    rigid(frame(part), part.id);
  }
  for (const limb of [
    "leftFore",
    "rightFore",
    "leftHind",
    "rightHind",
  ] as const) {
    const fore: boolean = limb.endsWith("Fore");
    const ids: readonly string[] = fore
      ? [`${limb}Humerus`, `${limb}Radius`, `${limb}Cannon`, `${limb}Pastern`]
      : [`${limb}Femur`, `${limb}Tibia`, `${limb}Cannon`, `${limb}Pastern`];
    // A fore limb hangs from its shoulder blade, which hangs from the trunk.
    const parent: string = fore ? `${limb}Scapula` : "hindquarters";
    if (fore) attached(parent, "trunk");
    // The shoulder joint lies below the blade's drawn bar, inside the trunk's solid.
    attached(ids[0]!, parent, fore ? "trunk" : parent);
    let previous: IAutoMovieVector3 | undefined;
    for (const id of ids) {
      const rest: IAutoMovieModelPart = need(original, id);
      const posed: IAutoMovieModelPart = need(current, id);
      const originalShape: {
        height: number;
        radius: number;
        capsule: boolean;
      } = dimensions(rest);
      const currentShape: { height: number; radius: number; capsule: boolean } =
        dimensions(posed);
      near(
        `${id} preserves actual height`,
        currentShape.height,
        originalShape.height,
        0,
      );
      near(
        `${id} preserves actual radius`,
        currentShape.radius,
        originalShape.radius,
        0,
      );
      truth(
        `${id} preserves actual primitive`,
        currentShape.capsule === originalShape.capsule,
      );
      const proximal: IAutoMovieVector3 = endpoint(posed, -1);
      const distal: IAutoMovieVector3 = endpoint(posed, 1);
      near(
        `${id} actual length`,
        distance(proximal, distal),
        distance(endpoint(rest, -1), endpoint(rest, 1)),
        1e-9,
      );
      if (previous !== undefined)
        point(`${id} joins previous bar`, proximal, previous);
      previous = distal;
    }
    const terminal: IAutoMovieModelPart = need(current, ids[3]!);
    const soleY: number = animalTerminalSole(terminal, sample.placement);
    feet.set(limb, { point: world(endpoint(terminal, 1)), soleY });
  }
  for (const [child, parent] of [
    ["neck", "trunk"],
    ["head", "neck"],
    ["tail", "hindquarters"],
    ["hindquarters", "trunk"],
  ] as const)
    attached(child, parent);

  truth(
    "contact count",
    sample.archetype.affordances.length === source.affordances.length,
  );
  for (const contact of source.affordances) {
    const posed: IAutoMovieAffordance | undefined = contacts.get(contact.id);
    truth(`${contact.id} retained contact`, posed !== undefined);
    if (posed === undefined) continue;
    rigid(posed.frame, `contact ${contact.id}`);
    truth(
      `${contact.id} semantics`,
      JSON.stringify({ ...posed, frame: null }) ===
        JSON.stringify({ ...contact, frame: null }),
    );
    if (contact.kind === "rein") {
      const rod: string | undefined = (
        {
          lead: "lead",
          leftRein: "rein-left",
          rightRein: "rein-right",
        } as Readonly<Record<string, string>>
      )[contact.id];
      // A pack saddle's tie is a rein fastening with no laid rod: it rides on the trunk with the saddle.
      if (rod === undefined && contact.id !== "tie")
        throw new Error(`Unsupported actual rein ${contact.id}`);
      if (rod !== undefined)
        animalReinObserver(need(current, rod), posed, label, findings);
      if (rod !== undefined && handContacts.includes(contact.id)) {
        point(
          `${contact.id} hand remains on actual trunk`,
          local(frame(need(current, "trunk")), posed.frame.translation),
          local(frame(need(original, "trunk")), contact.frame.translation),
        );
        point(
          `${contact.id} far end remains on actual head`,
          local(frame(need(current, "head")), endpoint(need(current, rod), 1)),
          local(
            frame(need(original, "head")),
            endpoint(need(original, rod), 1),
          ),
        );
        continue;
      }
    }
    const carrier: string | undefined =
      contact.kind === "hook"
        ? (
            {
              hitch: original.has("yoke-hitch-base")
                ? "yoke-hitch-base"
                : "trunk",
              leftLoad: "pack-left-hook-base",
              rightLoad: "pack-right-hook-base",
            } as Readonly<Record<string, string>>
          )[contact.id]
        : (
            {
              lead: "lead",
              seat: "saddle",
              pommel: "pommel",
              cantle: "cantle",
              leftStirrup: "stirrup-left",
              rightStirrup: "stirrup-right",
              leftLoad: "trunk",
              rightLoad: "trunk",
              tie: "trunk",
            } as Readonly<Record<string, string>>
          )[contact.id];
    if (carrier === undefined) continue;
    const old: IAutoMovieTransform = frame(need(original, carrier));
    const now: IAutoMovieTransform = frame(need(current, carrier));
    point(
      `${contact.id} actual carrier-local position`,
      local(now, posed.frame.translation),
      local(old, contact.frame.translation),
    );
    const a: IAutoMovieTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(old.rotation),
      contact.frame.rotation,
    );
    const b: IAutoMovieTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(now.rotation),
      posed.frame.rotation,
    );
    near(
      `${contact.id} actual carrier-local rotation`,
      Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
      1,
      1e-9,
    );
  }
  return feet;

  /**
   * A neutral attachment is measured in the actual parent primitive's centre
   * frame.
   */
  function attached(
    child: string,
    parent: string,
    solid: string = parent,
  ): void {
    const oldParent: IAutoMovieModelPart = need(original, parent);
    const newParent: IAutoMovieModelPart = need(current, parent);
    const oldPoint: IAutoMovieVector3 = local(
      frame(oldParent),
      endpoint(need(original, child), -1),
    );
    const newPoint: IAutoMovieVector3 = local(
      frame(newParent),
      endpoint(need(current, child), -1),
    );
    point(`${child} remains attached to ${parent}`, newPoint, oldPoint);
    if (child.endsWith("Humerus") || child.endsWith("Femur")) {
      inside(
        `${child} neutral proximal touches actual parent solid`,
        local(
          frame(need(original, solid)),
          endpoint(need(original, child), -1),
        ),
        need(original, solid),
      );
      // A turned blade carries the shoulder joint on its arc about the blade's
      // rotation centre, out of the trunk's solid that holds it at rest. The
      // point check above pins it to the blade's own frame, so only a parent
      // that is itself the solid is read inside it when posed.
      if (solid === parent)
        inside(
          `${child} posed proximal touches actual parent solid`,
          local(
            frame(need(current, solid)),
            endpoint(need(current, child), -1),
          ),
          need(current, solid),
        );
    }
  }

  /**
   * Rigid invariance alone cannot excuse a limb detached even in its neutral
   * model.
   */
  function inside(
    id: string,
    value: IAutoMovieVector3,
    parent: IAutoMovieModelPart,
  ): void {
    const solid: { height: number; radius: number; capsule: boolean } =
      dimensions(parent);
    const capDistance: number = Math.max(
      0,
      Math.abs(value.y) - solid.height / 2,
    );
    const outside: number = solid.capsule
      ? Math.hypot(value.x, value.z, capDistance) - solid.radius
      : Math.max(Math.hypot(value.x, value.z) - solid.radius, capDistance);
    truth(id, outside <= 1e-9);
  }

  /** World observations use the actual root once, independently of ride.frame. */
  function world(value: IAutoMovieVector3): IAutoMovieVector3 {
    return AutoMovieEngineVector3.add(
      sample.placement.translation,
      AutoMovieEngineQuaternion.rotateVector(sample.placement.rotation, value),
    );
  }

  /**
   * Every emitted rigid record needs finite position, unit scale and unit
   * rotation.
   */
  function rigid(value: IAutoMovieTransform, id: string): void {
    for (const axis of ["x", "y", "z"] as const) {
      near(`${id}.${axis} unit scale`, value.scale[axis], 1, 0);
    }
    near(
      `${id} unit quaternion`,
      Math.hypot(
        value.rotation.x,
        value.rotation.y,
        value.rotation.z,
        value.rotation.w,
      ),
      1,
      1e-10,
    );
  }

  /**
   * Metre observation precision is independent of authored body size or contact
   * gap.
   */
  function point(id: string, a: IAutoMovieVector3, b: IAutoMovieVector3): void {
    for (const axis of ["x", "y", "z"] as const)
      near(`${id}.${axis}`, a[axis], b[axis], 1e-9);
  }

  /** Keep every numeric assertion on the project's independent nclose seam. */
  function near(
    id: string,
    actual: number,
    expected: number,
    tolerance: number,
  ): void {
    truth(
      `${id}: ${actual} expected ${expected}`,
      nclose(actual, expected, tolerance),
    );
  }

  /** Collect failed assertions so later limbs and concerns remain observable. */
  function truth(id: string, condition: boolean): void {
    try {
      TestValidator.predicate(`${label}: ${id}`, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}

/**
 * Source/current geometry and the four actual world-space foot observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Model contains actual parts/contacts only; Sample adds the complete root, and IFoot distinguishes a distal cap centre from the lowest solid surface in metres.
 * @evidence contracts/development/design.md#principled-representation Existing archetype and transform records describe real input; a readonly limb-keyed map carries independent point/sole measurements without another skeleton or timing schema.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns only the independent test observer's input/output descriptions, sharing bone and model vocabulary with existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source proportions, expected motion sample, clinical bound or terminal-centre contact assumption is encoded in these types.
 */
export namespace animalAttachmentObserver {
  /** Actual model geometry and source contact semantics. */
  export type Model = Pick<AutoMovieArchetype, "parts" | "affordances">;

  /** Actual posed model and its complete world placement. */
  export interface Sample {
    /** Current real primitive parts and contacts. */
    archetype: Model;
    /** Complete model-to-world rigid placement. */
    placement: IAutoMovieTransform;
  }

  /**
   * A terminal control point and actual primitive support, both world-space
   * metres.
   */
  export interface IFoot {
    /** Distal bar cap centre, independently read from its actual transform. */
    point: IAutoMovieVector3;
    /** Lowest world Y of the entire cylinder or capsule, including its radius. */
    soleY: number;
  }
}

/**
 * Index actual ids once without borrowing a producer's rest-joint
 * reconstruction.
 */
function index(
  parts: readonly IAutoMovieModelPart[],
): Map<string, IAutoMovieModelPart> {
  return new Map(
    parts.map((part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
      part.id,
      part,
    ]),
  );
}

/** A missing real bar is a failed scenario, never synthesized geometry. */
function need(
  parts: ReadonlyMap<string, IAutoMovieModelPart>,
  id: string,
): IAutoMovieModelPart {
  const part: IAutoMovieModelPart | undefined = parts.get(id);
  if (part === undefined) throw new Error(`Missing actual part ${id}`);
  return part;
}

/** Only actual transformed primitives can contribute rigid observations. */
function frame(part: IAutoMovieModelPart): IAutoMovieTransform {
  if (part.transform === null || part.transform === undefined)
    throw new Error(`Missing actual transform ${part.id}`);
  return part.transform;
}

/**
 * Cylinder/capsule heights describe their actual centreline segment in the
 * model schema.
 */
function dimensions(part: IAutoMovieModelPart): {
  height: number;
  radius: number;
  capsule: boolean;
} {
  if (
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new Error(`Unsupported actual bar ${part.id}`);
  return {
    height: part.geometry.shape.height,
    radius: part.geometry.shape.radius,
    capsule: part.geometry.shape.type === "capsule",
  };
}

/** A rigid bar's proximal/distal endpoint is its signed rotated half-height. */
function endpoint(part: IAutoMovieModelPart, side: -1 | 1): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(
    frame(part).translation,
    AutoMovieEngineQuaternion.rotateVector(frame(part).rotation, {
      x: 0,
      y: (side * dimensions(part).height) / 2,
      z: 0,
    }),
  );
}

/**
 * Actual parent inverse coordinates remove a complete shared rigid
 * displacement.
 */
function local(
  parent: IAutoMovieTransform,
  value: IAutoMovieVector3,
): IAutoMovieVector3 {
  return AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(parent.rotation),
    AutoMovieEngineVector3.subtract(value, parent.translation),
  );
}

/** Euclidean lengths use raw coordinates rather than solver range calculations. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
