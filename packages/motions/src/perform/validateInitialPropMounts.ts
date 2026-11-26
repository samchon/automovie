import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieConstraintViolation,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Admit initial rigid prop mounts before the performance needs any prop frames.
 *
 * @param props Performance props by subject.
 * @throws {HumanRefusal} An authority conflict, missing carrier or socket,
 *   invalid offset or mount cycle.
 */
export function validateInitialPropMounts(
  props: ReadonlyMap<string, IAutoMovieMotionHumanProp>,
): void {
  const verified: Set<string> = new Set();
  for (const start of props.values()) {
    if (start.mounted === undefined || verified.has(start.subject)) continue;
    const path: Set<string> = new Set();
    let prop: IAutoMovieMotionHumanProp = start;
    while (prop.mounted !== undefined && !verified.has(prop.subject)) {
      const mount: IAutoMovieMotionHumanProp.IMounted = prop.mounted;
      const axis: string = `props.${prop.subject}.mounted`;
      if (path.has(prop.subject))
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value: [...path, prop.subject],
          reason: `initial mounts return to ${prop.subject}`,
          fix: "break the chain at a prop with an independent placement",
        });
      path.add(prop.subject);

      if (
        prop.worn !== undefined ||
        prop.motion !== undefined ||
        prop.fixed === true ||
        prop.soft !== undefined
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value: mount,
          reason: `${prop.subject} must be rigid and have one initial placement authority`,
          fix: "use either the socket mount or the conflicting prop declaration",
        });

      const parent: IAutoMovieMotionHumanProp | undefined = props.get(
        mount.prop,
      );
      if (parent === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: `${axis}.prop`,
          value: mount.prop,
          reason: `no prop is named ${mount.prop}`,
          fix: "name a prop declared in this performance",
        });
      if (
        !parent.affordances?.some(
          (point: IAutoMovieAffordance): boolean => point.id === mount.point,
        )
      )
        throw new HumanRefusal({
          kind: "affordance",
          axis: `${axis}.point`,
          value: mount.point,
          reason: `${parent.subject} does not declare an affordance named ${mount.point}`,
          fix: "name a declared affordance on the supporting prop",
        });

      const frame: IAutoMovieRigidTransform = mount.offset;
      const admission: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
      admission.unitQuaternion(
        `${axis}.offset.rotation`,
        frame.rotation,
        "rotation",
      );
      if (admission.items.length !== 0)
        throw new HumanRefusal({
          kind: "parameter",
          axis: `${axis}.offset`,
          value: frame,
          reason: admission.items
            .map((item: IAutoMovieConstraintViolation): string => item.expected)
            .join(", "),
          fix: "give a finite offset position and a unit rotation",
        });
      prop = parent;
    }
    for (const subject of path) verified.add(subject);
  }
}
