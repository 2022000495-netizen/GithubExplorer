import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RepositoryList from ".";
import { Repository } from "@/domain/models/Repository";

type sutParams = {
  repositoriesMock: Repository[];
  onRemoveMock?: (repository: Repository) => void;
};
const makeSut = ({ repositoriesMock, onRemoveMock = vi.fn() }: sutParams): void => {
  render(
    <RepositoryList repositories={repositoriesMock} onRemove={onRemoveMock} />,
    {
      wrapper: BrowserRouter,
    }
  );
};

const makeRepositoriesMock = (): Repository[] => [
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

describe("RepositoriesList", () => {
  it("should generate the correct redirect link to the selected repository", () => {
    const repositoriesMock = makeRepositoriesMock();
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

  it("should call onRemove with the selected repository when the remove button is clicked", () => {
    const repositoriesMock = makeRepositoriesMock();
    const onRemoveMock = vi.fn();
    makeSut({ repositoriesMock, onRemoveMock });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove repository-name-2" })
    );

    expect(onRemoveMock).toHaveBeenCalledTimes(1);
    expect(onRemoveMock).toHaveBeenCalledWith(repositoriesMock[1]);
  });
});
