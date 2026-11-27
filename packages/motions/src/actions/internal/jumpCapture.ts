import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { jumpEndpoints } from "./jumpEndpoints";
import { jumpFlight } from "./jumpFlight";
import { jumpLanding } from "./jumpLanding";
import type { jumpPush } from "./jumpPush";
import type { jumpPushEnd } from "./jumpPushEnd";
import type { jumpState } from "./jumpState";

/**
 * A jump's ballistics and the landing's capture (`jump.plan`): the centre of
 * mass at the achieved take-off and touchdown poses, the flight between them,
 * the touchdown root moved behind the footprints so the extrapolated centre of
 * mass lies over the feet as they land, and the flight solved again to that
 * caught landing. Read from the plan's body, mass model, parameters, heights,
 * landing and endpoint states.
 *
 * @param scope What the plan solves the flight from.
 * @returns The take-off centre, the caught landing, its endpoints and centre,
 *   and the flight to it.
 * @throws {HumanRefusal} When the apex is not positive or does not clear a
 *   raised landing (`jumpFlight`).
 */
export function jumpCapture(scope: jumpCapture.IScope): jumpCapture.ICapture {
  const {
    body,
    model,
    context,
    l,
    rise,
    to,
    landingHeading,
    upright,
    headingChange,
    endProps,
    rootT,
    landing,
    landingKnee,
    startState,
    endState,
  }: jumpCapture.IScope = scope;
  // Ballistics and free goals inherit these same achieved endpoint poses.
  const massBones: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) massBones.add(segment.bone);
  const readMassBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    massBones,
  );
  const { takeoff: comT, landing: comL }: IPlan = ((): IPlanResult => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return {
      takeoff: resolveAutoMovieCenterOfMass.place(
        model,
        readMassBones(startState.pose, read()),
      ),
      landing: resolveAutoMovieCenterOfMass.place(
        model,
        readMassBones(endState.pose, read()),
      ),
    };
  })();
  const flight: jumpFlight.IFlight = jumpFlight.solve(
    comT,
    comL,
    context.params.apex,
    l,
    rise,
  );
  // The landing's capture (Hof 2008, Hum Mov Sci 27:112; Pratt et al. 2006,
  // the capture point): the root touches down behind the footprints by the
  // flight's horizontal speed over the body's pendulum frequency, the one
  // the balance audit reads (`resolveAutoMovieCenterOfMass.pendulum`), so
  // the extrapolated centre of mass, the centre plus its speed over that
  // frequency, lies over the feet as they land: the place a body can stop
  // over. The speed is the flight's own, the distance its centre covers
  // over its time; the offset shortens that distance, so with `D` the
  // distance to a landing over the feet and `T` the flight's time (set by
  // the heights alone) the speed is `D / (T + 1 / omega)` in closed form.
  const omega: number = resolveAutoMovieCenterOfMass.frequency(
    resolveAutoMovieCenterOfMass.pendulum(l),
  );
  const ahead: number = Math.max(
    0,
    (comL.x - comT.x) * Math.sin((landingHeading * Math.PI) / 180) +
      (comL.z - comT.z) * Math.cos((landingHeading * Math.PI) / 180),
  );
  const caught: jumpLanding.ILanding = jumpLanding(
    body,
    to,
    landingHeading,
    rise,
    upright.lean,
    headingChange !== 0,
    ahead / (flight.T + 1 / omega) / omega,
  );
  const caughtEnds: jumpEndpoints.IEnds = jumpEndpoints(
    endProps,
    rootT,
    caught.touched,
    landing,
    landingHeading,
    landingKnee,
  );
  const caughtCentre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    readMassBones(caughtEnds.end.pose, prepareHumanPoseResolution()()),
  );
  const { vy, T, launch, land }: jumpFlight.IFlight = jumpFlight.solve(
    comT,
    caughtCentre,
    context.params.apex,
    l,
    rise,
  );

  return { comT, caught, caughtEnds, caughtCentre, vy, T, launch, land };
}

/** What a jump's capture reads and what it gives. */
export namespace jumpCapture {
  /** What a jump plan solves its flight from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The body's mass model. */
    model: IAutoMovieResolveCenterOfMass.IModel;

    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>;

    /** The hip height, metres. */
    l: number;

    /** The landing surface's height, metres. */
    rise: number;

    /** The destination on the floor. */
    to: IAutoMovieVector3;

    /** The landing's heading, degrees. */
    landingHeading: number;

    /** The upright stand's alignment. */
    upright: IAutoMovieMotionHumanStandUpright.IAlignment;

    /** The turn from the take-off heading to the landing's, degrees. */
    headingChange: number;

    /** The push's terminal writer's props. */
    endProps: Parameters<typeof jumpPushEnd>[0];

    /** The take-off root. */
    rootT: IAutoMovieVector3;

    /** Each foot's landing footprint. */
    landing: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** The knee planes at landing. */
    landingKnee: jumpPush.IProps["knee"];

    /** The achieved take-off state. */
    startState: jumpState.IState;

    /** The achieved touchdown state. */
    endState: jumpState.IState;
  }

  /** The flight to the caught landing. */
  export interface ICapture {
    /** The centre of mass at take-off. */
    comT: IAutoMovieVector3;

    /** The caught landing. */
    caught: jumpLanding.ILanding;

    /** The endpoints to the caught landing. */
    caughtEnds: jumpEndpoints.IEnds;

    /** The centre of mass at the caught touchdown. */
    caughtCentre: IAutoMovieVector3;

    /** The vertical take-off speed, metres a second. */
    vy: jumpFlight.IFlight["vy"];

    /** The flight's time, seconds. */
    T: jumpFlight.IFlight["T"];

    /** The centre's launch velocity. */
    launch: jumpFlight.IFlight["launch"];

    /** The centre's landing velocity. */
    land: jumpFlight.IFlight["land"];
  }
}
/** The record of `IPlanResult`'s site. */
type IPlanResult = {
  takeoff: IAutoMovieVector3;
  landing: IAutoMovieVector3;
};

/** The record of `IPlan`'s site. */
type IPlan = { takeoff: IAutoMovieVector3; landing: IAutoMovieVector3 };
