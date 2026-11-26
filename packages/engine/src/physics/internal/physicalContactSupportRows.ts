import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactSupportRows,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { linearizePhysicalInterval } from "./linearizePhysicalInterval";
import { physicalShapeBounds } from "../physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, IAutoMovieRigidTransform>>;

/**
 * Keep an endpoint's existing XYZ promise and its explicitly declared real
 * support plane in the same solve. Geometry, witnesses and original goals are
 * borrowed only for this invocation.
 */
export function physicalContactSupportRows(
  input: IAutoMoviePhysicalContactSupportRows.IInput,
): IAutoMovieLinearizePhysicalTargetRows.IRows[] {
  const profile: IAutoMoviePhysicalProfile = input.profile;

  const floors: IAutoMovieLinearizePhysicalTargetRows.IRows[] =
    profile.segments.flatMap(
      (
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieLinearizePhysicalTargetRows.IRows[] =>
        segment.shapes.map(
          (
            shape: IAutoMoviePhysicalShape,
          ): IAutoMovieLinearizePhysicalTargetRows.IRows => {
            const minimum: (poses: Poses) => number = (poses: Poses): number =>
              input.geometry.minimumY({
                body: input.body,
                bone: segment.bone,
                shape,
                pose: poses[segment.bone]!,
              });
            return {
              bones: new Set([segment.bone]),
              measure: (poses: Poses): number[] => [
                Math.min(0, minimum(poses) - input.floor),
              ],
              linearize: (poses: Poses): ((probe: Poses) => number[]) => {
                const model: (value: number) => number[] =
                  linearizePhysicalInterval(minimum(poses), input.floor);
                return (probe: Poses): number[] => model(minimum(probe));
              },
            };
          },
        ),
    );
  return [
    ...floors,
    ...input.supports.map(
      (
        support: IAutoMoviePhysicalContactSupportRows.ISupport,
      ): IAutoMovieLinearizePhysicalTargetRows.IRows => {
        const names: Set<string> = new Set([support.bone]);
        const patch: IAutoMoviePhysicalContactSupportRows.ISupport["patch"] =
          support.patch;
        if (
          !profile.segments.some(
            (segment: IAutoMoviePhysicalSegment): boolean =>
              segment.bone === support.bone,
          ) ||
          (patch !== undefined &&
            (!patch.contacts.length ||
              new Set(patch.contacts).size !== patch.contacts.length ||
              patch.contacts.some(
                (bone: string): boolean =>
                  !profile.segments.some(
                    (segment: IAutoMoviePhysicalSegment): boolean =>
                      segment.bone === bone && segment.shapes.length > 0,
                  ),
              ) ||
              (patch.floorPoints !== undefined &&
                (patch.floorPoints.length > 64 ||
                  patch.floorPoints.some(
                    (point: {
                      bone: string;
                      localPoint: IAutoMovieVector3;
                    }): boolean => !patch.contacts.includes(point.bone),
                  )))))
        )
          throw new Error("Invalid physical contact support patch");
        for (const bone of patch?.contacts ?? []) names.add(bone);
        const carriers: IAutoMoviePhysicalSegment[] = profile.segments.filter(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            patch?.contacts.includes(segment.bone) ?? false,
        );
        const minimum: (poses: Poses) => number = (poses: Poses): number =>
          Math.min(
            ...carriers.flatMap(
              (segment: IAutoMoviePhysicalSegment): number[] =>
                segment.shapes.map(
                  (shape: IAutoMoviePhysicalShape): number =>
                    physicalShapeBounds(poses[segment.bone]!, shape).min.y,
                ),
            ),
          );
        const measure: (poses: Poses) => number[] = (
          poses: Poses,
        ): number[] => {
          const difference: IAutoMovieVector3 = Vector3.subtract(
            physicalSupportPoint(poses[support.bone]!, support.localPoint),
            support.point,
          );
          if (!patch) return [difference.x, difference.y, difference.z];
          const clearance: number = minimum(poses) - patch.floor;
          return [
            difference.x,
            difference.y,
            difference.z,
            ...(patch.floorPoints ?? []).map(
              (point: {
                bone: string;
                localPoint: IAutoMovieVector3;
              }): number =>
                physicalSupportPoint(poses[point.bone]!, point.localPoint).y -
                patch.floor,
            ),
            patch.floorPoints?.length ? Math.min(0, clearance) : clearance,
          ];
        };
        return {
          bones: names,
          measure,
          linearize: (poses: Poses): ((probe: Poses) => number[]) => {
            const floor: ((value: number) => number[]) | undefined = patch
              ?.floorPoints?.length
              ? linearizePhysicalInterval(minimum(poses), patch.floor)
              : undefined;
            return (probe: Poses): number[] => {
              const result: number[] = measure(probe);
              if (floor) result[result.length - 1] = floor(minimum(probe))[0]!;
              return result;
            };
          },
        };
      },
    ),
  ];
}
