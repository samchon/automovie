import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { HUMAN_BODY_EXTERIOR_GAPS } from "./surface/HUMAN_BODY_EXTERIOR_GAPS";
import { HUMAN_BODY_EXTERIOR_TARGETS } from "./surface/HUMAN_BODY_EXTERIOR_TARGETS";

/**
 * Admit the anatomical measurements a body document carries against the
 * product path that consumes them.
 *
 * Every supplied measurement must be fulfilled, never silently kept:
 *
 * - an observed value refuses as `acquisition-not-registered`, since no
 *   acquisition posture, plane or site is registered on the source skin;
 * - a path `HUMAN_BODY_EXTERIOR_TARGETS` binds is admitted, but its solving
 *   channel must not also appear in `shape`, because one value would then
 *   have two authorities;
 * - a humeral or femoral sphere-fitted head radius is admitted for the
 *   articular inspection (`createHumanBodyAnatomicalInspection`);
 * - a path `HUMAN_BODY_EXTERIOR_GAPS` lists refuses with that gap's reason;
 * - any other path (a bone, muscle or tissue measurement, or a surface
 *   quantity without a binding) refuses as having no consumer, since the
 *   part it describes is not generated.
 *
 * The caller's document is not changed.
 *
 * @evidence contracts/common.md#principled-implementation The target and gap tables are the only authorities for what a supplied path means.
 * @evidence contracts/common.md#clear-and-simple-design One walk of the supplied tree with four outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is kept without a consumer and no channel has two authorities.
 * @evidence contracts/common.md#meaningful-documentation States each refusal and its reason.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels A bound channel is solved from its measurement and cannot be authored beside it.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The tables own the definitions and reasons.
 * @evidence contracts/anatomy.md#permitted-range Unconsumable and unregistered values refuse by path with their cause, leaving the document unchanged.
 * @evidence contracts/anatomy.md#parametric-authority Only named anatomical measurements with a consumer are admitted.
 * @author Samchon
 */
export function admitHumanBodyDocumentAnatomy(
  anatomy: IAutoMovieHumanBodyAnatomicalMeasurements,
  shape: Readonly<Record<string, number>>,
): void {
  const walk = (node: unknown, at: string): void => {
    // a scalar choice such as a phalangeal pattern describes an
    // ungenerated part as much as a measurement does
    if (typeof node !== "object" || node === null)
      throw new Error(`anatomy.${at} has no consumer: the part or quantity it describes is not generated.`);
    if (!Object.hasOwn(node, "kind")) {
      for (const [key, child] of Object.entries(node))
        if (child !== undefined) walk(child, at === "" ? key : at + "." + key);
      return;
    }
    if ((node as Record<string, unknown>).kind === "observed")
      throw new Error(`acquisition-not-registered:anatomy.${at} (posture, plane and site)`);
    const bound = HUMAN_BODY_EXTERIOR_TARGETS.find((target) => target.path === at);
    if (bound !== undefined) {
      if (Object.hasOwn(shape, bound.channel))
        throw new Error(`The body channel ${bound.channel} is solved from anatomy.${at} and cannot also be authored in shape.`);
      return;
    }
    // sphere-fitted head radii are the articular inspection's inputs
    if (/^(left|right)(UpperLimb\.upperArm\.humerus|LowerLimb\.thigh\.femur)\.sphereFittedHeadRadius$/u.test(at)) return;
    const gap = HUMAN_BODY_EXTERIOR_GAPS.find((one) => one.path === at);
    if (gap !== undefined) throw new Error(`${gap.reason}:anatomy.${at} ${gap.detail}`);
    throw new Error(`anatomy.${at} has no consumer: the part or quantity it describes is not generated.`);
  };
  walk(anatomy, "");
}
