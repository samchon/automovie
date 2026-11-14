import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { gestureStroke } from "../../everyday/gestureStroke";
import { gestureStrokeTables } from "../../everyday/gestureStrokeTables";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { everydayCaseKit } from "./everydayCaseKit";
import { everydayGestureVerdicts } from "./everydayGestureVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * The gesture cases of `everydayCases` (`everyday-gesture-<kind>`): each
 * gesture at rest, mid-preparation, the stroke's start, middle and end,
 * mid-retraction and the end, with the verdicts `everydayCases` lists.
 *
 * @param c The body's case context.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and where their verdicts are listed.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and measures contacts on its displayed poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the gesture kinds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plan's events.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per kind.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function everydayGestureCases(
  c: everydayCaseKit.IContext,
): IMotionCaptureCase[] {
  const { man, body, suffix } = c;
  const out: IMotionCaptureCase[] = [];
  const within = everydayVerdicts.within;
  const { figure, event, angle } = everydayCaseKit;
  const one = (chain: HumanChain): HumanPerformance =>
    everydayCaseKit.one(c, chain);
  const goal: IAutoMovieVector3 = { x: 1.5, y: 2.2, z: 3 };
  const kinds: gestureStroke.Kind[] = [
    "wave",
    "raiseHand",
    "cheer",
    "stopPalm",
    "point",
    "palmsUp",
    "beckon",
    "clap",
    "rubHands",
    "touchFace",
    "pushGlasses",
    "scratchHead",
    "shrug",
    "nod",
    "shakeHead",
    "bow",
    "chinLift",
    "squareShoulders",
    "slump",
  ];
  for (const kind of kinds) {
    const performance: HumanPerformance = one(
      HumanChain.subject("a").gesture({
        kind,
        ...(kind === "point"
          ? { target: { kind: "point", at: goal, frame: "world" } }
          : {}),
      }),
    );
    const s: number = event(performance, "a", 0, "strokeStart");
    const e: number = event(performance, "a", 0, "strokeEnd");
    const r: number = event(performance, "a", 0, "retract");
    const end: number = performance.segments("a")[0]!.end;
    const mid = performance.bones("a", (s + e) / 2);
    const verdicts: IMotionCaptureCase.IVerdict[] = everydayVerdicts.standard(
      performance,
      "a",
      body,
    );
    // An arm carried to and from its stroke swings from the shoulder: an
    // elbow that moves faster than 2.5 m/s has flipped to the other side.
    for (const side of ["left", "right"] as const)
      verdicts.push(
        within(
          `${side} elbow travel per frame outside the stroke`,
          Math.max(
            everydayVerdicts.travel(performance, "a", `${side}LowerArm`, 0, s),
            everydayVerdicts.travel(
              performance,
              "a",
              `${side}LowerArm`,
              r,
              end,
            ),
          ),
          2.5 / 24,
          "mm",
        ),
      );
    if (kind === "point") {
      const eye: IAutoMovieVector3 = mid.get("rightEye")!.worldPosition;
      verdicts.push(
        within(
          "fingertip on the eye-to-target line",
          angle(
            Vector3.subtract(
              HumanHand.frame(body, mid, "right", "indexTip", "point").point,
              eye,
            ),
            Vector3.subtract(goal, eye),
          ),
          2,
          "deg",
        ),
      );
    }
    if (kind === "touchFace" || kind === "pushGlasses") {
      const region =
        kind === "touchFace"
          ? body.surfaces.regions.forehead
          : body.surfaces.regions.noseBridge;
      const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        region,
        mid.get(region.bone)!,
      ).point;
      verdicts.push(
        within(
          "fingertip at the face region",
          Vector3.length(
            Vector3.subtract(
              HumanHand.frame(body, mid, "right", "indexTip", "flat").point,
              at,
            ),
          ),
          0.015 + 0.012,
          "mm",
        ),
      );
    }
    if (kind === "bow") {
      const margin: number = everydayVerdicts.stability(
        performance,
        "a",
        body,
        (s + e) / 2,
      );
      verdicts.push({
        name: "bowed body balanced over the feet",
        passed: margin >= 0,
        detail: `${(margin * 1000).toFixed(1)} mm margin`,
      });
    }
    verdicts.push(
      ...everydayGestureVerdicts(
        kind,
        performance,
        body,
        s,
        e,
        gestureStrokeTables.RHYTHM[kind].cycles,
      ),
    );
    if (kind === "clap")
      for (let k: number = 0; k < 4; k++) {
        const b = performance.bones("a", s + ((k + 0.5) / 4) * (e - s));
        verdicts.push(
          within(
            `palms meet on beat ${k + 1}`,
            Vector3.length(
              Vector3.subtract(
                HumanHand.frame(body, b, "left", "palm").point,
                HumanHand.frame(body, b, "right", "palm").point,
              ),
            ),
            0.01,
            "mm",
          ),
        );
      }
    out.push({
      name: `everyday-gesture-${kind}${suffix}`,
      times: [
        { seconds: 0, label: "rest" },
        { seconds: s / 2, label: "prepare" },
        { seconds: s, label: "stroke start" },
        { seconds: (s + e) / 2, label: "stroke" },
        { seconds: e, label: "stroke end" },
        { seconds: (r + end) / 2, label: "retract" },
        { seconds: end, label: "end" },
      ],
      performers: [figure(performance, "a", man)],
      ...(kind === "point"
        ? { targets: [{ at: goal, radius: 0.05, color: 0xd04040 }] }
        : {}),
      verdicts,
    });
  }
  return out;
}
