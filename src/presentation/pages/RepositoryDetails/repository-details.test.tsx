import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RepositoryDetailsPage from "./index";
import { GetRepositoryDetails } from "@/domain/use-cases/GetRepositoryDetails";
import { GetRepositoryIssues, GetRepositoryIssuesResult } from "@/domain/use-cases/GetRepositoryIssues";
import { RepositoryDetails } from "@/domain/models/RepositoryDetails";

const mockRepositoryDetails: RepositoryDetails = {
  name: "test-repo",
  description: "Test repository",
  owner: {
    avatar: "https://example.com/avatar.jpg",
    login: "testuser",
  },
  stars: 100,
  forks: 50,
  issues: 10,
};

const mockIssue1 = {
  id: 1,
  title: "First issue",
  createdBy: "user1",
  linkTo: "https://github.com/test/test-repo/issues/1",
};

const mockIssue2 = {
  id: 2,
  title: "Second issue",
  createdBy: "user2",
  linkTo: "https://github.com/test/test-repo/issues/2",
};

const mockIssue3 = {
  id: 3,
  title: "Third issue",
  createdBy: "user3",
  linkTo: "https://github.com/test/test-repo/issues/3",
};

describe("RepositoryDetailsPage Pagination", () => {
  it("should render the load more button when hasMore is true", async () => {
    const mockGetRepositoryDetails: GetRepositoryDetails = {
      get: vi.fn().mockResolvedValue(mockRepositoryDetails),
    };

    const mockGetRepositoryIssues: GetRepositoryIssues = {
      get: vi.fn().mockResolvedValue({
        issues: [mockIssue1, mockIssue2],
        hasMore: true,
      } as GetRepositoryIssuesResult),
    };

    render(
      <BrowserRouter>
        <RepositoryDetailsPage
          getRepositoryDetails={mockGetRepositoryDetails}
          getRepositoryIssues={mockGetRepositoryIssues}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Carregar mais")).toBeInTheDocument();
    });
  });

  it("should not render the load more button when hasMore is false", async () => {
    const mockGetRepositoryDetails: GetRepositoryDetails = {
      get: vi.fn().mockResolvedValue(mockRepositoryDetails),
    };

    const mockGetRepositoryIssues: GetRepositoryIssues = {
      get: vi.fn().mockResolvedValue({
        issues: [mockIssue1, mockIssue2],
        hasMore: false,
      } as GetRepositoryIssuesResult),
    };

    render(
      <BrowserRouter>
        <RepositoryDetailsPage
          getRepositoryDetails={mockGetRepositoryDetails}
          getRepositoryIssues={mockGetRepositoryIssues}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText("Carregar mais")).not.toBeInTheDocument();
    });
  });

  it("should load more issues when the button is clicked", async () => {
    const mockGetRepositoryDetails: GetRepositoryDetails = {
      get: vi.fn().mockResolvedValue(mockRepositoryDetails),
    };

    const mockGetRepositoryIssues: GetRepositoryIssues = {
      get: vi.fn()
        .mockResolvedValueOnce({
          issues: [mockIssue1, mockIssue2],
          hasMore: true,
        } as GetRepositoryIssuesResult)
        .mockResolvedValueOnce({
          issues: [mockIssue3],
          hasMore: false,
        } as GetRepositoryIssuesResult),
    };

    render(
      <BrowserRouter>
        <RepositoryDetailsPage
          getRepositoryDetails={mockGetRepositoryDetails}
          getRepositoryIssues={mockGetRepositoryIssues}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("First issue")).toBeInTheDocument();
      expect(screen.getByText("Second issue")).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText("Carregar mais");
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Third issue")).toBeInTheDocument();
      expect(mockGetRepositoryIssues.get).toHaveBeenCalledTimes(2);
      expect(mockGetRepositoryIssues.get).toHaveBeenLastCalledWith(
        "",
        "",
        2
      );
    });
  });

  it("should accumulate issues and disable button when loading more", async () => {
    const mockGetRepositoryDetails: GetRepositoryDetails = {
      get: vi.fn().mockResolvedValue(mockRepositoryDetails),
    };

    const mockGetRepositoryIssues: GetRepositoryIssues = {
      get: vi.fn()
        .mockResolvedValueOnce({
          issues: [mockIssue1, mockIssue2],
          hasMore: true,
        } as GetRepositoryIssuesResult)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  issues: [mockIssue3],
                  hasMore: false,
                } as GetRepositoryIssuesResult);
              }, 100);
            })
        ),
    };

    render(
      <BrowserRouter>
        <RepositoryDetailsPage
          getRepositoryDetails={mockGetRepositoryDetails}
          getRepositoryIssues={mockGetRepositoryIssues}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("First issue")).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText("Carregar mais") as HTMLButtonElement;
    fireEvent.click(loadMoreButton);

    expect(loadMoreButton.textContent).toBe("Carregando...");
    expect(loadMoreButton.disabled).toBe(true);

    await waitFor(() => {
      expect(screen.getByText("Third issue")).toBeInTheDocument();
    });
  });
});
