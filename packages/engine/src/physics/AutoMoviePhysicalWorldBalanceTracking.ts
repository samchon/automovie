import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { advancePhysicalBalance as AdvanceBalance } from "./advancePhysicalBalance";
import { AutoMovieEnginePhysics } from "./AutoMovieEnginePhysics";
import { samplePhysicalAuthoredTargets } from "./internal/samplePhysicalAuthoredTargets";

/** The balance phase's inputs. */
export namespace AutoMoviePhysicalWorldBalanceTracking {
  /**
   * Advance a tracked body's balance this substep (`trackPhysicalWorld`): the
   * authored command the plan phases follow, and the controller's assessment on
   * the body's measured supports.
   *
   * @param scope The world, the run and its binding, the body and its supports.
   * @returns The assessment, absent while the root is not dynamic, the body has
   *   no balance or its target no strength.
   */
  export function track(
    scope: AutoMoviePhysicalWorldBalanceTracking.IScope,
  ): IAutoMovieAdvancePhysicalBalance.IResult | undefined {
    const {
      world,
      input,
      bound,
      step,
      recovery,
      contacts,
      seconds,
      dt,
      body,
      target,
      authoredGoals,
      rootDynamic,
      actuation,
      balanceSupports,
    }: AutoMoviePhysicalWorldBalanceTracking.IScope = scope;
    // The authored command the plan phases follow where IHMC follows its
    // planner (`physicalAuthoredCapture`): its centre of mass and velocity;
    // their acceleration is the authored velocity differentiated over the
    // controller period, sampled again a substep earlier within the cache
    // interval: a derivative of the input, not a control rule.
    const authored:
      | NonNullable<Parameters<typeof AdvanceBalance>[0]["command"]>
      | undefined = body.balance
      ? ((): NonNullable<Parameters<typeof AdvanceBalance>[0]["command"]> => {
          const now: AutoMovieEnginePhysics.IAuthoredCenter =
            AutoMovieEnginePhysics.physicalAuthoredCenter(body.profile, authoredGoals);
          const before: AutoMovieEnginePhysics.IAuthoredCenter =
            AutoMovieEnginePhysics.physicalAuthoredCenter(
              body.profile,
              samplePhysicalAuthoredTargets(
                body,
                target,
                bound,
                step,
                seconds - dt,
                input.rate,
              ),
            );
          return {
            center: now.center,
            velocity: now.velocity,
            acceleration: Vector3.scale(
              Vector3.subtract(now.velocity, before.velocity),
              1 / dt,
            ),
          };
        })()
      : undefined;
    const assessment: IAutoMovieAdvancePhysicalBalance.IResult | undefined =
      rootDynamic && body.balance && target.strength > 0
        ? AdvanceBalance({
            world,
            body: body.id,
            profile: body.profile,
            segments: bound.segments.get(body.id)!,
            colliders: bound.colliders,
            contacts,
            policy: body.balance,
            ...(authored ? { command: authored } : {}),
            state: (recovery[body.id] ??= {
              last: "supported",
              steps: [],
              offsets: Object.create(null),
            }),
            targets: Object.fromEntries(
              Object.entries(authoredGoals).map(
                ([bone, goal]: [
                  string,
                  IAutoMovieSamplePhysicalTarget.IResult,
                ]): [string, IAutoMovieRigidTransform] => [bone, goal.pose],
              ),
            ),
            velocities: Object.fromEntries(
              body.balance.pattern.limbs.map(
                (
                  limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
                ): [string, IAutoMovieVector3] => {
                  const goal: IAutoMovieSamplePhysicalTarget.IResult =
                    authoredGoals[limb.bone]!;
                  return [
                    limb.bone,
                    Vector3.add(
                      goal.velocity,
                      Vector3.cross(
                        goal.angularVelocity,
                        Quaternion.rotateVector(
                          goal.pose.rotation,
                          limb.localPoint ?? { x: 0, y: 0, z: 0 },
                        ),
                      ),
                    ),
                  ];
                },
              ),
            ),
            unavailable: [
              ...new Set([
                ...(target.unavailableSupports ?? []),
                ...Object.entries(target.supportStrength ?? {})
                  .filter((entry: [string, number]): boolean => entry[1] === 0)
                  .map((entry: [string, number]): string => entry[0]),
              ]),
            ],
            seconds,
            dt,
            gravity:
              Math.abs(input.gravity.y) *
              (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
            floor: input.floor,
            actuation,
            supports: balanceSupports,
            ...disturbance(input, body, seconds),
          })
        : undefined;
    return assessment;
  }

  /** What the balance phase reads of the substep. */
  export interface IScope {
    /** The solver world. */
    world: AutoMovieXpbdWorld;

    /** The run's input. */
    input: IAutoMoviePhysicalSimulationInput.IInput;

    /** The run's binding. */
    bound: Bound;

    /** The enclosing cache interval. */
    step: number;

    /** Each body's recovery state, written when a body has none. */
    recovery: Record<string, IAutoMoviePhysicalRecoveryState>;

    /** The solver's contact receipts. */
    contacts: readonly IAutoMovieContactReceipt[];

    /** The substep's local seconds. */
    seconds: number;

    /** The substep, seconds. */
    dt: number;

    /** The body. */
    body: IAutoMoviePhysicalSimulationInput.IBody;

    /** Its sampled target. */
    target: IAutoMoviePhysicalSimulationInput.ITarget;

    /** Its authored goals. */
    authoredGoals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;

    /** Whether its root is dynamically owned. */
    rootDynamic: boolean;

    /** The internal actuation's accumulated moments, by joint. */
    actuation: Map<string, IAutoMovieVector3> | undefined;

    /** The balance pattern's measured supports. */
    balanceSupports: IAutoMovieCollectPhysicalSupports.ISupport[];
  }
}

/**
 * On the substep after one of a body's stated pushes, the pushes after it, each
 * its instant and the centre of mass's velocity jump, the impulse over the mass
 * (`preparePhysicalDisturbanceSpan`); a push is applied on its cache interval's
 * first substep, so its effect is first read on the second.
 */
function disturbance(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  seconds: number,
): { disturbance?: { pushes: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanPush[] } } {
  const substeps: number = input.substeps!;
  const rate: number = input.rate * substeps;
  const tick: number = Math.round(seconds * rate);
  const scale: number =
    body.mode.kind === "exaggerated" ? body.mode.impulse : 1;
  const pushes = input.impulses.filter(
    (impulse: (typeof input.impulses)[number]): boolean =>
      impulse.body === body.id && Vector3.length(impulse.impulse) > 0,
  );
  const read = (impulse: (typeof pushes)[number]): number =>
    (impulse.step - 1) * substeps + 2;
  const now = pushes.find(
    (impulse: (typeof pushes)[number]): boolean => read(impulse) === tick,
  );
  if (!now) return {};
  return {
    disturbance: {
      pushes: pushes
        .filter(
          (impulse: (typeof pushes)[number]): boolean => read(impulse) > tick,
        )
        .map((impulse: (typeof pushes)[number]) => ({
          seconds: read(impulse) / rate,
          velocity: Vector3.scale(impulse.impulse, scale / body.profile.mass),
        })),
    },
  };
}
