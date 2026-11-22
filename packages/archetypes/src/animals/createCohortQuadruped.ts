import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";
import type { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";
import { QuadrupedAnimal } from "./QuadrupedAnimal";
import { QuadrupedLeadPlan } from "./QuadrupedLeadPlan";

/** One admitted profile and its fixed-size physical addition plans. */
interface PreparedReference {
  /** The same profile is reused by selected model construction. */
  body: AutoMovieArchetypeQuadrupedBody.IBody;
  /** Non-emitting collar/lead plan, absent when none was requested. */
  lead: QuadrupedLeadPlan | undefined;
  /** Non-emitting species/equipment preparation, absent when no extra parts exist. */
  addition: createCohortQuadruped.Addition | undefined;
}

/** Coordinate of the table's declared spread; no unreported animal SD is inferred. */
const TEMPO: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
  "",
  -1,
  1,
  "authored coordinate of the species table's declared timing spread; deterministic point rows have zero authored spread without claiming a measured standard deviation",
);

/**
 * Select and build one whole non-equid reference without an equine mass law.
 *
 * @param props Closed whole-reference data, authored selection palette, body constructor and additions.
 * @returns The independent model with authored mass or its selected bare reference mass.
 * @throws {AutoMovieArchetypeRefusal} For invalid reference dimensions, mass, tempo or authored lead lengths.
 * @evidence contracts/development/common.md#meaningful-documentation States exact whole-reference ownership, fixed/seedless/seeded selection, authored catalogue frequency, source versus equipment mass and declared timing spread.
 * @evidence contracts/development/implementation.md#principled-implementation Admit profiles and non-emitting gear plans for the entire unfixed catalogue, including its seedless default, before one whole-row draw. Thus equipment refusal cannot depend on seed. A fixed cohort admits only itself. The selected prepared profile/additions build one model with source or authored mass and unknown foot friction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare source figures, rigs and physical additions for the request's complete choice domain, make one cohort draw, record tempo and emit the selected profile and plans once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No independent trait sampling, unreported population band, equine weight law, invented mass/foot coefficient or renderer-only feature is substituted. A point profile is not presented as completion of population variation.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(K) fixed-size profile/rig/addition planning for K declared reference rows precedes one model construction; no unselected model geometry, mesh or physical simulation is built. Selected body lay reads the same generating definition for its rigid geometry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One model-axis draw owns reference/provenance selection. Prepared body profiles and selected lead/equipment plans are reused for emission; no seed retry or selected gear replanning occurs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its records. The O(K) profile/plan catalogue, draw session and construction callbacks are call-local and become unreachable after emission; no process, global cache or external handle is retained.
 */
export function createCohortQuadruped<Cohort extends string>(
  props: createCohortQuadruped.IProps<Cohort>,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeQuadrupedBody.Dimension> =
    new AutoMovieArchetypeDrawSession(
      props.archetype,
      { withersHeight: "m", girth: "m", mass: "kg", tempo: "" },
      props.seed,
      props.params,
    );

  // An omitted cohort has one authored choice domain, independent of seed.
  const supplied: Cohort | undefined =
    props.cohort === undefined
      ? undefined
      : ArchetypeDraw.choice(
          props.archetype,
          "cohort",
          props.cohort,
          props.names,
        );
  const fixed: Cohort | undefined =
    supplied ?? (props.seed === undefined ? props.reference : undefined);
  const candidates: readonly Cohort[] =
    supplied === undefined
      ? [...new Set([props.reference, ...props.choices])]
      : [supplied];

  // Admit profiles and additions before the single whole-reference draw.
  const figures: Partial<
    Record<
      Cohort,
      Readonly<
        Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
      >
    >
  > = {};
  const prepared: Map<Cohort, PreparedReference> = new Map();
  for (const key of candidates) {
    ArchetypeDraw.choice(props.archetype, "cohort", key, props.names);
    const reference: createCohortQuadruped.IReference | undefined =
      props.references[key];
    if (reference === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: props.archetype,
        axis: "cohort",
        value: key,
        feasible: { kind: "alternatives", values: props.names },
        reason: "the catalogue key has no complete reference record",
        fix: "supply the reference's complete source vector before selecting it",
      });
    for (const [axis, value] of [
      ["withersHeight", reference.withers],
      ["girth", reference.girth],
    ] as const)
      positive(axis, value, "m");
    const mass: number | undefined =
      props.params.mass === undefined ? reference.mass : props.params.mass;
    positive("mass", mass, "kg");
    figures[key] = {
      withersHeight: reference.withers,
      girth: reference.girth,
      ...(props.params.mass === undefined && reference.mass !== undefined
        ? { mass: reference.mass }
        : {}),
    };
    const body: AutoMovieArchetypeQuadrupedBody.IBody = props.body(key);
    const rig: AutoMovieArchetypeQuadrupedBody.IRig =
      AutoMovieArchetypeQuadrupedBody.rig(body, {
        withersHeight: reference.withers,
        girth: reference.girth,
      });
    try {
      const lead: QuadrupedLeadPlan | undefined =
        props.params.lead === undefined
          ? undefined
          : new QuadrupedLeadPlan(rig, props.params.lead, props.archetype);
      prepared.set(key, { body, lead, addition: props.prepare?.(rig, key) });
    } catch (error) {
      if (
        supplied === undefined &&
        candidates.length > 1 &&
        error instanceof AutoMovieArchetypeRefusal
      )
        throw new AutoMovieArchetypeRefusal({
          kind: error.kind,
          archetype: error.archetype,
          axis: error.axis,
          value: error.value,
          feasible: null,
          reason: `${error.reason}; equipment without a fixed reference must fit the complete catalogue, including ${key}`,
          fix: `${error.fix}; or select an explicit cohort and size equipment for it`,
        });
      throw error;
    }
  }

  const models: Partial<
    Record<
      Cohort,
      Readonly<
        Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
      >
    >
  > = {};
  for (const key of fixed === undefined ? props.choices : [fixed]) {
    const row:
      | Readonly<
          Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
        >
      | undefined = figures[key];
    if (row === undefined)
      throw new RangeError(`The reference ${key} was not prepared`);
    models[key] = row;
  }
  const selected: Cohort | undefined = draw.model("cohort", fixed, models).name;
  if (selected === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: props.archetype,
      axis: "cohort",
      value: null,
      feasible: { kind: "alternatives", values: props.names },
      reason: "a whole-reference catalogue must have an eligible choice",
      fix: "supply a supported reference or a nonempty authored catalogue palette",
    });
  const actual: PreparedReference | undefined = prepared.get(selected);
  if (actual === undefined)
    throw new RangeError(`The selected reference ${selected} was not prepared`);

  draw.dimensions({ tempo: TEMPO });
  if (props.params.mass !== undefined) draw.derive("mass", props.params.mass);
  return QuadrupedAnimal<createCohortQuadruped.Affordance>({
    id: props.params.id,
    name: props.name(selected),
    draw,
    body: actual.body,
    add: (
      builder: AutoMovieArchetypeBuilder<
        createCohortQuadruped.Affordance,
        AutoMovieArchetypeQuadrupedBody.Dimension
      >,
    ): void => {
      actual.addition?.(builder);
      actual.lead?.emit(builder, "lead");
    },
  });

  /** Keep both source figures and complete authored mass inside their physical numeric domain. */
  function positive(
    axis: string,
    value: number | undefined,
    unit: "m" | "kg",
  ): void {
    if (!(value !== undefined && Number.isFinite(value) && value > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: props.archetype,
        axis,
        value,
        feasible: { kind: "range", minimum: 0, maximum: null, unit },
        reason:
          "the selected reference dimension or complete model mass must be finite and positive",
        fix: "supply a positive physical value; an unknown source mass requires authored complete kilograms",
      });
  }
}

/**
 * Shared construction inputs of the non-equid cohort producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States complete authored mass, optional timing/lead and producer-owned source references and additions.
 * @evidence contracts/development/design.md#principled-representation One closed contact vocabulary, shared physical dimensions and a whole reference cohort keep source data separate from authored mass and equipment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Species adapters own anatomy and identifying parts; the shared factory owns recording/admission and the existing body/lead owners do their construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown material coefficient, measured mass, statistical band or population allometry is implied by these prototype inputs.
 */
export namespace createCohortQuadruped {
  /** Contacts the non-equid producers may build. */
  export type Affordance = AutoMovieArchetypeQuadrupedEquipment.Affordance;

  /** Emission of already admitted, fixed-size additions into the selected builder. */
  export type Addition = (
    builder: AutoMovieArchetypeBuilder<
      Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    >,
  ) => void;

  /** Authored construction choices, independent of the reference cohort's traits. */
  export interface IParams {
    /** Optional instance identity. */
    id?: string;
    /** Positive complete kilograms; omission is valid only with a measured bare-reference mass. */
    mass?: number;
    /** Coordinate -1..1 of the table's declared timing spread. */
    tempo?: number;
    /** Explicit physical collar/lead dimensions; absent means no lead is drawn. */
    lead?: AutoMovieArchetypeQuadrupedLead.IParams;
  }

  /** Selected source dimensions; optional bare mass stays separate from equipment. */
  export interface IReference {
    /** Reference withers height, metres. */
    withers: number;
    /** Reference chest circumference, metres. */
    girth: number;
    /** Measured bare kilograms, absent when the source supplies none. */
    mass?: number;
  }

  /** The producer's closed whole-reference catalogue and selected-body consumers. */
  export interface IProps<Cohort extends string> {
    /** Producer identity, retained by the draw record. */
    archetype: string;
    /** Human-readable label of the selected whole reference. */
    name: (cohort: Cohort) => string;
    /** Every admissible explicit reference key. */
    names: readonly Cohort[];
    /** Authored equal-choice palette used only when a seed is given without a fixed reference. */
    choices: readonly Cohort[];
    /** Explicit seedless default, not inferred from palette ordering. */
    reference: Cohort;
    /** Optional fixed whole-reference choice. */
    cohort?: Cohort;
    /** Coherent source figures by key; unselected body geometry is not built. */
    references: Readonly<Record<Cohort, Readonly<IReference>>>;
    /** Prepare each eligible fixed-size profile; only the selected one emits model parts. */
    body: (cohort: Cohort) => AutoMovieArchetypeQuadrupedBody.IBody;
    /** Admitted authoring choices. */
    params: IParams;
    /** The seed that draws the cohort and the free dimensions left open in `params`; absent, the cohort is `reference` and each free dimension takes the middle of its band. */
    seed?: number | string;
    /** Admit physical additions without emitting unselected model geometry. */
    prepare?: (
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
      cohort: Cohort,
    ) => Addition | undefined;
  }
}
