# Production checks

Before drafting, define verifiable phase and delivery criteria. Register the subject and named checks in `src/executable/check.ts`. State each check's expectation, scope and evidence. List required IDs under `required[stage]`.

At handoff, run `pnpm run check --subject <id> --require <stage>`. Add `--run` to execute a needed measurement or refresh a configured capture. Record the result and keep the stage open until all required checks pass.

Use independent visual judgment where the stage requires it.
