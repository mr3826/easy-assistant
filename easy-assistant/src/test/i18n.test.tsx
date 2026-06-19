import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "../app/i18n";
import { click, getByTestId, render, waitFor } from "./test-utils";

function Probe() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t("app.title")}</span>
      <button type="button" onClick={() => setLocale("bn")}>
        Switch
      </button>
    </div>
  );
}

describe("i18n", () => {
  it("defaults to English and persists locale selection", async () => {
    localStorage.clear();

    const { container } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(getByTestId(container, "locale")).toHaveTextContent("en");
    expect(getByTestId(container, "title")).toHaveTextContent("Easy Assistant");

    click(container.querySelector("button")!);

    await waitFor(() => {
      expect(getByTestId(container, "locale")).toHaveTextContent("bn");
    });

    expect(localStorage.getItem("easy-assistant-locale")).toBe("bn");
  });
});
