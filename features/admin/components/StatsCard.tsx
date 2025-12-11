import { ArrowUp } from "lucide-react";
import React from "react";

import { getVariables } from "@/components/_variables/variables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { AdminStats } from "../types/admin.types";

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  historicalData,
}: AdminStats) {
  const variables = getVariables();
  const TrendIcon = trend?.trendIconValue;
  const isPositive = TrendIcon === ArrowUp;

  return (
    <Card className="shadow-sm gap-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle
          className="text-base font-medium font-inter"
          style={{ color: variables.colors.statsCardTitleColor }}
        >
          {title}
        </CardTitle>
        <div
          className="flex items-center justify-center rounded-md p-2"
          style={{
            backgroundColor: variables.colors.statsCardIconBackgroundColor,
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: variables.colors.statsCardIconColor }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 md:space-y-6.5">
        <div className="flex items-center justify-between">
          <div
            className="text-4xl xl:text-[2.5rem] font-medium font-inter"
            style={{ color: variables.colors.statsCardValueColor }}
          >
            {value}
          </div>

          {trend && (
            <div className="flex flex-col items-center justify-center gap-1">
              <span
                className="text-sm font-inter"
                style={{ color: variables.colors.statsCardTrendTextColor }}
              >
                {trend.trendTextValue}
              </span>
              <div className="flex items-center justify-start gap-1">
                {TrendIcon && (
                  <TrendIcon
                    className="h-4.5 w-4.5"
                    style={{
                      color: isPositive
                        ? variables.colors.statsCardTrendIconColorPositive
                        : variables.colors.statsCardTrendIconColorNegative,
                    }}
                  />
                )}
                <span
                  className="text-base font-semibold font-inter"
                  style={{
                    color: isPositive
                      ? variables.colors.statsCardTrendTextColorPositive
                      : variables.colors.statsCardTrendTextColorNegative,
                  }}
                >
                  {trend.textValue}
                </span>
              </div>
            </div>
          )}
        </div>

        {historicalData && (
          <div className="space-y-2 ">
            {historicalData.map((item, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-inter"
                    style={{
                      color: variables.colors.statsCardHistoricalDataLabelColor,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-base font-inter font-medium"
                    style={{
                      color: variables.colors.statsCardHistoricalDataValueColor,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
                {index < 2 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
