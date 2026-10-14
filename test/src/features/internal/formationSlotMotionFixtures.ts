import {
  type IAutoMovieFormationPlacement,
  validateAutoMovieFormationGround,
  validateAutoMovieFormationSlotMotions,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieDiagnostic,
  IAutoMovieFormationMotionState,
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationSlotState,
  IAutoMovieShotContract,
  IAutoMovieSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Original square floor centered at the origin, with the supplied half extent. */
const field: (half: number) => IAutoMovieSpace = (
  half: number,
): IAutoMovieSpace => ({
  id: "field",
  surfaces: [
    {
      id: "ground",
      kind: "floor",
      polygon: [
        { x: -half, y: 0, z: -half },
        { x: half, y: 0, z: -half },
        { x: half, y: 0, z: half },
        { x: -half, y: 0, z: half },
      ],
      anchor: { x: 0, y: 0, z: 0 },
      rampTo: null,
    },
  ],
  walkable: ["ground"],
});

/** Original crossed walkable arms: both diagonal endpoints stand on floor while their connecting path crosses the missing quadrant. */
const crossroads: (arm: number, halfWidth: number) => IAutoMovieSpace = (
  arm: number,
  halfWidth: number,
): IAutoMovieSpace => ({
  id: "crossroads",
  surfaces: [
    {
      id: "north-road",
      kind: "floor",
      polygon: [
        { x: -halfWidth, y: 0, z: -arm },
        { x: halfWidth, y: 0, z: -arm },
        { x: halfWidth, y: 0, z: arm },
        { x: -halfWidth, y: 0, z: arm },
      ],
      anchor: { x: 0, y: 0, z: 0 },
      rampTo: null,
    },
    {
      id: "east-road",
      kind: "floor",
      polygon: [
        { x: -arm, y: 0, z: -halfWidth },
        { x: arm, y: 0, z: -halfWidth },
        { x: arm, y: 0, z: halfWidth },
        { x: -arm, y: 0, z: halfWidth },
      ],
      anchor: { x: 0, y: 0, z: 0 },
      rampTo: null,
    },
  ],
  walkable: ["north-road", "east-road"],
});

/** Original three-abreast one-meter formation with caller-supplied count and anchor; no member appearance is encoded. */
const unit: (
  count: number,
  anchor?: IAutoMovieVector3,
) => IAutoMovieFormationPlacement = (
  count: number,
  anchor: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
): IAutoMovieFormationPlacement => ({
  id: "crowd",
  count,
  layout: {
    kind: "line",
    files: 3,
    ranks: Math.ceil(count / 3),
    spacing: { lateral: 1, depth: 1 },
  },
  anchor,
  facingDeg: 0,
  seed: 4,
});

/** Original single-member formation at the supplied anchor. */
const alone: (anchor: IAutoMovieVector3) => IAutoMovieFormationPlacement = (
  anchor: IAutoMovieVector3,
): IAutoMovieFormationPlacement => ({
  id: "crowd",
  count: 1,
  layout: {
    kind: "line",
    files: 1,
    ranks: 1,
    spacing: { lateral: 1, depth: 1 },
  },
  anchor,
  facingDeg: 0,
  seed: 4,
});

/** Original present, zero-offset member state with caller overrides applied last. */
const state: (
  props?: Partial<IAutoMovieFormationSlotState>,
) => IAutoMovieFormationSlotState = (
  props: Partial<IAutoMovieFormationSlotState> = {},
): IAutoMovieFormationSlotState => ({
  present: true,
  offset: { x: 0, y: 0, z: 0 },
  facingOffsetDeg: 0,
  ...props,
});

/** Original shared formation-wide state with no translation, rotation or spacing change. */
const held: IAutoMovieFormationMotionState = {
  translation: { x: 0, y: 0, z: 0 },
  facingOffsetDeg: 0,
  spacingScale: { lateral: 1, depth: 1 },
};

/** Original linear member offset cue between one and three seconds. */
const steps: (
  slots: number[],
  aside: number,
  id?: string,
) => IAutoMovieFormationSlotMotion = (
  slots: number[],
  aside: number,
  id: string = "step",
): IAutoMovieFormationSlotMotion => ({
  id,
  formation: "crowd",
  slots,
  start: 1,
  end: 3,
  from: state(),
  to: state({ offset: { x: aside, y: 0, z: 0 } }),
  easing: "linear",
});

/** Original step cue whose member is absent from its supplied start time onward. */
const leaves: (
  slots: number[],
  at: number,
  id?: string,
) => IAutoMovieFormationSlotMotion = (
  slots: number[],
  at: number,
  id: string = "leave",
): IAutoMovieFormationSlotMotion => ({
  id,
  formation: "crowd",
  slots,
  start: at,
  end: at + 1,
  from: state({ present: false }),
  to: state({ present: false }),
  easing: "step",
});

/** Read original ground diagnostics without filtering or reordering them. */
const codes: (
  space: IAutoMovieSpace | null,
  formations: readonly IAutoMovieFormationPlacement[],
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[],
) => string[] = (
  space: IAutoMovieSpace | null,
  formations: readonly IAutoMovieFormationPlacement[],
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[],
): string[] =>
  validateAutoMovieFormationGround(
    { id: "opening" },
    { scene: { space }, formations, formationSlotMotions },
  ).map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code);

/** Original compiled formation projection read by the cue gate, with caller-selected hero slots. */
const compiled: (
  count: number,
  heroes?: number[],
) => Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes"> = (
  count: number,
  heroes: number[] = [],
): Pick<IAutoMovieCompiledFormation, "id" | "count" | "heroes"> => ({
  id: "crowd",
  count,
  heroes: heroes.map(
    (slot: number): IAutoMovieCompiledFormation["heroes"][number] => ({
      slot,
      actor: `named-${slot}`,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    }),
  ),
});

/** Original six-second shot contract containing the crowd participant. */
const contract: Pick<
  IAutoMovieShotContract,
  "id" | "durationSeconds" | "participants"
> = {
  id: "opening",
  durationSeconds: 6,
  participants: [{ kind: "formation", id: "crowd" }],
};

/** Call the original cue gate on supplied cues and its original default nine-member formation. */
const cueDiagnostics: (
  cues: readonly IAutoMovieFormationSlotMotion[],
  formations?: ReturnType<typeof compiled>[],
) => IAutoMovieDiagnostic[] = (
  cues: readonly IAutoMovieFormationSlotMotion[],
  formations: ReturnType<typeof compiled>[] = [compiled(9)],
): IAutoMovieDiagnostic[] =>
  validateAutoMovieFormationSlotMotions(contract, {
    formations,
    formationSlotMotions: cues,
  });

/** Keep every cue diagnostic code in the gate's returned order. */
const cueCodes: (
  cues: readonly IAutoMovieFormationSlotMotion[],
  formations?: ReturnType<typeof compiled>[],
) => string[] = (
  cues: readonly IAutoMovieFormationSlotMotion[],
  formations: ReturnType<typeof compiled>[] = [compiled(9)],
): string[] =>
  cueDiagnostics(cues, formations).map(
    (diagnostic: IAutoMovieDiagnostic): string => diagnostic.code,
  );

/** Original cap fixture: nine independent members per successive 0.02-second window, with a 0.01-second cue duration. */
const spread: (count: number) => IAutoMovieFormationSlotMotion[] = (
  count: number,
): IAutoMovieFormationSlotMotion[] =>
  Array.from(
    { length: count },
    (_unused: unknown, index: number): IAutoMovieFormationSlotMotion => {
      const window: number = Math.floor(index / 9) * 0.02;
      return {
        ...steps([index % 9], 2, `many-${index}`),
        start: window,
        end: window + 0.01,
      };
    },
  );

/** Original fixture functions and shared held/contract records, retained once for the existing formation-slot test and its extracted final case; this object adds no scenario registration or host. */
export const formationSlotMotionFixtures: {
  field: typeof field;
  crossroads: typeof crossroads;
  unit: typeof unit;
  alone: typeof alone;
  state: typeof state;
  held: typeof held;
  steps: typeof steps;
  leaves: typeof leaves;
  codes: typeof codes;
  compiled: typeof compiled;
  contract: typeof contract;
  cueDiagnostics: typeof cueDiagnostics;
  cueCodes: typeof cueCodes;
  spread: typeof spread;
} = {
  field,
  crossroads,
  unit,
  alone,
  state,
  held,
  steps,
  leaves,
  codes,
  compiled,
  contract,
  cueDiagnostics,
  cueCodes,
  spread,
};
