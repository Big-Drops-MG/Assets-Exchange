export type RequestStatus =
  | "new"
  | "pending"
  | "approved"
  | "rejected"
  | "sent-back"
  | "revised";

export type ApprovalStage = "admin" | "advertiser" | "completed";

export interface CreativeRequest {
  id: string;
  date: string;
  offerId: string;
  everflowOfferId?: string | null;
  offerName: string;
  creativeType: string;
  creativeCount: number;
  fromLinesCount: number;
  subjectLinesCount: number;
  /** Campaign-level from lines (publisher form) — use for multi-creative requests */
  fromLines?: string | null;
  /** Campaign-level subject lines (publisher form) — use for multi-creative requests */
  subjectLines?: string | null;
  /** Campaign-level additional notes (publisher form) — use for multi-creative requests */
  additionalNotes?: string | null;
  advertiserName: string;
  affiliateId: string;
  clientId: string;
  clientName: string;
  advertiserEverflowId: string | null;
  priority: string;
  status: RequestStatus;
  approvalStage: ApprovalStage;
  advertiserStatus?: string | null;
  advertiserRespondedAt?: Date | string | null;
  advertiserComments?: string | null;

  parentRequestId?: string;
  childResponseId?: string;
}

export type RequestListResponse = {
  data: CreativeRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};
