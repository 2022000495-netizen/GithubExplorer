import { RepositoryIssue } from '../models/RepositoryIssue'

export const ISSUES_PER_PAGE = 10

export interface GetRepositoryIssues {
  get(
    owner: string,
    repositoryName: string,
    page?: number
  ): Promise<RepositoryIssue[]>
}
