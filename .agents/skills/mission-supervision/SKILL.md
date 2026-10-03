---
name: mission-supervision
description: Guides assignment, shared ownership, intermediate acceptance and recovery for a long mission when the user explicitly invokes mission-supervision. Ordinary implementation, reviews and campaigns do not activate it.
---

# Mission supervision

Apply this procedure only when the user explicitly requests this skill, including `$mission-supervision`. Its [Codex invocation policy](agents/openai.yaml) disables implicit matching. A request for a long task alone does not invoke it. The skill coordinates authorized work; it does not grant delegation or remote-action permissions.

## Assign a usable result

Break the mission into results a consumer can accept. For each assignment, give the intended behavior, current inputs and revision, owned files or shared boundary, required dependency result, acceptance evidence and next supervision point. Supply the applicable source and owning instructions rather than every mission document.

Start with a small connected result that exposes the representation and consumer assumptions. Widen subsequent assignments after observing that result. Set workload from unresolved dependencies, feedback delay and the assignee's demonstrated capacity. A large checklist or available agent slot is not a reason to enlarge the assignment.

Name one owner for a shared source or boundary. Coordinate dependent results with that owner before conflicting edits or publication. Accept a usable intermediate contract when it enables independent work; dependent tasks need that result, not the provider's entire issue to close. After a shared revision changes, identify and repeat the acceptance it invalidates.

## Supervise and correct

Inspect the first usable consumer result, a shared-boundary change and evidence of repeated failure while correction is still cheap. Require the current output and its limiting evidence, rather than completion percentages inferred from activity, tags or test counts. Keep verified results distinct from pending work and unsupported claims.

When an assignment repeatedly fails, inspect the attempted result and actual cause. Correct a missing input, overloaded scope, mistaken representation or conflicting ownership before repeating the assignment. Reassign or split when that addresses the cause, and give the successor the current artifacts, correction and remaining acceptance. The supervisor owns resolving the coordination failure and verifying recovery.

Keep an updated task list with owners, dependencies and accepted results. Finish when the requested results and their joint consumer acceptance hold at the current revision. Report any external blocker with its affected work. Route implementation, review and delivery to their owning procedures; this skill adds no separate review or publishing gate.
