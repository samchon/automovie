import { TestValidator } from "@nestia/e2e";

import { parseFaceBrowPreparationArguments } from "../../../scripts/face-review/parseFaceBrowPreparationArguments";
import { throwsError } from "../internal/predicates";

/** Literal path policy is pure and independent of Windows/POSIX I/O. */
export const test_subject_brow_preparation_arguments = (): void => {
  const args = ["study", "explicit.json", "output.json"];
  const exists = (name: string) => args.slice(0, 2).includes(name);
  TestValidator.equals("explicit argument mapping", parseFaceBrowPreparationArguments(args, exists),
    { study: args[0], request: args[1], output: args[2] });
  for (const input of [[], ["study", "explicit.json"], ["study", " ", "output.json"]])
    TestValidator.predicate("invalid argument tuple refuses", throwsError(() => parseFaceBrowPreparationArguments(input, exists), "STUDY REQUEST"));
  for (const missing of args.slice(0, 2))
    TestValidator.predicate("missing source input refuses", throwsError(() => parseFaceBrowPreparationArguments(args,
      (name) => name !== missing && exists(name)), "existing study"));
  TestValidator.predicate("existing output refuses", throwsError(() => parseFaceBrowPreparationArguments(args, () => true), "new artifact"));
  const paths = ["D:\\study files", "../explicit request.json", "./next output.json"];
  TestValidator.equals("platform paths retained literally", parseFaceBrowPreparationArguments(paths, (name) => name !== paths[2]),
    { study: paths[0], request: paths[1], output: paths[2] });
  TestValidator.equals("caller arguments unchanged", args, ["study", "explicit.json", "output.json"]);
};
