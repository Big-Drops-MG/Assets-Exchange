import { allPublisherRequests } from "../models/request.model";
import { advertiserResponses } from "../models/response.model";
import type { Request } from "../types/admin.types";

export async function getRequests(): Promise<Request[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [...allPublisherRequests];
}

export async function getAllRequests(): Promise<Request[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [...allPublisherRequests];
}

export async function getRecentPublisherRequests(
  limit: number = 3
): Promise<Request[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const parseDate = (dateString: string): Date => {
    const match = dateString.match(
      /(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})/
    );
    if (!match) return new Date(0);
    const [, day, month, year] = match;
    const monthMap: Record<string, number> = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };
    return new Date(
      parseInt(year),
      monthMap[month.toLowerCase()] || 0,
      parseInt(day)
    );
  };

  const sorted = [...allPublisherRequests].sort((a, b) => {
    return parseDate(b.date).getTime() - parseDate(a.date).getTime();
  });

  return sorted.slice(0, limit);
}

export async function getAdvertiserResponses(): Promise<Request[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [...advertiserResponses];
}
