import { InvalidRepositoryError } from "@/domain/errors/InvalidRepositoryError";
import { UnexpectedError } from "@/domain/errors/UnexpectedError";
import { RepositoryIssue } from "@/domain/models/RepositoryIssue";
import { GetRepositoryIssues } from "@/domain/use-cases/GetRepositoryIssues";
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
export class RemoteGetRepositoryIssues implements GetRepositoryIssues {
  private readonly perPage = 30;

  constructor(
    private readonly url: string,
    private readonly httpClient: HttpClientProtocol
  ) {}

  async get(owner: string, repositoryName: string): Promise<RepositoryIssue[]> {
    const httpResult = await this.httpClient.request({
      method: "GET",
      url: `${this.url}/${owner}/${repositoryName}/issues?page=1&per_page=${this.perPage}`,
    });

    switch (httpResult.statusCode) {
      case HttpStatusCode.ok:
        return this.adapt(httpResult.body as RemoteRepositoryIssues[]);
      case HttpStatusCode.notFound:
        throw new InvalidRepositoryError();
      default:
        throw new UnexpectedError();
    }
  }

  async getPage(owner: string, repositoryName: string, page: number): Promise<{ issues: RepositoryIssue[]; hasMore: boolean }> {
    const httpResult = await this.httpClient.request({
      method: "GET",
      url: `${this.url}/${owner}/${repositoryName}/issues?page=${page}&per_page=${this.perPage}`,
    });

    switch (httpResult.statusCode) {
      case HttpStatusCode.ok:
        const issues = this.adapt(httpResult.body as RemoteRepositoryIssues[]);
        const hasMore = issues.length === this.perPage;
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
