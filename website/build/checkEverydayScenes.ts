import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanStrike } from "@automovie/motions";
import { HumanColliders } from "../../packages/motions/src/posture/internal/HumanColliders";
import { HumanFoot } from "../../packages/motions/src/posture/internal/HumanFoot";
import { strict as assert } from "node:assert";
import { Group, type Object3D, PointLight } from "three";

import { BakedTake } from "../src/baked/BakedTake";
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundTimeline } from "../src/playground/structures/IPlaygroundTimeline";
import { SCENES } from "../src/scenes/SCENES";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneTrack } from "../src/scenes/SceneTrack";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";
import { scenePracticalLight } from "../src/scenes/package/scenePracticalLight";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import type { ITake } from "../src/takes/structures/ITake";

/** How deep the palm may press into the hip's skin, metres. */
const PRESS: number = 0.005;

/** The track's position resolution the light cue is read within, metres. */
const RESOLUTION: number = 0.0005;

/**
 * Check the site-rate observations for authored office and recovery actions.
 *
 * Scenarios:
 * 1. The office's visible rocker reaches its native limit. Its lamp follows
 *    the same take's press cue at the endpoint and when rewinding.
 * 2. On both published body combinations Dee's stagger is caught and her
 *    rise ends on both feet planted on the floor.
 * 3. Eve's palm holds her hip between the rise and the wipe.
 * 4. The original 1.2 m/s push still refuses on the stagger's speed.
 */
export function checkEverydayScenes(): void {
  checkOffice();
  const fall: IScene = SCENES.find(
    (scene: IScene): boolean => scene.id === "fall-and-rise",
  )!;
  for (const choice of [fall.takes[0]!, fall.takes[2]!]) {
    const composition: IPlaygroundComposition = SceneTake.apply(
      fall.composition!,
      choice,
    );
    const { performance }: PlaygroundPerformance.IBuilt =
      PlaygroundPerformance.build(composition);
    checkRecovery(performance, choice.label);
    checkHipHold(performance, choice.label);

    composition.performers
      .find(
        (person: IPlaygroundComposition.IPerformer): boolean =>
          person.subject === "dee",
      )!
      .actions.find(
        (action: IPlaygroundComposition.IAction): boolean =>
          action.name === "stagger",
      )!.params = { speed: 1.2 };
    const refused: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
      composition,
      SCENE_FPS,
    );
    assert(
      !("track" in refused) &&
        refused.act === "stagger" &&
        refused.axis === "speed",
      choice.label + " refuses the 1.2 m/s push",
    );
  }
}

/** The office rocker's travel and the lamp it switches, read from the baked track. */
function checkOffice(): void {
  const office: IScene = SCENES.find(
    (scene: IScene): boolean => scene.id === "office",
  )!;
  const composition: IPlaygroundComposition = SceneTake.apply(
    office.composition!,
    office.takes[0]!,
  );
  const response: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
    composition,
    SCENE_FPS,
  );
  assert(
    "track" in response,
    "message" in response ? response.message : undefined,
  );
  const take: ITake = BakedTake.decode(BakedTake.encode(response));
  const pressed: number = take.timeline.tracks
    .find(
      (track: IPlaygroundTimeline.ITrack): boolean => track.subject === "eli",
    )!
    .spans.find(
      (span: IPlaygroundTimeline.ISpan): boolean => span.name === "operate",
    )!
    .events.find(
      (event: IPlaygroundTimeline.IEvent): boolean => event.name === "stroke",
    )!.seconds;
  const propIndex: number = take.figures.length + take.props.indexOf("switch");
  const faceAt: (seconds: number) => SceneTrack.IPlacement = (
    seconds: number,
  ): SceneTrack.IPlacement =>
    SceneTrack.sample(take.track, seconds)[propIndex]!.find(
      (part: SceneTrack.IPlacement): boolean =>
        part.bone === SceneTrack.PROP_PART + "face",
    )!;
  const limit: number = SceneArchetype.model(
    object(composition, "switch"),
  ).affordance("press").travel!;
  assert(
    Math.abs(
      faceAt(0).position[2] - faceAt(take.duration).position[2] - limit,
    ) < 1e-7,
    "the visible face must travel exactly to the switch's limit",
  );
  assert(
    Math.abs(faceAt(0).position[2] - faceAt(pressed).position[2] - limit) <=
      RESOLUTION,
    "the visible face must reach the limit at the light cue, within track resolution",
  );

  const light: IScene.IPracticalLight = office.practicalLights![0]!;
  const group: Group = new Group();
  const seekLight: (seconds: number) => void = scenePracticalLight(
    group,
    SceneArchetype.model(object(composition, light.prop)),
    take.timeline,
    light,
  );
  const bulb: Object3D | undefined = group.children[0];
  assert(bulb instanceof PointLight);
  seekLight(pressed - 1e-6);
  assert.equal(bulb.intensity, 0);
  seekLight(pressed);
  assert.equal(bulb.intensity, light.intensity);
  seekLight(take.duration);
  assert.equal(bulb.intensity, light.intensity);
  seekLight(0);
  assert.equal(bulb.intensity, 0);
}

/** Dee is caught by her recovery steps and stands again on both soles. */
function checkRecovery(
  performance: IAutoMovieMotionHumanPerformance,
  label: string,
): void {
  const dee: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("dee");
  const stagger: IAutoMovieMotionHumanSegment = named(dee, "stagger");
  const rise: IAutoMovieMotionHumanSegment = named(dee, "getUp");
  for (const [seconds, beat] of [
    [cue(stagger, "caught"), "caught"],
    [rise.end, "risen"],
  ] as const) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("dee", seconds);
    for (const side of ["left", "right"] as const)
      assert(
        HumanFoot.sockets(stagger.context.body, bones, side).some(
          (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            Math.abs(socket.point.y) <= HumanFoot.BEARING,
        ),
        `${label}: Dee's ${side} sole bears on the floor when ${beat}`,
      );
  }
}

/** Eve's right palm stays on her own hip from the touch's ready to its relax. */
function checkHipHold(
  performance: IAutoMovieMotionHumanPerformance,
  label: string,
): void {
  const eve: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("eve");
  const touch: IAutoMovieMotionHumanSegment = named(eve, "touch");
  const body: IAutoMovieMotionHumanBody = touch.context.body;
  const ready: number = cue(touch, "ready");
  const relax: number = cue(touch, "relax");
  assert(named(eve, "kneel").end <= ready, label + " touches after the kneel");
  assert(named(eve, "wipe").start > relax, label + " wipes after the touch");
  for (
    let frame: number = Math.ceil(ready * SCENE_FPS);
    frame < relax * SCENE_FPS;
    frame++
  ) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("eve", frame / SCENE_FPS);

    // The visible hip is a physical patch. Read its central skin point on
    // the posed pelvis independently of the aim used to bring the hand in.
    const distance: number = HumanColliders.distance(
      body,
      new Map([["rightHand", bones.get("rightHand")!]]),
      AutoMovieMotionHumanStrike.StrikingBody.region(body, bones, "hipRight")
        .point,
    ).distance;
    assert(
      distance <= 0 && distance >= -PRESS,
      `${label}: palm-to-hip distance ${distance} m`,
    );
  }
}

/** The first segment of an action. */
function named(
  segments: readonly IAutoMovieMotionHumanSegment[],
  name: string,
): IAutoMovieMotionHumanSegment {
  const segment: IAutoMovieMotionHumanSegment | undefined = segments.find(
    (candidate: IAutoMovieMotionHumanSegment): boolean =>
      candidate.name === name,
  );
  assert(segment, name + " is performed");
  return segment;
}

/** The film second of a segment's named event. */
function cue(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
    (candidate: IAutoMovieMotionEvent): boolean => candidate.name === name,
  );
  assert(event, segment.name + " supplies " + name);
  return segment.start + segment.plan.duration * event.share;
}

/** A composition's placed object by its scene id. */
function object(
  composition: IPlaygroundComposition,
  subject: string,
): IPlaygroundComposition.IObject {
  return composition.objects!.find(
    (candidate: IPlaygroundComposition.IObject): boolean =>
      candidate.subject === subject,
  )!;
}
