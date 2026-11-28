# Production checks

Before drafting, define verifiable phase and delivery criteria. Register the subject and named checks in `src/executable/check.ts`. State each check's expectation, scope and evidence. List required IDs under `required[stage]`.

## First witness

Run the first relevant check as soon as the film's [first passage](director.md#first-programming-assignment) provides a witness.

```text
automovie check --subject <id> --only <check> --run
```

Import the measurement source when the check module loads. Declare that source and its real file inputs, or the manifest that identifies them. The CLI binds the loaded source and files before invoking the measurement. Record the exact participant, effector, prop and interval. A missing observation leaves the criterion pending. When several conditions form one criterion, require them on the same effector at the same realized occurrence. Locate an interrupted action from what played and use a [bounded capture](../visual-debugging/capture.md#times) for a picture question.

## Handoff

At handoff, run `pnpm run check --subject <id> --require <stage>`. Add `--run` to execute a needed measurement or refresh a configured capture. Record the result and keep the stage open until all required checks pass.

Run the check again when a change to its loaded source or inputs makes the stored result stale.

Use independent visual judgment where the stage requires it.
