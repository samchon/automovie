import {
  type IAutoMovieFormationPlacement,
  validateAutoMovieFormationOverlap,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieDiagnostic,
  IAutoMovieFormationMotion,
  IAutoMovieFormationSlotMotion,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** One staged unit as the overlap gate reads it: a placement and its tiers. */
interface IFormationOverlapTier {
  model: string;
}
interface IUnit extends IAutoMovieFormationPlacement {
  lod: ReadonlyArray<IFormationOverlapTier>;
}

interface IFormationPostInput {
  id: string;
  radius: number;
  height?: number;
  lift?: number;
}

interface IFormationRowInput {
  id?: string;
  count?: number;
  spacing: number;
  model?: string;
  anchor?: IAutoMovieVector3;
}

interface IFormationTieredInput {
  id: string;
  models: string[];
  anchor?: IAutoMovieVector3;
}

interface IFormationFileInput {
  id?: string;
  count: number;
  spacing: number;
  anchor: IAutoMovieVector3;
}

interface IFormationCarryInput {
  formation: string;
  from: number;
  to: number;
}

interface IFormationCloseInput {
  formation: string;
  scale: number;
}

interface IFormationRemoveInput {
  formation: string;
  slots: number[];
}

interface IFormationJudgeInput {
  models: readonly IAutoMovieModel[];
  formations: readonly IUnit[];
  formationMotions?: readonly IAutoMovieFormationMotion[];
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
}

interface IFormationCodesInput {
  models: readonly IAutoMovieModel[];
  formations: readonly IUnit[];
  formationMotions?: readonly IAutoMovieFormationMotion[];
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
}

/** The existing placement, model and motion constructors used by the original overlap scenario. */
export const createFormationOverlapScenario = () => {
  /** A transform with a stated translation and nothing else changed. */
  const at = (x: number, y: number, z: number): IAutoMovieTransform => ({
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

  /**
   * One member-shaped runtime: a plain upright post two metres tall.
   *
   * A cylinder on the model's own origin, so its column is exactly its radius and
   * exactly its height, and every number a case asserts can be read off the
   * geometry rather than out of the gate.
   */
  const post = (props: IFormationPostInput): IAutoMovieModel => ({
    id: props.id,
    name: null,
    origin: "generated",
    parts: [
      {
        id: "body",
        name: null,
        geometry: {
          type: "primitive",
          shape: {
            type: "cylinder",
            radius: props.radius,
            height: props.height ?? 2,
          },
        },
        material: null,
        attachedBone: null,
        transform: props.lift === undefined ? null : at(0, props.lift, 0),
      },
    ],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  });

  /** One row of members, evenly spaced across a stated interval. */
  const row = (props: IFormationRowInput): IUnit => {
    const count = props.count ?? 4;
    return {
      id: props.id ?? "crowd",
      count,
      layout: {
        kind: "line",
        ranks: 1,
        files: count,
        spacing: { lateral: props.spacing, depth: props.spacing },
      },
      anchor: props.anchor ?? { x: 0, y: 0, z: 0 },
      facingDeg: 0,
      seed: 0,
      lod: [{ model: props.model ?? "post" }],
    };
  };

  /**
   * One unit whose members may be drawn as any of several stated runtimes.
   *
   * Which tier a member is drawn at is the camera's decision, so a unit that
   * carries more than one is a unit whose real size is a range rather than a
   * number, and the refusal has to hold whichever end of it the camera picks.
   */
  const tiered = (props: IFormationTieredInput): IUnit => ({
    ...row({ id: props.id, count: 1, spacing: 1, anchor: props.anchor }),
    lod: props.models.map((model) => ({ model })),
  });

  /** One file of members, one behind the other along +z from a stated anchor. */
  const file = (props: IFormationFileInput): IUnit => ({
    id: props.id ?? "crowd",
    count: props.count,
    layout: {
      kind: "line",
      ranks: props.count,
      files: 1,
      spacing: { lateral: props.spacing, depth: props.spacing },
    },
    anchor: props.anchor,
    facingDeg: 0,
    seed: 0,
    lod: [{ model: "post" }],
  });

  /** One unit far larger than the number of members the gate will measure. */
  const host = (count: number): IUnit => ({
    id: "host",
    count,
    layout: {
      kind: "line",
      ranks: 1,
      files: count,
      spacing: { lateral: 1, depth: 1 },
    },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 0,
    lod: [{ model: "post" }],
  });

  /** Where slot `slot` of {@link host} stands, from its layout alone. */
  const hostSlotX = (count: number, slot: number): number =>
    slot - (count - 1) / 2;

  /** One cue carrying a unit from one place to another along `x`. */
  const carry = (props: IFormationCarryInput): IAutoMovieFormationMotion => ({
    id: `${props.formation}-carry`,
    formation: props.formation,
    action: "advance",
    start: 1,
    end: 3,
    from: {
      translation: { x: props.from, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: props.to, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    easing: "linear",
  });

  /** One cue closing a unit's own intervals to a stated fraction of themselves. */
  const close = (props: IFormationCloseInput): IAutoMovieFormationMotion => ({
    ...carry({ formation: props.formation, from: 0, to: 0 }),
    to: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: props.scale, depth: props.scale },
    },
  });

  /**
   * Cues of a unit nobody stages, purely to spend the shot's sampling budget.
   *
   * Every cue end is a time the shot certainly holds and is therefore always
   * sampled; whatever is left of the budget fills the gaps between them. Eight of
   * these put nineteen ends on the clock, which is more than the budget itself,
   * so nothing is left for the interior and the walk reads the ends alone.
   */
  const filler = (count: number): IAutoMovieFormationMotion[] =>
    Array.from({ length: count }, (_unused, index) => ({
      ...carry({ formation: "elsewhere", from: 0, to: 0 }),
      id: `filler-${index}`,
      start: 4 + index * 2,
      end: 5 + index * 2,
    }));

  /** One cue taking named members out of the shot for the whole of it. */
  const remove = (
    props: IFormationRemoveInput,
  ): IAutoMovieFormationSlotMotion => ({
    id: `${props.formation}-remove`,
    formation: props.formation,
    slots: props.slots,
    start: 0,
    end: 4,
    from: {
      present: false,
      offset: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
    },
    to: {
      present: false,
      offset: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
    },
    easing: "linear",
  });

  const judge = (props: IFormationJudgeInput): IAutoMovieDiagnostic[] =>
    validateAutoMovieFormationOverlap({ id: "opening" }, props);

  const codes = (props: IFormationCodesInput): string[] =>
    judge(props).map((diagnostic) => diagnostic.code);

  /** The time a refusal names, as the refusal itself spells it. */
  const sampledTime = (diagnostics: readonly IAutoMovieDiagnostic[]): string =>
    /at ([0-9.]+)s/u.exec(diagnostics[0]?.message ?? "")?.[1] ?? "";

  /** One bone at a stated place, so a chain can be built out of order. */
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    place: IAutoMovieTransform,
  ): NonNullable<IAutoMovieModel["skeleton"]>["bones"][number] => ({
    bone: name,
    parent,
    rest: place,
    constraint: null,
  });

  return {
    at,
    post,
    row,
    tiered,
    file,
    host,
    hostSlotX,
    carry,
    close,
    filler,
    remove,
    judge,
    codes,
    sampledTime,
    bone,
  };
};
