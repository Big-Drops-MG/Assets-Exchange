"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useState } from "react";

import { getVariables } from "@/components/_variables/variables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Request } from "../types/admin.types";

import { RequestItem } from "./RequestItem";

interface RequestSectionProps {
  request: Request;
}

export function RequestSection({ request }: RequestSectionProps) {
  const variables = getVariables();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="-mt-6 mb-0 px-6 py-6 gap-4 flex flex-row items-center justify-between"
        style={{ backgroundColor: variables.colors.cardHeaderBackgroundColor }}
      >
        <CardTitle
          className="xl:text-lg text-sm lg:text-base font-inter font-medium"
          style={{ color: variables.colors.cardHeaderTextColor }}
        >
          {request.headerTitle}
        </CardTitle>

        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <Button
            className="md:h-8.5 md:w-20 lg:h-9.5 lg:w-21.5  xl:h-10.5 xl:w-23 font-inter font-medium rounded-[6px] transition-colors"
            style={{
              backgroundColor: isHovered ? "#FFFFFF" : "#FFFFFF",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span
              className="text-xs lg:text-sm font-medium xl:text-[0.95rem]"
              style={{
                color: isHovered ? "#2563EB" : "#2563EB",
              }}
            >
              {request.buttonTitle}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion.Root type="single" collapsible className="space-y-4">
          {request.requestHeader.map((header, index) => {
            const viewRequest = request.viewRequests[index];
            const approveRequest = request.approveRequest[index];
            const rejectRequest = request.rejectRequest[index];

            if (!viewRequest || !approveRequest || !rejectRequest) {
              return null;
            }

            return (
              <RequestItem
                key={`${request.id}-${index}`}
                requestId={`${request.id}-${index}`}
                requestHeader={header}
                viewRequest={viewRequest}
                approveRequest={approveRequest}
                rejectRequest={rejectRequest}
              />
            );
          })}
        </Accordion.Root>
      </CardContent>
    </Card>
  );
}
