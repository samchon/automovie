import { AutoMovieArchetypeDoor } from "@automovie/archetypes";
import {
  AutoMovieComposition,
  Quaternion,
  Transform,
  Vector3,
} from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanThrowObject,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanThrowCatch,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
} from "@automovie/motions";

import type { IMotionTakeSource } from "../../src/executable/motionTake/IMotionTakeSource";
import bodyFixture from "./body.json" with { type: "json" };

/**
 * The stable identity and time references shared by the two installed
 * processes.
 */
export const fixture = {
  directory: "test/e2e-motion-take",
  source: "test/e2e-motion-take/source.ts",
  branchSource: "test/e2e-motion-take/branch.ts",
  sameSource: "test/e2e-motion-take/same.ts",
  opaqueSource: "test/e2e-motion-take/opaque.ts",
  artifact: "test/e2e-motion-take/original.json",
  branchArtifact: "test/e2e-motion-take/branch.json",
  sameArtifact: "test/e2e-motion-take/same.json",
  data: "test/e2e-motion-take/body.json",
  reference: "test/e2e-motion-take/reference.json",
  seconds: 0.25,
  sourceSeconds: 0.5,
  catchSeconds: 0.85,
  doorSeed: 7321,
};

/**
 * The edited occurrence and registered dependency shared by the two sibling
 * takes.
 */
export function takeMetadata(): Pick<
  IMotionTakeSource,
  "production" | "assets" | "seeds" | "shots" | "edit"
> {
  const shot: IAutoMovieShot = {
    id: "staged-catch",
    name: null,
    scene: "stage",
    camera: "wide",
    cameraMotion: null,
    duration: 3,
    performances: [],
    objectMotions: [],
  };
  const incoming: IAutoMovieShot = { ...shot, id: "next-view" };
  return {
    production: "installed-motion-take",
    assets: [fixture.data],
    seeds: [{ id: "door", value: String(fixture.doorSeed) }],
    shots: [shot, incoming],
    edit: {
      sequence: { id: "retimed-catch", name: "Retimed catch" },
      fps: 24,
      entries: [
        {
          shot: shot.id,
          trim: { start: 0, duration: fixture.sourceSeconds },
          playbackRate: 2,
          transition: null,
        },
        {
          shot: shot.id,
          trim: { start: fixture.sourceSeconds, duration: 2.5 },
          transition: null,
        },
        {
          shot: incoming.id,
          trim: null,
          transition: { kind: "crossDissolve", duration: 0.1 },
        },
      ],
      pacing: "Slow down mid-flight.",
      continuity: "Keep the original source clock at the hard cut.",
    },
  };
}

/** The world origin and neutral orientation for the stage props. */
const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** A staged release intersects the catcher after six tenths of a second. */
const launch: IAutoMovieMotionPropLaunch = {
  prop: "foam-ball",
  seconds: 0.25,
  point: { x: 0, y: 1.35, z: 0 },
  velocity: { x: 0, y: 0.5 * 9.80665 * 0.6, z: 2 },
};

/** The interception plane follows from the constant launch speed. */
const intercept: IAutoMovieVector3 = { ...launch.point, z: 1.2 };

/** Stage the ball without ending the emitter's grip on the separate parcel. */
function releasePlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
): IAutoMovieMotionHumanThrowObject.IPlan {
  verifyDoorSite(context.prop("door").prop);
  return {
    ...AutoMovieMotionHumanStance.stand.plan({
      ...context,
      params: { ...context.params, sway: 0, on: { prop: "carrier" } },
    }),
    events: [
      { name: "release", share: launch.seconds / context.params.hold! },
      {
        name: "retime",
        share: fixture.sourceSeconds / context.params.hold!,
      },
    ],
    launch: { ...launch, target: intercept },
    launches: [launch],
    holds: [{ side: "right", prop: "parcel", from: 0 }],
  };
}

/** A local law with one versioned callback and no custom interrupts. */
const release: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
  {
    name: "releaseFoamBall",
    interrupts: {},
    plan: releasePlan,
  };

/** The door carrier translates twelve centimetres each source second. */
function carrierMotion(seconds: number): IAutoMovieRigidTransform {
  return {
    position: { ...origin, z: 0.12 * seconds },
    rotation: Quaternion.identity(),
  };
}

/** The hinged door moves through sixty degrees in one source second. */
function hingeTravel(seconds: number): number {
  return 60 * Math.min(1, seconds) ** 2;
}

/** Compare the prepared reader with full model posing across the source cut. */
function verifyDoorSite(door: IAutoMovieMotionHumanProp): void {
  const site: IAutoMovieMotionHumanProp["articulateSite"] =
    AutoMovieMotionHumanObject.articulateSite(door);
  const articulate: IAutoMovieMotionHumanProp["articulate"] = door.articulate;
  if (site === undefined || articulate === undefined)
    throw new Error(
      "the prepared door site must be available in the Human owner",
    );
  const cut: number = fixture.sourceSeconds;
  for (const seconds of [cut + 0.001, cut - 0.001, cut, cut + 0.001]) {
    const state: Readonly<Record<string, number>> = {
      hinge: hingeTravel(seconds),
    };
    const narrow: IAutoMovieAffordance | undefined = site("pull", state);
    const full: IAutoMovieAffordance | undefined = articulate(
      state,
    ).affordances.find(
      (affordance: IAutoMovieAffordance): boolean => affordance.id === "pull",
    );
    if (
      narrow === undefined ||
      full === undefined ||
      !(
        Vector3.distance(narrow.frame.translation, full.frame.translation) <=
        1e-6
      ) ||
      !(Quaternion.angle(narrow.frame.rotation, full.frame.rotation) <= 1e-6)
    )
      throw new Error(
        `the prepared door pull must match its full pose at ${seconds}s`,
      );
  }
}

/**
 * Register one installed production with an active grip, articulated socket,
 * and flight.
 *
 * The source begins at twice normal rate, then returns to normal speed at
 * exactly 0.5 source seconds. Both occurrences retain the same authored seconds
 * at the seam.
 */
export function createMotionTakeSource(): IMotionTakeSource {
  const prepared: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(
      bodyFixture.params as IAutoMovieHumanParameters,
      { mass: bodyFixture.mass, id: "m-average" },
    );
  const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    prepared.skeleton,
    prepared.profile,
  );
  const initial: IAutoMovieVector3 = AutoMovieMotionHumanStance.stand.posture(
    body,
    origin,
    180,
  ).root;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const door: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "door",
    AutoMovieArchetypeDoor.create(
      { hinge: "right", hardware: "lever" },
      fixture.doorSeed,
    ),
    { at: origin, yaw: 0, fixed: false },
    undefined,
    undefined,
    [{ articulation: "hinge", start: 0, duration: 1, travel: hingeTravel }],
  );
  const frame: IAutoMovieRigidTransform = {
    position: origin,
    rotation: Quaternion.identity(),
  };
  return {
    ...takeMetadata(),
    take: "original",
    bindings: [
      { id: "release-plan", version: "1", value: releasePlan },
      {
        id: "staged-catch-plan",
        version: "1",
        value: AutoMovieMotionHumanThrowCatch.stageCatch.plan,
      },
      { id: "carrier-motion", version: "1", value: carrierMotion },
      { id: "hinge-travel", version: "1", value: hingeTravel },
      { id: "door-articulation", version: "1", value: door.articulate! },
    ],
    human: {
      "staged-catch": {
        seed: "staged-foam-catch",
        laws: [release],
        performers: [
          {
            subject: "emitter",
            body,
            at: { x: 4, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "catcher",
            body,
            at: { x: -initial.x, y: 0, z: intercept.z + 0.6 * arm - initial.z },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          {
            subject: launch.prop,
            frame: { ...frame, position: launch.point },
            points: {},
            affordances: [
              {
                id: "grip",
                kind: "handle",
                symmetry: "round",
                frame: Transform.of(origin, frame.rotation),
                extent: null,
                aperture: 0.15,
              },
            ],
          },
          {
            subject: "parcel",
            frame: { ...frame, position: { x: 4, y: 1, z: 0 } },
            points: {},
          },
          {
            subject: "carrier",
            frame,
            points: {},
            motion: carrierMotion,
            affordances: [
              {
                id: "rack",
                kind: "socket",
                frame: Transform.of(origin, frame.rotation),
                extent: null,
              },
            ],
          },
          {
            ...door,
            shapes: [],
            mounted: { prop: "carrier", point: "rack", offset: frame },
          },
        ],
        composition: AutoMovieComposition.sequence(
          AutoMovieComposition.parallel(
            AutoMovieMotionHumanChain.subject("emitter").registered(
              "releaseFoamBall",
              { hold: 2 },
              "foam-release",
            ).node,
            AutoMovieMotionHumanChain.subject("catcher").registered("stageCatch", {
              partner: "foam-release",
              ball: launch.prop,
              hands: "one",
            }).node,
          ),
          AutoMovieMotionHumanChain.subject("catcher").registered(
            "stand",
            { hold: 1, sway: 0 },
            "old-tail",
          ).node,
        ),
      },
    },
  };
}
