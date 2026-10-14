import {
  IAutoMovieAxisFrame,
  restRelativeConstraint,
  toClinicalAngle,
  toRigAngle,
} from "@automovie/engine";
import { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

const CLINICAL: IAutoMovieJointConstraint = {
  flexion: { min: -60, max: 180 },
  abduction: { min: -30, max: 180 },
  twist: null,
};

const badSign: IAutoMovieAxisFrame = { sign: 0 as 1, neutral: 90 };
const badNeutral: IAutoMovieAxisFrame = {
  sign: 1,
  neutral: Number.NaN,
};

/**
 * Refuse invalid supplied frame signs and neutrals before scalar conversion or interval reconciliation uses them.
 *
 * Scenarios:
 *
 * 1. `toRigAngle` rejects invalid frame signs.
 * 2. `toClinicalAngle` rejects non-finite neutrals.
 * 3. `restRelativeConstraint` rejects invalid frame entries before shifting.
 * 4. Omitted frames and null angles remain identity cases.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises both scalar conversions and interval reconciliation with malformed supplied frames, requiring actionable Error fragments before an invalid sign or neutral propagates.
 * @evidence contracts/testing.md#independent-expectations An affine rest frame admits only sign plus/minus one and a finite neutral; omitted frames preserve degrees and null angles preserve rest. Message fragments pin the offending quantity without depending on a full rendered message.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts invalid zero sign, NaN neutral, interval conversion of each defect, absent-frame scalar identity and null rest; valid mirror/shift arithmetic is covered by rest-frame reconciliation.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit calls maintained scalar and interval owners with local records, observes thrown Errors and starts no host or asset pipeline.
 */
export function test_rom_rest_frame_scalars(): void {
  TestValidator.predicate(
    "toRigAngle rejects invalid sign",
    throwsError(
      (): number | null => toRigAngle(150, badSign),
      ["rest frame sign", "1 or -1", "0"],
    ),
  );

  TestValidator.predicate(
    "toClinicalAngle rejects non-finite neutral",
    throwsError(
      (): number | null => toClinicalAngle(-60, badNeutral),
      ["rest frame neutral", "finite", "NaN"],
    ),
  );

  TestValidator.predicate(
    "restRelativeConstraint rejects invalid sign",
    throwsError(
      (): IAutoMovieJointConstraint => restRelativeConstraint(CLINICAL, { abduction: badSign }),
      ["rest frame abduction sign", "1 or -1", "0"],
    ),
  );

  TestValidator.predicate(
    "restRelativeConstraint rejects non-finite neutral",
    throwsError(
      (): IAutoMovieJointConstraint => restRelativeConstraint(CLINICAL, { flexion: badNeutral }),
      ["rest frame flexion neutral", "finite", "NaN"],
    ),
  );

  TestValidator.predicate("no frame is identity", nclose(toRigAngle(12, undefined)!, 12, 0));
  TestValidator.equals(
    "null angle is identity",
    toClinicalAngle(null, { sign: -1, neutral: 90 }),
    null,
  );
}
