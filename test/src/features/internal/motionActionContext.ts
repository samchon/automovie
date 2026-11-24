import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanSkill,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";

/**
 * A typed synthetic action context for a unit test of one law's plan: a trained
 * performer standing at rest at a floor point and heading, both feet planted on
 * the ground, holding nothing, at the take's start. Draws come from the
 * performer's own keyed streams (`HumanSkill.stream`), so a seed fixes them. A
 * world point is aimed at as itself; any other target, another performer, a
 * prop, a meeting or a placed action is refused, since a unit reads its law
 * alone.
 *
 * @param body The performer's body.
 * @param params The law's parameters.
 * @param options Where the performer stands, its heading, the seed and the
 *   action's start; the origin, +Z, `"unit"` and 0 when absent.
 * @returns The context.
 */
export function motionActionContext<P extends object>(
  body: IAutoMovieMotionHumanBody,
  params: P,
  options: motionActionContext.IOptions = {},
): IAutoMovieMotionHumanActionContext<P> {
  type IPartner = motionActionContext.IPartner;
  const at: IAutoMovieVector3 = options.at ?? { x: 0, y: 0, z: 0 };
  const yaw: number = options.yaw ?? 0;
  const subject: string = options.subject ?? "a";
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "trained" },
    options.seed ?? "unit",
  );
  const posture: IAutoMovieMotionHumanPosture =
    options.posture ?? stand.posture(body, at, yaw);
  const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
  const bones: ReturnType<typeof poseBones> = poseBones(body, pose);
  const rest: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const foot = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanEntryState.IFoot => {
    const bone: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return {
      ankle: bone.worldPosition,
      rotation: bone.worldRotation,
      planted: true,
      velocity: rest,
      acceleration: rest,
      spin: rest,
    };
  };
  const refuse = (what: string): never => {
    throw new Error(`A unit context reads no ${what}`);
  };
  const props = (name: string): IAutoMovieMotionHumanProp =>
    options.props?.find(
      (prop: IAutoMovieMotionHumanProp): boolean => prop.subject === name,
    ) ?? refuse(`prop ${name}`);
  const performer = (name: string): IAutoMovieMotionHumanPerformerReader => {
    const other: IPartner =
      options.partners?.find((p: IPartner): boolean => p.subject === name) ??
      refuse(`performer ${name}`);
    const at = (seconds: number): IAutoMovieMotionHumanPosture =>
      other.plan.posture(Math.min(other.plan.duration, Math.max(0, seconds)));
    return {
      body: other.body,
      bones: (seconds: number) =>
        poseBones(other.body, resolveHumanPosture(other.body, at(seconds))),
      root: (seconds: number) => ({
        position: at(seconds).root,
        yaw: at(seconds).yaw,
      }),
      posture: at,
    };
  };
  return {
    subject,
    body,
    params,
    skill,
    entry: {
      seconds: options.start ?? 0,
      pose,
      velocity: {
        joints: new Map(),
        spins: new Map(),
        linear: options.velocity ?? rest,
        angular: rest,
      },
      acceleration: rest,
      posture,
      feet: { left: foot("left"), right: foot("right") },
      supports: (["leftFoot", "rightFoot"] as const).map(
        (
          part: "leftFoot" | "rightFoot",
        ): IAutoMovieMotionHumanEntryState.ISupport => ({
          part,
          kind: "plant",
          support: { kind: "ground" },
        }),
      ),
      base: options.base ?? { kind: "standing" },
      holds: {},
      uses: {},
    },
    start: options.start ?? 0,
    aim: (target: IAutoMovieMotionTarget, seconds: number) => {
      if (target.kind === "point" && target.frame === "world")
        return { point: target.at, normal: { x: 0, y: 1, z: 0 } };
      if (target.kind === "person") {
        const other: IAutoMovieMotionHumanPerformerReader = performer(
          target.subject,
        );
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          other.body.surfaces.regions[target.region];
        return resolveAutoMovieHumanoidSurfaces.pointNormal(
          frame,
          other.bones(seconds).get(frame.bone)!,
        );
      }
      if (target.kind !== "prop") return refuse(`${target.kind} target`);
      const prop: IAutoMovieMotionHumanProp = props(target.subject);
      const frame: IAutoMovieRigidTransform =
        prop.motion?.(seconds) ?? prop.frame;
      const local: IAutoMovieMotionHumanProp["points"][string] | undefined =
        prop.points[target.point];
      if (local === undefined) return refuse(`point ${target.point}`);
      return {
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, local.point),
        ),
        normal: Quaternion.rotateVector(frame.rotation, local.normal),
      };
    },
    action: (): never => refuse("placed action"),
    performer: (name: string): IAutoMovieMotionHumanPerformerReader =>
      performer(name),
    prop: (name: string): IAutoMovieMotionHumanPropReader => {
      const prop: IAutoMovieMotionHumanProp = props(name);
      return {
        prop,
        frame: (seconds: number): IAutoMovieRigidTransform =>
          prop.motion?.(seconds) ?? prop.frame,
      };
    },
    meeting: (): never => refuse("meeting"),
    cue: () => [],
    obstacles: () => [],
    random: (channel: string) =>
      HumanSkill.stream(skill, subject, "unit", 1, channel),
    series: (channel: string) => ({
      random: HumanSkill.series(skill, subject, "unit", channel),
      index: 1,
    }),
  };
}

/** The options of {@link motionActionContext}. */
export namespace motionActionContext {
  /**
   * The context of an action entered where a plan ends: its last posture, on
   * the base it declares (standing when it declares none).
   *
   * @param body The performer's body.
   * @param before The plan the action follows.
   * @param params The law's parameters.
   * @param options The props and the seed, as {@link motionActionContext} takes
   *   them.
   * @returns The context.
   */
  export function after<P extends object>(
    body: IAutoMovieMotionHumanBody,
    before: IAutoMovieMotionHumanActionPlan,
    params: P,
    options: Omit<IOptions, "posture" | "base"> = {},
  ): IAutoMovieMotionHumanActionContext<P> {
    return motionActionContext(body, params, {
      ...options,
      posture: before.posture(before.duration),
      base: before.base ?? { kind: "standing" },
    });
  }

  /** Another performer: its subject, body and plan, read on the same clock. */
  export interface IPartner {
    /** Its subject. */
    subject: string;

    /** Its body. */
    body: IAutoMovieMotionHumanBody;

    /** What it does. */
    plan: IAutoMovieMotionHumanActionPlan;
  }

  /** Where and how the performer enters. */
  export interface IOptions {
    /** The floor point it stands at; the origin when absent. */
    at?: IAutoMovieVector3;

    /** Its heading, degrees; +Z (0) when absent. */
    yaw?: number;

    /** The posture it enters in; its quiet stance there when absent. */
    posture?: IAutoMovieMotionHumanPosture;

    /** The base it enters on; standing when absent. */
    base?: IAutoMovieMotionHumanBase;

    /** Its subject; `"a"` when absent. */
    subject?: string;

    /** The props in the scene, standing where their frames put them. */
    props?: readonly IAutoMovieMotionHumanProp[];

    /** The other performers, each by its subject, body and plan. */
    partners?: readonly IPartner[];

    /** The root's velocity at entry, m/s; at rest when absent. */
    velocity?: IAutoMovieVector3;

    /** The chain seed; `"unit"` when absent. */
    seed?: string;

    /** The action's film start, seconds; 0 when absent. */
    start?: number;
  }
}
