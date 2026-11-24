import type {
  IAutoMovieMotionHumanAttribute,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanEnsemblePreset,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieProficiency,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSkill } from "../skill/HumanSkill";
import { HUMAN_ATTRIBUTE_EFFECTS } from "./HUMAN_ATTRIBUTE_EFFECTS";
import { HUMAN_ENSEMBLE_PRESETS } from "./HUMAN_ENSEMBLE_PRESETS";
import { HumanAttribute } from "./HumanAttribute";
import { HumanFormation } from "./HumanFormation";

/**
 * How an ensemble's members are resolved from its input (`HumanEnsemble.of`):
 * each member's attributes and proficiency drawn from the group's distributions
 * by its own keys, its body drawn from the pool, its place its formation slot
 * at second 0 or the place given, then the roles filled in the order given from
 * the members each pick names, and each member's detail read once its role is
 * known.
 */
export namespace HumanEnsembleMembers {
  /**
   * Resolve an ensemble's members, as `HumanEnsemble.of` documents.
   *
   * @param input The ensemble.
   * @param read Reads a guide's placed root, when the formation follows a
   *   guide.
   * @returns The ensemble.
   * @throws {HumanRefusal} When the count, the pool, a distribution, a role or
   *   a place cannot be met, naming the ensemble and the axis.
   */
  export function resolve(
    input: IAutoMovieMotionHumanEnsemble.IInput,
    read?: IAutoMovieMotionHumanFormation.Reader,
  ): IAutoMovieMotionHumanEnsemble.IEnsemble {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      fix: string,
      feasible?: IAutoMovieMotionHumanRefusal.Feasible,
    ): never => {
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${input.id}.${axis}`,
        value,
        ...(feasible === undefined ? {} : { feasible }),
        reason,
        fix,
      });
    };
    if (!(Number.isInteger(input.count) && input.count > 0))
      refuse(
        "count",
        input.count,
        "an ensemble has a positive whole number of members",
        "give a positive count",
      );
    if (input.bodies.length === 0)
      refuse(
        "bodies",
        0,
        "an ensemble's body pool is empty",
        "give at least one body",
      );
    const formation: IAutoMovieMotionHumanFormation | undefined =
      input.formation === undefined
        ? undefined
        : HumanFormation.of(input.formation);
    const prepared: HumanFormation.IPrepared | undefined =
      formation === undefined ? undefined : HumanFormation.prepare(formation);
    if (
      formation !== undefined &&
      HumanFormation.count(formation) < input.count
    )
      refuse(
        "formation",
        HumanFormation.count(formation),
        `the formation holds ${HumanFormation.count(formation)} slots for ${input.count} members`,
        "give the formation a slot for every member",
        { kind: "range", minimum: input.count, maximum: null, unit: "" },
      );
    if (formation === undefined && input.places === undefined)
      refuse(
        "places",
        undefined,
        "an ensemble needs a formation or places",
        "give a formation or places",
      );

    // The distributions: the preset's rows, overridden by the input's.
    const preset: IAutoMovieMotionHumanEnsemblePreset | undefined =
      input.preset === undefined
        ? undefined
        : HUMAN_ENSEMBLE_PRESETS[input.preset];
    const distributions: Partial<
      Record<
        IAutoMovieMotionHumanAttribute.Name,
        IAutoMovieMotionHumanAttribute.IDistribution
      >
    > = {
      ...(preset?.attributes ?? {}),
      ...(input.attributes ?? {}),
    };
    const proficiency: IAutoMovieMotionHumanAttribute.IDistribution =
      input.proficiency ??
        preset?.proficiency ?? { mean: HumanSkill.LEVELS.trained, spread: 0 };

    // Each member's own draws, keyed by its index.
    const members: IAutoMovieMotionHumanEnsemble.IMember[] = [];
    for (let index: number = 0; index < input.count; ++index) {
      const subject: string = `${input.id}.${index}`;
      const attributes: Partial<
        Record<IAutoMovieMotionHumanAttribute.Name, number>
      > = {};
      for (const name of HumanAttribute.NAMES) {
        const d: IAutoMovieMotionHumanAttribute.IDistribution | undefined =
          distributions[name];
        if (d !== undefined)
          attributes[name] = HumanAttribute.draw(
            input.seed,
            input.id,
            index,
            name,
            d,
          );
      }
      const p: number = HumanAttribute.draw(
        input.seed,
        input.id,
        index,
        "proficiency",
        proficiency,
      );
      const axes: Partial<Record<IAutoMovieProficiency.Axis, number>> = {};
      if (attributes.discipline !== undefined)
        for (const axis of HUMAN_ATTRIBUTE_EFFECTS.discipline.axes)
          axes[axis] = attributes.discipline;
      const pool: number = Math.min(
        input.bodies.length - 1,
        Math.floor(
          HumanAttribute.stream(input.seed, input.id, index, "body").float(0) *
            input.bodies.length,
        ),
      );
      const slot: IAutoMovieMotionHumanFormation.ILocal | null =
        formation === undefined ? null : HumanFormation.local(formation, index);
      const place: IAutoMovieMotionHumanEnsemble.IPlace =
        prepared !== undefined
          ? placeOf(prepared.slot(index, 0, read))
          : typeof input.places === "function"
            ? input.places(index)
            : (input.places![index] ??
              refuse(
                "places",
                input.places!.length,
                `${input.places!.length} places for ${input.count} members`,
                "give a place for every member",
              ));
      members.push({
        index,
        subject,
        role: null,
        body: input.bodies[pool]!,
        pool,
        attributes,
        proficiency: Object.keys(axes).length === 0 ? { p } : { p, axes },
        place,
        slot,
        detail: "full",
        prop: (name: string): string => `${subject}.${name}`,
      });
    }

    // Roles in the order given, each from the members its pick names that no earlier role took.
    for (const [role, spec] of Object.entries(input.roles ?? {})) {
      const free: IAutoMovieMotionHumanEnsemble.IMember[] = members.filter(
        (m: IAutoMovieMotionHumanEnsemble.IMember): boolean => m.role === null,
      );
      const candidates: IAutoMovieMotionHumanEnsemble.IMember[] =
        spec.pick !== undefined && typeof spec.pick !== "string"
          ? spec.pick.map(
              (
                i: number,
                k: number,
                all: readonly number[],
              ): IAutoMovieMotionHumanEnsemble.IMember =>
                members[i] !== undefined &&
                members[i]!.role === null &&
                all.indexOf(i) === k
                  ? members[i]!
                  : refuse(
                      `roles.${role}.pick`,
                      i,
                      `member ${i} does not exist, already has a role or is picked twice`,
                      "pick distinct free members by index",
                    ),
            )
          : spec.pick === "front"
            ? free.filter(
                (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
                  m.slot === null || m.slot.rank === 0,
              )
            : spec.pick === "rear"
              ? free
                  .filter(
                    (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
                      m.slot === null ||
                      m.slot.rank ===
                        (formation === undefined
                          ? 0
                          : HumanFormation.rear(formation, m.slot.block)),
                  )
                  .reverse()
              : spec.pick === "flank"
                ? flank(free, formation)
                : free;
      if (
        !(Number.isInteger(spec.count) && spec.count >= 0) ||
        spec.count > candidates.length
      )
        refuse(
          `roles.${role}`,
          spec.count,
          `the role ${role} asks ${spec.count} members and ${candidates.length} can take it`,
          "ask no more members than the pick offers",
          { kind: "range", minimum: 0, maximum: candidates.length, unit: "" },
        );
      for (const m of candidates.slice(0, spec.count)) m.role = role;
    }

    // Each member's detail, read once its role is known.
    if (input.detail !== undefined)
      for (const m of members)
        m.detail = input.detail({
          index: m.index,
          role: m.role,
          block: m.slot?.block ?? null,
          rank: m.slot?.rank ?? null,
        });
    return { input, members };
  }
}

/** A slot as a starting place. */
function placeOf(
  slot: IAutoMovieMotionHumanFormation.ISlot,
): IAutoMovieMotionHumanEnsemble.IPlace {
  return { at: slot.at, yaw: slot.heading };
}

/**
 * The free members on a flank: file 0 first, then the last file of each block;
 * without a formation, the first and the last.
 */
function flank(
  free: readonly IAutoMovieMotionHumanEnsemble.IMember[],
  formation: IAutoMovieMotionHumanFormation | undefined,
): IAutoMovieMotionHumanEnsemble.IMember[] {
  if (formation === undefined)
    return free.length < 2 ? [...free] : [free[0]!, free[free.length - 1]!];
  // Each block's last file among its free members.
  const last: Map<number, number> = new Map();
  for (const m of free)
    if (m.slot !== null)
      last.set(
        m.slot.block,
        Math.max(last.get(m.slot.block) ?? 0, m.slot.file),
      );
  return [
    ...free.filter(
      (m: IAutoMovieMotionHumanEnsemble.IMember): boolean => m.slot?.file === 0,
    ),
    ...free.filter(
      (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
        m.slot !== null &&
        m.slot.file !== 0 &&
        m.slot.file === last.get(m.slot.block),
    ),
  ];
}
