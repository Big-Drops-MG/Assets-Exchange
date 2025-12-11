import type {
  ComparisonType,
  PerformanceChartData,
} from "../types/admin.types";

const generate24HourData = (): PerformanceChartData => {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const timeLabel = `${hour.toString().padStart(2, "0")}:00`;
    data.push({
      label: timeLabel,
      current: Math.floor(Math.random() * 20000) + 1000,
      previous: Math.floor(Math.random() * 20000) + 1000,
    });
  }
  return {
    data,
    comparisonType: "Today vs Yesterday",
    xAxisLabel: "Time",
  };
};

const generateWeeklyData = (): PerformanceChartData => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const data = days.map((day) => ({
    label: day,
    current: Math.floor(Math.random() * 20000) + 1000,
    previous: Math.floor(Math.random() * 20000) + 1000,
  }));
  return {
    data,
    comparisonType: "Current Week vs Last Week",
    xAxisLabel: "Day",
  };
};

const generateMonthlyData = (): PerformanceChartData => {
  const data = [];
  const daysInMonth = 31;
  for (let day = 1; day <= daysInMonth; day++) {
    data.push({
      label: day.toString().padStart(2, "0"),
      current: Math.floor(Math.random() * 20000) + 1000,
      previous: Math.floor(Math.random() * 20000) + 1000,
    });
  }
  return {
    data,
    comparisonType: "Current Month vs Last Month",
    xAxisLabel: "Date",
  };
};

export const getPerformanceChartDataByType = (
  comparisonType: ComparisonType
): PerformanceChartData => {
  switch (comparisonType) {
    case "Today vs Yesterday":
    case "Today vs Last Week":
      return generate24HourData();
    case "Current Week vs Last Week":
      return generateWeeklyData();
    case "Current Month vs Last Month":
      return generateMonthlyData();
    default:
      return generate24HourData();
  }
};
