import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPutDownAperture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { putDown } from "./putDown";
import { putDownTarget } from "./putDownTarget";

/**
 * Register and stage an aligned solid-object insertion and seated handoff.
 *
 * Use with HumanChain.extend({ putDownAperture }) and supply the law to
 * HumanPerformance. The receptacle must hold its opening and seat fixed
 * until the empty hand has withdrawn through the opening. The authored
 * corridor must clear the prop and hand.
 *
 * Adult shape-sorter trials distinguish transport to the opening from
 * insertion, with orientation primarily adjusted during transport
 * (Ossmy et al. 2020, Figures 1 and 3,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the installed law, the support requirement and the study underlying the phase split.
 * @evidence contracts/development/design.md#principled-representation An installed placement law with two authored receiver frames and a shared rigid grip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the placement family's cut and grasp rules and adds only the request for an aperture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A separate registered law keeps built-in placement inputs and behavior intact.
 */
export const putDownAperture: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPutDownAperture> =
  {
    name: "putDownAperture",
    family: putDown.name,
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
  const mouth: IAutoMovieRigidTransform = putDownTarget.of(
    { ...context, params: { prop, onto: { ...onto, point: onto.aperture } } },
    context.entry.pose,
  )!;
  const offset: IAutoMovieVector3 = Vector3.subtract(
    mouth.position,
    seat.position,
  );

  // Both frames describe the same part of the object at two depths.
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
      fix: "author the opening and seat along a straight insertion corridor",
    });

  return putDown.plan(context, offset);
}
