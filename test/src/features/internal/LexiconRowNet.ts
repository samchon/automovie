import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { lexiconRowInputs } from "./lexiconRowInputs";
import { motionHumanBody } from "./motionHumanBody";
import { profileHumanMotion } from "./profileHumanMotion";

const { HumanSocial } = AutoMovieMotionHumanTouch;

/**
 * The net every lexicon family's test casts over its rows: each row is
 * registered through the public input and a performance of it is built on
 * the average man and on the small woman, alone or on a partner of the
 * other build at the row's own distance, and a row that is refused, or
 * placed under another name, is returned as a complaint with the row, the
 * body and the refusal's message.
 *
 * The tables say what a row leaves open: what a row done alone needs (a
 * place to go, a bench), the partner's distance and the target a
 * row done on a partner needs, which rows are costly strikes planned by one
 * of the two performers only, which follow a partner's placed path, and
 * which need a prop or a thrower their own tests stage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the net does, what a complaint carries and what each table says.
 * @evidence contracts/development/design.md#principled-representation One table-walking function and the tables it walks, so every family's test is the same net over its own rows and no scene is restated per family.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four casts the family tests call: a family's rows, the carried scene, a row over a walk, and the mutual records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A family or part with no row is a complaint, so a renamed family cannot pass by walking nothing.
 */
export namespace LexiconRowNet {
  /** Rows whose planning is costly, each planned by one of the two performers. */
  const STRIKES: readonly string[] = [
    "jab",
    "cross",
    "hook",
    "uppercut",
    "frontKick",
    "roundKick",
    "thrust",
  ];

  /** Rows that follow a person's placed path, so the partner is composed first. */
  const TRACKING: readonly string[] = [
    "follow",
    "escort",
    "chase",
    "intercept",
    "danceFollow",
  ];

  /** Rows that need a support, a prop or a thrower, which their own tests stage. */
  export const STAGED: readonly string[] = [
    // Loads held at the sides need the props in the hands, which `test_human_motion_sport_carry` stages; a sled push needs the sled, which `test_human_motion_sport_sled` stages.
    "farmersHold",
    "sledPush",
    // A photograph needs the camera in hand, which `test_human_motion_hand_verdicts_photograph` stages.
    "photograph",
    // A doorway, a car and a door's leaf need an obstacle, an opening or a door, which `test_human_motion_travel_obstacles`, `test_human_motion_travel_car` and `test_human_motion_travel_door_leaf` stage.
    "passThrough",
    "getIn",
    "openDoor",
    "ride",
    "carried",
    "drawFirearm",
    "holsterFirearm",
    "gloveCatch",
    "twoHandCatch",
    // A vault needs its prop, a pole vault a held pole and a run-up, and a
    // flop its high jump, which `test_human_motion_gymnastics_airborne` and
    // `test_human_motion_gymnastics_jumps` stage.
    "handspringVault",
    // A box vault needs its box, which `test_human_motion_gymnastics_box_vault` stages.
    "boxVault",
    "vaultOnPole",
    "fosburyFlop",
    // Labour and explicit tool-use rows both need scene props. Keep both
    // registered vocabularies out of unprepared numeric boundary probes.
    "hammer",
    "saw",
    "stir",
    "screw",
    "toolHammer",
    "toolSaw",
    "toolStir",
    "toolScrewdriver",
    // A kick needs its ball, which `test_human_motion_sport_swings` and
    // `test_archetype_sport_strike` stage.
    "kickRight",
    "kickLeft",
    // A hanging exercise needs its bar, which `test_archetype_pull_up_bar_hang` stages.
    "deadHang",
    "pullUp",
    "chinUp",
    "kneeRaise",
    "barSwing",
    // A movement across supports needs its surface at the body's own
    // heights, which `test_human_motion_lexicon_rows_support` stages.
    "scramble",
    "slideOff",
  ];

  /** The two builds, each performing with the other as its partner. */
  const PAIRINGS: readonly Pairing[] = [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ];

  /** A performer's chain out of a short stand. */
  const starting = (subject: string): IAutoMovieMotionHumanChain =>
    HumanChain.subject(subject).stand({ hold: 0.3 });

  /** Build one performance and note its refusal or its misplaced name. */
  const check = (
    complaints: string[],
    label: string,
    names: Pairing,
    gap: number | null,
    build: Build,
    laws: readonly IAutoMovieMotionHumanActionLaw<never>[],
    placed?: string,
  ): void => {
    try {
      const performance: IAutoMovieMotionHumanPerformance = profileHumanMotion(
        `${label}/${names[0]}`,
        (): IAutoMovieMotionHumanPerformance =>
          new HumanPerformance({
            seed: "lexicon",
            laws,
            performers: [
              {
                subject: "a",
                body: motionHumanBody(names[0]),
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" },
              },
              ...(gap === null
                ? []
                : [
                    {
                      subject: "b",
                      body: motionHumanBody(names[1]),
                      at: { x: 0, y: 0, z: gap },
                      yaw: 180,
                      proficiency: { level: "trained" as const },
                    },
                  ]),
            ],
            composition: build().node,
          }),
        gap === null ? ["a"] : ["a", "b"],
        placed,
      );
      if (placed !== undefined) {
        const action: IAutoMovieMotionHumanSegment | undefined =
          performance.segments("a")[1];
        if (action?.name !== placed)
          complaints.push(
            `${label} on ${names[0]}: placed as ${action?.name}, ${placed} expected`,
          );
        else if (!(action.end > action.entryTime))
          complaints.push(
            `${label} on ${names[0]}: the placed action lasts no time`,
          );
      }
    } catch (error) {
      complaints.push(
        `${label} on ${names[0]}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  /**
   * Cast the net over a family's rows, or over a group of named branches.
   *
   * @param family The family's key in `HUMAN_LEXICON`.
   * @param names The rows that exercise the branch under test; every row when absent.
   * @param omit Whether the branch names are excluded to cover the rest of the family.
   * @param performer Limit an individually costly branch to this one of the already staged performers.
   * @returns The complaints; none when every row is performable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the family, the optional named branch selection and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each row is built alone, or on its partner at its own distance, for both pairings of the two builds; a strike is planned by one performer, chosen by its position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two pairings, one pass over the rows, one build each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing family or named row is itself a complaint, so nothing passes by walking nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One performance per row and pairing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The two polygon men are prepared once per process and shared by every cast.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each performance is dropped after its name is read.
   */
  export function rows(
    family: string,
    names?: readonly string[],
    omit: boolean = false,
    performer?: motionHumanBody.Name,
  ): string[] {
    const complaints: string[] = [];
    const laws: readonly IAutoMovieMotionHumanActionLaw<never>[] =
      HUMAN_LEXICON[family] ?? [];
    if (laws.length === 0)
      complaints.push(`the family ${family} holds no row to perform`);
    for (const name of names ?? [])
      if (
        !laws.some(
          (law: IAutoMovieMotionHumanActionLaw<never>): boolean =>
            law.name === name,
        )
      )
        complaints.push(`the family ${family} has no row named ${name}`);
    const pairings: readonly Pairing[] =
      family === "sport" ? [...PAIRINGS, ["m-large", "f-small"]] : PAIRINGS;
    if (
      performer !== undefined &&
      !pairings.some((pair: Pairing): boolean => pair[0] === performer)
    )
      complaints.push(
        `the family ${family} has no performer named ${performer}`,
      );
    pairings.forEach((pair: Pairing, turn: number): void => {
      if (performer !== undefined && pair[0] !== performer) return;
      laws.forEach(
        (law: IAutoMovieMotionHumanActionLaw<never>, index: number): void => {
          if (
            STAGED.includes(law.name) ||
            (names !== undefined && names.includes(law.name) === omit)
          )
            return;
          const scene: PossiblePair = lexiconRowInputs.PAIRED[law.name];
          if (scene === undefined)
            check(
              complaints,
              law.name,
              pair,
              null,
              () =>
                starting("a").registered(
                  law.name,
                  lexiconRowInputs.ALONE[law.name] ?? {},
                ),
              [law],
              law.name,
            );
          else if (!STRIKES.includes(law.name) || index % 2 === turn)
            check(
              complaints,
              law.name,
              pair,
              scene[0],
              () =>
                TRACKING.includes(law.name)
                  ? starting("b").with(
                      starting("a").registered(law.name, scene[1]),
                    )
                  : starting("a")
                      .registered(law.name, scene[1])
                      .with(starting("b")),
              [law],
              law.name,
            );
        },
      );
    });
    return complaints;
  }

  /**
   * What the net gives a row: its partner scene's parameters, else what it
   * leaves open alone; none when the row needs nothing.
   *
   * @param row The row's name.
   * @returns The parameters, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned and when nothing is.
   * @evidence contracts/development/implementation.md#principled-implementation The net's own tables, so a caller that varies a row's parameters starts from the scene the net plans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a row the tables do not name gives nothing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the table's own record.
   */
  export function given(row: string): object | undefined {
    return lexiconRowInputs.PAIRED[row]?.[1] ?? lexiconRowInputs.ALONE[row];
  }

  /**
   * Build one row in the scene the net stages it in, on the average man
   * with the small woman as the partner, with some of its parameters
   * replaced, and return what the build threw.
   *
   * @param row The row's name.
   * @param replaced Parameters laid over what the net's tables give the row.
   * @param staged Whether the row receives its usual fixture. False asks for the row alone with exactly the given parameters.
   * @returns The error the build threw; null when it planned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the scene, the replacement and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The same tables and the same partner placement as `rows`, so a refusal read here is the row's own and not the staging's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of the scene, one build.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A row the net stages elsewhere is built alone, as the caller asked.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One performance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the polygon men prepared for `rows`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The performance is dropped.
   */
  export function attempt(
    row: string,
    replaced: object,
    staged: boolean = true,
  ): unknown {
    const scene: PossiblePair = staged
      ? lexiconRowInputs.PAIRED[row]
      : undefined;
    const params: object = staged
      ? { ...(scene?.[1] ?? lexiconRowInputs.ALONE[row] ?? {}), ...replaced }
      : replaced;
    const laws: IAutoMovieMotionHumanActionLaw<never>[] = Object.values(
      HUMAN_LEXICON,
    )
      .flat()
      .filter(
        (law: IAutoMovieMotionHumanActionLaw<never>): boolean =>
          law.name === row,
      );
    try {
      new HumanPerformance({
        seed: "lexicon",
        laws,
        performers: [
          {
            subject: "a",
            body: motionHumanBody("m-average"),
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(scene === undefined
            ? []
            : [
                {
                  subject: "b",
                  body: motionHumanBody("f-small"),
                  at: { x: 0, y: 0, z: scene[0] },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]),
        ],
        composition: (scene === undefined
          ? starting("a").registered(row, params)
          : TRACKING.includes(row)
            ? starting("b").with(starting("a").registered(row, params))
            : starting("a").registered(row, params).with(starting("b"))
        ).node,
      });
    } catch (error) {
      return error;
    }
    return null;
  }

  /**
   * Cast the net over the scenes a row alone cannot show: a person carried
   * by another who walks 2 m, a salute performed over a walk, and each
   * mutual record joining the two.
   *
   * @returns The complaints; none when every scene plans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three scenes and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Rows of an action that rides a carrier ride one here, and a mutual record is joined through `HumanChain.mutual`, for both pairings of the two builds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two pairings, three scenes each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a refusal is returned with its message.
   * @evidence contracts/development/implementation.md#efficient-algorithms One performance per scene and pairing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing repeats.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each performance is dropped after it is built.
   */
  export function scenes(): string[] {
    const complaints: string[] = [];
    for (const names of PAIRINGS) {
      check(
        complaints,
        "carried",
        names,
        0.3,
        () =>
          starting("a")
            .walk({ to: { x: 0, y: 0, z: -2 } })
            .with(starting("b").registered("carried", { partner: "a", hold: 2 })),
        HUMAN_LEXICON.carried!,
      );
      check(
        complaints,
        "a salute over a walk",
        names,
        null,
        () =>
          starting("a")
            .walk({ to: { x: 0, y: 0, z: 3 } })
            .over((o) => o.registered("salute")),
        HUMAN_LEXICON.emblem!,
      );
      // Each record is joined on its own: their roles and parameters
      // differ, so one loop over both does not type.
      check(
        complaints,
        `the mutual ${HumanSocial.bump.name}`,
        names,
        0.7,
        () =>
          HumanChain.mutual(HumanSocial.bump, {
            one: starting("a"),
            other: starting("b"),
          }),
        HUMAN_LEXICON.social!,
      );
      check(
        complaints,
        `the mutual ${HumanSocial.toast.name}`,
        names,
        0.7,
        () =>
          HumanChain.mutual(HumanSocial.toast, {
            guest: starting("a"),
            host: starting("b"),
          }),
        HUMAN_LEXICON.social!,
      );
    }
    return complaints;
  }
}

/** The subject and partner, from the same public body fixture. */
type Pairing = readonly [motionHumanBody.Name, motionHumanBody.Name];

/** The composition seam a lexicon test builds. */
type Build = () => Pick<IAutoMovieMotionHumanChain, "node">;

/** A row has partner staging only when the fixture names it. */
type PossiblePair = lexiconRowInputs.Pair | undefined;
