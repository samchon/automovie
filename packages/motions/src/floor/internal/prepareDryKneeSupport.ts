import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { HumanMaterialContact } from "../../posture/HumanMaterialContact";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** A fixed body and its articulated support snapshot at the action's start. */
type Context = Pick<
  IAutoMovieMotionHumanActionContext,
  "body" | "prop" | "start"
>;

/** A potential point of bearing measured on the knee/shin exterior. */
type Measure = NonNullable<IAutoMovieMotionHumanContactWindow["material"]>;

/** Displayed channels needed by the actual knee and shin. */
const CHANNELS: readonly AutoMovieMotionHumanChannel[] = [
  "root",
  "trunk",
  "leftLeg",
  "rightLeg",
];

/** One declared window, prepared to measure its displayed support. */
interface IContact {
  /** The admitted support's frame. */
  window: IAutoMovieMotionHumanContactWindow;
  /** The side bearing. */
  side: AutoMovieHumanSide;
  /** Window bounds on the action clock. */
  from: number;
  to: number;
  /** Read the displayed clearance in the prepared support frame. */
  sample(posture: IAutoMovieMotionHumanPosture): Measure | undefined;
  /** Return the copied point in world metres. */
  world(point: IAutoMovieVector3): IAutoMovieVector3;
  /** World-Y normal component used by the pelvis correction. */
  up: number;
  /** Optional moving finite support. */
  site?: HumanMaterialContact.ISite;
}

/**
 * Measure the held knee/shin exterior at the nominal landing, stance and
 * release of a kneel or crawl. Prepare a small pelvis correction where an
 * actual surface receives it, leaving toe and hand IK goals on their existing
 * targets. The selected surface follows its material frame.
 */
export function prepareDryKneeSupport(
  context: Context,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const contacts: IContact[] = plan.contacts.flatMap(
    (window: IAutoMovieMotionHumanContactWindow): IContact[] => {
      if (
        window.kind !== "bear" ||
        (window.part !== "leftLowerLeg" && window.part !== "rightLowerLeg")
      )
        return [];
      const side: AutoMovieHumanSide =
        window.part === "leftLowerLeg" ? "left" : "right";
      const bone: AutoMovieHumanoidBone = `${side}LowerLeg`;
      const names: ReadonlySet<AutoMovieHumanoidBone> = new Set([bone]);
      const from: number = window.from * plan.duration;
      const to: number = window.to * plan.duration;
      const support: IAutoMovieMotionHumanContactWindow.Support =
        window.support;
      if (support.kind === "ground") {
        const height: number = support.height ?? 0;
        const sample: ReturnType<typeof HumanMaterialContact.prepareFloor> =
          HumanMaterialContact.prepareFloor(context.body, names);
        return [
          {
            window,
            side,
            from,
            to,
            up: 1,
            sample: (
              posture: IAutoMovieMotionHumanPosture,
            ): Measure | undefined => sample(posture, height),
            world: (point: IAutoMovieVector3): IAutoMovieVector3 => ({
              ...point,
              y: height,
            }),
          },
        ];
      }
      if (support.kind !== "prop" || support.point === undefined) return [];
      const site: HumanMaterialContact.ISite | undefined =
        HumanMaterialContact.prepare(
          context.prop(support.subject),
          support.point,
          context.start,
        );
      if (site === undefined) return [];
      const face: HumanMaterialContact.IFace = site.at(context.start);
      const up: number = Quaternion.rotateVectorY(
        face.frame.rotation,
        HumanMaterialContact.NORMAL,
      );
      if (up <= 0) return [];
      const sample: ReturnType<typeof HumanMaterialContact.preparePosture> =
        HumanMaterialContact.preparePosture(context.body, names);
      return [
        {
          window,
          side,
          from,
          to,
          up,
          site,
          sample: (
            posture: IAutoMovieMotionHumanPosture,
          ): Measure | undefined => sample(posture, face),
          world: (point: IAutoMovieVector3): IAutoMovieVector3 =>
            HumanMaterialContact.world(face, point),
        },
      ];
    },
  );
  if (contacts.length === 0) return plan;

  const first: number = Math.min(
    ...contacts.map((contact: IContact): number => contact.from),
  );
  const last: number = Math.max(
    ...contacts.map((contact: IContact): number => contact.to),
  );
  const approach: number = Math.min(0.1, first);
  const release: number = Math.min(0.1, plan.duration - last);
  const height: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: first - approach,
    to: last + release,
    marks: contacts.flatMap((contact: IContact): number[] => [
      contact.from,
      contact.to,
    ]),
    sample: (seconds: number): readonly number[] => {
      const time: number = Math.min(last, Math.max(first, seconds));
      const active: IContact[] = contacts.filter(
        (contact: IContact): boolean =>
          contact.from <= time && time <= contact.to,
      );
      const raw: IAutoMovieMotionHumanPosture = plan.posture(time, CHANNELS);
      let offset: number = 0;
      for (let i: number = 0; i < 3; ++i) {
        const moved: IAutoMovieMotionHumanPosture = translate(raw, offset);
        const clearances: number[] = active.flatMap(
          (contact: IContact): number[] => {
            const result: Measure | undefined = contact.sample(moved);
            return result === undefined ? [] : [result.clearance / contact.up];
          },
        );
        if (clearances.length === 0) break;
        const delta: number = Math.min(...clearances);
        if (Math.abs(delta) < HumanFoot.BEARING / 4) break;
        offset -= delta;
        if (Math.abs(offset) > context.body.measure.shankRadius) return [0];
      }
      const fade: number =
        approach === 0
          ? 1
          : minimumJerk.share((seconds - first + approach) / approach);
      const end: number =
        release === 0 ? 1 : 1 - minimumJerk.share((seconds - last) / release);
      return [offset * fade * end];
    },
    tolerance: { kind: "absolute", absolute: HumanFoot.BEARING / 4 },
    step: 1 / 60,
  });
  const posed = (seconds: number): IAutoMovieMotionHumanPosture =>
    translate(plan.posture(seconds, CHANNELS), height(seconds)[0]!);
  const windows: IAutoMovieMotionHumanContactWindow[] = plan.contacts.flatMap(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow[] => {
      const contact: IContact | undefined = contacts.find(
        (contact: IContact): boolean => contact.window === window,
      );
      if (contact === undefined) return [window];
      return HumanMaterialContact.intervals(
        contact.from,
        contact.to,
        (time: number): number => {
          const candidate: Measure | undefined = contact.sample(posed(time));
          return candidate === undefined
            ? 1
            : Math.abs(candidate.clearance) - HumanFoot.BEARING;
        },
      ).map(
        ({
          from,
          to,
        }: HumanMaterialContact.IInterval): IAutoMovieMotionHumanContactWindow => {
          const posture: IAutoMovieMotionHumanPosture = posed((from + to) / 2);
          const bearing: Measure = contact.sample(posture)!;
          const bones: ReturnType<typeof poseBones> = poseBones(
            context.body,
            resolveHumanPosture(context.body, posture),
          );
          const knee: IAutoMovieVector3 = bones.get(
            `${contact.side}LowerLeg`,
          )!.worldPosition;
          const ankle: IAutoMovieVector3 = bones.get(
            `${contact.side}Foot`,
          )!.worldPosition;
          const point: IAutoMovieVector3 = contact.world(bearing.point);
          const onShin: boolean =
            Vector3.dot(
              Vector3.subtract(point, knee),
              Vector3.normalize(Vector3.subtract(ankle, knee)),
            ) > context.body.measure.shankRadius;
          const region: AutoMovieHumanoidRegion =
            contact.side === "left"
              ? onShin
                ? "shinLeft"
                : "kneeLeft"
              : onShin
                ? "shinRight"
                : "kneeRight";
          return {
            ...window,
            from: from / plan.duration,
            to: to / plan.duration,
            region,
            material: bearing,
          };
        },
      );
    },
  );
  const carrier: HumanMaterialContact.ISite | undefined = contacts[0]?.site;
  const origin: IAutoMovieRigidTransform | undefined = carrier?.at(
    context.start,
  ).frame;
  return {
    ...plan,
    contacts: windows,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      const time: number = args[0];
      const posture: IAutoMovieMotionHumanPosture = translate(
        plan.posture(...args),
        height(time)[0]!,
      );
      return carrier === undefined || origin === undefined
        ? posture
        : carryHumanPosture(
            posture,
            origin,
            carrier.at(context.start + time).frame,
          );
    },
  };
}

/** Translate the pelvis vertically without reauthoring any world IK targets. */
function translate(
  posture: IAutoMovieMotionHumanPosture,
  offset: number,
): IAutoMovieMotionHumanPosture {
  return offset === 0
    ? posture
    : { ...posture, root: { ...posture.root, y: posture.root.y + offset } };
}
