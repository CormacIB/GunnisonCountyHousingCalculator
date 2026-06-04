// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach } from "vitest";
import Home from "../page";

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText(/annual.*income/i), "60000");
  await userEvent.type(screen.getByLabelText(/household size/i), "3");
}

function mockFetch(response: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
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
    expect(screen.getByLabelText(/household size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/live in gunnison county/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work in gunnison county/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find property/i })).toBeInTheDocument();
  });

  it("hides first-time buyer field when Rent is selected", () => {
    render(<Home />);
    expect(screen.queryByLabelText(/first.time buyer/i)).not.toBeInTheDocument();
  });

  it("shows first-time buyer field when Buy is selected", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("radio", { name: /buy/i }));
    expect(screen.getByLabelText(/first.time buyer/i)).toBeInTheDocument();
  });

  it("shows an error and does not submit when income is empty", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows an error and does not submit when household size is outside 1–8", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText(/annual.*income/i), "50000");
    await userEvent.clear(screen.getByLabelText(/household size/i));
    await userEvent.type(screen.getByLabelText(/household size/i), "9");
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays matched listings as cards after a successful search", async () => {
    mockFetch([
      {
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
      },
    ]);
    render(<Home />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));

    await waitFor(() =>
      expect(screen.getByText("123 Main St, Gunnison")).toBeInTheDocument()
    );
    expect(screen.getByText(/rental/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,200\/month/i)).toBeInTheDocument();
  });

  it("displays the empty state when no listings match", async () => {
    mockFetch([]);
    render(<Home />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));

    await waitFor(() =>
      expect(screen.getByText(/no listings match/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/gunnison county housing authority/i)).toBeInTheDocument();
  });

  it("shows a loading indicator while the request is in flight", async () => {
    let resolve!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    );
    render(<Home />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    resolve({ ok: true, json: async () => [] });
  });

  it("POSTs the correct UserProfile to /api/match on valid submit", async () => {
    mockFetch([]);
    render(<Home />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /find property/i }));

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce());

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/match");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({
      listingType: "rental",
      annualIncome: 60000,
      householdSize: 3,
      countyResident: true,
      countyEmployee: true,
    });
  });
});
