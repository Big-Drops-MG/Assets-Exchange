"use client";

import { ChevronDown } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

import { getVariables } from "@/components/_variables/variables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface EntityDataTableColumn {
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
}

/** Same width math as data rows: fr tracks use minmax(0, …) so columns line up with bordered cards. */
export function entityTableGridTemplateColumns(
  columns: EntityDataTableColumn[]
): string {
  return columns
    .map((col) => {
      const w = col.width || "1fr";
      if (/^\d*\.?\d+fr$/.test(w.trim())) {
        return `minmax(0, ${w.trim()})`;
      }
      return w;
    })
    .join(" ");
}

interface EntityDataTableProps<T> {
  data: T[];
  columns: EntityDataTableColumn[];
  renderRow: (item: T, index: number) => React.ReactNode;
}

export function EntityDataTable<T>({
  data,
  columns,
  renderRow,
}: EntityDataTableProps<T>) {
  const variables = getVariables();
  const gridTemplateColumns = entityTableGridTemplateColumns(columns);

  return (
    <div className="w-full">
      <div
        className="rounded-t-2xl px-5 py-4 box-border border border-transparent border-b"
        style={{
          backgroundColor: variables.colors.cardHeaderBackgroundColor,
          borderBottomColor: variables.colors.inputBorderColor,
        }}
      >
        <div
          className="grid items-center min-w-0"
          style={{
            gridTemplateColumns,
            gap: "1.5rem",
          }}
        >
          {columns.map((column, index) => (
            <div
              key={index}
              className={`min-w-0 font-inter font-semibold text-xs xl:text-sm tracking-wide ${
                column.align === "left"
                  ? "text-left"
                  : column.align === "right"
                    ? "text-right"
                    : "text-center"
              }`}
              style={{ color: variables.colors.cardHeaderTextColor }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-3">
        {data.map((item, index) => (
          <div key={index} className="transition-all duration-200">
            {renderRow(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface VisibilityDropdownProps {
  visibility: "Public" | "Internal" | "Hidden";
  onVisibilityChange: (visibility: "Public" | "Internal" | "Hidden") => void;
  variables: ReturnType<typeof getVariables>;
}

const VisibilityDropdown = memo(
  ({ visibility, onVisibilityChange, variables }: VisibilityDropdownProps) => {
    const [open, setOpen] = useState(false);

    const handleSelect = useCallback(
      (value: "Public" | "Internal" | "Hidden") => {
        onVisibilityChange(value);
        setOpen(false);
      },
      [onVisibilityChange]
    );

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 w-28 text-xs font-medium rounded-md border pointer-events-auto transition-all duration-200 hover:shadow-sm"
            style={{
              color: variables.colors.buttonOutlineTextColor,
              borderColor: variables.colors.buttonOutlineBorderColor,
              backgroundColor: variables.colors.cardBackground,
            }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {visibility}
            <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="min-w-28 z-100"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={() => handleSelect("Public")}
            className="text-xs cursor-pointer"
          >
            Public
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleSelect("Internal")}
            className="text-xs cursor-pointer"
          >
            Internal
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleSelect("Hidden")}
            className="text-xs cursor-pointer"
          >
            Hidden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

VisibilityDropdown.displayName = "VisibilityDropdown";

interface EntityDataCardProps {
  id: string;
  name: string;
  platform?: string;
  advName?: string;
  createdMethod: string;
  status: "Active" | "Inactive" | "active" | "inactive";
  variant?: "purple" | "blue";
  visibility?: "Public" | "Internal" | "Hidden";
  nameAlign?: "left" | "center" | "right";
  gridTemplateColumns?: string;
  actionButtonsLayout?: "row" | "col";
  onEditDetails?: () => void;
  onBrandGuidelines?: () => void;
  onVisibilityChange?: (visibility: "Public" | "Internal" | "Hidden") => void;
}

export const EntityDataCard = memo(
  ({
    id,
    name,
    platform,
    advName,
    createdMethod,
    status,
    variant = "purple",
    visibility,
    nameAlign = "left",
    gridTemplateColumns = "100px 2.5fr 1fr 1fr 140px 340px",
    actionButtonsLayout = "col",
    onEditDetails,
    onBrandGuidelines,
    onVisibilityChange,
  }: EntityDataCardProps) => {
    const variables = getVariables();
    const isPurple = variant === "purple";
    const backgroundColor = useMemo(
      () =>
        isPurple
          ? variables.colors.AccordionPurpleBackgroundColor
          : variables.colors.AccordionBlueBackgroundColor,
      [isPurple, variables.colors]
    );
    const borderColor = useMemo(
      () =>
        isPurple
          ? variables.colors.AccordionPurpleBorderColor
          : variables.colors.AccordionBlueBorderColor,
      [isPurple, variables.colors]
    );

    return (
      <div
        className="rounded-2xl border px-5 py-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-opacity-80"
        style={{
          backgroundColor,
          borderColor,
        }}
      >
        <div
          className="grid items-center min-w-0"
          style={{
            gridTemplateColumns,
            gap: "1.5rem",
          }}
        >
          <div
            className="min-w-0 text-center text-xs xl:text-sm font-medium leading-relaxed font-mono truncate"
            style={{ color: variables.colors.requestCardTextColor }}
          >
            {id}
          </div>

          <div
            className={`min-w-0 font-inter text-xs xl:text-sm leading-relaxed ${
              nameAlign === "center"
                ? "text-center"
                : nameAlign === "right"
                  ? "text-right"
                  : "text-left"
            }`}
            style={{ color: variables.colors.requestCardTextColor }}
          >
            {name}
          </div>

          <div
            className="min-w-0 font-inter text-center text-xs xl:text-sm leading-relaxed"
            style={{ color: variables.colors.requestCardTextColor }}
          >
            {advName || platform}
          </div>

          <div
            className="min-w-0 font-inter text-center text-xs xl:text-sm leading-relaxed"
            style={{ color: variables.colors.requestCardTextColor }}
          >
            {createdMethod}
          </div>

          <div className="flex min-w-0 flex-col gap-2.5 justify-center items-center">
            <Badge
              className="h-7 w-28 p-0 text-xs xl:text-sm font-medium rounded-[20px] border flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor:
                  status.toLowerCase() === "active"
                    ? variables.colors.approvedAssetsBackgroundColor
                    : variables.colors.rejectedAssetsBackgroundColor,
                borderColor:
                  status.toLowerCase() === "active" ? "#86EFAC" : "#FFC2A3",
                color:
                  status.toLowerCase() === "active"
                    ? variables.colors.approvedAssetsIconColor
                    : variables.colors.rejectedAssetsIconColor,
              }}
            >
              {status}
            </Badge>
            {visibility && onVisibilityChange && (
              <VisibilityDropdown
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
                variables={variables}
              />
            )}
          </div>

          <div
            className={`flex min-w-0 ${actionButtonsLayout === "row" ? "flex-row" : "flex-col"} flex-wrap gap-2.5 items-center justify-center`}
          >
            {onEditDetails && (
              <Button
                variant="outline"
                className="h-9 w-36 font-inter text-xs xl:text-sm font-medium rounded-md border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                style={{
                  color: variables.colors.requestCardViewButtonTextColor,
                  borderColor:
                    variables.colors.requestCardViewButtonBorderColor,
                  backgroundColor:
                    variables.colors.requestCardViewButtonBackgroundColor,
                }}
                onClick={onEditDetails}
              >
                Edit Details
              </Button>
            )}
            {onBrandGuidelines && (
              <Button
                className="h-9 w-36 font-inter text-xs xl:text-sm font-medium rounded-md border-0 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                style={{
                  color: variables.colors.requestCardApproveButtonTextColor,
                  backgroundColor:
                    variables.colors.requestCardApproveButtonBackgroundColor,
                }}
                onClick={onBrandGuidelines}
              >
                Brand Guidelines
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EntityDataCard.displayName = "EntityDataCard";
