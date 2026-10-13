---
name: mission-supervision
description: Guides assignment, shared ownership, intermediate acceptance, and recovery for a long mission. Use only when the user explicitly invokes mission-supervision; ordinary implementation, reviews, and campaigns do not activate it.
---

# Mission Supervision

This skill grants no delegation or remote-action permission; [agents/openai.yaml](agents/openai.yaml) disables implicit invocation.

- Break the mission into results a consumer can accept. Each assignment names the behavior, current inputs and revision, owned files, predecessor result, acceptance evidence, and next check.
- Start with a small connected result that exposes the representation and consumer assumptions, and size later assignments from it, never from available agent slots.
- Give each shared source or boundary one owner. A dependent task needs the provider's usable intermediate contract, not its whole issue closed; a changed shared revision repeats the acceptance it invalidates.
- Accept current output and its limiting evidence, never progress inferred from activity, tags, or test counts. When an assignment fails repeatedly, fix the cause before repeating it.
- Finish when the requested results and their joint consumer acceptance hold at the current revision.
