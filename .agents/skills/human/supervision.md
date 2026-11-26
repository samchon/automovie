# Human supervision

Apply this policy whenever supervising Human work. Read it at the start of the assignment and after a resume or handoff. The current user instructions and issue define scope and acceptance. [3D modeling](../3d-modeling/SKILL.md) owns general construction and form inspection. [Human verification](verification.md) owns anatomical evidence.

## Start or resume

1. Confirm the checkout, branch, worktree state, published revision, active writers and next pending acceptance step. Read the issue, PR, handoff, last audit, applicable construction rule and evidence for the last accepted result. Record user corrections as requirements.
2. Start the audit clock immediately. Set the next deadline ten minutes after the start and maintain that schedule during code edits, fits, verification, worker waits and CI waits. Bound waits by the next deadline. Use actual local time with its offset. When an audit runs late, record the scheduled and actual time and the reason. Continue on the established cadence.
3. Assign one writer per coupled source. Give each worker the actual owners, scope, governing user rules, expected evidence and output locations. Use fewer workers when their work overlaps or shares a mutable input. Use PowerShell only and include that rule in every worker brief. Keep inspection logic in tracked tools. For Campaign #3151, stay in the designated checkout and run those tools directly in place of temporary Python or JavaScript scripts. Keep private references and captures in Human's local ignored evidence directory.

Workers choose their sources, make implementation decisions, edit and verify within scope without waiting for the supervisor's approval. The supervisor audits the work after action. When a violation is found, identify the exact rule and affected code, direct the owner to remove the unsupported change from the candidate, and require renewed research at the cause. Preserve verified independent work. Apply existing authorization rules for operations the user has reserved. [Shared checkout](../development/SKILL.md#several-agents-in-one-checkout).

## Evidence before implementation

Before implementing a feature, correction or shape trial, establish the behavior, its owner and the method from evidence. For a correction, first reproduce the problem and record the input, first failed invariant, contributing factors and affected neighbors. For a feature, identify the measured or specified behavior and the existing operator capable of carrying it.

Read primary research for anatomical or numerical claims. Read maintained open-source implementations and official documentation for applicable methods. Inspect the original equations, source code or data and record the exact section, table, version or revision. Check whether the source's population, posture, units, frame and numerical assumptions fit the case. Use licensed public geometry to observe and verify form. Exemplar measurements supply observations and never determine acceptance.

In the rule record, connect each changed behavior and each new curve, coefficient, limit, fallback or exception to the relevant source and the person's measured field. Show the calculation or transfer into the implementation and name an independent verification that can reject it. Use the smallest established method supported by the evidence. Mark a value `ESTIMATE` only when a cited observation or measured field supports a specific transfer. State the calculation, applicability and limitation. A label or a better-looking screenshot alone provides no basis for a change.

Remove unsupported changes from the candidate and return to research on the original cause. Keep the existing supported rule when evidence for replacement is missing. A diagnostic comparison can isolate an existing rule on preserved inputs. Any replacement trial requires its own source basis. Fixes for one case, widened admission limits and additional shaping bands require the same cause and source evidence as any other change.

## Every ten minutes

Read the actual diff and live process state. Open new matched images, read measurements and logs, and verify which revision, case and files produced them. Check who is editing each shared source and how long each fit has run. Record changes in working method and compare them with the user's instructions, even when no new build or render exists. Record verified, violated or pending evidence for each applicable check.

| Check | Evidence and decision |
| --- | --- |
| Scope and sequence | Record the current work, its exact revision and the first pending issue gate. Check worker boundaries, dependency order and user corrections. For Campaign 3, record the accepted F1 baseline and separate connection changes from wider parameterization. |
| Source and basis | Apply [Evidence before implementation](#evidence-before-implementation) to the actual diff. Check the relevant source, its applicability, the measured or derived values and the independent verification. If any change lacks that basis, record the violation and direct the owner to remove it and investigate the cause. |
| Geometry owner | Identify the original parent loop, its position and transverse derivative, the child's first curve and the common parameter map. Trace a crack, fold or turn to the source curve or correspondence. Correct the source line where the surface exposes the problem. |
| Code structure | Check that each decision has one owner, each module has a clear responsibility, and equivalent cases reuse the same rule. Require a measured cause for any additional curve, special case or correction. Remove superseded trial paths from the delivery scope. |
| Whole failure set | Inspect all pertinent rejection branches, inlet and outlet conditions, opposite and same-region intersections, nearby parts, topology and visible defects. Record every phenomenon, its root cause, its contributing factors and any remaining uncertainty. |
| Actual appearance | Personally open matched clay, curves over clay and close views for each changed joint and its neighbours. Check silhouette, folds and contact in the required views. Compare Campaign 3 changes to the accepted local F1 assembly and record visible regressions. Judge realistic skin through visual debugging and use measurements to diagnose the findings. |
| Cost and ownership | Record start time and wall time for active fits. Profile expensive work by scope, including variables, calls, points and time by stage. Check retained state and lifetimes. Prepare each immutable scope once per invocation and expose a partial reader. Reject result caches, memo maps, module-level results and last-result fields. |
| Reusable work | Keep a rejected candidate's receipts, evidence and independently verified improvements. Identify the exact reusable changes and their verification. Remove a failed trial from the emitted geometry and from the delivery diff. |
| Delivery status | Read each gate from the revision actually checked. Identify the scope of each result, such as a local section proof, a cropped pair, a full joint group or the assembled figure. List unverified requirements and the next action by owner. |

When a fit takes minutes, measure it and redesign the recurring cost. At fifteen minutes, stop that fit and profile its bounded stage before retrying. Record the number of variables, evaluations and points as well as the repeated work. Compare the old and new paths on the same declared scope. A longer limit requires a change to the governing user instruction.

## Correct one batch by cause

1. Preserve the failing input, revision, camera settings, witness positions and logs. Trace every relevant refusal route and inspect the measured failure set before any production correction. Test diagnostic hypotheses against fixed evidence and apply [Evidence before implementation](#evidence-before-implementation) to every replacement proposal.
2. Group all symptoms by source owner and cause. Pair each group with a single causal change and explicit evidence that can disprove it. Include failures at dependent boundaries and in unaffected neighboring domains so the next verification detects regressions.
3. If a fix makes another refusal appear, or if symptoms migrate between regions, stop tuning the affected design. Reopen the original anatomy, parameterization, ownership and prior research. Check the full refusal set on the same input. Replace the incompatible rule or representation at its source.
4. Apply the causal changes together. Keep the smallest set of source curves and shape controls that expresses the measured anatomy and shared boundary jets. Keep branch registration and continuity in those curves.
5. Capture the complete relevant visual debugging set once on the same candidate. Read the associated geometry diagnostics, compare all observed symptoms and affected neighbours, and record one disposition. A rejection starts from the full evidence set.

For example, when a join changes from crossing its neighbor to folding within itself, group both failures with the original curve order, shared tangent plane, sidedness and same-region orientation. Inspect the combined candidate against all those conditions before choosing another construction. [Correction rounds](../visual-debugging/correction-rounds.md) · [Connections](construction.md#connections).

## Record and communicate

Write an entry in the current campaign log at every scheduled audit, including intervals with no new result. Record unavailable evidence and the action that will obtain it. Use a separate dated entry for a user correction, blocked run, rejected candidate or published checkpoint when it changes the direction of work.

Use this record structure and include enough detail to repeat each judgment.

```text
Scheduled / actual / next audit time and offset
Branch, revision and local state
Issue gate, owner, active processes and elapsed times
User rules checked and any violation with corrective action
Evidence opened or measured, including paths, inputs and revision
Phenomenon | Root cause | Contributing factors | Evidence | Disposition
Source changes and reusable verified work
Complete next verification set and unresolved gates
Next action, owner and deadline
```

Report meaningful changes and open gates in the user's language. Give separately the status of design, implementation, verification and publication when they differ. Mark estimates as estimates and state how they were obtained. Write project records, code, commits, issues and PRs in English.

## Before delivery

Run the affected packages' repository build before pushing a code checkpoint. Record the command, checked revision and any difference between the built checkout and the staged files. The build runs the compiler and declaration checks used by CI. Run the tracked visual debugging tools against the built geometry and record the exact revision for each capture.

Inspect the affected assembly and neighbours on the delivery revision. Apply the issue's whole-figure and CI gates. Use matched images for realistic skin acceptance and record the capture's topology and clearance observations when required. Check exact-head CI before changing PR readiness. [Human verification](verification.md) · [Pull request](../pull-request/SKILL.md).

Stage only authorized checkpoint changes. Keep private assets, generated captures, scratch files, unrelated changes and `AUTOMOVIE_TEMPLATE_VERSIONS.ts` out of the campaign commit. Delete commit message files after use. Stop work on user request and preserve existing diffs, captures and local references.
