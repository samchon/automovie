import type { AutoMovieEnvironment } from "@automovie/archetypes/environments";
import { AutoMovieEngineFilm, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieEnvironment,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieStageActor,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSupport,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A scripted transfer whose start will be read from the native schedule. */
type Crossing = Omit<
  AutoMovieEnvironment.ILiftCrossing,
  "id" | "start"
>;

/**
 * Stage a call, boarding, turn on the cab, ride and alighting on real lift prop
 * frames.
 */
export function environmentLiftActor(input: {
  environment: IAutoMovieEnvironment;
  id: string;
  lift: AutoMovieEnvironment.ILiftDefinition;
  schedule: readonly AutoMovieEnvironment.ILiftKey[];
  node?: string;
}): { film: AutoMovieMotionHumanPerformance; actor: IAutoMovieStageActor } {
  const { environment, id, lift } = input;
  const item: string = id.slice(id.lastIndexOf("/") + 1);
  const ground: IAutoMovieTransform = environment.anchors[`${item}/ground`]!;
  const cab: string = `${id}/cab`;
  const lowerPad: string = `${id}/stops/ground/landing`;
  const upperPad: string = `${id}/stops/upper/landing`;
  const call: string = `${id}/stops/ground/call`;
  const props: IAutoMovieMotionHumanProp[] = [
    cab,
    lowerPad,
    upperPad,
    call,
  ].map((node: string): IAutoMovieMotionHumanProp => {
    const model = environment.runtime.props.find(
      (candidate): boolean => candidate.node === node,
    )!.model;
    const piece: IAutoMovieStageSetPiece = environment.stage.set!.find(
      (candidate): boolean => candidate.node === node,
    )!;
    const frame = (time: number): IAutoMovieRigidTransform => {
      const placed: IAutoMovieTransform | null =
        AutoMovieEngineFilm.bakedTransformFromClipsAt(
          environment.runtime.objectMotions,
          node,
          time,
        );
      return {
        position: placed?.translation ?? piece.position,
        rotation: placed?.rotation ?? piece.rotation ?? Quaternion.identity(),
      };
    };
    const affordances: IAutoMovieAffordance[] = model.affordances ?? [];
    return {
      subject: node,
      frame: frame(0),
      fixed: true,
      motion: frame,
      affordances,
      points: Object.fromEntries(
        affordances.map((affordance: IAutoMovieAffordance) => [
          affordance.id,
          {
            point: affordance.frame.translation,
            normal: Quaternion.rotateVector(
              affordance.frame.rotation,
              Vector3.create(0, 1, 0),
            ),
          },
        ]),
      ),
    };
  });
  const local = (x: number, z: number): IAutoMovieVector3 =>
    Vector3.add(
      ground.translation,
      Quaternion.rotateVector(ground.rotation, Vector3.create(x, 0, z)),
    );
  const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
    ground.rotation,
    Vector3.create(0, 0, 1),
  );
  const yaw: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
  // The quiet stance's forward toes stay fully on the landing.
  const at: IAutoMovieVector3 = local(0.37, 0.322);
  const passageX: number = 0.32;
  const node: string = input.node ?? "lift-rider";
  const walkAcross: IAutoMovieMotionHumanActionLaw<Crossing> = {
    name: "liftDockTransfer",
    interrupts: AutoMovieMotionHumanStance.stand.interrupts,
    plan: (context) =>
      AutoMovieMotionHumanSupport.supportTransfer({
        ...context,
        params: lift.transfer({
          ...context.params,
          id,
          start: context.start,
        }),
      }),
  };
  // The rider waits in the cab until the lift's schedule has it docked at the
  // upper stop with its doors open.
  const opened: AutoMovieEnvironment.ILiftKey | undefined =
    input.schedule.find(
      (key: AutoMovieEnvironment.ILiftKey): boolean =>
        key.stop === "upper" && key.doors === "open",
    );
  if (opened === undefined)
    throw new Error(`The lift ${id} never opens at its upper stop.`);
  const exitFrom: number = opened.seconds;
  const wait: IAutoMovieMotionHumanActionLaw = {
    name: "liftCabWait",
    interrupts: AutoMovieMotionHumanStance.stand.interrupts,
    plan: (context) =>
      AutoMovieMotionHumanStance.stand.plan({
        ...context,
        params: {
          sway: 0,
          hold: exitFrom - context.start,
          on: { prop: cab },
        },
      }),
  };
  const depth = (prop: IAutoMovieMotionHumanProp): number => {
    const metres: number | undefined = prop.affordances?.find(
      (value: IAutoMovieAffordance): boolean => value.id === "sill",
    )?.depth;
    if (metres === undefined)
      throw new Error(
        `The lift fixture needs the sill depth for ${prop.subject}.`,
      );
    return metres;
  };
  const cabDepth: number = depth(props[0]!);
  const landingDepth: number = depth(props[2]!);
  const board: Crossing = {
    stop: "ground",
    direction: "board",
    seconds: 2,
    lead: "left",
    landing: { x: passageX, z: cabDepth / 2 - 0.12 },
  };
  const exit: Crossing = {
    stop: "upper",
    direction: "exit",
    seconds: 2,
    lead: "right",
    landing: { x: passageX, z: 0.14 - landingDepth / 2 },
  };
  const film: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
    seed: "environment-lift",
    props,
    laws: [walkAcross, wait],
    performers: [
      {
        subject: node,
        body: motionHumanBody("m-average"),
        at,
        yaw: yaw + 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject(node)
      .stand({ hold: 1.1, sway: 0, on: { prop: lowerPad } })
      .over((onPad) =>
        onPad.touch({
          target: { kind: "prop", subject: call, point: "call" },
          kind: "press",
          hand: "right",
          effector: "palm",
          hold: 0.02,
        }),
      )
      .registered(walkAcross.name, board)
      .walk({
        to: local(passageX, -0.3),
        face: yaw,
        pace: "normal",
        on: { prop: cab },
      })
      .registered(wait.name)
      .registered(walkAcross.name, exit)
      .stand({ hold: 0.9, sway: 0, on: { prop: upperPad } }).node,
  });
  return { film, actor: { node, position: at, facingDeg: yaw + 180 } };
}
