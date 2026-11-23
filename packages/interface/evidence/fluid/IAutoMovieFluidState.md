# src/fluid/IAutoMovieFluidState.ts#IAutoMovieFluidState

## @evidence contracts/development/design.md#principled-representation

Each call replays an explicit flux-form update from zero, with a shared donor-scaled limiter and ledger contributions from the same fluxes. Interior cancellation gives mathematical conservation under finite arithmetic; shape admission and the current depth/velocity checks do not establish finite clock/ledger values or detect a NaN depth intermediate already replaced by zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Depth on cells and velocity on faces is the whole state the next step needs, plus four ledger totals that let a caller audit conservation without re-solving.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No result cache makes seek results independent of earlier calls for unchanged inputs. The nonpositive-depth assignment follows limiting but also hides NaN intermediates, and ledger/time overflow is not independently refused; these remain unresolved numerical admission gaps rather than guaranteed roundoff-only corrections.

## @evidence contracts/development/common.md#meaningful-documentation

States replay ownership and cost, step refusal, exact scope and limits of finite-state checks, array layouts and the intended finite-arithmetic ledger relation; members give units, indices and each total's meaning.
