import { RemoteGetRepositoryPullRequests } from "@/data/use-cases/RemoteGetRepositoryPullRequests";
import { GetRepositoryPullRequests } from "@/domain/use-cases/GetRepositoryPullRequests";
import { makeApiUrl } from "../http/api-url-factory";
import { makeAxiosHttpClientAdapter } from "../http/axios-http-client-adapter-factory";

export const makeRemoteGetRepositoryPullRequests = (): GetRepositoryPullRequests => {
  return new RemoteGetRepositoryPullRequests(
    makeApiUrl("repos"),
    makeAxiosHttpClientAdapter()
  );
};
