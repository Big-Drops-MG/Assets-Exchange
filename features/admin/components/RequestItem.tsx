"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, ChevronUp } from "lucide-react";

import { getVariables } from "@/components/_variables/variables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  RequestHeader,
  ViewRequests,
  ApproveRequest,
  RejectRequest,
} from "../types/admin.types";

interface RequestItemProps {
  requestId: string;
  colorVariant: "purple" | "blue";
  requestHeader: RequestHeader;
  viewRequest: ViewRequests;
  approveRequest: ApproveRequest;
  rejectRequest: RejectRequest;
}

const getPriorityBadgeClass = (priority: string) => {
  if (priority.toLowerCase().includes("high")) {
    return "rounded-[20px] border border-[#FCA5A5] bg-[#FFDFDF] h-7 px-1.5 text-xs  xl:text-sm font-inter  text-[#D70000]";
  }
  if (priority.toLowerCase().includes("medium")) {
    return "rounded-[20px] border border-[#FCD34D] bg-[#FFF8DB] h-7 px-1.5 text-xs  xl:text-sm font-inter  text-[#B18100]";
  }

  return "rounded-[20px] border border-[#93C5FD] bg-[#DBEAFE] h-7 px-1.5 text-xs  xl:text-sm font-inter  text-[#1E40AF]";
};

const getAccordionColors = (
  variant: "purple" | "blue",
  colors: ReturnType<typeof getVariables>["colors"]
) => {
  if (variant === "purple") {
    return {
      backgroundColor: colors.AccordionPurpleBackgroundColor,
      borderColor: colors.AccordionPurpleBorderColor,
      offerIdBackgroundColor: colors.AccordionPurpleOfferIdBackgroundColor,
      offerIdTextColor: colors.AccordionPurpleOfferIdTextColor,
    };
  }

  return {
    backgroundColor: colors.AccordionBlueBackgroundColor,
    borderColor: colors.AccordionBlueBorderColor,
    offerIdBackgroundColor: colors.AccordionBlueOfferIdBackgroundColor,
    offerIdTextColor: colors.AccordionBlueOfferIdTextColor,
  };
};

export function RequestItem({
  requestId,
  colorVariant,
  requestHeader,
  viewRequest,
  approveRequest,
  rejectRequest,
}: RequestItemProps) {
  const variables = getVariables();
  const accordionColors = getAccordionColors(colorVariant, variables.colors);

  const meta = [
    `Creative Type: ${rejectRequest.creativeTypeValue}`,
    `Creative Count: ${rejectRequest.creattiveCountValue}`,
    `From Lines Count: ${rejectRequest.fromlinesCountValue}`,
    `Subject Lines Count: ${rejectRequest.subjectlinesCountValue}`,
  ];

  return (
    <Accordion.Item
      value={requestId}
      className="rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: accordionColors.backgroundColor,
        border: `1px solid ${accordionColors.borderColor}`,
      }}
    >
      <Accordion.Header>
        <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left group">
          <div className="flex flex-wrap items-center xlg:gap-3 gap-2 text-xs xl:text-sm leading-5">
            <span
              className="font-inter"
              style={{ color: variables.colors.requestCardTextColor }}
            >
              {requestHeader.date}
            </span>
            <span style={{ color: variables.colors.requestCardTextColor }}>
              |
            </span>
            <span
              className="font-inter"
              style={{ color: variables.colors.requestCardTextColor }}
            >
              {requestHeader.advertiserName}- AFF ID :{" "}
              <span className="font-inter font-semibold">
                {requestHeader.affId}
              </span>
            </span>
            <span
              className="font-inter"
              style={{ color: variables.colors.requestCardTextColor }}
            >
              |
            </span>

            <Badge
              variant="outline"
              className={getPriorityBadgeClass(requestHeader.priority)}
            >
              {requestHeader.priority}
            </Badge>
          </div>

          <div className="flex items-center">
            <ChevronDown className="h-7 w-7 text-[#525252] group-data-[state=open]:hidden" />
            <ChevronUp className="h-7 w-7 text-[#525252] hidden group-data-[state=open]:block" />
          </div>
        </Accordion.Trigger>
      </Accordion.Header>

      <div
        className="grid grid-cols-[1fr_220px]  items-center border-t bg-white px-5 py-4"
        style={{
          borderTop: "1px solid #D6D6D6",
          backgroundColor: accordionColors.backgroundColor,
        }}
      >
        <div className="flex flex-wrap items-center  gap-2.5 text-xs xl:text-sm leading-5">
          <span
            className="rounded-[20px] h-6 px-1 text-xs xl:text-sm font-inter font-medium flex items-center justify-center"
            style={{
              backgroundColor: accordionColors.offerIdBackgroundColor,
            }}
          >
            <span style={{ color: accordionColors.offerIdTextColor }}>
              Offer ID: {viewRequest.offerId}
            </span>
          </span>
          <span className="font-inter text-xs xl:text-sm">
            {viewRequest.offerName}
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full justify-self-end xl:h-11 xl:w-47 h-10 w-40 font-inter text-xs xl:text-sm font-medium rounded-[6px]"
          style={{
            color: variables.colors.requestCardViewButtonTextColor,
            backgroundColor:
              variables.colors.requestCardViewButtonBackgroundColor,
            border: `1px solid ${variables.colors.requestCardViewButtonBorderColor}`,
          }}
        >
          {viewRequest.buttonTitle}
        </Button>
      </div>

      <Accordion.Content className="bg-white overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up transition-all duration-300 ease-in-out">
        <div
          className="grid grid-cols-[1fr_220px]  xlg:gap-6 gap-3 px-5 pb-5 items-start"
          style={{
            backgroundColor: accordionColors.backgroundColor,
          }}
        >
          <div className="flex flex-col gap-6 text-xs xl:text-sm">
            <div className="leading-5 font-inter flex items-center gap-2">
              <span
                className="font-inter text-sm font-semibold"
                style={{ color: variables.colors.requestCardTextColor }}
              >
                Client:
              </span>{" "}
              <span
                className="font-inter text-xs xl:text-sm "
                style={{ color: variables.colors.requestCardTextColor }}
              >
                {approveRequest.clientId}
              </span>{" "}
              |{" "}
              <span
                className="font-inter text-xs xl:text-sm "
                style={{ color: variables.colors.requestCardTextColor }}
              >
                {approveRequest.companyNameTitle}
              </span>
            </div>

            <div className="flex flex-wrap  gap-2">
              {meta.map((m, index) => (
                <span
                  key={index}
                  className="rounded-[4px] border bg-white px-2 h-7 text-xs xl:text-sm font-normal flex items-center justify-center leading-4 font-inter shadow-[0_0_2px_0_rgba(30,64,175,0.1)]"
                  style={{ color: variables.colors.requestCardTextColor }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:gap-4 justify-self-end">
            <Button
              className="xl:h-11 xl:w-47 h-10 w-40 font-inter text-xs xl:text-sm font-medium rounded-[6px] "
              style={{
                color: variables.colors.requestCardApproveButtonTextColor,
                backgroundColor:
                  variables.colors.requestCardApproveButtonBackgroundColor,
              }}
            >
              {approveRequest.buttonTitle}
            </Button>

            <Button
              variant="outline"
              className=" xl:h-11 xl:w-47 h-10 w-40 font-inter text-xs xl:text-sm font-medium rounded-[6px] "
              style={{
                color: variables.colors.requestCardRejectedButtonTextColor,
                backgroundColor:
                  variables.colors.requestCardRejectedButtonBackgroundColor,
                border: `1px solid ${variables.colors.requestCardRejectedButtonBorderColor}`,
              }}
            >
              {rejectRequest.buttonTitle}
            </Button>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
