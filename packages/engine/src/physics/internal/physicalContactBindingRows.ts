import type {
  IAutoMoviePhysicalContactBindingRows,
  IAutoMoviePoses,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { IPhysicalContactPoseReference } from "./IPhysicalContactPoseReference";
import { preparePhysicalContactBindingRows } from "./preparePhysicalContactBindingRows";

/*
 * Prepare one body's relationship witnesses. Same-body endpoints follow the
 * candidate and outside receivers read the original actual snapshot.
 */
export function physicalContactBindingRows(
  input: IAutoMoviePhysicalContactBindingRows.IInput,
): IAutoMoviePhysicalContactBindingRows.IResult {
  return preparePhysicalContactBindingRows(
    input,
    (body: string, bone: string): IPhysicalContactPoseReference =>
      body === input.body
        ? {
            key: bone,
            read: (poses: IAutoMoviePoses): IAutoMovieRigidTransform =>
              poses[bone]!,
          }
        : {
            read: (): IAutoMovieRigidTransform => input.actual[body]![bone]!,
          },
  );
}
