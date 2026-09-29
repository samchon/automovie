# Steering A Live External Agent

Read this document when a Claude Code or Codex session runs for hours and you steer it. [briefing.md](briefing.md) owns what goes into the brief and every later message, and [records.md](records.md#operate-one-frozen-run-as-a-state-machine) owns the lifecycle state and receipts. Record the transition there before launch, intervention, replacement or cleanup, because live process evidence never substitutes for that durable order.

## Read the turn boundary

`codex exec resume <session-uuid> "<message>"` runs exactly one turn and exits. A live process does not prove the agent is working, and an exited process does not prove it stopped.

- **Poll the session file's size and never its timestamp.** `~/.codex/sessions/` holds one file per session, growing while a turn runs and stopping when it ends. On Windows the last-write time does not move while the writer holds the file open, so a working turn shows a frozen stamp. Two equal sizes over a sensible interval mean idle, and growth means alive.
- **Prefer the process exit as the primary signal** when the turn was launched as a process you watch, with the size as the cross-check. Never kill a session on a size reading alone.
- **Believe a boundary only when three signals agree:** the launched process, the rollout size and the disk. Process and rollout answer whether the session is alive, and only disk answers whether work is happening: a quota-exhausted session keeps a live process and a growing rollout of retry chatter while the disk sits at zero. Pick the artifact signal from the turn's deliverable, disk for an authoring turn and the transcript for an analysis turn, and say which one you read.
- **Treat a notification and its absence as no signal.** A completion notice describes the task wrapper and not the session, and an exit code of 0 there can hide a real exit 2 from a rejected flag. Read the exit code of the command you ran. A finished turn can also go unannounced, so poll on a cadence.
- **A plan is not execution.** A turn that ends by describing what it will do next has not done it, and the next turn is yours to send.

## No steering inside a turn

Input to a session that is mid-turn is refused with `thread-store conflict: thread <uuid> already has an active writer`, and the turn keeps producing evidence meanwhile. Keep the next message in a file and have the retry loop re-read that file on every attempt, so editing it changes what eventually arrives.

- Name the session UUID explicitly, because `--last` resolves to a sub-agent thread and fails.
- `codex exec resume` accepts no `-C`, so change directory first.
- `codex exec resume` does not inherit the session's model but takes the configured default. Pass `-m` on every resume, read the harness's model warning, and record which turns ran under which model, because a substitution also rewrites what the session records.

## Identify processes on a shared machine

Attribute a process by ancestry rooted at the session process (the main `codex.exe` beneath the node wrapper), pinned by process id and creation time together, never by recency and never at the launcher. A reaped launcher makes the closure compute empty, and an empty closure looks like a session that ended.

On a `codex exec resume` turn the session UUID is on the command line, and on a first turn it is not. Neither signal is sound alone, so take both and treat a disagreement as unknown.

- **Only an absolute path authorizes a kill.** Verify process id, creation time, absolute path and a readable command line immediately before each kill, refuse when any of the four cannot be read, and re-check a state you may have misread instead of escalating against it. A path fragment names a kind of thing, and other sandboxes on the machine can share its name. Kill the main process only, because its children clean up behind it, and never `taskkill` by image name.
- **On the Claude Code leg** `claude -p --resume <uuid>` carries neither the working directory, the sandbox nor the UUID, so the UUID-named transcript is the only identity evidence. Without a second signal a kill has nothing to authorize it and the answer is to not kill. Establish which signal your harness leaves before you need it.
- **Shared state fails silently by succeeding on someone else's data:** the machine's Codex configuration, the coordination lock root and the scratchpad. Prefer options on the launch command line. If you must write shared configuration, remove only your own key at your own turn boundary. Prefix every file with your own name, execute no unprefixed one, and compute the identity you expect and capture until it appears, because a one-shot directory listing does not say whose entries you see.

## Keep the home fixed

Moving `USERPROFILE` and `HOME` to make a sandboxed agent's lock paths writable also moves `~/.codex`. The session file relocates, `codex exec resume` no longer finds the session, and a relocated rollout looks like a finished turn. Pin `CODEX_HOME` before the home moves, and afterwards verify that no `.codex` exists under the new home, that the session resumes on the same UUID and that the rollout still grows.

The workaround also makes the supervisor and the agent fence against different coordination roots, so mutual exclusion never engages. Run rounds at turn boundaries only. On Claude Code, moving the home strands its MCP approval state in the user config, and the session then runs to completion touching zero product tools. Claude Code runs as the profile that owns the coordination root, so the workaround is unnecessary there. Say in the record whether the run stands on the stock configuration or an override.

## Verify your instruments

An instrument that answers confidently about input it never received is the family's signature, and it fails in either direction. Make each instrument state its input count and treat zero as a failure and never as a result, so an empty comparison cannot render a verdict.

| The instrument | What it returns |
| --- | --- |
| A query whose own command line contains the search string | Itself, as a real match |
| `-and` and `-or` mixed without parentheses | Processes that match neither clause |
| A hashtable keyed on `ParentProcessId` (`UInt32`) read with an `Int32` | No children, the same answer as a turn that ended |
| `$queue[1..($queue.Count-1)]` on a one-element queue | Indices 1 then 0, an infinite loop that looks like slowness |
| A hash comparison whose input list came back empty | `IDENTICAL` over zero files |
| A per-shot comparand taken as the first recorded digest | Two frames reported `DIFFERENT` because the first line was not the newest |
| `Select-Object -First 40` on a running script's output | Exit -1 from a truncated pipe while the script had succeeded |
| A `grep` for NUL whose pattern expands to empty | `NUL BYTES PRESENT` on a clean file |

Apply the same discipline to what you read from an instrument:

- Check that the mechanism under test was switched on. Single quotes suppress the expansion a test meant to observe.
- A complete, uniform, error-free answer can still be wrong: derived state read from a stored field returns a uniform miss. Ask the model and not your own index, and print an object's keys before counting them.
- Establish where the project's convention says a value lives, and when it can exist, before reporting an absence. A lease file exists only while the command holds it, and a centralized dimension is absent from a module by design. Search across line boundaries in historical prose.
- A null under a condition that no longer exists is no pass, and a property established on a degenerate population holds for that population only.
- A guard must gate. A check that prints and does not gate is worse than none, so make it refuse once on purpose. Prove it on the input shape you will meet, comparing an identifier the way the harness writes it (forward slashes on a resume line), and write every refusal to the log before anything else. Writing a rule into a handoff does not enforce it, and the script must branch on it.
- Anything you write that the session can read joins the corpus your instruments search. A monitor can match your own handoff prose.
- Count what the turn log shows the session doing and never what a harness counter says it did. A verdict about a probe the harness launched itself is no evidence about your session.
- Removing a registration stops new servers and evicts nothing. Do not date the end of an exposure from the removal, and do not kill the residue, whose parent belongs to someone else.
- Transcribing is not measuring. Re-count when you move a number into prose and cite the artifact you re-counted from.

## Handoff

Keep a `HANDOFF.md` current, because it is the only part of the supervisor that outlives it. It names the session UUID, the rollout path, the exact resume command, what exists and must not be rebuilt, the product defects once mistaken for authoring defects, the unmet requirements and the per-turn record, and it separates what you verified from what you were told. The session reads this file, so everything in it is disclosed to the thing observed. Keep out of it only what you deliberately hold back, and a finding you plan to introduce later does not go in.

## The agent may rebut you and be right

Send an observation with an explicit invitation to contradict it, so a rebuttal costs a paragraph and not a repair. Settle a rebuttal by measurement and not by another look at frames: counting elements in the compiled artifact withdraws a claim a second look at frames would have kept. Tell the agent how you obtained every claim so it can challenge the frame. Ask the session nothing you are measuring about it, because asking primes the behavior.

## Harness disclosures

The environment tells the agent things too. A Claude Code harness injects the complete tool-name list unrequested, so discoverability is a property of the harness and a comparison between harnesses measures the harnesses. A readable root that contains this repository lets the session read the tracked baseline, and `git log` reaches a session that opens nothing, because subject lines carry the narrative. Record this as a condition of the run and split the axis: production legibility stays measurable, and blindness to being in an experiment is spent.

## Ask for its list

Running out of findings is not the same as none remaining. Before you treat the run as closed, ask the agent for its own list. The closing condition itself belongs to the brief ([What the brief names](briefing.md#what-the-brief-names)).

## A repack changes the production

Refreshing a sandbox against new packages changes its execution basis. Recompute the outputs from the recorded current source before treating them as evidence for the new generation. A repack with zero source changes can move the fingerprint and turn every frame stale. Take any "before" after the last compile and before the repack and say so, because a stage mark from an earlier round measures your agent's work and attributes it to the product. For a source-authored integration, establish which source and package generation produced the observed frame.

## Read the artifact you are holding

Counts, ids, positions, bindings and dimensions come from the compiled artifact. The frame answers only whether a thing reads as itself at review distance, and when the two disagree about a count the artifact wins and the disagreement is a fact about the frame. Compare a difference between two surfaces as a measurement, with chromaticity separate from brightness: two walls with brightness twelve percent apart and the same ratio are one white lit from two angles.

## Prove the pixels are new

A checkpoint report is the agent's claim and no reading of its output. Compare every sweep against the previous round byte for byte, because how many frames changed and which ones is the progress report.

That comparison holds only where frames are written to a fixed path. Under content-addressed directories a re-render lands in a new digest directory, so re-reading the old paths returns `CHANGED 0` whatever happened, and a comparison whose answer the addressing scheme fixes cannot fail. The signal there is new paths appearing, and the old-path comparison is a labelled tripwire. The propagation shape can fail: with the design untouched nothing derived moves, and with the design touched its dependents move and only the shots facing the change move their pixels. Artifact propagation is wholesale, since a shot contract embeds the whole built environment, and only rendered pixels are proportional.

Hash only what the product wrote (`generated/`, the design and production records, the reports and the renders), and take the snapshot on both sides of the same command. A change can be count-invariant and still move every pixel, as double-sided doors did at 1,929 elements before and after, so a count shows that geometry was added and never that nothing changed. Compare digests and open the frame.
