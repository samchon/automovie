/**
 * Let a measurement reader run only while the displayed person is admitted.
 *
 * Measurements are read on an admitted person by the measurement worker's
 * ordinary evaluation. A draft is by definition a person that evaluation
 * refuses, so asking for its measurements would construct the whole person in
 * a second worker only to throw the first failure. The reader is therefore
 * answered at once with the reason, which the measurement rows display in
 * place of a value; the caller's document and the worker are left untouched.
 *
 * @author Samchon
 */
export function readConnectedPersonAdmitted<
  Arguments extends unknown[],
  Reading,
>(
  isDraft: () => boolean,
  read: (...input: Arguments) => Promise<Reading>,
): (...input: Arguments) => Promise<Reading> {
  return (...input) =>
    isDraft()
      ? Promise.reject(
          new Error(
            "not read: the displayed person is a draft its owner did not accept",
          ),
        )
      : read(...input);
}
