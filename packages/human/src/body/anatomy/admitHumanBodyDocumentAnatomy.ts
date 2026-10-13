import type { IAutoMovieHumanBodyAnatomicalAssembly } from "./assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodySourcePart } from "./assembly/IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourceVolumeBinding } from "./assembly/IAutoMovieHumanBodySourceVolumeBinding";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { HUMAN_BODY_EXTERIOR_GAPS } from "./surface/HUMAN_BODY_EXTERIOR_GAPS";
import { HUMAN_BODY_EXTERIOR_TARGETS } from "./surface/HUMAN_BODY_EXTERIOR_TARGETS";

type RegisteredQuantityBinding = {
  part: IAutoMovieHumanBodySourcePart;
  binding: IAutoMovieHumanBodySourceVolumeBinding;
};

/**
 * Admit the anatomical measurements a body document carries against the product path that consumes them.
 *
 * Every supplied measurement must be fulfilled, never silently kept:
 *
 * - an exact loaded-source quantity binding admits its actual compartment, unit, protocol and target field. A registered observed record reaches raw/acquisition-availability reporting without changing geometry;
 * - an unregistered observed value refuses as `acquisition-not-registered`, since no acquisition posture, plane or site is registered on the source;
 * - a path `HUMAN_BODY_EXTERIOR_TARGETS` binds is admitted, but its solving channel must not also appear in `shape`, because one value would then have two authorities;
 * - a humeral or femoral sphere-fitted head radius is admitted for the articular inspection (`createHumanBodyAnatomicalInspection`);
 * - a path `HUMAN_BODY_EXTERIOR_GAPS` lists refuses with that gap's reason;
 * - any other path (a bone, muscle or tissue measurement, or a surface quantity without a binding) refuses as having no consumer, since the part it describes is not generated.
 *
 * The caller's document is not changed.
 *
 * @evidence contracts/common.md#principled-implementation Recursive own-entry traversal classifies admitted measurement records by their consuming path; volume bindings preserve source compartment ownership and unsupported observations refuse without modifying inputs.
 * @evidence contracts/common.md#clear-and-simple-design Admission stays separate from anatomy generation so a stored measurement cannot silently survive without a producer; exterior channels and source quantities retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four sphere-radius paths are admitted because the articular inspector consumes them; registered observations report acquisition availability without fabricating a measured body.
 * @evidence contracts/common.md#meaningful-documentation The comment enumerates accepted binding classes, conflicting shape authority, unavailable acquisition registration and the unchanged caller document.
 * @evidence contracts/performance.md#efficient-algorithms A per-call path index scans B source bindings once and gives expected constant-time lookup for L measurement leaves; exterior-table scans and compartment member checks retain their own row costs. The index uses O(B) entries and traversal uses ancestry depth.
 * @evidence contracts/performance.md#reuse-equivalent-work All leaves share the current call's source-binding index; duplicate owners remain ordered arrays and refuse only at the same visited measurement path. A later call rebuilds the index because caller-owned source records can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The binding index and recursive ancestry are call-local and become collectible on return or refusal; referenced source parts remain caller-owned and no persistent source registry or external handle is acquired.
 */
export function admitHumanBodyDocumentAnatomy(
  anatomy: IAutoMovieHumanBodyAnatomicalMeasurements,
  shape: Readonly<Record<string, number>>,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): void {
  const bindings: Map<string, RegisteredQuantityBinding[]> = new Map();
  for (const part of source?.parts ?? [])
    for (const binding of part.quantityBindings ?? []) {
      const registered: RegisteredQuantityBinding[] = bindings.get(binding.path) ?? [];
      registered.push({ part, binding });
      bindings.set(binding.path, registered);
    }
  const walk: (node: unknown, at: string) => void = (node: unknown, at: string): void => {
    // a scalar choice such as a phalangeal pattern describes an
    // ungenerated part as much as a measurement does
    if (typeof node !== "object" || node === null)
      throw new Error(
        `anatomy.${at} has no consumer: the part or quantity it describes is not generated.`,
      );
    if (!Object.hasOwn(node, "kind")) {
      for (const [key, child] of Object.entries(node))
        if (child !== undefined) walk(child, at === "" ? key : at + "." + key);
      return;
    }
    const registered: RegisteredQuantityBinding[] = bindings.get(at) ?? [];
    if (registered.length > 1)
      throw new Error(`anatomy.${at} has ambiguous source quantity ownership.`);
    if (registered.length === 1) {
      const { part, binding }: RegisteredQuantityBinding = registered[0];
      if (
        !("millilitres" in node) ||
        typeof node.millilitres !== "number" ||
        !Number.isFinite(node.millilitres) ||
        node.millilitres <= 0 ||
        binding.sourceProtocol.trim() === "" ||
        binding.targetCondition.trim() === "" ||
        binding.members.length === 0 ||
        new Set(binding.members).size !== binding.members.length ||
        binding.members.some(
          (member: string): boolean => !part.surfaces.some((surface: IAutoMovieHumanBodySourcePart["surfaces"][number]): boolean => surface.id === member),
        )
      )
        throw new Error(`source-volume-binding-unavailable:anatomy.${at}`);
      if (
        (node as Record<string, unknown>).kind === "target" &&
        !part.shapeFields?.some((field: NonNullable<IAutoMovieHumanBodySourcePart["shapeFields"]>[number]): boolean => field.id === binding.field)
      )
        throw new Error(`source-shape-field-unavailable:anatomy.${at}`);
      return;
    }
    if ((node as Record<string, unknown>).kind === "observed")
      throw new Error(
        `acquisition-not-registered:anatomy.${at} (posture, plane and site)`,
      );
    const bound: (typeof HUMAN_BODY_EXTERIOR_TARGETS)[number] | undefined = HUMAN_BODY_EXTERIOR_TARGETS.find(
      (target: (typeof HUMAN_BODY_EXTERIOR_TARGETS)[number]): boolean => target.path === at,
    );
    if (bound !== undefined) {
      if (Object.hasOwn(shape, bound.channel))
        throw new Error(
          `The body channel ${bound.channel} is solved from anatomy.${at} and cannot also be authored in shape.`,
        );
      return;
    }
    // sphere-fitted head radii are the articular inspection's inputs
    if (
      /^(left|right)(UpperLimb\.upperArm\.humerus|LowerLimb\.thigh\.femur)\.sphereFittedHeadRadius$/u.test(
        at,
      )
    )
      return;
    const gap: (typeof HUMAN_BODY_EXTERIOR_GAPS)[number] | undefined = HUMAN_BODY_EXTERIOR_GAPS.find((one: (typeof HUMAN_BODY_EXTERIOR_GAPS)[number]): boolean => one.path === at);
    if (gap !== undefined)
      throw new Error(`${gap.reason}:anatomy.${at} ${gap.detail}`);
    throw new Error(
      `anatomy.${at} has no consumer: the part or quantity it describes is not generated.`,
    );
  };
  walk(anatomy, "");
}
