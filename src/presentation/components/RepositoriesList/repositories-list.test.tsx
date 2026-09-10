import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RepositoryList from ".";
import { Repository } from "@/domain/models/Repository";

type sutParams = {
  repositoriesMock: Repository[];
  onRemoveRepository?: (repository: Repository) => void;
};
const makeSut = ({
  repositoriesMock,
  onRemoveRepository = vi.fn(),
}: sutParams): void => {
  render(
    <RepositoryList
      repositories={repositoriesMock}
      onRemoveRepository={onRemoveRepository}
    />,
    {
      wrapper: BrowserRouter,
    }
  );
};

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

describe("RepositoriesList", () => {
  it("should generate the correct redirect link to the selected repository", () => {
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

  it("should call onRemoveRepository with the selected repository when the remove button is clicked", () => {
    const onRemoveRepository = vi.fn();
    makeSut({ repositoriesMock, onRemoveRepository });

    const removeButton = screen.getByRole("button", {
      name: /remove repository-name-1/i,
    });
    fireEvent.click(removeButton);

    expect(onRemoveRepository).toHaveBeenCalledWith(repositoriesMock[0]);
    expect(onRemoveRepository).toHaveBeenCalledTimes(1);
  });
});
