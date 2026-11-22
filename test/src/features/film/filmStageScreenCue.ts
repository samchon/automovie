import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "@automovie/archetypes";
import { Quaternion, materializeCompiledEffects } from "@automovie/engine";
import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStand,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  stand,
} from "@automovie/motions";

import { motionHumanBody } from "../internal/motionHumanBody";

/** Authored scene and effect inputs shared by the two camera reads. */
export namespace filmStageScreenCue {
  /** Source seconds at which the operator sends the rehearsal token. */
  export const RELEASE: number = 0.25;
  /** Source seconds at which the token reaches the panel. */
  export const CONTACT: number = 0.5;
  /** Source seconds at which the observer starts the scripted look. */
  export const RESPONSE: number = 7 / 12;
  /** Output frames sampled per film second. */
  export const FPS: number = 24;

  /** A decorative stage panel built as a fixed frame and a detachable tile. */
  export type Panel = AutoMovieArchetype<never, never>;

  /** Make a solid decorative panel whose visible tile can separate. */
  export function panel(): Panel {
    const builder: AutoMovieArchetypeBuilder<never, never> =
      new AutoMovieArchetypeBuilder({
        draw: new AutoMovieArchetypeDrawSession<never>(
          "rehearsal-panel",
          {},
          undefined,
          {},
        ),
        name: "decorative panel",
        material: "wood",
      });
    const frame = { color: "#274932" };
    builder.box(
      "base",
      { x: 1.5, y: 0.28, z: 0.52 },
      { x: 0, y: 0.14, z: 0 },
      frame,
    );
    builder.box(
      "left-rail",
      { x: 0.22, y: 1.3, z: 0.28 },
      { x: 0.59, y: 0.72, z: -0.15 },
      frame,
    );
    builder.box(
      "right-rail",
      { x: 0.22, y: 1.3, z: 0.28 },
      { x: -0.59, y: 0.72, z: -0.15 },
      frame,
    );
    builder.box(
      "top",
      { x: 1.4, y: 0.22, z: 0.28 },
      { x: 0, y: 1.32, z: -0.15 },
      frame,
    );
    builder.box(
      "tile",
      { x: 0.98, y: 0.68, z: 0.24 },
      { x: 0, y: 0.85, z: -0.38 },
      { color: "#d8ac61" },
    );
    builder.fracture([{ id: "tile", parts: ["tile"] }]);
    return builder.build(2, { outcome: { fracture: 1 } });
  }

  /** Compose a foam token crossing a set and the actor looking at the result. */
  export function rehearse(
    pane: Panel,
    placed: IAutoMovieRigidTransform,
    contact: boolean,
  ): HumanPerformance {
    const token: IAutoMovieVector3 = { x: contact ? 0 : 2, y: 1, z: -1 };
    const rehearsal: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
      {
        name: "sceneryRehearsal",
        interrupts: stand.interrupts,
        plan(
          context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
        ): IAutoMovieMotionHumanActionPlan {
          return {
            ...stand.plan(context),
            launches: [
              {
                prop: "foam-token",
                seconds: RELEASE,
                point: token,
                velocity: { x: 0, y: 0, z: 2 },
              },
            ],
          };
        },
      };
    const operator = HumanChain.subject("performer").registered(
      rehearsal.name,
      {
        seconds: 1,
        sway: 0,
      },
    );
    const waiting = HumanChain.subject("observer").stand({
      seconds: contact ? RESPONSE : 1,
      sway: 0,
    });
    const response = contact
      ? waiting.look(
          {
            target: { kind: "point", frame: "world", at: { x: 0, y: 1, z: 0 } },
            with: "head",
            seconds: 1 - RESPONSE,
          },
          "notice-the-panel",
        )
      : waiting;
    const body = motionHumanBody("m-average");
    return new HumanPerformance({
      seed: "foam-rehearsal",
      laws: [rehearsal],
      performers: [
        {
          subject: "performer",
          body,
          at: { x: -3, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "observer",
          body,
          at: { x: -2.7, y: 0, z: -1.2 },
          yaw: 20,
          proficiency: { level: "trained" },
        },
      ],
      composition: operator.with(response).node,
      props: [
        HumanObject.prop("panel", pane, placed),
        {
          subject: "foam-token",
          frame: { position: token, rotation: Quaternion.identity() },
          points: {},
        },
      ],
    });
  }

  /** An amber screen puff bounded to the observed point in the incoming shot. */
  export function flash(at: IAutoMovieVector3): IAutoMovieCompiledEffect {
    const recipe: IAutoMovieEffectRecipe = {
      id: "scenery-amber-puff",
      kind: "dust",
      seed: 17,
      emission: { rate: 0, burst: 3, duration: 1 / FPS },
      particle: {
        lifetime: { min: 0.14, max: 0.14 },
        size: { min: 0.07, max: 0.07 },
        color: "#ffbc6b",
        opacity: { min: 0.7, max: 0.7, envelope: "constant" },
      },
      motion: { wind: { x: 0, y: 0, z: 0 }, rise: 0.3, turbulence: 0 },
      budget: { maxParticles: 8, lodDistance: 20 },
      blend: "alpha",
    };
    const radius: number = 0.001;
    const box = (edge: number): IAutoMovieVector3 => ({
      x: at.x + edge,
      y: at.y + edge,
      z: at.z + edge,
    });
    const effect: IAutoMovieCompiledEffect | undefined =
      materializeCompiledEffects({
        world: {
          effectRecipes: [recipe],
          effectZones: [
            {
              id: "tile-edge",
              recipe: recipe.id,
              bounds: { min: box(-radius), max: box(radius) },
              seed: 3,
            },
          ],
        },
        seedOwner: { production: "scenery-rehearsal", film: "screen-cue" },
        fixedStepSeconds: 1 / FPS,
        cues: [
          {
            id: "panel-puff",
            zone: "tile-edge",
            start: CONTACT,
            end: CONTACT + 1 / 6,
            intensity: { from: 1, to: 1 },
          },
        ],
      })[0];
    if (effect === undefined)
      throw new Error("The authored effect does not resolve.");
    return effect;
  }
}
