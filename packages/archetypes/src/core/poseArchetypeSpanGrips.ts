import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";

/**
 * Align explicitly held span frames while keeping their carrier origins fixed.
 *
 * @param archetype Producer identity used by a physical refusal.
 * @param spans Declared current spans, with overhang marking their held ends.
 * @param states The corresponding already computed endpoints.
 * @param affordances Current independent contact records before line alignment.
 * @returns Changed held frames and unchanged other contacts, without input
 *   mutation.
 * @throws {AutoMovieArchetypeRefusal} For incompatible shared axes, non-rigid
 *   held frames or a rein whose complete held run does not fit its physical
 *   line.
 */
export function poseArchetypeSpanGrips(
  archetype: string,
  spans: readonly AutoMovieArchetypeSpan.ISpan[],
  states: readonly AutoMovieArchetypeSpan.IState[],
  affordances: IAutoMovieAffordance[],
): IAutoMovieAffordance[] {
  const contacts: Map<string, IAutoMovieAffordance> = new Map(
    affordances.map(
      (contact: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [
        contact.id,
        contact,
      ],
    ),
  );
  const axes: Map<string, IAutoMovieVector3> = new Map();
  for (let index: number = 0; index < spans.length; index++) {
    const current: AutoMovieArchetypeSpan.IState = states[index]!;
    const axis: IAutoMovieVector3 = {
      x: (current.to.x - current.from.x) / current.length,
      y: (current.to.y - current.from.y) / current.length,
      z: (current.to.z - current.from.z) / current.length,
    };
    for (const end of [spans[index]!.from, spans[index]!.to]) {
      if (end.affordance === undefined || end.overhang === undefined) continue;
      const contact: IAutoMovieAffordance = contacts.get(end.affordance)!;
      const previous: IAutoMovieVector3 | undefined = axes.get(end.affordance);
      if (previous !== undefined) {
        const cross: IAutoMovieVector3 = Vector3.cross(previous, axis);
        if (Math.hypot(cross.x, cross.y, cross.z) > 64 * Number.EPSILON)
          refuse(
            end.affordance,
            axis,
            "one held contact cannot follow incompatible span axes",
          );
      }
      if (contact.kind === "rein") {
        const point: IAutoMovieVector3 = contact.frame.translation;
        const held: number = contact.length ?? NaN;
        const before: number = Vector3.dot(
          Vector3.subtract(point, current.from),
          axis,
        );
        const after: number = Vector3.dot(
          Vector3.subtract(current.to, point),
          axis,
        );
        const roundoff: number =
          128 *
          Number.EPSILON *
          Math.max(
            1,
            Math.abs(point.x),
            Math.abs(point.y),
            Math.abs(point.z),
            current.length,
          );
        if (
          !(held > 0) ||
          before < held / 2 - roundoff ||
          after < held / 2 - roundoff
        )
          refuse(
            contact.id,
            contact.length,
            "the complete rein grip must fit on both sides of its hand origin",
          );
      }
      axes.set(end.affordance, axis);
    }
  }
  if (axes.size === 0) return affordances;
  return affordances.map(
    (contact: IAutoMovieAffordance): IAutoMovieAffordance => {
      const line: IAutoMovieVector3 | undefined = axes.get(contact.id);
      if (line === undefined) return contact;
      const q: IAutoMovieAffordance["frame"]["rotation"] =
        contact.frame.rotation;
      const norm: number = Math.hypot(q.x, q.y, q.z, q.w);
      if (
        !(Math.abs(norm - 1) <= 64 * Number.EPSILON) ||
        ![
          contact.frame.scale.x,
          contact.frame.scale.y,
          contact.frame.scale.z,
        ].every((scale: number): boolean => scale === 1)
      )
        refuse(
          contact.id,
          contact.frame,
          "a held span requires a unit-scale rigid grip frame",
        );
      const old: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        contact.frame,
        "x",
      );
      const next: IAutoMovieVector3 =
        Vector3.dot(old, line) < 0 ? Vector3.scale(line, -1) : line;
      return {
        ...contact,
        frame: {
          translation: { ...contact.frame.translation },
          rotation: Quaternion.normalize(
            Quaternion.multiply(rotationBetween(old, next), q),
          ),
          scale: { ...contact.frame.scale },
        },
      };
    },
  );

  /**
   * The original request identifies an unsupported physical held-line
   * condition.
   */
  function refuse(id: string, value: unknown, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: id,
      value,
      feasible: null,
      reason,
      fix: "keep each held run inside its actual line and use compatible rigid grip frames",
    });
  }
}
