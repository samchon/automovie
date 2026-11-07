import {
  type AutoMovieMotionAudit as Audit,
  type AutoMoviePhysicsCache as Cache,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { filmHeadGuardPoint } from "../motion/rig/filmHeadGuardPoint";
import { Strike } from "../motion/striking/Strike";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";

/** Check the actual displayed gloves throughout every kick at the declared cache rate. This film promise measures height coverage and forward intent without altering poses, fitting targets or claiming physical impulses. */
export function auditBoutGuard(input: {
  /** Actual provider collision descriptions; this check reads only their segments. */ profiles: Readonly<
    Record<"a" | "b", Pick<P, "segments">>
  >;
  /** Actual displayed state on the absolute film clock. */ at: (
    seconds: number,
  ) => Cache.IFrame;
  /** Admitted available absolute interval. */ start: number;
  end: number;
  /** Positive cache sampling frequency, Hz. */ rate: number;
  /** Declared authored facing on the mat, expressed as a horizontal world unit direction. */ facing: (
    actor: "a" | "b",
    seconds: number,
  ) => IAutoMovieVector3;
}): { samples: number; findings: Audit.IFinding[] } {
  if (
    ![input.start, input.end, input.rate].every(Number.isFinite) ||
    input.end < input.start ||
    input.rate <= 0
  )
    throw new Error("Invalid guard audit interval");
  const findings: Audit.IFinding[] = [];
  const seen: Set<string> = new Set();
  let samples: number = 0;
  for (const action of BoutScript.actions.filter(
    (candidate: BoutScript.Action): boolean =>
      BoutScript.specs[candidate.technique].guard === "forward",
  )) {
    const [start, end]: readonly [number, number] = Strike.window(action);
    const first: number = Math.max(
      0,
      Math.ceil((start - input.start) * input.rate),
    );
    const last: number = Math.min(
      Math.floor((input.end - input.start) * input.rate),
      Math.floor((end - input.start) * input.rate),
    );
    for (let tick: number = first; tick <= last; tick++) {
      const seconds: number = input.start + tick / input.rate;
      const key: string = `${action.actor}/${tick}`;
      if (seen.has(key)) continue;
      seen.add(key);
      samples++;
      const states: Record<string, Cache.ISegment> =
        input.at(seconds).bodies[action.actor]!;
      const profile: Pick<P, "segments"> = input.profiles[action.actor];
      const center: ReturnType<typeof filmHeadGuardPoint> = filmHeadGuardPoint(
        profile,
        states.head!,
      );
      const head: number = center[1];
      const forward: IAutoMovieVector3 = input.facing(action.actor, seconds);
      if (
        forward.y !== 0 ||
        ![forward.x, forward.z].every(Number.isFinite) ||
        !(Math.hypot(forward.x, forward.z) > 0)
      )
        throw new Error(
          "Guard audit needs the film's finite horizontal facing direction",
        );
      const heading: number = Math.atan2(-forward.z, forward.x);
      const inverseHeading: P.ITransform["rotation"] = {
        x: 0,
        y: -Math.sin(heading / 2),
        z: 0,
        w: Math.cos(heading / 2),
      };
      const headInFacingFrame: P.ITransform = {
        position: Quaternion.rotateVector(
          inverseHeading,
          states.head!.position,
        ),
        rotation: Quaternion.multiply(inverseHeading, states.head!.rotation),
      };
      const headFront: number = Math.max(
        ...profile.segments
          .find((segment: P.ISegment): boolean => segment.bone === "head")!
          .shapes.map(
            (shape: P.IShape): number =>
              physicalShapeBounds(headInFacingFrame, shape).max.x,
          ),
      );
      for (const side of ["left", "right"] as const) {
        const bone: string = `${side}Hand`;
        const shape: P.IShape = profile.segments
          .find((segment: P.ISegment): boolean => segment.bone === bone)!
          .shapes.find(
            (candidate: P.IShape): boolean => candidate.material === "glove",
          )!;
        if (shape.kind !== "sphere")
          throw new Error("Guard audit requires the actual film glove sphere");
        const point: IAutoMovieVector3 = physicalSupportPoint(
          states[bone]!,
          shape.transform.position,
        );
        const vertical: number = Math.abs(point.y - head);
        const limit: number = shape.radius + Settings.contactTolerance;
        if (vertical > limit)
          findings.push({
            seconds,
            body: action.actor,
            label: `${side}-guard-head-height`,
            kind: "goal",
            actual: vertical,
            limit,
          });
        if (side === BoutScript.specs[action.technique].side) {
          const extension: number =
            Vector3.dot(point, Vector3.normalize(forward)) - headFront;
          const minimum: number =
            (2 * Strike.kickGuardWeight(action, seconds) - 1) * shape.radius;
          if (extension < minimum - Settings.contactTolerance)
            findings.push({
              seconds,
              body: action.actor,
              label: `${side}-guard-forward`,
              kind: "distance",
              actual: extension,
              limit: minimum,
            });
        }
      }
    }
  }
  return { samples, findings };
}
