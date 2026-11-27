import {
  AutoMovieEngineGravity,
  AutoMovieEnginePhysicalSimulation,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Bake a released ball on its playing surface and its effect on loose targets:
 * a bowling ball on the lane and its pins, a cue ball on the table and its
 * object balls, a putt on the green.
 *
 * Read the ball and target frames from the shared native cache with its film
 * clock offset. A delivery that touches no target has no target impact. Contact
 * order and target motion follow the supplied profiles and materials.
 * Parameter input: The world release state, fixed surface, placed targets and
 * simulation extent.
 * Returns: A fixed-step replay of the actual ball and target transforms and the
 * first target contact, if any.
 * For invalid duration, release time or a non-rigid input.
 * Engine admission owns profiles, coordinates and solver bounds.
 */
export async function bakePrecisionDeck(
  input: IAutoMovieMotionHumanPrecisionDeck,
): Promise<IAutoMovieMotionHumanPrecisionDeck.IResult> {
  const steps: number = Math.round(input.duration * RATE);
  if (
    steps < 1 ||
    input.maximumSteps < steps ||
    steps > 0xffffffff - 1
  )
    throw new RangeError(
      "Deck duration must contain whole 120 Hz intervals inside its step budget",
    );
  if (
    !(input.release >= 0)
  )
    throw new RangeError("Deck release must be a nonnegative film second");

  const bodies: IAutoMoviePhysicalSimulationInput.IBody[] = [
    placed(input.surface, steps, false),
    placed(input.ball, steps, true, input.ball.velocity),
    ...input.targets.map(
      (
        target: IAutoMovieMotionHumanPrecisionDeck.IRigid,
      ): IAutoMoviePhysicalSimulationInput.IBody => placed(target, steps, true),
    ),
  ];
  const simulation: IAutoMoviePhysicalSimulation =
    await AutoMovieEnginePhysicalSimulation.compute({
      duration: input.duration,
      rate: RATE,
      substeps: 4,
      gravity: AutoMovieEngineGravity.DOWN,
      floor: input.floor,
      floorBounds: input.floorBounds,
      bodies,
      impulses: [],
      checkpointEvery: RATE,
      yieldEvery: RATE,
      maximumSteps: input.maximumSteps,
      maximumSegments: bodies.length,
    });
  const targetIds: ReadonlySet<string> = new Set(
    input.targets.map(
      (target: IAutoMovieMotionHumanPrecisionDeck.IRigid): string => target.id,
    ),
  );
  let firstTarget:
    | IAutoMovieMotionHumanPrecisionDeck.ITargetContact
    | undefined;
  for (const contact of simulation.cache.contacts) {
    if (contact.source !== "solver" || (contact.impulse ?? 0) <= 0) continue;
    const target: string =
      contact.a.body === input.ball.id
        ? contact.b.body
        : contact.b.body === input.ball.id
          ? contact.a.body
          : "";
    if (!targetIds.has(target)) continue;
    const local: number =
      contact.samples?.find(
        (sample: ContactSample): boolean => sample.impulse > 0,
      )?.seconds ?? contact.seconds;
    const seconds: number = input.release + local;
    if (firstTarget === undefined || seconds < firstTarget.seconds)
      firstTarget = { id: target, seconds };
  }
  return {
    release: input.release,
    cache: simulation.cache,
    ...(firstTarget === undefined ? {} : { firstTarget }),
  };
}

/*
 * Cache rate for the finite deck result.
 */
const RATE: number = 120;

/*
 * One completed solver sample of a contact receipt.
 */
type ContactSample = NonNullable<IAutoMovieContactReceipt["samples"]>[number];

/*
 * Use the actual rigid model and its authored first velocity as native inputs.
 * Parameter rigid: The placed one-segment model.
 * Parameter steps: Number of cached physics intervals.
 * Parameter dynamic: Whether solver motion owns the object.
 * Parameter velocity: World metres per second at the release, at rest when absent.
 * Returns: A sampled body specification.
 */
function placed(
  rigid: IAutoMovieMotionHumanPrecisionDeck.IRigid,
  steps: number,
  dynamic: boolean,
  velocity?: IAutoMovieVector3,
): IAutoMoviePhysicalSimulationInput.IBody {
  const root: string | undefined = rigid.profile.segments[0]?.bone;
  if (root === undefined || rigid.profile.segments.length !== 1)
    throw new RangeError(`Deck object ${rigid.id} needs one rigid segment`);
  const target: IAutoMoviePhysicalSimulationInput.ITarget = {
    strength: 0,
    ...(dynamic ? { dynamicSegments: [root] } : {}),
    segments: { [root]: rigid.pose },
  };
  const targets: IAutoMoviePhysicalSimulationInput.ITarget[] =
    new Array<IAutoMoviePhysicalSimulationInput.ITarget>(steps + 1).fill(
      target,
    );
  if (velocity !== undefined)
    targets[1] = {
      ...target,
      segments: {
        [root]: {
          ...rigid.pose,
          position: AutoMovieEngineVector3.add(
            rigid.pose.position,
            AutoMovieEngineVector3.scale(velocity, 1 / RATE),
          ),
        },
      },
    };
  return {
    id: rigid.id,
    profile: rigid.profile,
    mode: { kind: dynamic ? "simulated" : "kinematic" },
    targets,
    rootStiffness: 0,
    rootDamping: 0,
    maximumRootForce: 0,
    complianceSeconds: 0,
    complianceStrength: 0,
  };
}
