import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DateRangePicker } from "./DateRangePicker";

const TODAY_PRESET = {
  label: "오늘",
  range: () => ["2026-07-01T00:00:00Z", "2026-07-01T23:59:59Z"] as [string, string],
};

function setup() {
  const onChange = vi.fn();
  const utils = render(
    <DateRangePicker
      start="2026-06-01T00:00:00Z"
      end="2026-06-05T23:59:59Z"
      timezone="Asia/Seoul"
      presets={[TODAY_PRESET]}
      onChange={onChange}
    />
  );
  return { ...utils, onChange };
}

describe("DateRangePicker", () => {
  it("프리셋 클릭 시 즉시 onChange 호출하고 패널을 닫는다", () => {
    const { container, getByText, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.click(getByText("오늘"));

    expect(onChange).toHaveBeenCalledWith(...TODAY_PRESET.range(), "Asia/Seoul");
    expect(container.querySelector(".daterange-panel")).toBeNull();
  });

  it("Start/End 시간 수정 후 Apply 시 타임존 기준으로 UTC 인스턴트를 계산한다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const [startDateInput, startTimeInput, endDateInput, endTimeInput] =
      container.querySelectorAll(".daterange-field-row input");

    fireEvent.change(startDateInput, { target: { value: "2026-06-15" } });
    fireEvent.change(startTimeInput, { target: { value: "10:30" } });
    fireEvent.change(endDateInput, { target: { value: "2026-06-20" } });
    fireEvent.change(endTimeInput, { target: { value: "08:59" } });
    fireEvent.click(container.querySelector(".daterange-apply")!);

    // Asia/Seoul(UTC+9): 06-15 10:30 로컬 -> 06-15 01:30Z, 06-20 08:59 로컬 -> 06-19 23:59Z
    expect(onChange).toHaveBeenCalledWith(
      "2026-06-15T01:30:00.000Z",
      "2026-06-19T23:59:00.000Z",
      "Asia/Seoul"
    );
  });

  it("타임존을 UTC로 바꾸면 입력한 시각이 오프셋 없이 그대로 전송된다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.change(container.querySelector(".daterange-tz")!, { target: { value: "UTC" } });
    const [startDateInput, startTimeInput, endDateInput, endTimeInput] =
      container.querySelectorAll(".daterange-field-row input");

    fireEvent.change(startDateInput, { target: { value: "2026-06-15" } });
    fireEvent.change(startTimeInput, { target: { value: "05:00" } });
    fireEvent.change(endDateInput, { target: { value: "2026-06-15" } });
    fireEvent.change(endTimeInput, { target: { value: "23:00" } });
    fireEvent.click(container.querySelector(".daterange-apply")!);

    expect(onChange).toHaveBeenCalledWith(
      "2026-06-15T05:00:00.000Z",
      "2026-06-15T23:00:00.000Z",
      "UTC"
    );
  });

  it("캘린더에서 두 날짜를 클릭하면 Start/End 날짜 입력에 반영된다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const dayButtons = Array.from(container.querySelectorAll(".daterange-day")) as HTMLButtonElement[];
    const day15 = dayButtons.find((b) => b.textContent === "15" && !b.className.includes("dim"));
    const day20 = dayButtons.find((b) => b.textContent === "20" && !b.className.includes("dim"));

    fireEvent.click(day15!);
    fireEvent.click(day20!);

    const [startDateInput, , endDateInput] = container.querySelectorAll(
      ".daterange-field-row input"
    ) as NodeListOf<HTMLInputElement>;
    expect(startDateInput.value).toBe("2026-06-15");
    expect(endDateInput.value).toBe("2026-06-20");
  });
});
