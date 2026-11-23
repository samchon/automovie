# src/IMountViewerOptions.ts#IMountViewerOptions

## @evidence contracts/development/design.md#principled-representation

Per-mount antialiasing and buffer preservation belong to context creation, pixel ratio controls output dimensions and handled-frame hooks preserve the original producer's completed facts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One options shape keeps native context settings separate from the mount's loop and the producer's actual completed-frame observation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Disabling antialiasing avoids blended structural boundaries but is not a claim of GPU-independent output; handled draws need original completion rather than an invented verification render.

## @evidence contracts/development/common.md#meaningful-documentation

Members describe defaults, creation-only settings, output sizing and required handled-frame completion/redraw ownership.

# src/IMountViewerOptions.ts#IMountViewerOptions.completedFrame

## @evidence contracts/development/implementation.md#principled-implementation

The hook exposes the producer's actual completed draw rather than a requested display state or nominal scene passed to mount.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Handled composites retain completion ownership while mount attaches its clock/control to the supplied record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent handled completion is not replaced with a fabricated ordinary beauty observation.

## @evidence contracts/development/common.md#meaningful-documentation

The member documents original-producer facts and explicit unavailable observation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This observation capability selects no scene rendering or composition algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Record identity suppresses idle ordinary publication in mount but is not by itself canonical pixel/source equivalence.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The hook borrows producer state; the mounted owner retains its callback for that mount's lifetime.

# src/IMountViewerOptions.ts#IMountViewerOptions.redrawCompleted

## @evidence contracts/development/implementation.md#principled-implementation

Explicit redraw delegates the requested completed seconds to the same producer that owns the handled frame and mount checks that a completion was published. A producer with its own clock restores that clock before drawing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mount supplies preserved clock/control while the producer retains its composite render sequence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Redraw does not substitute the nominal scene for an unobserved composite or relabel a previous producer record. Explicit completion or a newly exposed producer record must attest the requested time; refusal throws.

## @evidence contracts/development/common.md#meaningful-documentation

The member states original-producer redraw, requested seconds for restoration versus ordinary redraw, and synchronous completion responsibility.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This redraw capability chooses no multipass or guide rendering strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Redraw is an individual render effect under the current completed clock and cannot be cached by matching options.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The callback borrows its producer's resources; that producer owns pass restoration and mount owns renderer/loop lifetime.

# src/IMountViewerOptions.ts#IMountViewerOptions.freezeCompleted

## @evidence contracts/development/implementation.md#principled-implementation

Delegates independent clock/audio pause to their actual producer owner and distinguishes resumption from terminal release; mount keeps nested lease accounting and animation suppression.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional producer lease complements original redraw ownership without making Viewer own media playback or a production clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ordinary mount-clock producers need no callback; independently advancing state is paused through its owner rather than a substituted time argument.

## @evidence contracts/development/common.md#meaningful-documentation

States outermost acquisition, final and terminal release flags, synchronous ownership, nested behavior, explicit draws and failed-acquisition rollback.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This callback type performs no playback calculation itself.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The controller shares the outer producer lease; this declaration retains no cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A mounted controller retains at most one acquired producer cleanup and consumes it on final release or terminal disposal; the producer owns any async tasks it starts during resumption.
