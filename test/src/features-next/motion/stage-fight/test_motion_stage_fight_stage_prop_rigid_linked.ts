import { createStageWeaponProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStageProp,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** The stage prop model the archetype produces. */
type Model = ReturnType<typeof createStageWeaponProp>;

/** One profile of the comparison: its model, beat and the mark it shows. */
interface IProfile {
  /** The profile's label. */
  name: string;

  /** The archetype kind. */
  kind: createStageWeaponProp.Kind;

  /** The authored beat. */
  beat: IAutoMovieMotionHumanStageProp["beat"];

  /** The prop-local mark the beat shows. */
  mark: Parameters<Model["affordance"]>[0];

  /** Whether the prop's link swings on the film cue. */
  linked: boolean;
}

/** The two profiles: a rigid offset hammer and a linked prop on the same carriage path. */
const PROFILES: readonly IProfile[] = [
  {
    name: "rigid",
    kind: "offsetHammer",
    beat: "offset",
    mark: "face",
    linked: false,
  },
  { name: "linked", kind: "linked", beat: "linked", mark: "end", linked: true },
];

/** The partner's reaction delay after the stroke, seconds: an authored stage value. */
const DELAY: number = 0.1;
/** The link's authored keys on the film cue, seconds and degrees. */
const KEYS: readonly { seconds: number; degrees: number }[] = [
  { seconds: 0, degrees: 0 },
  { seconds: 0.6, degrees: 55 },
  { seconds: 1.2, degrees: 20 },
];
/** The least clearance between the prop's shown mark and the partner's head, metres: a stage safety margin of a hand's breadth. */
const CLEAR: number = 0.1;
/** Rigid continuity at a cut, metres. */
const RIGID: number = 0.001;

/**
 * A rigid and an articulated inert prop played through the same complete
 * filmed motion: pickup, anticipation, the authored stroke cue and recovery.
 *
 * Scenarios:
 * 1. Each profile keeps the right hand's grip window over its whole beat,
 *    its shown mark travels through the beat, and the prop joins the
 *    recovery stand with no jump.
 * 2. The partner's flinch starts exactly `DELAY` after each stroke cue, with
 *    no physical hit, and the mark keeps its clearance from the partner.
 * 3. The linked profile's link angle follows its keys from the film cue and
 *    reads the same out of order; the rigid profile has no link state, so
 *    its mark is the rigid carry of the hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two profiles, the cue, the reaction delay, the link keys and what each read compares.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickup, the stage beat and the partner response through HumanPerformance and reads grip windows, the placed schedule and the displayed and articulated prop frames.
 * @evidence contracts/development/testing.md#independent-expectations The delay, the link keys and the clearance margin are authored stage values; the key midpoint must read the mean of its keys; a rigid prop has no link state.
 * @evidence contracts/development/testing.md#distinguishing-cases Rigid against articulated, before against after the cue, in order against out of order, and the beat against its recovery.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men; rendering belongs to capture review.
 */
export function test_motion_stage_fight_stage_prop_rigid_linked(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const travels: number[] = [];
  for (const profile of PROFILES) {
    const model: Model = createStageWeaponProp({
      kind: profile.kind,
      height: 0.72,
    });
    const grip: number = model.affordance("grip").frame.translation.y;
    const rest: IAutoMovieMotionHumanProp = HumanObject.prop("prop", model, {
      at: { x: -0.15 - grip, y: 1.11, z: 0.29 },
      yaw: 0,
    });
    const laid: IAutoMovieMotionHumanProp = {
      ...rest,
      frame: {
        ...rest.frame,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
      },
    };
    // The beat and its recovery on the carrier, the flinch on the partner.
    const composition: IAutoMovieChain = HumanChain.subject("carrier")
      .stand({ hold: 0.3, sway: 0 })
      .pickUp({ prop: "prop", handle: "grip", hand: "right", lift: 0 })
      .registered(
        AutoMovieMotionHumanStageFight.HumanStageProp.name,
        { beat: profile.beat, prop: "prop", mark: profile.mark },
        "display",
      )
      .stand({ hold: 0.6, sway: 0 })
      .with(
        HumanChain.subject("partner")
          .act("flinch", {}, "display.response")
          .sync({ of: "display", event: "stroke", offset: DELAY }),
      );
    const perform = (
      prop: IAutoMovieMotionHumanProp,
      swing: number,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "stage-prop-rigid-linked",
        performers: [
          {
            subject: "carrier",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "partner",
            body,
            at: { x: 1.6, y: 0, z: 0.8 },
            yaw: -90,
            proficiency: { level: "trained" },
          },
        ],
        composition: composition.node,
        cues: { edit: [{ name: "swing", seconds: swing }] },
        laws: [AutoMovieMotionHumanStageFight.HumanStageProp],
        props: [prop],
      });

    // The editor places the link's swing cue on the beat's stroke.
    const rigid: HumanPerformance = perform(laid, 0);
    const placed: number = rigid.schedule.entries
      .find(
        (entry: IAutoMovieScheduleEntry): boolean =>
          entry.intent.anchor === "display",
      )!
      .events!.find(
        (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
      )!.seconds;
    const film: HumanPerformance = profile.linked
      ? perform(
          AutoMovieMotionHumanStageFight.withHumanStagePropLink(
            laid,
            { of: "edit", event: "swing" },
            KEYS,
          ),
          placed,
        )
      : rigid;
    const beat: IAutoMovieMotionHumanSegment = film
      .segments("carrier")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.law.name === "stageProp",
      )!;
    const grips: readonly IAutoMovieMotionHumanContactWindow[] =
      beat.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "grip" &&
          window.part === "rightHand" &&
          window.support.kind === "prop" &&
          window.support.subject === "prop",
      );
    TestValidator.predicate(
      profile.name + " keeps the grip through the beat",
      grips.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.from === 0 && window.to === 1,
      ),
    );

    const lead: IAutoMovieScheduleEntry = film.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "display",
    )!;
    const response: IAutoMovieScheduleEntry = film.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "display.response",
    )!;
    const stroke: IAutoMovieScheduleCue = lead.events!.find(
      (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
    )!;
    TestValidator.predicate(
      profile.name + " cues the partner after the stroke without a hit",
      nclose(response.start, stroke.seconds + DELAY) &&
        film.hits().length === 0,
    );

    // The shown mark: the prop's displayed frame and its posed mark.
    const shown = (t: number): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = film.prop("prop", t);
      const local: IAutoMovieVector3 = model
        .articulate(film.state("prop", t))
        .affordance(profile.mark).frame.translation;
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    };
    const travel: number = Vector3.distance(
      shown(lead.start),
      shown(stroke.seconds),
    );
    travels.push(travel);
    TestValidator.predicate(
      profile.name + " moves its mark into the cue",
      travel > 0.05,
    );
    for (let i: number = 0; i <= 12; ++i) {
      const t: number = lead.start + ((beat.end - lead.start) * i) / 12;
      const head: IAutoMovieVector3 = film
        .bones("partner", t)
        .get("head")!.worldPosition;
      TestValidator.predicate(
        profile.name +
          " keeps its mark clear of the partner at " +
          t.toFixed(2),
        Vector3.distance(shown(t), head) > CLEAR,
      );
    }
    const before: IAutoMovieRigidTransform = film.prop("prop", beat.end - 1e-4);
    const after: IAutoMovieRigidTransform = film.prop("prop", beat.end + 1e-4);
    TestValidator.predicate(
      profile.name + " joins the recovery with no jump",
      Vector3.distance(before.position, after.position) <= RIGID &&
        Quaternion.angle(before.rotation, after.rotation) <= RIGID,
    );

    // The link reads its keys from the cue, in any order; a rigid prop has none.
    const link = (t: number): number | undefined => film.state("prop", t).link;
    if (profile.linked) {
      const times: number[] = [
        stroke.seconds + 1.5,
        stroke.seconds + 0.3,
        stroke.seconds + 0.9,
        stroke.seconds + 0.3,
      ];
      const values: (number | undefined)[] = times.map(link);
      TestValidator.predicate(
        "the link follows its keys from the cue in any order",
        link(stroke.seconds - 0.2) === undefined &&
          nclose(values[0]!, 20) &&
          nclose(values[1]!, 27.5) &&
          nclose(values[2]!, 37.5) &&
          values[1] === values[3],
      );
    } else
      TestValidator.predicate(
        "the rigid prop has no link state",
        link(stroke.seconds + 0.3) === undefined,
      );
  }
  TestValidator.predicate(
    "the two profiles show different marks on the same carriage",
    Math.abs(travels[0]! - travels[1]!) > 1e-3,
  );
}
