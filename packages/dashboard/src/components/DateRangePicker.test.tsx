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

  it("오버레이(패널 바깥)를 클릭하면 패널이 닫힌다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    expect(container.querySelector(".daterange-panel")).not.toBeNull();

    fireEvent.click(container.querySelector(".daterange-overlay")!);

    expect(container.querySelector(".daterange-panel")).toBeNull();
  });

  it("열려 있는 상태에서 트리거를 다시 클릭하면 패널이 닫힌다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    expect(container.querySelector(".daterange-panel")).not.toBeNull();

    fireEvent.click(container.querySelector(".daterange-trigger")!);

    expect(container.querySelector(".daterange-panel")).toBeNull();
  });

  it("나중 날짜를 먼저 클릭하고 이전 날짜를 나중에 클릭해도 Start/End가 자동으로 정렬된다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const dayButtons = Array.from(container.querySelectorAll(".daterange-day")) as HTMLButtonElement[];
    const day20 = dayButtons.find((b) => b.textContent === "20" && !b.className.includes("dim"));
    const day15 = dayButtons.find((b) => b.textContent === "15" && !b.className.includes("dim"));

    fireEvent.click(day20!);
    fireEvent.click(day15!);

    const [startDateInput, , endDateInput] = container.querySelectorAll(
      ".daterange-field-row input"
    ) as NodeListOf<HTMLInputElement>;
    expect(startDateInput.value).toBe("2026-06-15");
    expect(endDateInput.value).toBe("2026-06-20");
  });

  it("이전/다음 달 버튼으로 캘린더 헤더의 연월이 이동한다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const [prevBtn, nextBtn] = container.querySelectorAll(".daterange-cal-header button");
    const header = () => container.querySelector(".daterange-cal-header span")!.textContent;

    expect(header()).toBe("2026년 6월");

    fireEvent.click(nextBtn);
    expect(header()).toBe("2026년 7월");

    fireEvent.click(prevBtn);
    fireEvent.click(prevBtn);
    expect(header()).toBe("2026년 5월");
  });

  it("프리셋과 일치하지 않는 범위는 트리거에 'M/D HH:mm ~ M/D HH:mm' 형식으로 표시된다", () => {
    const { container } = setup();

    expect(container.querySelector(".daterange-trigger span")!.textContent).toBe(
      "6/1 09:00 ~ 6/6 08:59"
    );
  });

  it("Start 날짜를 비우면 Apply 버튼이 비활성화되어 잘못된 시간 값으로 진행되지 않는다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const [startDateInput] = container.querySelectorAll(".daterange-field-row input");

    fireEvent.change(startDateInput, { target: { value: "" } });

    const applyBtn = container.querySelector(".daterange-apply") as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);

    fireEvent.click(applyBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("날짜/시간 입력란을 직접 수정해 Start가 End보다 뒤에 오면 Apply 시 자동으로 정렬된다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const [startDateInput, startTimeInput, endDateInput, endTimeInput] =
      container.querySelectorAll(".daterange-field-row input");

    // 캘린더 클릭과 달리 입력란은 독립적이라 Start를 End보다 뒤로 만들 수 있다
    fireEvent.change(startDateInput, { target: { value: "2026-06-25" } });
    fireEvent.change(startTimeInput, { target: { value: "12:00" } });
    fireEvent.change(endDateInput, { target: { value: "2026-06-01" } });
    fireEvent.change(endTimeInput, { target: { value: "12:00" } });
    fireEvent.click(container.querySelector(".daterange-apply")!);

    expect(onChange).toHaveBeenCalledWith(
      "2026-06-01T03:00:00.000Z",
      "2026-06-25T03:00:00.000Z",
      "Asia/Seoul"
    );
  });

  it("서머타임 전환일 전후를 걸치는 타임존도 각 날짜의 오프셋을 정확히 반영한다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.change(container.querySelector(".daterange-tz")!, {
      target: { value: "America/New_York" },
    });
    const [startDateInput, startTimeInput, endDateInput, endTimeInput] =
      container.querySelectorAll(".daterange-field-row input");

    // 2026-03-08 미국 동부 서머타임 시작(EST -05:00 -> EDT -04:00)을 걸치는 구간
    fireEvent.change(startDateInput, { target: { value: "2026-03-07" } });
    fireEvent.change(startTimeInput, { target: { value: "03:30" } });
    fireEvent.change(endDateInput, { target: { value: "2026-03-09" } });
    fireEvent.change(endTimeInput, { target: { value: "03:30" } });
    fireEvent.click(container.querySelector(".daterange-apply")!);

    expect(onChange).toHaveBeenCalledWith(
      "2026-03-07T08:30:00.000Z",
      "2026-03-09T07:30:00.000Z",
      "America/New_York"
    );
  });

  it("서머타임 전환 직후(같은 날) 유효한 로컬 시각도 올바른 오프셋으로 변환한다", () => {
    // America/New_York은 2026-03-08 02:00 EST -> 03:00 EDT로 전환된다. 전환 인스턴트
    // 이전(guess) 시점 오프셋(EST, -05:00)만으로 한 번만 보정하면, 전환 이후에야 존재하는
    // 유효한 로컬 시각(06:30)도 실제보다 1시간 어긋난 인스턴트로 계산되는 회귀가 있었다.
    // 06:30 EDT(-04:00) === 10:30Z가 정답.
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    fireEvent.change(container.querySelector(".daterange-tz")!, {
      target: { value: "America/New_York" },
    });
    const [startDateInput, startTimeInput, endDateInput, endTimeInput] =
      container.querySelectorAll(".daterange-field-row input");

    fireEvent.change(startDateInput, { target: { value: "2026-03-08" } });
    fireEvent.change(startTimeInput, { target: { value: "06:30" } });
    fireEvent.change(endDateInput, { target: { value: "2026-03-08" } });
    fireEvent.change(endTimeInput, { target: { value: "07:00" } });
    fireEvent.click(container.querySelector(".daterange-apply")!);

    expect(onChange).toHaveBeenCalledWith(
      "2026-03-08T10:30:00.000Z",
      "2026-03-08T11:00:00.000Z",
      "America/New_York"
    );
  });

  it("두 날짜로 범위를 완성한 뒤 세 번째 날짜를 클릭하면 새 단일 날짜 선택으로 초기화된다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const findDay = (n: string) =>
      (Array.from(container.querySelectorAll(".daterange-day")) as HTMLButtonElement[]).find(
        (b) => b.textContent === n && !b.className.includes("dim")
      )!;
    const [startDateInput, , endDateInput] = container.querySelectorAll(
      ".daterange-field-row input"
    ) as NodeListOf<HTMLInputElement>;

    fireEvent.click(findDay("15"));
    fireEvent.click(findDay("20"));
    expect(startDateInput.value).toBe("2026-06-15");
    expect(endDateInput.value).toBe("2026-06-20");

    fireEvent.click(findDay("10"));
    expect(startDateInput.value).toBe("2026-06-10");
    expect(endDateInput.value).toBe("2026-06-10");
  });

  it("날짜를 선택한 뒤 달을 이동해도 Start 값은 그대로 유지된다", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const dayButtons = Array.from(container.querySelectorAll(".daterange-day")) as HTMLButtonElement[];
    const day15 = dayButtons.find((b) => b.textContent === "15" && !b.className.includes("dim"))!;
    fireEvent.click(day15);

    const [startDateInput] = container.querySelectorAll(".daterange-field-row input") as NodeListOf<HTMLInputElement>;
    expect(startDateInput.value).toBe("2026-06-15");

    const [prevBtn, nextBtn] = container.querySelectorAll(".daterange-cal-header button");
    const header = () => container.querySelector(".daterange-cal-header span")!.textContent;

    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(header()).toBe("2026년 8월");
    expect(startDateInput.value).toBe("2026-06-15");

    fireEvent.click(prevBtn);
    fireEvent.click(prevBtn);
    expect(header()).toBe("2026년 6월");
    expect(startDateInput.value).toBe("2026-06-15");
  });

  it("End 날짜를 비워도 Apply 버튼이 비활성화되어 잘못된 시간 값으로 진행되지 않는다", () => {
    const { container, onChange } = setup();
    fireEvent.click(container.querySelector(".daterange-trigger")!);
    const [, , endDateInput] = container.querySelectorAll(".daterange-field-row input");

    fireEvent.change(endDateInput, { target: { value: "" } });

    const applyBtn = container.querySelector(".daterange-apply") as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);

    fireEvent.click(applyBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("현재 범위가 프리셋과 정확히 일치하면 트리거에 프리셋 라벨이 표시된다", () => {
    const onChange = vi.fn();
    const [presetStart, presetEnd] = TODAY_PRESET.range();
    const { container } = render(
      <DateRangePicker
        start={presetStart}
        end={presetEnd}
        timezone="Asia/Seoul"
        presets={[TODAY_PRESET]}
        onChange={onChange}
      />
    );

    expect(container.querySelector(".daterange-trigger span")!.textContent).toBe("오늘");
  });

  it("범위 선택 도중 패널을 닫았다가 다시 열면 이전 선택은 초기화되고 새로 시작한다", () => {
    const { container } = setup();
    const trigger = container.querySelector(".daterange-trigger")!;
    const findDay = (n: string) =>
      (Array.from(container.querySelectorAll(".daterange-day")) as HTMLButtonElement[]).find(
        (b) => b.textContent === n && !b.className.includes("dim")
      )!;

    fireEvent.click(trigger); // 열기
    fireEvent.click(findDay("10")); // 첫 클릭만 하고 완료하지 않음 (pendingStart = 10일)

    fireEvent.click(trigger); // 닫기
    fireEvent.click(trigger); // 다시 열기 -> pendingStart는 초기화되어야 함

    fireEvent.click(findDay("20")); // 이전 10일과 짝지어지면 안 되고, 새 단일 날짜 선택이어야 함

    const [startDateInput, , endDateInput] = container.querySelectorAll(
      ".daterange-field-row input"
    ) as NodeListOf<HTMLInputElement>;
    expect(startDateInput.value).toBe("2026-06-20");
    expect(endDateInput.value).toBe("2026-06-20");
  });
});
