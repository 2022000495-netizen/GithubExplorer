import { RepositoryPullRequest } from '../models/RepositoryPullRequest'

export interface GetRepositoryPullRequests {
  get(owner: string, repositoryName: string): Promise<RepositoryPullRequest[]>
}
