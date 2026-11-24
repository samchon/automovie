import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanSkill,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";

/**
 * A typed synthetic action context for a unit test of one law's plan: a
 * trained performer standing at rest at a floor point and heading, both feet
 * planted on the ground, holding nothing, at the take's start. Draws come from
 * the performer's own keyed streams (`HumanSkill.stream`), so a seed fixes
 * them. A world point is aimed at as itself; any other target, another
 * performer, a prop, a meeting or a placed action is refused, since a unit
 * reads its law alone.
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
  const foot = (side: AutoMovieHumanSide): IAutoMovieMotionHumanEntryState.IFoot => {
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
        linear: rest,
        angular: rest,
      },
      acceleration: rest,
      posture,
      feet: { left: foot("left"), right: foot("right") },
      supports: (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanEntryState.ISupport => ({
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
    aim: (target: IAutoMovieMotionTarget) =>
      target.kind === "point" && target.frame === "world"
        ? { point: target.at, normal: { x: 0, y: 1, z: 0 } }
        : refuse(`${target.kind} target`),
    action: (): never => refuse("placed action"),
    performer: (): never => refuse("other performer"),
    prop: (): never => refuse("prop"),
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

    /** The chain seed; `"unit"` when absent. */
    seed?: string;

    /** The action's film start, seconds; 0 when absent. */
    start?: number;
  }
}
