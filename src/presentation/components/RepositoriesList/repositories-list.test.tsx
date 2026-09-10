import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RepositoryList from ".";
import { Repository } from "@/domain/models/Repository";

type sutParams = {
  repositoriesMock: Repository[];
  onRemove?: (repositoryName: string) => void;
};
const makeSut = ({ repositoriesMock, onRemove }: sutParams): void => {
  render(
    <RepositoryList repositories={repositoriesMock} onRemove={onRemove} />,
    {
      wrapper: BrowserRouter,
    }
  );
};

describe("RepositoriesList", () => {
  it("should generate the correct redirect link to the selected repository", () => {
    const repositoriesMock: Repository[] = [
      {
        description: "repository-description-1",
        name: "repository-name-1",
        owner: {
          avatar: "avatar_url_1",
          login: "owner-1",
        },
      },
      {
        description: "repository-description-2",
        name: "repository-description-2",
        owner: {
          avatar: "avatar_url_2",
          login: "owner-2",
        },
      },
    ];
    makeSut({ repositoriesMock });
    const links = screen.getAllByRole("link");

    expect(links[0]).toHaveAttribute(
      "href",
      `/repositories/owner-1/repository-name-1`
    );
    expect(links[1]).toHaveAttribute(
      "href",
      `/repositories/owner-2/repository-description-2`
    );
  });

  it("should render remove button when onRemove callback is provided", () => {
    const repositoriesMock: Repository[] = [
      {
        description: "repository-description-1",
        name: "repository-name-1",
        owner: {
          avatar: "avatar_url_1",
          login: "owner-1",
        },
      },
    ];
    const mockOnRemove = vi.fn();
    makeSut({ repositoriesMock, onRemove: mockOnRemove });

    const removeButtons = screen.getAllByRole("button");
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it("should call onRemove callback with repository name when remove button is clicked", () => {
    const repositoriesMock: Repository[] = [
      {
        description: "repository-description-1",
        name: "repository-name-1",
        owner: {
          avatar: "avatar_url_1",
          login: "owner-1",
        },
      },
    ];
    const mockOnRemove = vi.fn();
    makeSut({ repositoriesMock, onRemove: mockOnRemove });

    const removeButton = screen.getByLabelText("Remove repository-name-1");
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith("repository-name-1");
  });

  it("should not render remove button when onRemove callback is not provided", () => {
    const repositoriesMock: Repository[] = [
      {
        description: "repository-description-1",
        name: "repository-name-1",
        owner: {
          avatar: "avatar_url_1",
          login: "owner-1",
        },
      },
    ];
    makeSut({ repositoriesMock });

    const removeButtons = screen.queryAllByRole("button");
    expect(removeButtons.length).toBe(0);
  });
});
