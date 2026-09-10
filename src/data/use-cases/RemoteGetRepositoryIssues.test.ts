import { describe, it, expect, vi } from "vitest";
import { RemoteGetRepositoryIssues } from "./RemoteGetRepositoryIssues";
import { ISSUES_PER_PAGE } from "@/domain/use-cases/GetRepositoryIssues";
import { InvalidRepositoryError } from "@/domain/errors/InvalidRepositoryError";
import {
  HttpClientProtocol,
  HttpResponse,
  HttpStatusCode,
} from "../protocols/http/HttpClientProtocol";

const urlMock = "https://api.github.com/repos";

const makeSut = (
  httpResponse: HttpResponse = { statusCode: HttpStatusCode.ok, body: [] }
): { sut: RemoteGetRepositoryIssues; httpClientMock: HttpClientProtocol } => {
  const httpClientMock: HttpClientProtocol = {
    request: vi.fn().mockResolvedValue(httpResponse),
  };
  const sut = new RemoteGetRepositoryIssues(urlMock, httpClientMock);

  return { sut, httpClientMock };
};

describe("RemoteGetRepositoryIssues", () => {
  it("should request the first page by default", async () => {
    const { sut, httpClientMock } = makeSut();

    await sut.get("owner-1", "repository-1");

    expect(httpClientMock.request).toHaveBeenCalledWith({
      method: "GET",
      url: `${urlMock}/owner-1/repository-1/issues?page=1&per_page=${ISSUES_PER_PAGE}`,
    });
  });

  it("should request the provided page", async () => {
    const { sut, httpClientMock } = makeSut();

    await sut.get("owner-1", "repository-1", 3);

    expect(httpClientMock.request).toHaveBeenCalledWith({
      method: "GET",
      url: `${urlMock}/owner-1/repository-1/issues?page=3&per_page=${ISSUES_PER_PAGE}`,
    });
  });

  it("should adapt the returned issues", async () => {
    const { sut } = makeSut({
      statusCode: HttpStatusCode.ok,
      body: [
        {
          id: 1,
          title: "issue-title-1",
          html_url: "issue-link-1",
          user: { login: "user-1" },
        },
      ],
    });

    const issues = await sut.get("owner-1", "repository-1");

    expect(issues).toStrictEqual([
      {
        id: 1,
        title: "issue-title-1",
        createdBy: "user-1",
        linkTo: "issue-link-1",
      },
    ]);
  });

  it("should throw InvalidRepositoryError when the repository is not found", async () => {
    const { sut } = makeSut({ statusCode: HttpStatusCode.notFound });

    await expect(sut.get("owner-1", "repository-1")).rejects.toThrow(
      new InvalidRepositoryError()
    );
  });
});
