import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBowViolinParams,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  HumanHand
} from "../../../../../packages/motions/src/posture/internal/HumanHand";
import {
  bowViolin
} from "../../../../../packages/motions/src/music/internal/bowViolin";
import {
  bowViolinGrip
} from "../../../../../packages/motions/src/music/internal/bowViolinGrip";
import {
  bowViolinHairAxis
} from "../../../../../packages/motions/src/music/internal/bowViolinHairAxis";
import {
  bowViolinStroke
} from "../../../../../packages/motions/src/music/internal/bowViolinStroke";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** The clearance off the string before and after the stroke, metres. */
const CLEARANCE: number = 0.035;

/** A half turn about +Z: (x, y, z) goes to (-x, -y, z). */
const HALF: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };

/**
 * The bowed violin law's own logic: the stroke's schedule, the hair's axis
 * across the string, and the grip that lays the hair on the sounding point.
 *
 * Scenarios:
 *
 * 1. Over phases approach 0 to 1 s, ready to 1.2 s, contact to 2.2 s and lift to
 *    2.4 s, a down-bow stands a clearance off the string at 18 % of the hair,
 *    passes 30 % on it mid-stroke and ends at 42 % a clearance off; an up-bow
 *    runs the other way.
 * 2. On `string1` across a string along +X under a +Y outward normal, the hair
 *    lies along `(0, sin(π / 15), cos(π / 15))` (Schoonderwaldt 2010's straight
 *    stroke, tilted out of the string bar's plane); on `string4` it tilts the
 *    other way.
 * 3. With the frog 0.1 m below the grip and the hair 0.6 m along -X, the bow
 *    turned a half turn about +Z lays half its hair on (1, 1, 0) from a grip at
 *    (0.7, 0.9, 0).
 * 4. A fixed string at a reachable grip checks the actual hair point at both
 *    boundaries and an unseen offset, read in shuffled order.
 */
export async function test_motions_music_bow_violin(): Promise<void> {
  // 1. The stroke.
  const clock: IAutoMovieMotionClock = motionClock.sequence([
    { name: "approach", seconds: 1 },
    { name: "ready", seconds: 0.2 },
    { name: "contact", seconds: 1 },
    { name: "lift", seconds: 0.2 },
  ]);
  const down: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
    clock,
    undefined,
    CLEARANCE,
  );
  const up: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
    clock,
    "up",
    CLEARANCE,
  );
  const at = (
    stroke: bowViolinStroke.IStroke,
    share: number,
    lift: number,
  ): boolean =>
    nclose(stroke.share, share, 1e-12) && nclose(stroke.lift, lift, 1e-12);
  TestValidator.predicate(
    "the down- and up-bow",
    at(down(0.5), 0.18, CLEARANCE) &&
      at(down(1.7), 0.3, 0) &&
      at(down(2.4), 0.42, CLEARANCE) &&
      at(up(0.5), 0.42, CLEARANCE) &&
      at(up(2.4), 0.18, CLEARANCE),
  );

  // 2. The hair's axis.
  const tilt: number = Math.PI / 15;
  const along: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const outward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "tilted toward each string's outside",
    vclose(
      bowViolinHairAxis(along, outward, "string1"),
      { x: 0, y: Math.sin(tilt), z: Math.cos(tilt) },
      1e-12,
    ) &&
      vclose(
        bowViolinHairAxis(along, outward, "string4"),
        { x: 0, y: -Math.sin(tilt), z: Math.cos(tilt) },
        1e-12,
      ),
  );

  // 3. The grip.
  const grip: (share: number, lift: number) => IAutoMovieVector3 =
    bowViolinGrip(
      { x: 1, y: 1, z: 0 },
      outward,
      HALF,
      { x: 0, y: -0.1, z: 0 },
      { x: -0.6, y: 0, z: 0 },
    );
  TestValidator.predicate(
    "the grip that lays the hair on the string",
    vclose(grip(0.5, 0), { x: 0.7, y: 0.9, z: 0 }, 1e-12),
  );
  await activeHair();
}

/** Place a small playable hair line on a staged string using a real arm. */
async function activeHair(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const params: IAutoMovieMotionHumanBowViolinParams = {
    violin: "violin",
    bow: "bow",
    string: "string1",
    duration: 1.3,
  };
  const entry: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBowViolinParams> =
    motionActionContext(body, params);
  const before: ReturnType<typeof poseBones> = poseBones(
    body,
    entry.entry.pose,
  );
  const initial: IAutoMovieResolvedBone = before.get("rightHand")!;
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    before,
    "right",
    "grip",
  ).point;
  const along: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const outward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const hair: IAutoMovieVector3 = bowViolinHairAxis(along, outward, "string1");
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    initial.worldRotation,
  );
  const localHair: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    inverse,
    AutoMovieEngineVector3.scale(hair, 0.16),
  );
  const transverse: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(
      AutoMovieEngineVector3.scale(outward, -1),
      AutoMovieEngineVector3.scale(hair, -AutoMovieEngineVector3.dot(outward, hair)),
    ),
  );
  const hairRotation: IAutoMovieQuaternion = HumanHand.align(
    { normal: outward, forward: along },
    {
      normal: AutoMovieEngineQuaternion.rotateVector(inverse, transverse),
      forward: AutoMovieEngineQuaternion.rotateVector(inverse, hair),
    },
  );
  const frog: IAutoMovieVector3 = AutoMovieEngineVector3.scale(localHair, -0.3);
  const tip: IAutoMovieVector3 = AutoMovieEngineVector3.add(frog, localHair);
  const frame = (
    translation: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieAffordance["frame"] => ({
    translation,
    rotation,
    scale: { x: 1, y: 1, z: 1 },
  });
  const string: IAutoMovieAffordance = {
    id: "string1",
    kind: "bar",
    length: 0.25,
    extent: null,
    frame: frame({ x: 0.1, y: 0, z: 0 }, AutoMovieEngineQuaternion.identity()),
  };
  const staged: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBowViolinParams> =
    motionActionContext(body, params, {
      holds: { right: "bow" },
      carried: {
        right: {
          position: HumanHand.offset(body, "right", "grip").point,
          rotation: AutoMovieEngineQuaternion.identity(),
        },
      },
      props: [
        {
          subject: "violin",
          fixed: true,
          frame: { position: grip, rotation: AutoMovieEngineQuaternion.identity() },
          points: {},
          affordances: [string],
        },
        {
          subject: "bow",
          frame: { position: grip, rotation: initial.worldRotation },
          points: {},
          affordances: [
            {
              id: "hairFrog",
              kind: "socket",
              extent: null,
              frame: frame(frog, hairRotation),
            },
            {
              id: "hairTip",
              kind: "socket",
              extent: null,
              frame: frame(tip, hairRotation),
            },
          ],
        },
      ],
    });
  const plan: IAutoMovieMotionHumanActionPlan = bowViolin.plan(staged);
  const instant = (name: string): number =>
    plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )!.share * plan.duration;
  const touch: number = instant("contact");
  const release: number = instant("lift");
  for (const u of [1, 0.37, 0, 1]) {
    const seconds: number = touch + u * (release - touch);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, plan.posture(seconds)),
    );
    const hand: IAutoMovieResolvedBone = bones.get("rightHand")!;
    const handGrip: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "right",
      "grip",
    ).point;
    const share: number = 0.18 + 0.24 * u ** 3 * (10 + u * (-15 + 6 * u));
    const placed: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      handGrip,
      AutoMovieEngineQuaternion.rotateVector(
        hand.worldRotation,
        AutoMovieEngineVector3.add(frog, AutoMovieEngineVector3.scale(localHair, share)),
      ),
    );
    TestValidator.predicate(
      `displayed hair on the string at ${u}`,
      vclose(placed, grip, 0.002),
    );
  }
}
