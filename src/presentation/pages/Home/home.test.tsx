import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Home from ".";
import { Repository } from "@/domain/models/Repository";
import { SearchRepository } from "@/domain/use-cases/SearchRepository";
import { Validation } from "@/presentation/protocols/validation";
import { LoadRepositories } from "@/domain/use-cases/LoadRepositories";
import { SaveRepositories } from "@/domain/use-cases/SaveRepositories";

const mockRepository: Repository = {
  name: "react",
  description: "A JavaScript library for building user interfaces",
  owner: {
    login: "facebook",
    avatar: "https://avatars.githubusercontent.com/u/69631?v=4",
  },
};

const createMocks = () => {
  const searchRepositoryMock: SearchRepository = {
    search: vi.fn().mockResolvedValue(mockRepository),
  };

  const validationMock: Validation = {
    validate: vi.fn().mockReturnValue(null),
  };

  const loadRepositoriesMock: LoadRepositories = {
    load: vi.fn().mockReturnValue([]),
  };

  const saveRepositoriesMock: SaveRepositories = {
    save: vi.fn(),
  };

  return {
    searchRepositoryMock,
    validationMock,
    loadRepositoriesMock,
    saveRepositoriesMock,
  };
};

const makeSut = (mocks = createMocks()) => {
  render(
    <BrowserRouter>
      <Home
        searchRepository={mocks.searchRepositoryMock}
        validation={mocks.validationMock}
        loadRepositories={mocks.loadRepositoriesMock}
        saveRepositories={mocks.saveRepositoriesMock}
      />
    </BrowserRouter>
  );

  return mocks;
};

describe("Home - Remove Repository Feature", () => {
  it("should display remove button for each repository", () => {
    const mocks = createMocks();
    mocks.loadRepositoriesMock.load = vi.fn().mockReturnValue([mockRepository]);

    makeSut(mocks);

    const removeButtons = screen.getAllByRole("button");
    const removeButton = removeButtons.find((btn) =>
      btn.getAttribute("aria-label")?.includes("Remove")
    );
    expect(removeButton).toBeInTheDocument();
  });

  it("should remove repository when remove button is clicked", () => {
    const mocks = createMocks();
    mocks.loadRepositoriesMock.load = vi.fn().mockReturnValue([mockRepository]);

    makeSut(mocks);

    const removeButtons = screen.getAllByRole("button");
    const removeButton = removeButtons.find((btn) =>
      btn.getAttribute("aria-label")?.includes("Remove")
    );

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    const repositoryLink = screen.queryByText("react");
    expect(repositoryLink).not.toBeInTheDocument();
  });

  it("should persist repository removal by calling saveRepositories", () => {
    const mocks = createMocks();
    mocks.loadRepositoriesMock.load = vi.fn().mockReturnValue([mockRepository]);

    makeSut(mocks);

    const removeButtons = screen.getAllByRole("button");
    const removeButton = removeButtons.find((btn) =>
      btn.getAttribute("aria-label")?.includes("Remove")
    );

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(mocks.saveRepositoriesMock.save).toHaveBeenCalledWith([]);
  });
});
