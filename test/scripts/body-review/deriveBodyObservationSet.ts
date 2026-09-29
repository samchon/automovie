import type { IAutoMovieHumanBodyBasisJoint } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import type { HumanObservationView } from "@automovie/playground/src/human/observation/HumanObservationView";

import type { IBodyObservationFrame } from "./IBodyObservationFrame";
import type { IBodyObservationUnit } from "./IBodyObservationUnit";
import type { IBodyReviewState } from "./standardBodyReviewDocuments";

/** The six horizon views a unit is observed from, and the poles added to whole-body frames. */
const HORIZON: HumanObservationView[] = [
  "front",
  "left-three-quarter",
  "left",
  "back",
  "right-three-quarter",
  "right",
];
const WITH_POLES: HumanObservationView[] = [...HORIZON, "top"];
const AXES = ["flexion", "abduction", "twist"] as const;

type Joint = Pick<
  IAutoMovieHumanBodyBasisJoint,
  "bone" | "parent" | "constraint" | "shoulder"
>;

/**
 * Derive the observation set the rendered-observation contract asks of a body
 * from the things that own it, so no list is kept by hand.
 *
 * - A **part** unit is each displayed part (`parts`, from the built model)
 *   drawn alone and in the assembled body, in the neutral state, from every
 *   view, as beauty and normal frames.
 * - A **joint** unit is each rig seam, a child bone with its parent, at the
 *   extremes the rig admits: every mobile axis of the child at its minimum and
 *   at its maximum, and where the parent moves on the same axis, both bones at
 *   the same extreme together, since two bones turning the same way is what
 *   opens a seam. Extremes come from the joint's own clinical range, never from
 *   a chosen number. An upper arm, whose generic axes are held, is taken at
 *   the elevation its joint sinus admits at each plane of its envelope and at
 *   its two axial-rotation limits. An extreme the joint's swing cone does not
 *   admit is left out and listed in `excluded` with the reason: for one axis
 *   the swing is the angle itself, and for two the cone is
 *   `2 acos(cos(a/2) cos(b/2))`.
 * - The **whole** unit is the supplied reference states from every view
 *   including the pole, and comes last: proportion, mass and reference poses
 *   couple every part, so they are observed after the parts and seams.
 *
 * The derivation reads only its input, so a new part or joint appears in the
 * set the moment its owner has it. It does not run the builder: a state the
 * document validator still refuses (a rhythm the pelvis adds, for example) is
 * found and recorded by the runner that draws it, where it stays visible.
 *
 * @param input The displayed part names, the rig's joints and the whole-body reference states.
 */
export function deriveBodyObservationSet(input: {
  parts: readonly string[];
  joints: readonly Joint[];
  wholeStates: Record<string, IBodyReviewState>;
}): IBodyObservationUnit[] {
  const frames = (
    state: string,
    document: IBodyReviewState,
    views: HumanObservationView[],
    passes: IBodyObservationFrame["pass"][],
    isolate: string[] | null,
  ): IBodyObservationFrame[] =>
    views.flatMap((view) =>
      passes.map((pass) => ({ state, document, view, pass, isolate })),
    );
  const neutral: IBodyReviewState = { shape: {}, pose: [] };
  const units: IBodyObservationUnit[] = [];

  for (const part of input.parts)
    units.push({
      unit: "part",
      id: part,
      frames: [
        ...frames("neutral", neutral, [...HORIZON, "top", "bottom"], ["beauty", "normal"], [part]),
        ...frames("neutral", neutral, ["front", "left", "back", "right"], ["beauty"], null),
      ],
      excluded: [],
    });

  const byBone = new Map(input.joints.map((joint) => [joint.bone, joint]));
  for (const joint of input.joints) {
    if (joint.parent === null) continue;
    const unit: IBodyObservationUnit = {
      unit: "joint",
      id: `${joint.parent}>${joint.bone}`,
      frames: [],
      excluded: [],
    };
    const add = (state: string, document: IBodyReviewState): void => {
      unit.frames.push(
        ...frames(state, document, HORIZON, ["beauty", "normal"], null),
      );
    };
    const swing = (angles: Partial<Record<(typeof AXES)[number], number>>) => {
      const a = ((angles.flexion ?? 0) * Math.PI) / 360;
      const b = ((angles.abduction ?? 0) * Math.PI) / 360;
      return (360 / Math.PI) * Math.acos(Math.cos(a) * Math.cos(b));
    };
    const admitted = (
      target: Joint,
      angles: Partial<Record<(typeof AXES)[number], number>>,
    ): string | null => {
      const cone = target.constraint?.swingDeg;
      return typeof cone === "number" && swing(angles) > cone + 1e-9
        ? `${target.bone} swing ${swing(angles).toFixed(1)} exceeds its ${cone} degree cone`
        : null;
    };
    const row = (
      bone: string,
      angles: Partial<Record<(typeof AXES)[number], number>>,
    ): IAutoMovieJointPose =>
      ({
        bone,
        flexion: angles.flexion ?? null,
        abduction: angles.abduction ?? null,
        twist: angles.twist ?? null,
      }) as unknown as IAutoMovieJointPose;

    add("neutral", neutral);
    if (joint.shoulder !== undefined) {
      const { envelope, axialRotation } = joint.shoulder.range;
      for (const [plane, elevation] of envelope)
        add(`${joint.bone}-plane-${plane}-elevation-max`, {
          shape: {},
          pose: [],
          shoulders: [
            { bone: joint.bone as "leftUpperArm", plane, elevation, axialRotation: 0 },
          ],
        });
      for (const [name, value] of [
        ["min", axialRotation.min],
        ["max", axialRotation.max],
      ] as const)
        add(`${joint.bone}-axial-${name}`, {
          shape: {},
          pose: [],
          shoulders: [
            { bone: joint.bone as "leftUpperArm", plane: 0, elevation: 90, axialRotation: value },
          ],
        });
    } else {
      const parent = byBone.get(joint.parent!);
      for (const axis of AXES) {
        const own = joint.constraint?.[axis];
        if (own === null || own === undefined || own.min === own.max) continue;
        for (const end of ["min", "max"] as const) {
          const state = `${joint.bone}-${axis}-${end}`;
          const angles = { [axis]: own[end] };
          const reason = admitted(joint, angles);
          if (reason !== null) {
            unit.excluded.push({ state, reason });
            continue;
          }
          add(state, { shape: {}, pose: [row(joint.bone, angles)] });
          const shared = parent?.shoulder === undefined ? parent?.constraint?.[axis] : null;
          if (shared !== null && shared !== undefined && shared.min !== shared.max) {
            const together = `${joint.parent}-${joint.bone}-${axis}-${end}-together`;
            const parentAngles = { [axis]: shared[end] };
            const parentReason = admitted(parent!, parentAngles);
            if (parentReason !== null) unit.excluded.push({ state: together, reason: parentReason });
            else
              add(together, {
                shape: {},
                pose: [row(joint.parent!, parentAngles), row(joint.bone, angles)],
              });
          }
        }
      }
    }
    units.push(unit);
  }

  units.push({
    unit: "whole",
    id: "whole",
    frames: Object.entries(input.wholeStates).flatMap(([name, document]) =>
      frames(name, document, WITH_POLES, ["beauty", "clay"], null),
    ),
    excluded: [],
  });
  return units;
}
