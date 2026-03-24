import { GET } from "@/app/api/offers/route";
import { listOffers } from "@/features/admin/services/offer.service";

// Mock the service layer instead of the DB for a cleaner route test
jest.mock("@/features/admin/services/offer.service", () => ({
  listOffers: jest.fn(),
}));

describe("GET /api/offers - Public Security Filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should enforce Public + Active filter at the service call level", async () => {
    // 1. Setup mocks to simulate "seeding" 3 offers in the backend
    const mockData = [
      { id: "1", offerId: "OFFER-A", status: "Active", visibility: "Public" },
      { id: "2", offerId: "OFFER-B", status: "Active", visibility: "Internal" },
      { id: "3", offerId: "OFFER-C", status: "Inactive", visibility: "Public" },
    ];

    // Mock listOffers to return only the allowed offer, assuming the implementation works
    (listOffers as jest.Mock).mockImplementation(
      ({ status, visibility }: { status: string; visibility: string }) => {
        return mockData.filter(
          (o) => o.status === status && o.visibility === visibility
        );
      }
    );

    // 2. Execute the public GET handler
    const response = await GET();
    const json = await response.json();

    // 3. Assertions
    // Verify listOffers was called with the STRICT filter
    expect(listOffers).toHaveBeenCalledWith({
      status: "Active",
      visibility: "Public",
    });

    // Verify only the Public-Active offer (OFFER-A) is returned
    expect(json).toHaveLength(1);
    expect(json[0].offerId).toBe("OFFER-A");

    // Ensure Internal and Inactive offers (B and C) were filtered out
    const offerIds = json.map((o: { offerId: string }) => o.offerId);
    expect(offerIds).not.toContain("OFFER-B");
    expect(offerIds).not.toContain("OFFER-C");
  });

  it("should return only required public fields (id, offerId)", async () => {
    (listOffers as jest.Mock).mockResolvedValue([
      { id: "1", offerId: "OFFER-A", status: "Active", visibility: "Public" },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(json[0]).toHaveProperty("id");
    expect(json[0]).toHaveProperty("offerId");
    // Ensure sensitive fields like 'status' or 'visibility' aren't leaked in the JSON
    expect(json[0]).not.toHaveProperty("status");
    expect(json[0]).not.toHaveProperty("visibility");
  });
});
