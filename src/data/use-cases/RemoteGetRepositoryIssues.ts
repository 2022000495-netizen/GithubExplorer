import { InvalidRepositoryError } from "@/domain/errors/InvalidRepositoryError";
import { UnexpectedError } from "@/domain/errors/UnexpectedError";
import { RepositoryIssue } from "@/domain/models/RepositoryIssue";
import { GetRepositoryIssues, GetRepositoryIssuesResult } from "@/domain/use-cases/GetRepositoryIssues";
import {
  HttpClientProtocol,
  HttpStatusCode,
} from "../protocols/http/HttpClientProtocol";

interface RemoteRepositoryIssues {
  id: number;
  title: string;
  html_url: string;
  user: {
    login: string;
  };
}

const ISSUES_PER_PAGE = 6;

export class RemoteGetRepositoryIssues implements GetRepositoryIssues {
  constructor(
    private readonly url: string,
    private readonly httpClient: HttpClientProtocol
  ) {}

  async get(owner: string, repositoryName: string, page = 1): Promise<GetRepositoryIssuesResult> {
    const httpResult = await this.httpClient.request({
      method: "GET",
      url: `${this.url}/${owner}/${repositoryName}/issues?page=${page}&per_page=${ISSUES_PER_PAGE}`,
    });

    switch (httpResult.statusCode) {
      case HttpStatusCode.ok:
        const issues = this.adapt(httpResult.body as RemoteRepositoryIssues[]);
        const hasMore = issues.length === ISSUES_PER_PAGE;
        return { issues, hasMore };
      case HttpStatusCode.notFound:
        throw new InvalidRepositoryError();
      default:
        throw new UnexpectedError();
    }
  }

  private adapt(httpResponse: RemoteRepositoryIssues[]): RepositoryIssue[] {
    return httpResponse.map((response) => ({
      id: response.id,
      title: response.title,
      createdBy: response.user.login,
      linkTo: response.html_url,
    }));
  }
}
