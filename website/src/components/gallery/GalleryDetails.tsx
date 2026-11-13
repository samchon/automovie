"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";

import type { IGalleryCatalogue } from "../../gallery/structures/IGalleryCatalogue";
import type { IGalleryRequest } from "../../gallery/structures/IGalleryRequest";
import type { IGalleryView } from "../../gallery/structures/IGalleryView";

/**
 * The facts of the subject shown and the controls that change it. Its name
 * and kind stay on top; under them two toggle buttons, the pressed one
 * choosing what the panel shows: Specs, the dimensions the seed drew against
 * their bands and the affordances an action attaches to, or Customise, the
 * seed, the affordance marks and a slider for each articulation, for a
 * visitor who wants to change them. They are pressed buttons rather than
 * tabs, since the panel has no tab panels to move between with arrow keys.
 *
 * @param props The subject, the request, what was built and the listener.
 * @returns The panel.
 */
export function GalleryDetails(props: {
  /** The subject shown. */
  subject: IGalleryCatalogue.ISubject;

  /** What is asked for. */
  request: IGalleryRequest;

  /** What was built, or null while nothing is. */
  view: IGalleryView | null;

  /** Hear the changed request. */
  onChange: (request: IGalleryRequest) => void;
}): ReactElement {
  const { subject, request, view } = props;
  const [tab, setTab]: [
    "specs" | "customise",
    Dispatch<SetStateAction<"specs" | "customise">>,
  ] = useState<"specs" | "customise">("specs");
  return (
    <aside className="am-gallery-facts" aria-label="Details">
      <section className="am-panel am-stack">
        <h2>{view?.name ?? subject.label}</h2>
        {subject.variants.length === 0 ? null : (
          <label className="am-field">
            <span className="am-label">
              {`${subject.variantKey[0]!.toUpperCase()}${subject.variantKey.slice(1)}`}
            </span>
            <select
              value={request.variant}
              onChange={(event): void =>
                props.onChange({
                  ...request,
                  variant: event.target.value,
                  state: {},
                })
              }
            >
              {subject.variants.map(
                (variant: { id: string; label: string }): ReactElement => (
                  <option key={variant.id} value={variant.id}>
                    {variant.label}
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        <div className="am-chips" role="group" aria-label="Details view">
          <button
            type="button"
            className="am-chip"
            aria-pressed={tab === "specs"}
            onClick={(): void => setTab("specs")}
          >
            Specs
          </button>
          <button
            type="button"
            className="am-chip"
            aria-pressed={tab === "customise"}
            onClick={(): void => setTab("customise")}
          >
            Customise
          </button>
        </div>
      </section>

      {tab !== "customise" ? null : (
        <section className="am-panel am-stack">
          <div className="am-row">
            <label className="am-field">
              <span className="am-label">Seed</span>
              <input
                type="text"
                value={request.seed}
                placeholder="none: the middle of every band"
                onChange={(event): void =>
                  props.onChange({
                    ...request,
                    seed: event.target.value,
                    state: {},
                  })
                }
              />
            </label>
            <button
              type="button"
              onClick={(): void =>
                props.onChange({
                  ...request,
                  seed: String(Math.floor(Math.random() * 1_000_000)),
                  state: {},
                })
              }
            >
              New seed
            </button>
          </div>
          <label className="am-check">
            <input
              type="checkbox"
              checked={request.affordances}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                props.onChange({
                  ...request,
                  affordances: event.target.checked,
                })
              }
            />
            <span>Show the affordances on the model</span>
          </label>
        </section>
      )}

      {tab !== "specs" ||
      view === null ||
      view.dimensions.length === 0 ? null : (
        <section className="am-panel">
          <h2>Dimensions</h2>
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th className="am-number">Drawn</th>
                  <th>Band</th>
                </tr>
              </thead>
              <tbody>
                {view.dimensions.map(
                  (dimension: IGalleryView.IDimension): ReactElement => (
                    <tr key={dimension.name}>
                      <td className="am-mono" title={dimension.source}>
                        {dimension.name}
                        {dimension.provisional ? " *" : ""}
                      </td>
                      <td className="am-number">
                        {format(dimension.value)}
                        {unit(dimension.unit)}
                      </td>
                      <td>
                        <div
                          className="am-band"
                          role="img"
                          aria-label={`${format(dimension.minimum)} to ${format(dimension.maximum)} ${dimension.unit}`}
                        >
                          <span
                            className="am-band-mark"
                            style={{
                              left: `${
                                dimension.maximum > dimension.minimum
                                  ? Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        ((dimension.value - dimension.minimum) /
                                          (dimension.maximum -
                                            dimension.minimum)) *
                                          100,
                                      ),
                                    )
                                  : 50
                              }%`,
                            }}
                          />
                        </div>
                        <span className="am-band-text">
                          {format(dimension.minimum)} to{" "}
                          {format(dimension.maximum)}
                          {unit(dimension.unit)}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {view.dimensions.some(
            (d: IGalleryView.IDimension): boolean => d.provisional,
          ) ? (
            <p className="am-muted am-hint">
              * A band that could not be read at its primary source.
            </p>
          ) : null}
        </section>
      )}

      {tab !== "specs" ||
      view === null ||
      view.affordances.length === 0 ? null : (
        <section className="am-panel am-stack">
          <h2>Affordances</h2>
          <p className="am-muted">
            Where a person meets it. An action attaches to an affordance by its
            id.
          </p>
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Kind</th>
                </tr>
              </thead>
              <tbody>
                {view.affordances.map(
                  (affordance: IGalleryView.IAffordance): ReactElement => (
                    <tr key={affordance.id}>
                      <td className="am-mono">{affordance.id}</td>
                      <td>
                        <span
                          className="am-swatch"
                          style={{ background: affordance.color }}
                          aria-hidden="true"
                        />
                        {affordance.kind}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab !== "customise" ||
      view === null ||
      !view.affordances.some(
        (a: IGalleryView.IAffordance): boolean => a.travel !== null,
      ) ? null : (
        <section className="am-panel am-stack">
          <h2>Articulations</h2>
          {view.affordances
            .filter((a: IGalleryView.IAffordance): boolean => a.travel !== null)
            .map((affordance: IGalleryView.IAffordance): ReactElement => {
              const travel: IGalleryView.ITravel = affordance.travel!;
              const value: number = request.state[affordance.id] ?? 0;
              return (
                <label key={affordance.id} className="am-field">
                  <span className="am-label">
                    Move {affordance.id} ({affordance.kind},{" "}
                    {format(travel.minimum)} to {format(travel.maximum)}
                    {unit(travel.unit)})
                  </span>
                  <span className="am-slider">
                    <input
                      type="range"
                      min={travel.minimum}
                      max={travel.maximum}
                      step={(travel.maximum - travel.minimum) / 100}
                      value={value}
                      onChange={(event): void =>
                        props.onChange({
                          ...request,
                          state: {
                            ...request.state,
                            [affordance.id]: Number(event.target.value),
                          },
                        })
                      }
                    />
                    <output className="am-mono">
                      {format(value)}
                      {unit(travel.unit)}
                    </output>
                  </span>
                </label>
              );
            })}
        </section>
      )}
    </aside>
  );
}

/** A unit as the tables show it: the degree sign for degrees, any other unit after a space. */
const unit = (name: string): string =>
  name === "degrees" ? "°" : name === "" ? "" : ` ${name}`;

/** A number as the tables show it: at most four significant decimals, without trailing zeros. */
const format = (value: number): string =>
  String(Number(value.toFixed(Math.abs(value) >= 100 ? 1 : 4)));
