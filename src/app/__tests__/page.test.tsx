// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach } from "vitest";
import Home from "../page";

const BASE_LISTING = {
  listing_id: "001",
  listing_name: "123 Main St, Gunnison",
  type: "rental",
  ami_max_percent: 80,
  bedrooms: 2,
  monthly_rent: 1200,
  county_residency_required: false,
  county_employment_required: false,
  first_time_buyer_required: false,
  status: "available",
  contact_info: "housing@gunnisoncounty.org",
};

async function fillIncome() {
  await userEvent.type(screen.getByLabelText(/annual.*income/i), "60000");
}

function mockFetch(listings: unknown[], amiPercent = 80) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ listings, amiPercent }),
    })
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("Calculator form", () => {
  it("renders the rent/buy toggle and core fields", () => {
    render(<Home />);

    expect(screen.getByRole("radio", { name: /rent/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /buy/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/annual.*income/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /household size/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /lived in gunnison county/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find homes/i })).toBeInTheDocument();
  });

  it("hides first-time buyer field when Rent is selected", () => {
    render(<Home />);
    expect(
      screen.queryByRole("radiogroup", { name: /first.time buyer/i })
    ).not.toBeInTheDocument();
  });

  it("shows first-time buyer field when Buy is selected", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("radio", { name: /buy/i }));
    expect(
      screen.getByRole("radiogroup", { name: /first.time buyer/i })
    ).toBeInTheDocument();
  });

  it("shows an error and does not submit when income is zero", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /find homes/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays matched listings as cards after a successful search", async () => {
    mockFetch([BASE_LISTING]);
    render(<Home />);
    await fillIncome();
    await userEvent.click(screen.getByRole("button", { name: /find homes/i }));

    await waitFor(() =>
      expect(screen.getByText("123 Main St, Gunnison")).toBeInTheDocument()
    );
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
  });

  it("displays the empty state when no listings match", async () => {
    mockFetch([]);
    render(<Home />);
    await fillIncome();
    await userEvent.click(screen.getByRole("button", { name: /find homes/i }));

    await waitFor(() =>
      expect(screen.getByText(/no listings match/i)).toBeInTheDocument()
    );
    expect(
      screen.getByText(/gunnison county housing authority/i)
    ).toBeInTheDocument();
  });

  it("shows a loading indicator while the request is in flight", async () => {
    let resolve!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    );
    render(<Home />);
    await fillIncome();
    await userEvent.click(screen.getByRole("button", { name: /find homes/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    resolve({
      ok: true,
      json: async () => ({ listings: [], amiPercent: 80 }),
    });
  });

  it("POSTs the correct UserProfile to /api/match on valid submit", async () => {
    mockFetch([]);
    render(<Home />);
    await fillIncome();
    await userEvent.click(screen.getByRole("button", { name: /find homes/i }));

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce());

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/match");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({
      listingType: "rental",
      annualIncome: 60000,
      householdSize: 3,
      countyResident: true,
    });
  });
});
