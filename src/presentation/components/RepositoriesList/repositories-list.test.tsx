import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RepositoryList from ".";
import { Repository } from "@/domain/models/Repository";

type sutParams = {
  repositoriesMock: Repository[];
  onRemove?: (repository: Repository) => void;
};
const makeSut = ({ repositoriesMock, onRemove }: sutParams): void => {
  render(<RepositoryList repositories={repositoriesMock} onRemove={onRemove} />, {
    wrapper: BrowserRouter,
  });
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
        name: "repository-name-2",
        owner: {
          avatar: "avatar_url_2",
          login: "owner-2",
        },
      },
    ];
    makeSut({ repositoriesMock });
    const [firstRepository, secondRepository] = screen.getAllByRole("link");

    expect(firstRepository).toHaveAttribute(
      "href",
      `/repositories/owner-1/repository-name-1`
    );
    expect(secondRepository).toHaveAttribute(
      "href",
      `/repositories/owner-2/repository-name-2`
    );
  });

  it("should call onRemove callback when remove button is clicked", () => {
    const repositoryMock: Repository = {
      description: "repository-description",
      name: "repository-name",
      owner: {
        avatar: "avatar_url",
        login: "owner",
      },
    };
    const onRemoveMock = vi.fn();

    makeSut({ repositoriesMock: [repositoryMock], onRemove: onRemoveMock });

    const removeButton = screen.getByRole("button", {
      name: /Remove repository/i,
    });
    fireEvent.click(removeButton);

    expect(onRemoveMock).toHaveBeenCalledWith(repositoryMock);
  });

  it("should not display remove button when onRemove is not provided", () => {
    const repositoriesMock: Repository[] = [
      {
        description: "repository-description",
        name: "repository-name",
        owner: {
          avatar: "avatar_url",
          login: "owner",
        },
      },
    ];

    makeSut({ repositoriesMock });

    const removeButton = screen.queryByRole("button", {
      name: /Remove repository/i,
    });

    expect(removeButton).not.toBeInTheDocument();
  });
});
