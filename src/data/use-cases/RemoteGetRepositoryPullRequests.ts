import { InvalidRepositoryError } from "@/domain/errors/InvalidRepositoryError";
import { UnexpectedError } from "@/domain/errors/UnexpectedError";
import { RepositoryPullRequest } from "@/domain/models/RepositoryPullRequest";
import { GetRepositoryPullRequests } from "@/domain/use-cases/GetRepositoryPullRequests";
import {
  HttpClientProtocol,
  HttpStatusCode,
} from "../protocols/http/HttpClientProtocol";

interface RemoteRepositoryPullRequest {
  id: number;
  title: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
}
export class RemoteGetRepositoryPullRequests
  implements GetRepositoryPullRequests
{
  constructor(
    private readonly url: string,
    private readonly httpClient: HttpClientProtocol
  ) {}

  async get(
    owner: string,
    repositoryName: string
  ): Promise<RepositoryPullRequest[]> {
    const httpResult = await this.httpClient.request({
      method: "GET",
      url: `${this.url}/${owner}/${repositoryName}/pulls`,
    });

    switch (httpResult.statusCode) {
      case HttpStatusCode.ok:
        return this.adapt(httpResult.body as RemoteRepositoryPullRequest[]);
      case HttpStatusCode.notFound:
        throw new InvalidRepositoryError();
      default:
        throw new UnexpectedError();
    }
  }

  private adapt(
    httpResponse: RemoteRepositoryPullRequest[]
  ): RepositoryPullRequest[] {
    return httpResponse.map((response) => ({
      id: response.id,
      title: response.title,
      createdBy: response.user.login,
      linkTo: response.html_url,
      createdAt: response.created_at,
    }));
  }
}
