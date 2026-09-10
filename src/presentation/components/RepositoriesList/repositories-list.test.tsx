import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import RepositoryList from ".";
import { Repository } from "@/domain/models/Repository";

type sutParams = {
  repositoriesMock: Repository[];
  onDelete?: (owner: string, name: string) => void;
};
const makeSut = ({ repositoriesMock, onDelete }: sutParams): void => {
  render(<RepositoryList repositories={repositoriesMock} onDelete={onDelete} />, {
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
    const links = screen.getAllByRole("link");
    const repositoryLinks = links.filter((link) =>
      link.getAttribute("href")?.startsWith("/repositories/")
    );

    expect(repositoryLinks[0]).toHaveAttribute(
      "href",
      `/repositories/owner-1/repository-name-1`
    );
    expect(repositoryLinks[1]).toHaveAttribute(
      "href",
      `/repositories/owner-2/repository-name-2`
    );
  });

  it("should render delete button when onDelete callback is provided", () => {
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
    const onDeleteMock = vi.fn();
    makeSut({ repositoriesMock, onDelete: onDeleteMock });

    const deleteButtons = screen.getAllByRole("button");
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("should call onDelete with correct parameters when delete button is clicked", async () => {
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
    const onDeleteMock = vi.fn();
    makeSut({ repositoriesMock, onDelete: onDeleteMock });

    const deleteButton = screen.getByTitle("Remove repository");
    const user = userEvent.setup();
    await user.click(deleteButton);

    expect(onDeleteMock).toHaveBeenCalledWith("owner-1", "repository-name-1");
  });

  it("should not render delete button when onDelete callback is not provided", () => {
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

    const deleteButtons = screen.queryAllByTitle("Remove repository");
    expect(deleteButtons.length).toBe(0);
  });
});
