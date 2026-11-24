import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanPutDownAperture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { putDown } from "./putDown";
import { putDownTarget } from "./putDownTarget";
import type { putDownTravel } from "./putDownTravel";

/**
 * Register and stage an aligned solid-object insertion and seated handoff.
 *
 * Use with HumanChain.extend({ putDownAperture }) and supply the law to
 * HumanPerformance. The receptacle must hold its opening and seat fixed until
 * the empty hand has withdrawn through the opening. The authored corridor must
 * clear the prop and hand.
 *
 * Adult shape-sorter trials distinguish transport to the opening from
 * insertion, with orientation primarily adjusted during transport (Ossmy et al.
 * 2020, Figures 1 and 3, https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/).
 *
 * A receptacle with a guide (`onto.guide`) carries the object itself from the
 * opening to the seat: the object rides the guide's socket while the placement
 * drives the guide's slider back to the seat, as a scabbard guides its blade
 * home, and the hand follows on its grip.
 */
export const putDownAperture: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPutDownAperture> =
  {
    name: "putDownAperture",
    family: putDown.name,
    // Over a carrier, a seated rider sheathing: the hand's work alone.
    overlay: true,
    interrupts: putDown.interrupts,
    demands: putDown.demands,
    plan,
  };

/**
 * Resolve the distinct, aligned receiver frames and ask placement to join them.
 *
 * @param context The action entry state, grip and authored receptacle.
 * @returns The staged placement plan with an aperture event before seating.
 * @throws {HumanRefusal} If the named grip, opening or seat cannot be used.
 * @evidence contracts/development/common.md#meaningful-documentation Names the installed law, the support requirement and the study underlying the phase split.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDownAperture>,
): IAutoMovieMotionHumanActionPlan {
  const { hand, onto, prop } = context.params;
  const side: AutoMovieHumanSide = hand ?? "right";
  if (context.entry.holds[side] !== prop || !prop)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "prop",
      value: prop,
      feasible: {
        kind: "alternatives",
        values: [context.entry.holds[side] ?? "none"],
      },
      reason: "aperture placement starts with the object in the selected hand",
      fix: "grasp the object with that hand before placing it",
    });
  if (
    onto === undefined ||
    !onto.prop ||
    !onto.aperture ||
    !onto.point ||
    onto.prop === prop
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "onto",
      value: onto?.prop ?? "absent",
      feasible: { kind: "alternatives", values: ["a separate receptacle"] },
      reason:
        "aperture placement needs an opening and a seat on a separate prop",
      fix: "name a receptacle and both of its affordances",
    });

  const seat: IAutoMovieRigidTransform = putDownTarget.of(
    context,
    context.entry.pose,
  )!;
  const through: (point: string) => IAutoMovieRigidTransform = (
    point: string,
  ): IAutoMovieRigidTransform =>
    putDownTarget.of(
      { ...context, params: { prop, onto: { ...onto, point } } },
      context.entry.pose,
    )!;
  const mouth: IAutoMovieRigidTransform = through(onto.aperture);
  const offset: IAutoMovieVector3 = Vector3.subtract(
    mouth.position,
    seat.position,
  );

  // Preserve the original straight passage and its admission.
  if (
    !(Vector3.length(offset) > Number.EPSILON) ||
    !(Quaternion.angle(mouth.rotation, seat.rotation) <= 1e-6)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "onto.aperture",
      value: onto.aperture,
      feasible: {
        kind: "alternatives",
        values: ["a distinct aligned opening"],
      },
      reason:
        "the opening and seat must share an attitude at distinct positions",
      fix: "author the opening and seat in the same attitude at distinct positions",
    });

  // Named approach and insertion sockets turn the straight passage into a
  // route of fixed, aligned waypoints relative to the seat.
  const approach: readonly string[] = onto.approach ?? [];
  const insertion: readonly string[] = onto.insertion ?? [];
  let route: putDownTravel.IRoute | undefined;
  if (approach.length !== 0 || insertion.length !== 0) {
    const ids: string[] = [
      ...approach,
      onto.aperture,
      ...insertion,
      onto.point,
    ];
    const reader: IAutoMovieMotionHumanPropReader = context.prop(onto.prop);
    const offsets: IAutoMovieVector3[] = [];
    for (const [index, id] of ids.entries()) {
      const posed: IAutoMovieRigidTransform =
        id === onto.aperture ? mouth : id === onto.point ? seat : through(id);
      const next: IAutoMovieVector3 = Vector3.subtract(
        posed.position,
        seat.position,
      );
      const previous: IAutoMovieVector3 | undefined = offsets[index - 1];
      if (
        reader.prop.affordances?.find(
          (item: IAutoMovieAffordance): boolean => item.id === id,
        )?.rides !== undefined ||
        !(Quaternion.angle(posed.rotation, seat.rotation) <= 1e-6) ||
        (previous !== undefined &&
          !(Vector3.distance(previous, next) > Number.EPSILON))
      )
        throw new HumanRefusal({
          kind: "affordance",
          axis: "onto",
          value: `${onto.prop}.${id}`,
          reason:
            "the insertion path needs fixed, aligned consecutive frames at distinct positions",
          fix: "name fixed sockets with the seat's attitude in the order the hand travels",
        });
      offsets.push(next);
    }
    route = {
      approach: offsets.slice(0, approach.length),
      insertion: offsets.slice(approach.length + 1, -1),
    };
  }
  const plan: IAutoMovieMotionHumanActionPlan = putDown.plan(
    context,
    offset,
    route,
  );
  if (onto.guide === undefined) return coursed(context, side, plan);

  // A guided receptacle carries the object from the opening to the seat: the
  // object rides the guide's socket while the slider runs back to the seat,
  // on the insertion's own minimum-jerk clock, until the seat mount takes it.
  const share: (name: string) => number = (name: string): number =>
    plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )!.share;
  const entry: number = share("aperture");
  const placed: number = share("placed");
  const length: number = Vector3.length(offset);
  const duration: number = plan.duration;
  return coursed(context, side, {
    ...plan,
    mounts: [
      { prop, onto: onto.prop, point: onto.guide.slide, from: entry },
      ...(plan.mounts ?? []),
    ],
    drives: [
      ...(plan.drives ?? []),
      {
        prop: onto.prop,
        articulation: onto.guide.slider,
        from: entry,
        to: placed,
        travel: (seconds: number): number =>
          length *
          (1 -
            minimumJerk(
              Math.min(
                1,
                Math.max(0, (seconds / duration - entry) / (placed - entry)),
              ),
            ).s),
      },
    ],
  });
}

/**
 * The placing arm laid as one admitted course over the whole placement
 * (`courseArmGoal`): it holds the plan's own goal at every second, the carry,
 * the insertion, the release and the retreat, with branch and swivel continuity
 * and the arm and the hand's digits kept clear of the body, in place of a fresh
 * fit at each second. Over a carrier the carried hand keeps its own riding
 * goal.
 */
function coursed(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDownAperture>,
  side: AutoMovieHumanSide,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  if (context.carrier !== undefined) return plan;
  return courseArmGoal({
    context,
    plan,
    side,
    span: { start: 0, ready: 0, relax: plan.duration, end: plan.duration },
  });
}
