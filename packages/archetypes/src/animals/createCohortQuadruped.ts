import { type Archetype, ArchetypeBand, type ArchetypeBuilder, ArchetypeDrawSession, ArchetypeRefusal, type IArchetypeBand } from "../core";
import { QuadrupedAnimal } from "./QuadrupedAnimal";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedLead } from "./QuadrupedLead";

/** Coordinate of the table's declared spread; no unreported animal SD is inferred. */
const TEMPO: IArchetypeBand = ArchetypeBand.of("", -1, 1,
  "authored coordinate of the species table's declared timing spread; deterministic point rows have zero authored spread without claiming a measured standard deviation");

/**
 * Build one coherent non-equid cohort prototype without an equine mass law.
 *
 * @param props The producer's whole reference dimensions, body and optional actual additions.
 * @returns The independent actual model with explicitly authored whole-model mass.
 * @throws {ArchetypeRefusal} For invalid reference dimensions, mass, tempo or authored lead lengths.
 * @evidence contracts/development/common.md#meaningful-documentation States whole-cohort ownership, authored total mass including additions, exact reference dimensions and explicitly declared timing spread.
 * @evidence contracts/development/implementation.md#principled-implementation The draw session records one whole reference height/girth pair and authored mass; the existing shared animal builder lays that body with uniform solid-density allocation and unknown foot friction. Every optional lead is actual geometry with its own contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit reference/mass scalars, record the coherent reference model and timing coordinate, and invoke the shared animal builder with actual species additions and the common lead owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No independent trait sampling, unreported population band, equine weight law, invented mass/foot coefficient or renderer-only feature is substituted. A point profile is not presented as completion of population variation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant reference admission followed by the shared fixed-size body and declared additions, without mesh search or fitting iterations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing draw, body/mass builder and collar/lead geometry/contact owners; species adapters supply only their own profiles and actual identifying parts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its records; the draw session and construction callbacks are call-local and no process, global cache or external handle is retained.
 */
export function createCohortQuadruped(
  props: createCohortQuadruped.IProps,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
  for (const [axis, value, unit] of [["withersHeight", props.withers, "m"], ["girth", props.girth, "m"], ["mass", props.params.mass, "kg"]] as const)
    if (!(Number.isFinite(value) && value > 0))
      throw new ArchetypeRefusal({ kind: "parameter", archetype: props.archetype, axis, value,
        feasible: { kind: "range", minimum: 0, maximum: null, unit },
        reason: "a reference dimension and authored mass must be finite and positive",
        fix: "supply a positive physical value in the stated unit" });
  const draw: ArchetypeDrawSession<QuadrupedBody.Dimension> = new ArchetypeDrawSession(
    props.archetype, { withersHeight: "m", girth: "m", mass: "kg", tempo: "" }, props.seed, props.params,
  );
  draw.model("cohort", props.cohort, { [props.cohort]: { withersHeight: props.withers, girth: props.girth } });
  draw.dimensions({ tempo: TEMPO });
  draw.derive("mass", props.params.mass);
  return QuadrupedAnimal<createCohortQuadruped.Affordance>({
    id: props.params.id, name: props.name, draw, body: props.body,
    add: (builder: ArchetypeBuilder<createCohortQuadruped.Affordance, QuadrupedBody.Dimension>, rig: QuadrupedBody.IRig): void => {
      props.add?.(builder, rig);
      if (props.params.lead !== undefined) QuadrupedLead(builder, rig, "lead", props.params.lead, props.archetype);
    },
  });
}

/**
 * Shared construction inputs of the actual non-equid cohort producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States complete authored mass, optional timing/lead and producer-owned source references and additions.
 * @evidence contracts/development/design.md#principled-representation One closed contact vocabulary, shared physical dimensions and a whole reference cohort keep source data separate from authored mass and equipment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Species adapters own anatomy and identifying parts; the shared factory owns recording/admission and the existing body/lead owners do their construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown material coefficient, measured mass, statistical band or population allometry is implied by these prototype inputs.
 */
export namespace createCohortQuadruped {
  /** Contacts the non-equid producers may actually build. */
  export type Affordance = "lead" | "leftLoad" | "rightLoad" | "hitch";

  /** Authored construction choices, independent of the reference cohort's traits. */
  export interface IParams {
    /** Optional instance identity. */
    id?: string;
    /** Positive total kilograms including any explicitly drawn equipment. */
    mass: number;
    /** Coordinate -1..1 of the table's declared timing spread. */
    tempo?: number;
    /** Explicit physical collar/lead dimensions; absent means no lead is drawn. */
    lead?: QuadrupedLead.IParams;
  }

  /** The producer's complete coherent reference plus its actual additions. */
  export interface IProps {
    /** Producer identity, retained by the draw record. */
    archetype: string;
    /** Human-readable prototype label. */
    name: string;
    /** One whole source cohort identity. */
    cohort: string;
    /** Reference withers height in metres. */
    withers: number;
    /** Reference chest circumference in metres. */
    girth: number;
    /** Actual shared body profile. */
    body: QuadrupedBody.IBody;
    /** Admitted authoring choices. */
    params: IParams;
    /** Independent deterministic construction seed. */
    seed?: number | string;
    /** Identifying geometry/equipment on the same physical body. */
    add?: (builder: ArchetypeBuilder<Affordance, QuadrupedBody.Dimension>, rig: QuadrupedBody.IRig) => void;
  }
}
