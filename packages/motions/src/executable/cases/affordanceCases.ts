import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidSocket,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { operate } from "../../affordance/operate";
import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the articulated affordances family (#3233), each from
 * quiet standing with the right hand, every part within the 2010 ADA
 * hardware band (865 to 1220 mm, 404.2.7) or at a drawer's height:
 *
 * - `affordance-button`: a lift button at 1.1 m pressed 5 mm;
 * - `affordance-knob`: a door knob at 0.95 m turned 90 degrees;
 * - `affordance-drawer`: a drawer handle at 0.8 m pulled 0.3 m;
 * - `affordance-door`: a door handle at 1.0 m, 0.75 m from its hinge,
 *   pulled open 40 degrees.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot. Beyond that, from `ready` to `relax` the hand's surface (the
 * index fingertip on the button, the grip elsewhere) stays within 10 mm of
 * the part's place as the mechanism moves it (the issue's handle bound; on
 * the knob this is the knob's axis), and the button's tip travels along the
 * button's axis within 2 degrees (the issue's press bound). The knob also
 * reports the hand's roll about its axis against the turn, within 10 degrees
 * (provisional).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed sockets against the mechanism's own state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over four mechanisms over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function affordanceCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const towardPerformer: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const at = (x: number, y: number, z: number) => ({
      kind: "point" as const,
      at: { x, y, z },
      frame: "world" as const,
      normal: towardPerformer,
    });
    const mechanisms: [string, operate.Mechanism][] = [
      ["button", { kind: "button", at: at(-0.15, 1.1, 0.5) }],
      ["knob", { kind: "knob", at: at(-0.2, 0.95, 0.5), turn: 90 }],
      ["drawer", { kind: "slider", at: at(-0.15, 0.8, 0.55), travel: 0.3 }],
      [
        "door",
        {
          kind: "hinge",
          at: at(-0.2, 1.0, 0.6),
          hinge: { kind: "point", at: { x: 0.55, y: 1.0, z: 0.6 }, frame: "world" },
          swing: 40,
        },
      ],
    ];
    for (const [label, mechanism] of mechanisms) {
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "affordance",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("operate", { mechanism }),
      );
      const ready: number = FamilyCaseKit.event(performance, "ready");
      const start: number = FamilyCaseKit.event(performance, "strokeStart");
      const end: number = FamilyCaseKit.event(performance, "strokeEnd");
      const relax: number = FamilyCaseKit.event(performance, "relax");
      const rest = {
        point: (mechanism.at as { at: IAutoMovieVector3 }).at,
        normal: towardPerformer,
      };
      const hinge: IAutoMovieVector3 | undefined =
        mechanism.kind === "hinge"
          ? (mechanism.hinge as { at: IAutoMovieVector3 }).at
          : undefined;
      const progress = (t: number): number =>
        t <= start ? 0 : t >= end ? 1 : (t - start) / (end - start);
      const surfaceAt = (t: number): IAutoMovieVector3 =>
        mechanism.kind === "button"
          ? HumanHand.frame(
              who.body,
              performance.bones("a", t),
              "right",
              "indexTip",
              "point",
            ).point
          : socket(who.body, performance, t, "gripRight");
      // The plan moves the part on the clock's minimum-jerk progress.
      const smooth = (t: number): number => {
        const u: number = progress(t);
        return u * u * u * (10 - 15 * u + 6 * u * u);
      };
      let worst: { value: number; at: number } = { value: 0, at: ready };
      for (let t: number = ready; t <= relax + 1e-9; t += 1 / 24) {
        const want: IAutoMovieVector3 = operate.state(
          mechanism,
          rest,
          hinge,
          smooth(t),
        ).point;
        const gap: number = Vector3.length(Vector3.subtract(surfaceAt(t), want));
        if (gap > worst.value) worst = { value: gap, at: t };
      }
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", who.body),
        {
          name: "hand on the moving part within 10 mm",
          passed: worst.value <= 0.01,
          detail: `${(worst.value * 1000).toFixed(1)} mm, worst at ${worst.at.toFixed(2)} s`,
        },
      ];
      if (mechanism.kind === "button") {
        const travel: IAutoMovieVector3 = Vector3.subtract(
          surfaceAt(end),
          surfaceAt(start),
        );
        const angle: number =
          Vector3.length(travel) < 1e-6
            ? 180
            : (Math.acos(
                Math.min(
                  1,
                  Vector3.dot(Vector3.normalize(travel), { x: 0, y: 0, z: 1 }),
                ),
              ) *
                180) /
              Math.PI;
        verdicts.push(
          everydayVerdicts.within("press along the button's axis", angle, 2, "deg"),
        );
      }
      if (mechanism.kind === "knob") {
        const turn = (t: number) =>
          performance.bones("a", t).get("rightHand")!.worldRotation;
        const delta = Quaternion.multiply(turn(end), Quaternion.inverse(turn(start)));
        const twist: number =
          (2 * Math.atan2(Vector3.dot({ x: delta.x, y: delta.y, z: delta.z }, towardPerformer), delta.w) * 180) /
          Math.PI;
        verdicts.push(
          FamilyCaseKit.band(
            "hand's roll about the knob's axis",
            Math.abs(twist),
            80,
            100,
            "deg",
          ),
        );
      }
      out.push({
        name: `affordance-${label}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.2, [
          [ready, "ready"],
          [end, "strokeEnd"],
        ]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        targets: [{ at: rest.point, radius: 0.025, color: 0xd04040 }],
        verdicts,
      });
    }
  }
  return out;
}

/** A body socket's displayed world point. */
function socket(
  body: IHumanBody,
  performance: HumanPerformance,
  seconds: number,
  name: AutoMovieHumanoidSocket,
): IAutoMovieVector3 {
  const frame = body.surfaces.sockets[name];
  return resolveAutoMovieHumanoidSurfaces.place(
    frame,
    performance.bones("a", seconds).get(frame.bone)!,
  ).point;
}
