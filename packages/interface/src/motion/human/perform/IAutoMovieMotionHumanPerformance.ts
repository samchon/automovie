import type { IAutoMovieInteractionEvent } from "../../../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieCheckLegality } from "../../composition/IAutoMovieCheckLegality";
import type { IAutoMovieComposition } from "../../composition/IAutoMovieComposition";
import type { IAutoMovieSchedule } from "../../composition/IAutoMovieSchedule";
import type { IAutoMovieScheduleCue } from "../../composition/IAutoMovieScheduleCue";
import type { AutoMovieMotionHumanScheduledInstant } from "../law/AutoMovieMotionHumanScheduledInstant";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanLayer } from "../law/IAutoMovieMotionHumanLayer";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanBlast } from "./IAutoMovieMotionHumanBlast";
import type { IAutoMovieMotionHumanForce } from "./IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "./IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPerformanceAim } from "./IAutoMovieMotionHumanPerformanceAim";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";

/**
 * A performance of people and props: their chained actions placed on the
 * film clock, every cut checked against the actions' interrupt tables, and
 * each person's displayed pose a pure function of film seconds.
 *
 * Construction resolves the composition with the engine's schedule resolver.
 * Each intent's timing comes from its law's plan, made from the state the
 * performer is in when the intent starts: the previous action's displayed
 * pose and velocity at its cut or end, its posture and its planted feet. A cut
 * (an intent's `until`) is legal only inside a window of the cut action's
 * interrupt table for the next action; otherwise construction throws with
 * the legal windows. A `proximity` cut is found by scanning the 24 Hz grid for
 * the first frame within the distance and bisecting 20 times, about 1e-7 s,
 * deterministic on a fixed grid whose last sample is the action's end; a
 * distance never met leaves the action uncut. Given rules, the placed schedule is checked
 * with the engine's legality check and a violation refuses the performance.
 * An input equal to one the process resolved recently reads that resolution
 * again (`HumanPerformanceState.of`): the resolution is a pure function of
 * its input.
 *
 * Sampling a person at a second takes the active action's posture, resolves
 * it to a pose, adds the decaying inertialization offset of the transition
 * that entered it, re-solves every planted or gripping limb onto its goal so
 * no contact slides, and clamps to the range of motion ({@link HumanSegment}).
 * A person before their first action stands at their starting place.
 * Additive layers (gaze, breathing) apply over every action without cutting
 * it. While the schedule is resolved, a person's poses may read people whose
 * actions are not placed yet, so nothing is cached until every action is
 * placed; then caches and transition offsets start afresh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds from 0 to the last action's end. state: One input per coupled degree of freedom a prop's acts or tracks have moved by a film second (`HumanPerformanceObject.state`), in the latest begun writer's coordinate. A later writer of another coordinate of the same degree replaces the old one; after its end its last travel holds. A degree absent from the record starts at its leader's zero. hits: Every hit of the performance in time order, or those on one person or prop (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts, each as the one shared interaction record. rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.
 * @evidence contracts/development/design.md#principled-representation duration: Seconds from 0 to the last action's end. state: One input per coupled degree of freedom a prop's acts or tracks have moved by a film second (`HumanPerformanceObject.state`), in the latest begun writer's coordinate. A later writer of another coordinate of the same degree replaces the old one; after its end its last travel holds. A degree absent from the record starts at its leader's zero. hits: Every hit of the performance in time order, or those on one person or prop (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts, each as the one shared interaction record. rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of, performance); audit/HumanVerdicts.ts (remember, performance); ensemble/HumanPopulation.ts (HumanPopulation.cycle, performance); executable/cases/affectionCases.ts (affectionCases.run, return); executable/cases/affectionCases.ts (affectionCases.performance, return); executable/cases/affectionCases.ts (attempt, run).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieSchedule, IAutoMovieMotionHumanPerformer, IAutoMoviePose, IAutoMovieMotionHumanPosture, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanProp, IAutoMovieComposition, IAutoMovieCheckLegality.IRule, IAutoMovieMotionHumanActionLaw identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanPerformance {
  /** The resolved schedule. */
  readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  readonly duration: number;

  /** The people, as the performance was given them. */
  readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.pose: A person's displayed canonical pose at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.pose is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  pose(subject: string, seconds: number): IAutoMoviePose;

  /**
   * A person's active posture at a film second, before layers: the posture
   * the active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.posture: A person's active posture at a film second, before layers: the posture the active action writes, or the standing posture before the first.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.posture is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  posture(subject: string, seconds: number): IAutoMovieMotionHumanPosture;

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.bones: A person's world bones at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.bones is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  bones(
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * A prop's world frame at a film second: its rest frame until a hand grips
   * it, then carried by the gripping hand with the offset it had when the
   * grip closed, and left where the last grip released it.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the
   * engine's `IAutoMovieAttachment`, a bone plus an offset, with the offset
   * captured at the grip's start instead of authored. When grips overlap (a
   * handover), the one that closed last carries the prop. A hold an action
   * leaves (`IAutoMovieMotionHumanActionPlan.holds`) is a grip lasting until a later action
   * takes that hand over. A released prop stays where the last grip to end
   * released it, unless an action launched it: then it flies from the launch
   * and rests where it struck (`HumanPropFlight`) until a later grip takes it.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Its frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.prop: A prop's world frame at a film second: its rest frame until a hand grips it, then carried by the gripping hand with the offset it had when the grip closed, and left where the last grip released it. A grip is any action's contact window of kind `grip` on a hand whose support is this prop. The hand's grip socket rides the hand bone, so the prop is a child of the hand while held: the rigid coupling of the engine's `IAutoMovieAttachment`, a bone plus an offset, with the offset captured at the grip's start instead of authored. When grips overlap (a handover), the one that closed last carries the prop. A hold an action leaves (`IAutoMovieMotionHumanActionPlan.holds`) is a grip lasting until a later action takes that hand over. A released prop stays where the last grip to end released it, unless an action launched it: then it flies from the launch and rests where it struck (`HumanPropFlight`) until a later grip takes it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.prop is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  prop(subject: string, seconds: number): IAutoMovieRigidTransform;

  /**
   * One input per coupled degree of freedom a prop's acts or tracks have
   * moved by a film second (`HumanPerformanceObject.state`), in the latest
   * begun writer's coordinate. A later writer of another coordinate of the
   * same degree replaces the old one; after its end its last travel holds.
   * A degree absent from the record starts at its leader's zero.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Travel by articulation id, in each articulation's own unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.state: One input per coupled degree of freedom a prop's acts or tracks have moved by a film second (`HumanPerformanceObject.state`), in the latest begun writer's coordinate. A later writer of another coordinate of the same degree replaces the old one; after its end its last travel holds. A degree absent from the record starts at its leader's zero.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.state is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  state(subject: string, seconds: number): Record<string, number>;

  /**
   * A prop's flights in film order (`HumanPropFlight`): each launch an
   * action published, its engine flight and its first contact, for audits
   * and the hit record.
   *
   * @param subject The prop.
   * @returns The flights; none for a prop never launched.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.flights: A prop's flights in film order (`HumanPropFlight`): each launch an action published, its engine flight and its first contact, for audits and the hit record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.flights is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  flights(subject: string): readonly IAutoMovieMotionHumanPropFlight.IFlight[];

  /**
   * Every hit of the performance in time order, or those on one person or
   * prop (`HumanPerformanceHits`): melee stops, blasts and flights' first
   * contacts, each as the one shared interaction record.
   *
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.hits: Every hit of the performance in time order, or those on one person or prop (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts, each as the one shared interaction record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.hits is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  hits(subject?: string): readonly IAutoMovieInteractionEvent[];

  /**
   * A soft prop's particle positions at a film second: its lattice solved
   * once over the performance from the displayed poses at its domain's
   * fixed step, and read between the two steps around the second, so a seek
   * costs no solve and every frame rate reads the same state
   * (`HumanPerformanceSoft`).
   *
   * @param subject The soft prop.
   * @param seconds Film seconds.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {HumanRefusal} When the prop is not soft or the performance outlasts its domain's step budget.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.soft: A soft prop's particle positions at a film second: its lattice solved once over the performance from the displayed poses at its domain's fixed step, and read between the two steps around the second, so a seek costs no solve and every frame rate reads the same state (`HumanPerformanceSoft`).
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.soft is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  soft(subject: string, seconds: number): number[];

  /**
   * The force a soft prop pulls a gripping hand with at a film second
   * (`HumanPerformanceSoft.load`): the compliant solver's force on the
   * particle the hand holds, held over its step.
   *
   * @param subject The soft prop.
   * @param person The gripping person.
   * @param side The hand.
   * @param seconds Film seconds.
   * @returns Newtons on the hand, world frame; zero when the hand does not hold the prop or its domain declares no compliance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.softLoad: The force a soft prop pulls a gripping hand with at a film second (`HumanPerformanceSoft.load`): the compliant solver's force on the particle the hand holds, held over its step.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.softLoad is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  softLoad(
    subject: string,
    person: string,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3;

  /**
   * The film second of an instant: a second as given, or a named instant of
   * an anchored action or of a cue track.
   *
   * @param at The instant.
   * @returns The film second.
   * @throws {HumanRefusal} When nothing is anchored or tracked under the name, or it has no such event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.instant: The film second of an instant: a second as given, or a named instant of an anchored action or of a cue track.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.instant is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  instant(at: AutoMovieMotionHumanScheduledInstant): number;

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.segments: A person's placed actions, in order.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.segments is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  segments(subject: string): readonly IAutoMovieMotionHumanSegment[];

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.overlays: The actions a person performs over their placed actions, in placement order: each rides a carrier and takes only its claimed channels.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.overlays is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  overlays(subject: string): readonly IAutoMovieMotionHumanSegment.IOverlay[];

  /**
   * A target's world point and outward normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame and body, including their optional subject id so a carried or mounted prop is read on the supplied bones, as a self target is.
   * @returns The aim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformance.aim: A target's world point and outward normal at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformance.aim is used through packages/motions/src/perform/HumanPerformance.ts.
   */
  aim(
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): {
    /** Resolved target point in world metres. */
    point: IAutoMovieVector3;
    /** Resolved target's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };
}

/**
 * A performance of people and props: their chained actions placed on the
 * film clock, every cut checked against the actions' interrupt tables, and
 * each person's displayed pose a pure function of film seconds.
 *
 * Construction resolves the composition with the engine's schedule resolver.
 * Each intent's timing comes from its law's plan, made from the state the
 * performer is in when the intent starts: the previous action's displayed
 * pose and velocity at its cut or end, its posture and its planted feet. A cut
 * (an intent's `until`) is legal only inside a window of the cut action's
 * interrupt table for the next action; otherwise construction throws with
 * the legal windows. A `proximity` cut is found by scanning the 24 Hz grid for
 * the first frame within the distance and bisecting 20 times, about 1e-7 s,
 * deterministic on a fixed grid whose last sample is the action's end; a
 * distance never met leaves the action uncut. Given rules, the placed schedule is checked
 * with the engine's legality check and a violation refuses the performance.
 * An input equal to one the process resolved recently reads that resolution
 * again (`HumanPerformanceState.of`): the resolution is a pure function of
 * its input.
 *
 * Sampling a person at a second takes the active action's posture, resolves
 * it to a pose, adds the decaying inertialization offset of the transition
 * that entered it, re-solves every planted or gripping limb onto its goal so
 * no contact slides, and clamps to the range of motion ({@link HumanSegment}).
 * A person before their first action stands at their starting place.
 * Additive layers (gaze, breathing) apply over every action without cutting
 * it. While the schedule is resolved, a person's poses may read people whose
 * actions are not placed yet, so nothing is cached until every action is
 * placed; then caches and transition offsets start afresh.
 *
 */
export namespace IAutoMovieMotionHumanPerformance {
  /**
   * The callable constructor and static factories.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The callable constructor and static factories.
   * @evidence contracts/development/design.md#principled-representation A single input describes seed, performers, props and composition; runtime construction resolves and validates them before exposing the performance queries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanPerformance contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPerformance.IInput, IAutoMovieMotionHumanPerformance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IConstructor {
    /**
     * Resolve a performance.
     *
     * @param input The chain seed, the performers, the props and the composition.
     */
    new (
      input: IAutoMovieMotionHumanPerformance.IInput,
    ): IAutoMovieMotionHumanPerformance;
  }

  /**
   * Construction input for one deterministic performance: seed, performers, props, composition and optional environmental constraints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.
   * @evidence contracts/development/design.md#principled-representation rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/affectionCases.ts (performers, return); perform/HumanPerformanceKey.ts (HumanPerformanceKey.of, input); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.resolve, input); perform/HumanPerformanceState.ts (HumanPerformanceState.of, input); perform/HumanPerformance.ts (HumanPerformance); perform/HumanPerformanceState.ts (HumanPerformanceState).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanProp, IAutoMovieComposition, IAutoMovieCheckLegality.IRule, IAutoMovieMotionHumanActionLaw identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IInput {
    /** The chain seed every draw starts from. */
    seed: string;

    /** The people. */
    performers: IAutoMovieMotionHumanPerformer[];

    /** The props actions aim at. */
    props?: IAutoMovieMotionHumanProp[];

    /** What everyone does. */
    composition: IAutoMovieComposition;

    /**
     * The production's legality rules, such as `KickboxingRules.rules`,
     * checked against the placed schedule with the engine's
     * `checkAutoMovieLegality`; any violation refuses the performance with
     * every broken rule in the message. None when absent.
     */
    rules?: readonly IAutoMovieCheckLegality.IRule[];

    /**
     * Laws of the production's own, performed like the vocabulary's under
     * the names they carry: an act the vocabulary lacks, written on the same
     * kernel (a clock, a base and part primitives), or a row of an existing
     * law with some of its parameters fixed. A name the vocabulary already
     * has, or one given twice, refuses the performance. A registered law
     * draws from streams keyed by its own name, so registering it changes no
     * other action's draws. `HumanChain.extend` gives its typed method.
     */
    laws?: readonly IAutoMovieMotionHumanActionLaw<never>[];

    /**
     * Additive layers per subject, applied in order over the person's
     * actions: each for the whole film, or scheduled in a window between two
     * instants (`IAutoMovieMotionHumanLayer.IScheduled`).
     */
    layers?: Readonly<
      Record<
        string,
        readonly (
          | IAutoMovieMotionHumanLayer
          | IAutoMovieMotionHumanLayer.IScheduled
        )[]
      >
    >;

    /**
     * Tracks of named instants that belong to no action, by track name: a
     * dialogue's line starts and accents, a score's beats (`HumanCue` builds
     * both). An action is synced to one (`HumanChain.sync`) and cut on one
     * (`until`) as on another action's events; a track's name is used like
     * an anchor, so no action may be anchored under it.
     */
    cues?: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

    /**
     * Forces on the performers (#3429): impulses at an instant and forces
     * sustained over a span, read by the reactions the composition places
     * (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when
     * absent.
     */
    forces?: readonly IAutoMovieMotionHumanForce[];

    /**
     * What stands in the performers' way: the scene's walls and solid
     * objects with their openings (`HumanObstacle`). A law that moves a body
     * across the floor reads them through its context and refuses a path
     * through a solid; none when absent, and then every path is free.
     */
    obstacles?: readonly IAutoMovieMotionHumanObstacle[];

    /**
     * Blasts in the scene: each gives a hit to every person within its
     * radius at its instant (`HumanBlast`, `hits`). None when absent.
     */
    blasts?: readonly IAutoMovieMotionHumanBlast.IBlast[];
  }
}
