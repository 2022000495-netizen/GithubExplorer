import { RepositoryIssue } from '../models/RepositoryIssue'

export interface GetRepositoryIssuesResult {
  issues: RepositoryIssue[]
  hasMore: boolean
}

export interface GetRepositoryIssues {
  get(owner: string, repositoryName: string, page?: number): Promise<GetRepositoryIssuesResult>
}
